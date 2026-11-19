-- Storage is installed by Supabase. Never enable public access or persist signed URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('it-private','it-private',false,16777216,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/octet-stream'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create or replace function app.storage_manager() returns boolean
language sql stable as $$
  select app.is_admin() or (app.signed_in() and app.claim('app_role')='hr')
$$;

create or replace function app.storage_path_valid(object_name text) returns boolean
language sql immutable as $$
  select object_name ~ '^(admin|catalog|staff)/[A-Za-z0-9_./-]+$'
    and object_name !~ '(^|/)(\.|\.\.|)(/|$)'
$$;

create or replace function app.storage_own_photo(object_name text) returns boolean
language sql stable as $$
  select app.is_staff() and app.staff_active()
    and split_part(object_name,'/',1)='staff'
    and split_part(object_name,'/',2)=app.uid()
$$;
grant execute on function app.storage_manager(), app.storage_path_valid(text), app.storage_own_photo(text)
  to anon,authenticated,service_role;

drop policy if exists it_private_read on storage.objects;
create policy it_private_read on storage.objects for select to authenticated
using (bucket_id='it-private' and app.storage_path_valid(name) and
  (app.storage_manager() or (app.is_staff() and
    (name like 'catalog/%' or app.storage_own_photo(name)))));

drop policy if exists it_private_insert on storage.objects;
create policy it_private_insert on storage.objects for insert to authenticated
with check (bucket_id='it-private' and app.storage_path_valid(name) and
  (app.is_admin() or app.storage_own_photo(name)));

drop policy if exists it_private_update on storage.objects;
create policy it_private_update on storage.objects for update to authenticated
using (bucket_id='it-private' and app.storage_path_valid(name) and
  (app.is_admin() or app.storage_own_photo(name)))
with check (bucket_id='it-private' and app.storage_path_valid(name) and
  (app.is_admin() or app.storage_own_photo(name)));

drop policy if exists it_private_delete on storage.objects;
create policy it_private_delete on storage.objects for delete to authenticated
using (bucket_id='it-private' and app.storage_path_valid(name) and
  (app.is_admin() or app.storage_own_photo(name)));

-- Compare the entire snapshot inside one UPDATE. A migration never overwrites
-- a document edited since the backup/read, and never deletes legacy chunks.
create or replace function public.storage_migrate_document(
  p_table text,p_id text,p_expected jsonb,p_replacement jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare changed integer;
begin
  if p_table <> all(array['assets','accessories','licenses','office_supplies','bundled_items',
    'employees','deleted_employees','repair_requests','replacement_requests','accessory_requests',
    'supply_requests','assets_transactions','accessories_transactions','licenses_transactions',
    'transaction_attachments','asset_purchase_docs','printed_documents','asset_handovers','it_report','settings'])
    then raise exception 'unsupported storage migration table'; end if;
  execute format('update public.%I set data=$1 where id=$2 and data=$3',p_table)
    using p_replacement,p_id,p_expected;
  get diagnostics changed=row_count;
  return changed=1;
end $$;
revoke all on function public.storage_migrate_document(text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.storage_migrate_document(text,text,jsonb,jsonb) to service_role;
