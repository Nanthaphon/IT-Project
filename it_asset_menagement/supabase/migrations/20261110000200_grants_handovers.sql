-- ═══════════════════════════════════════════════════════════════════
-- 1) สิทธิ์ของ service_role (สคริปต์นำเข้า / ฟังก์ชัน Vercel ใช้)
--    โปรเจคสร้างโดยปิด "Automatically expose new tables" → ไม่มีใครได้สิทธิ์ตารางอัตโนมัติ
--    service_role ข้าม RLS ได้ แต่ยังต้องมีสิทธิ์ระดับตาราง
-- 2) ตารางใหม่ในอนาคตได้สิทธิ์เองตามแบบเดียวกัน (default privileges) — RLS ยังเป็นตัวตัดสินทีละแถว
-- 3) asset_handovers — ข้อมูลจากระบบรุ่นเก่า (โค้ดปัจจุบันไม่ได้ใช้) เก็บไว้ไม่ให้หาย · admin เท่านั้น
-- 4) doc_write รับทุกตารางเอกสารที่มีจริง (ไม่ต้องแก้รายชื่อในฟังก์ชันทุกครั้งที่เพิ่มตาราง)
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.asset_handovers (
  id         text primary key default gen_random_uuid()::text,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.asset_handovers enable row level security;
drop trigger if exists touch_updated_at on public.asset_handovers;
create trigger touch_updated_at before update on public.asset_handovers for each row execute function app.touch_updated_at();
drop policy if exists admin_all on public.asset_handovers;
create policy admin_all on public.asset_handovers for all using (app.is_admin()) with check (app.is_admin());

create or replace function public.doc_write(p_table text, p_id text, p_mode text, p_ops jsonb)
returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  cur    jsonb;
  found  boolean;
  op     jsonb;
  path   text[];
  i      int;
  n      int;
  result jsonb;
begin
  -- ตารางเอกสาร = ตารางใน public ที่มีคอลัมน์ id + data (ยกเว้น doc_chunks ซึ่งมีคีย์หลายคอลัมน์)
  if p_table = 'doc_chunks' or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = p_table and column_name = 'data'
  ) then
    raise exception 'ไม่รู้จักตาราง %', p_table using errcode = '42P01';
  end if;
  if p_mode not in ('create', 'set', 'merge', 'update') then
    raise exception 'mode ไม่ถูกต้อง %', p_mode;
  end if;

  execute format('select data from public.%I where id = $1', p_table) into cur using p_id;
  found := cur is not null;
  if p_mode = 'update' and not found then
    raise exception 'ไม่พบเอกสาร %/%', p_table, p_id using errcode = 'P0002';
  end if;
  if p_mode = 'create' and found then
    raise exception 'มีเอกสาร %/% อยู่แล้ว', p_table, p_id using errcode = '23505';
  end if;

  result := case when p_mode in ('merge', 'update') and found then cur else '{}'::jsonb end;

  for op in select * from jsonb_array_elements(coalesce(p_ops, '[]'::jsonb)) loop
    path := array(select jsonb_array_elements_text(op->'path'));
    if op ? 'delete' then
      result := result #- path;
    else
      for i in 1 .. coalesce(array_length(path, 1), 0) - 1 loop
        if jsonb_typeof(result #> path[1:i]) is distinct from 'object' then
          result := jsonb_set(result, path[1:i], '{}'::jsonb, true);
        end if;
      end loop;
      result := jsonb_set(result, path, op->'value', true);
    end if;
  end loop;

  if found then
    execute format('update public.%I set data = $1 where id = $2', p_table) using result, p_id;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'ไม่มีสิทธิ์แก้ %/%', p_table, p_id using errcode = '42501';
    end if;
  else
    execute format('insert into public.%I (id, data) values ($1, $2)', p_table) using p_id, result;
  end if;
  return result;
end $$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant usage on schema public, app to service_role;
    grant all on all tables in schema public to service_role;
    grant execute on all functions in schema app to service_role;
    grant execute on function public.doc_write(text, text, text, jsonb) to service_role;
    alter default privileges in schema public grant all on tables to service_role;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.asset_handovers to anon, authenticated;
    alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
    grant execute on function public.doc_write(text, text, text, jsonb) to anon, authenticated;
  end if;
end $$;
