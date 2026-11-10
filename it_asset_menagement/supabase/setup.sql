-- ═══ ติดตั้งฐานข้อมูล IT Asset Management บน Supabase (ไฟล์รวม — วางใน SQL Editor แล้วกด Run ครั้งเดียว) ═══
-- สร้างจาก supabase/migrations/*.sql ตามลำดับ · รันซ้ำไม่ได้ (policy ซ้ำชื่อ) — ถ้าต้องเริ่มใหม่ให้ลบตารางก่อน

-- ──────── supabase/migrations/20261110000000_init.sql ────────
-- ═══════════════════════════════════════════════════════════════════
-- IT Asset Management — โครงสร้างฐานข้อมูลบน Supabase (ย้ายจาก Firestore)
--
-- แนวทาง: ยกเอกสารมาทั้งก้อน — 1 collection = 1 ตาราง · id เดิมของ Firestore
-- ฟิลด์ทั้งหมดอยู่ใน data (jsonb) · Timestamp เก็บเป็น {"__ts": "ISO"} (src/db/codec.js)
-- subcollection (chunks / signed_chunks) อยู่ที่ตารางกลาง doc_chunks
--
-- สิทธิ์ (RLS) แปลมาจาก firestore.rules ทีละข้อ — ทดสอบด้วย npm run test:supabase
--   admin = ผู้ใช้ Supabase Auth ที่มีแถวใน admin_users (id = auth.uid())
--   staff = JWT ที่ api/staff-login ออกให้ มี claim app_role = 'staff', emp_id, emp_doc_id
-- ═══════════════════════════════════════════════════════════════════

create schema if not exists app;

-- ── ตัวช่วย ────────────────────────────────────────────────────────
create or replace function app.claims() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create or replace function app.signed_in() returns boolean
language sql stable as $$ select app.claims()->>'role' = 'authenticated' $$;

create or replace function app.uid() returns text
language sql stable as $$ select app.claims()->>'sub' $$;

create or replace function app.is_staff() returns boolean
language sql stable as $$ select app.signed_in() and app.claims()->>'app_role' = 'staff' $$;

create or replace function app.emp_id() returns text
language sql stable as $$ select app.claims()->>'emp_id' $$;

create or replace function app.emp_doc_id() returns text
language sql stable as $$ select app.claims()->>'emp_doc_id' $$;

-- คีย์ที่ต่างกันระหว่างเอกสารเก่า/ใหม่ (เพิ่ม ลบ หรือเปลี่ยนค่า)
create or replace function app.changed_keys(old_data jsonb, new_data jsonb) returns text[]
language sql immutable as $$
  select coalesce(array_agg(k), '{}') from (
    select k from jsonb_object_keys(old_data || new_data) as k
    where (old_data -> k) is distinct from (new_data -> k)
  ) s
$$;

-- เอกสารมีเฉพาะคีย์ในรายการ
create or replace function app.only_keys(data jsonb, allowed text[]) returns boolean
language sql immutable as $$
  select not exists (select 1 from jsonb_object_keys(data) k where k <> all(allowed))
$$;

create or replace function app.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

-- ── ตาราง ──────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'settings', 'it_report',
    'assets', 'accessories', 'licenses', 'office_supplies', 'bundled_items',
    'employees', 'employee_secrets', 'deleted_employees',
    'repair_requests', 'supply_requests', 'replacement_requests', 'accessory_requests',
    'assets_transactions', 'accessories_transactions', 'licenses_transactions',
    'transaction_attachments', 'asset_purchase_docs', 'printed_documents',
    'staff_passwords', 'line_users', 'admin_users'
  ] loop
    execute format($f$
      create table if not exists public.%I (
        id         text primary key default gen_random_uuid()::text,
        data       jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )$f$, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function app.touch_updated_at()', t);
  end loop;
end $$;

-- subcollection ทั้งหมด (ไฟล์แนบแบ่งชิ้น) — ทุกตัวเป็นของ admin
create table if not exists public.doc_chunks (
  parent_collection text not null,
  parent_id         text not null,
  sub               text not null,
  id                text not null default gen_random_uuid()::text,
  data              jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  primary key (parent_collection, parent_id, sub, id)
);
alter table public.doc_chunks enable row level security;

-- security definer: อ่าน admin_users ได้แม้ตัว admin_users เองมี RLS
-- token ของ staff ไม่นับเป็น admin แม้ sub จะบังเอิญตรงกับ id ใน admin_users
create or replace function app.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select app.signed_in() and coalesce(app.claims()->>'app_role', '') <> 'staff'
     and exists (select 1 from public.admin_users where id = app.uid())
$$;

create or replace function app.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select app.is_admin() and exists (
    select 1 from public.admin_users where id = app.uid() and (data->>'isSuperAdmin')::boolean is true)
$$;

-- คำขอ: ค้นด้วยรหัสพนักงานบ่อย (หน้าพนักงาน)
create index if not exists repair_requests_emp on public.repair_requests ((data->>'empId'));
create index if not exists supply_requests_emp on public.supply_requests ((data->>'empId'));
create index if not exists replacement_requests_emp on public.replacement_requests ((data->>'empId'));
create index if not exists accessory_requests_emp on public.accessory_requests ((data->>'empId'));
create index if not exists employees_emp on public.employees ((data->>'empId'));

-- ── สิทธิ์ ─────────────────────────────────────────────────────────
-- settings: อ่านได้ทุกคน (หน้า login ใช้) · เขียน admin
create policy settings_read on public.settings for select using (true);
create policy settings_write on public.settings for all using (app.is_admin()) with check (app.is_admin());

-- admin เท่านั้น ทั้งอ่านและเขียน
do $$
declare t text;
begin
  foreach t in array array[
    'it_report', 'deleted_employees',
    'assets_transactions', 'accessories_transactions', 'licenses_transactions',
    'transaction_attachments', 'asset_purchase_docs', 'printed_documents', 'doc_chunks'
  ] loop
    execute format('create policy admin_all on public.%I for all using (app.is_admin()) with check (app.is_admin())', t);
  end loop;
end $$;

-- ข้อมูลหลัก: login แล้วอ่านได้ · เขียน admin
do $$
declare t text;
begin
  foreach t in array array['assets', 'accessories', 'licenses', 'office_supplies', 'bundled_items'] loop
    execute format('create policy signed_read on public.%I for select using (app.signed_in())', t);
    execute format('create policy admin_insert on public.%I for insert with check (app.is_admin())', t);
    execute format('create policy admin_update on public.%I for update using (app.is_admin()) with check (app.is_admin())', t);
    execute format('create policy admin_delete on public.%I for delete using (app.is_admin())', t);
  end loop;
end $$;

-- employees: เอกสารใหม่ห้ามมี m365Password (อยู่ที่ employee_secrets)
--            staff แก้ได้เฉพาะเอกสารตัวเอง เฉพาะฟิลด์ profile (ตรวจใน trigger — RLS เทียบค่าเก่ากับใหม่ไม่ได้)
create policy emp_read on public.employees for select using (app.signed_in());
create policy emp_insert on public.employees for insert with check (app.is_admin() and not (data ? 'm365Password'));
create policy emp_delete on public.employees for delete using (app.is_admin());
create policy emp_update on public.employees for update
  using (app.is_admin() or (app.is_staff() and id = app.emp_doc_id()))
  with check (app.is_admin() or (app.is_staff() and id = app.emp_doc_id()));

create or replace function app.guard_employee_update() returns trigger
language plpgsql as $$
begin
  if app.is_admin() or current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if not (app.changed_keys(old.data, new.data) <@ array[
      'fullName', 'fullNameEng', 'nickname', 'position', 'department', 'company', 'phone', 'm365Email', 'links', 'updatedAt']) then
    raise exception 'staff แก้ได้เฉพาะข้อมูลส่วนตัว' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists guard_employee_update on public.employees;
create trigger guard_employee_update before update on public.employees for each row execute function app.guard_employee_update();

-- employee_secrets: admin หรือเจ้าของ · staff เขียนได้แค่ m365Password
create policy sec_read on public.employee_secrets for select
  using (app.is_admin() or (app.is_staff() and id = app.emp_doc_id()));
create policy sec_insert on public.employee_secrets for insert
  with check (app.is_admin() or (app.is_staff() and id = app.emp_doc_id() and app.only_keys(data, array['m365Password', 'updatedAt'])));
create policy sec_update on public.employee_secrets for update
  using (app.is_admin() or (app.is_staff() and id = app.emp_doc_id()))
  with check (app.is_admin() or (app.is_staff() and id = app.emp_doc_id() and app.only_keys(data, array['m365Password', 'updatedAt'])));

-- คำขอทั้ง 4 แบบ: login แล้วอ่านได้ · สร้างได้เฉพาะในนามตัวเอง (admin สร้างแทนได้)
create or replace function app.is_own_request(data jsonb, required text[]) returns boolean
language sql stable as $$
  select (app.is_admin() or (app.is_staff() and data->>'empId' = app.emp_id())) and data ?& required
$$;

create policy rr_read on public.repair_requests for select using (app.signed_in());
create policy rr_insert on public.repair_requests for insert with check (app.is_own_request(data, array['empId', 'empName']));
create policy rr_update on public.repair_requests for update
  using (app.is_admin() or (app.signed_in() and data->>'empId' = app.emp_id()))
  with check (app.is_admin() or (app.signed_in() and data->>'empId' = app.emp_id()));
create policy rr_delete on public.repair_requests for delete
  using (app.is_admin() or (app.signed_in() and data->>'empId' = app.emp_id() and data->>'status' = 'รอดำเนินการ'));

-- เจ้าของคำขอแจ้งซ่อมแก้ได้แค่ "evaluation" (ให้คะแนน)
create or replace function app.guard_repair_update() returns trigger
language plpgsql as $$
begin
  if app.is_admin() or current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if not (app.changed_keys(old.data, new.data) <@ array['evaluation']) then
    raise exception 'แก้ได้เฉพาะการประเมิน' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists guard_repair_update on public.repair_requests;
create trigger guard_repair_update before update on public.repair_requests for each row execute function app.guard_repair_update();

create policy sr_read on public.supply_requests for select using (app.signed_in());
create policy sr_insert on public.supply_requests for insert with check (app.is_own_request(data, array['empId', 'empName']));
create policy sr_update on public.supply_requests for update using (app.is_admin()) with check (app.is_admin());
create policy sr_delete on public.supply_requests for delete
  using (app.is_admin() or (app.signed_in() and data->>'empId' = app.emp_id() and data->>'status' = 'รอดำเนินการ'));

create policy rp_read on public.replacement_requests for select using (app.signed_in());
create policy rp_insert on public.replacement_requests for insert with check (app.is_own_request(data, array['empId', 'empName']));
create policy rp_update on public.replacement_requests for update using (app.is_admin()) with check (app.is_admin());
create policy rp_delete on public.replacement_requests for delete using (app.is_admin());

create policy ar_read on public.accessory_requests for select using (app.signed_in());
create policy ar_insert on public.accessory_requests for insert
  with check (app.is_own_request(data, array['empId', 'empName', 'accessoryId', 'requestType']));
create policy ar_update on public.accessory_requests for update using (app.is_admin()) with check (app.is_admin());
create policy ar_delete on public.accessory_requests for delete using (app.is_admin());

-- staff_passwords: admin อ่าน · เขียนผ่าน Vercel API (service role) เท่านั้น
create policy sp_read on public.staff_passwords for select using (app.is_admin());

-- line_users: admin อ่าน/ลบ · webhook (service role) สร้าง/แก้
create policy lu_read on public.line_users for select using (app.is_admin());
create policy lu_delete on public.line_users for delete using (app.is_admin());

-- admin_users: admin อ่าน · SuperAdmin จัดการ · admin แก้ของตัวเอง
create policy au_read on public.admin_users for select using (app.is_admin());
create policy au_insert on public.admin_users for insert with check (app.is_super_admin());
create policy au_update on public.admin_users for update
  using (app.is_super_admin() or (app.is_admin() and id = app.uid()))
  with check (app.is_super_admin() or (app.is_admin() and id = app.uid()));
create policy au_delete on public.admin_users for delete using (app.is_super_admin());

-- ── Realtime (แทน onSnapshot) ─────────────────────────────────────
-- เฉพาะบน Supabase จริง (มี publication supabase_realtime) — RLS ใช้กับ realtime ด้วย
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'settings', 'assets', 'accessories', 'licenses', 'office_supplies', 'bundled_items',
      'employees', 'deleted_employees',
      'repair_requests', 'supply_requests', 'replacement_requests', 'accessory_requests',
      'assets_transactions', 'accessories_transactions', 'licenses_transactions',
      'it_report', 'admin_users', 'employee_secrets'
    ] loop
      execute format('alter publication supabase_realtime add table public.%I', t);
      execute format('alter table public.%I replica identity full', t);   -- ให้ event ลบส่ง id มาด้วย
    end loop;
  end if;
end $$;

-- ── สิทธิ์ระดับตาราง (RLS กรองแถวอีกชั้น) ───────────────────────────
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema app to anon, authenticated;
    grant execute on all functions in schema app to anon, authenticated;
    -- เหมือนค่าตั้งต้นของ Supabase: ให้สิทธิ์ตาราง แล้วให้ RLS ตัดสินทีละแถว
    grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  end if;
end $$;

-- ──────── supabase/migrations/20261110000100_doc_write.sql ────────
-- ═══════════════════════════════════════════════════════════════════
-- doc_write — เขียนเอกสารแบบ Firestore ในคำสั่งเดียว (ใช้โดย src/db/compat.js)
--   p_mode: 'create' (ต้องยังไม่มี) · 'set' (แทนทั้งก้อน) · 'merge' (setDoc merge) · 'update' (ต้องมีอยู่แล้ว)
--   p_ops:  [{ "path": ["a","b"], "value": ... } | { "path": [...], "delete": true }]
-- security invoker = RLS ของผู้เรียกยังใช้เต็ม (แก้แถวที่ไม่มีสิทธิ์ → error permission)
-- ═══════════════════════════════════════════════════════════════════

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
  if p_table not in (
    'settings', 'it_report', 'assets', 'accessories', 'licenses', 'office_supplies', 'bundled_items',
    'employees', 'employee_secrets', 'deleted_employees',
    'repair_requests', 'supply_requests', 'replacement_requests', 'accessory_requests',
    'assets_transactions', 'accessories_transactions', 'licenses_transactions',
    'transaction_attachments', 'asset_purchase_docs', 'printed_documents',
    'staff_passwords', 'line_users', 'admin_users'
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
      -- สร้างออบเจ็กต์ระหว่างทางให้ครบ (jsonb_set สร้างได้แค่คีย์สุดท้าย)
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
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.doc_write(text, text, text, jsonb) to anon, authenticated;
  end if;
end $$;

-- ──────── supabase/migrations/20261110000200_grants_handovers.sql ────────
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

