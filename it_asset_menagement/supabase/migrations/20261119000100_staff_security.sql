-- Staff credentials: no recoverable passwords; default/reset sessions are restricted
-- until the password is changed. All checks read current rows, not stale JWT flags.
create or replace function app.guard_staff_password() returns trigger
language plpgsql as $$
begin
  new.data := new.data - 'plaintext';
  if (new.data->>'isDefault') is distinct from 'false'
    or new.data->>'mustChangePassword' is null then
    new.data := new.data || '{"mustChangePassword":true}'::jsonb;
  end if;
  return new;
end $$;
drop trigger if exists guard_staff_password on public.staff_passwords;
create trigger guard_staff_password before insert or update on public.staff_passwords
for each row execute function app.guard_staff_password();

update public.staff_passwords p set data = (p.data - 'plaintext') ||
  case when p.data->>'isDefault' = 'true' or exists (
    select 1 from public.employees e where e.id=p.id and p.data->>'plaintext'=e.data->>'empId'
  ) then '{"isDefault":true,"mustChangePassword":true}'::jsonb
    when (p.data->>'isDefault') is distinct from 'false' or p.data->>'mustChangePassword' is null
      then '{"mustChangePassword":true}'::jsonb else '{}'::jsonb end
where p.data ? 'plaintext' or (p.data->>'isDefault') is distinct from 'false'
  or p.data->>'mustChangePassword' is null;

create or replace function app.staff_identity_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.employees e where e.id=app.emp_doc_id()
    and not (coalesce(e.data->>'resignDate','') ~ '^\d{4}-\d{2}-\d{2}$'
      and e.data->>'resignDate' <= to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD')))
    and exists(select 1 from public.staff_passwords p where p.id=app.emp_doc_id()
      and coalesce(p.data->>'credentialVersion','legacy')=coalesce(app.claim('credential_version'),'legacy'))
$$;

create or replace function app.staff_active() returns boolean
language sql stable security definer set search_path = public as $$
  select app.staff_identity_active() and exists (
    select 1 from public.staff_passwords p where p.id=app.emp_doc_id()
      and p.data->>'isDefault'='false'
      and p.data->>'mustChangePassword'='false')
$$;

-- Only minimal bootstrap information; no profile, hashes or password disclosure.
create or replace function public.staff_access_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when app.claims()->>'role'='authenticated' and app.claim('app_role')='staff'
    and app.staff_identity_active() then jsonb_build_object(
      'empDocId',app.emp_doc_id(),
      'empId',(select e.data->>'empId' from public.employees e where e.id=app.emp_doc_id()),
      'mustChangePassword',not app.staff_active()) else null end
$$;
revoke all on function public.staff_access_status() from public, anon;
grant execute on function public.staff_access_status() to authenticated, service_role;

create table if not exists public.auth_rate_limits (
  key text primary key,
  attempts integer not null,
  window_started_at timestamptz not null
);
alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from public, anon, authenticated;
create index if not exists auth_rate_limits_expiry on public.auth_rate_limits(window_started_at);

-- ON CONFLICT locks each bucket atomically, including across serverless instances.
-- Keys are SHA-256 digests computed server-side; no raw IP or employee ID stored.
create or replace function public.consume_auth_attempt(p_key text,p_limit integer,p_window_seconds integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bucket public.auth_rate_limits; stamp timestamptz := clock_timestamp();
begin
  if length(p_key) not between 1 and 256 or p_limit not between 1 and 1000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit parameters';
  end if;
  delete from public.auth_rate_limits where window_started_at < stamp-interval '1 day';
  insert into public.auth_rate_limits as limits(key,attempts,window_started_at)
    values(p_key,1,stamp)
  on conflict(key) do update set
    attempts=case when limits.window_started_at <= stamp-make_interval(secs=>p_window_seconds)
      then 1 else least(limits.attempts+1,p_limit+1) end,
    window_started_at=case when limits.window_started_at <= stamp-make_interval(secs=>p_window_seconds)
      then stamp else limits.window_started_at end
  returning * into bucket;
  return jsonb_build_object('allowed',bucket.attempts<=p_limit,'retryAfter',
    case when bucket.attempts<=p_limit then 0 else greatest(1,ceil(extract(epoch from
      bucket.window_started_at+make_interval(secs=>p_window_seconds)-stamp))::integer) end);
end $$;
revoke all on function public.consume_auth_attempt(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_auth_attempt(text,integer,integer) to service_role;
grant execute on function app.staff_identity_active() to anon, authenticated, service_role;

-- Compare the verified hash under the UPDATE row lock, so a concurrent reset wins.
create or replace function public.change_staff_password(p_emp_id text,p_expected_hash text,p_data jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.staff_passwords set data=p_data - 'plaintext'
    where id=p_emp_id and data->>'hash'=p_expected_hash;
  return found;
end $$;
revoke all on function public.change_staff_password(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.change_staff_password(text,text,jsonb) to service_role;
