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

-- ──────── supabase/migrations/20261110000300_columns.sql ────────
-- ═══════════════════════════════════════════════════════════════════
-- แยกข้อมูลใน data (jsonb) ออกเป็นคอลัมน์ — ดูใน Table Editor / ต่อ Power BI / เขียน SQL ได้ง่าย
--
-- เป็น "generated column": Postgres คำนวณจาก data เองทุกครั้งที่บันทึก
--   · แอปยังเขียนลง data เหมือนเดิม ไม่ต้องแก้โค้ด · คอลัมน์ตามทันทีเสมอ
--   · แก้ค่าที่คอลัมน์ตรง ๆ ไม่ได้ (ต้องแก้ใน data)
--   · แปลงตัวเลข/วันที่แบบปลอดภัย: ค่าเพี้ยน = ว่าง (null) ไม่ทำให้การบันทึกล้ม
-- ไม่แยก: รหัสผ่าน · รูป/ไฟล์ base64 · รายการซ้อน (ยังอยู่ใน data)
-- ═══════════════════════════════════════════════════════════════════

-- ── ตัวแปลงค่าแบบไม่ error ─────────────────────────────────────────
-- ตัวเลข: รับ 25000 / "25,000" / "25000.50"
create or replace function app.num(v jsonb) returns numeric
language plpgsql immutable as $$
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  if jsonb_typeof(v) = 'number' then return (v #>> '{}')::numeric; end if;
  return nullif(replace(trim(v #>> '{}'), ',', ''), '')::numeric;
exception when others then return null;
end $$;

-- วันที่: "2026-01-05" / "2026-01-05T..." / Timestamp {"__ts"} / "3/15/2024"
-- แบบมี / : ทรัพย์สินที่นำเข้าจาก Snipe-IT เป็น เดือน/วัน/ปี (ตรวจข้อมูลจริง 11/2026: ชัดว่าเดือนขึ้นก่อน 104 · วันขึ้นก่อน 0)
--           จึงถือเป็นเดือน/วัน ยกเว้นตัวแรกเกิน 12 (ต้องเป็นวัน) · ปี พ.ศ. ลบ 543
create or replace function app.dt(v jsonb) returns date
language plpgsql immutable as $$
declare
  s text;
  m text[];
  a int; b int; y int;
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  s := trim(case when jsonb_typeof(v) = 'object' then v->>'__ts' else v #>> '{}' end);
  if s ~ '^\d{4}-\d{2}-\d{2}' then return left(s, 10)::date; end if;
  m := regexp_match(s, '^(\d{1,2})/(\d{1,2})/(\d{4})$');
  if m is null then return null; end if;
  a := m[1]::int; b := m[2]::int; y := m[3]::int;
  if y > 2400 then y := y - 543; end if;
  if a > 12 then return make_date(y, b, a); end if;   -- วัน/เดือน
  return make_date(y, a, b);                           -- เดือน/วัน
exception when others then return null;
end $$;

-- เวลา: Timestamp {"__ts": ISO} หรือมิลลิวินาที (timestamp ของคำขอ/ประวัติ)
create or replace function app.ts(v jsonb) returns timestamptz
language plpgsql immutable as $$
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  if jsonb_typeof(v) = 'object' then return (v->>'__ts')::timestamptz; end if;
  if jsonb_typeof(v) = 'number' then return to_timestamp((v #>> '{}')::numeric / 1000); end if;
  return (v #>> '{}')::timestamptz;
exception when others then return null;
end $$;

-- รายการ → ข้อความคั่นจุลภาค (แบรนด์ที่ดูแล)
create or replace function app.list(v jsonb) returns text
language plpgsql immutable as $$
begin
  if v is null or jsonb_typeof(v) <> 'array' then return nullif(v #>> '{}', ''); end if;
  return nullif((select string_agg(x, ', ') from jsonb_array_elements_text(v) x), '');
exception when others then return null;
end $$;

-- จำนวนในรายการ (คนที่ถืออยู่)
create or replace function app.len(v jsonb) returns int
language plpgsql immutable as $$
begin
  if v is null or jsonb_typeof(v) <> 'array' then return 0; end if;
  return jsonb_array_length(v);
end $$;

-- ── สร้างคอลัมน์ ─────────────────────────────────────────────────
-- รายการ: ตาราง → [ชื่อคอลัมน์, ชนิด, นิพจน์]
do $$
declare
  spec jsonb := $j$
  {
    "employees": [
      ["emp_id","text","data->>'empId'"], ["name_prefix","text","data->>'namePrefix'"],
      ["full_name","text","data->>'fullName'"], ["nickname","text","data->>'nickname'"],
      ["full_name_eng","text","data->>'fullNameEng'"], ["position","text","data->>'position'"],
      ["department","text","data->>'department'"], ["company","text","data->>'company'"],
      ["m365_email","text","data->>'m365Email'"], ["phone","text","data->>'phone'"],
      ["manager","text","data->>'manager'"], ["manager_emp_id","text","data->>'managerEmpId'"],
      ["brands","text","app.list(data->'brands')"],
      ["start_date","date","app.dt(data->'startDate')"], ["resign_date","date","app.dt(data->'resignDate')"]
    ],
    "deleted_employees": [
      ["emp_id","text","data->>'empId'"], ["name_prefix","text","data->>'namePrefix'"],
      ["full_name","text","data->>'fullName'"], ["nickname","text","data->>'nickname'"],
      ["full_name_eng","text","data->>'fullNameEng'"], ["position","text","data->>'position'"],
      ["department","text","data->>'department'"], ["company","text","data->>'company'"],
      ["m365_email","text","data->>'m365Email'"], ["phone","text","data->>'phone'"],
      ["manager","text","data->>'manager'"], ["manager_emp_id","text","data->>'managerEmpId'"],
      ["brands","text","app.list(data->'brands')"],
      ["start_date","date","app.dt(data->'startDate')"], ["resign_date","date","app.dt(data->'resignDate')"],
      ["deleted_at","timestamptz","app.ts(data->'deletedAt')"]
    ],
    "assets": [
      ["asset_tag","text","data->>'assetTag'"], ["name","text","data->>'name'"], ["type","text","data->>'type'"],
      ["model","text","data->>'model'"], ["sn","text","data->>'sn'"], ["status","text","data->>'status'"],
      ["company","text","data->>'company'"], ["department","text","data->>'department'"],
      ["for_department","text","data->>'forDepartment'"], ["assigned_name","text","data->>'assignedName'"],
      ["asset_group","text","data->>'assetGroup'"], ["tier","text","data->>'tier'"], ["vendor","text","data->>'vendor'"],
      ["purchase_condition","text","data->>'purchaseCondition'"],
      ["cost","numeric","app.num(data->'cost')"], ["quantity","numeric","app.num(data->'quantity')"],
      ["broken_quantity","numeric","app.num(data->'brokenQuantity')"],
      ["purchase_date","date","app.dt(data->'purchaseDate')"], ["warranty_date","date","app.dt(data->'warrantyDate')"],
      ["note","text","data->>'note'"], ["remark","text","data->>'remark'"]
    ],
    "accessories": [
      ["name","text","data->>'name'"], ["type","text","data->>'type'"], ["vendor","text","data->>'vendor'"],
      ["status","text","data->>'status'"], ["quantity","numeric","app.num(data->'quantity')"],
      ["broken_quantity","numeric","app.num(data->'brokenQuantity')"], ["assigned_count","int","app.len(data->'assignees')"],
      ["cost","numeric","app.num(data->'cost')"],
      ["purchase_date","date","app.dt(data->'purchaseDate')"], ["warranty_date","date","app.dt(data->'warrantyDate')"],
      ["note","text","data->>'note'"]
    ],
    "licenses": [
      ["name","text","data->>'name'"], ["key_code","text","data->>'keyCode'"], ["supplier","text","data->>'supplier'"],
      ["status","text","data->>'status'"], ["quantity","numeric","app.num(data->'quantity')"],
      ["assigned_count","int","app.len(data->'assignees')"], ["cost","numeric","app.num(data->'cost')"],
      ["purchase_date","date","app.dt(data->'purchaseDate')"], ["expiration_date","date","app.dt(data->'expirationDate')"],
      ["purchase_order_number","text","data->>'purchaseOrderNumber'"], ["note","text","data->>'note'"]
    ],
    "office_supplies": [
      ["name","text","data->>'name'"], ["type","text","data->>'type'"], ["unit","text","data->>'unit'"],
      ["company","text","data->>'company'"], ["status","text","data->>'status'"], ["quantity","numeric","app.num(data->'quantity')"]
    ],
    "repair_requests": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["department","text","data->>'department'"],
      ["asset_name","text","data->>'assetName'"], ["issue","text","data->>'issue'"], ["status","text","data->>'status'"],
      ["requested_at","timestamptz","app.ts(data->'timestamp')"], ["started_at","timestamptz","app.ts(data->'startedAt')"],
      ["completed_at","timestamptz","app.ts(data->'completedAt')"],
      ["overall_rating","numeric","app.num(data->'evaluation'->'overallRating')"]
    ],
    "supply_requests": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["department","text","data->>'department'"],
      ["supply_name","text","data->>'supplyName'"], ["supply_company","text","data->>'supplyCompany'"],
      ["requested_qty","numeric","app.num(data->'requestedQty')"], ["status","text","data->>'status'"],
      ["note","text","data->>'note'"], ["requested_at","timestamptz","app.ts(data->'timestamp')"]
    ],
    "accessory_requests": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["nickname","text","data->>'nickname'"],
      ["department","text","data->>'department'"], ["accessory_name","text","data->>'accessoryName'"],
      ["accessory_type","text","data->>'accessoryType'"], ["request_type","text","data->>'requestType'"],
      ["quantity","numeric","app.num(data->'quantity')"], ["reason","text","data->>'reason'"],
      ["return_date","date","app.dt(data->'returnDate')"], ["status","text","data->>'status'"],
      ["requested_at","timestamptz","app.ts(data->'timestamp')"], ["approved_at","timestamptz","app.ts(data->'approvedAt')"]
    ],
    "replacement_requests": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["department","text","data->>'department'"],
      ["manager_name","text","data->>'managerName'"], ["current_status","text","data->>'currentStatus'"],
      ["status","text","data->>'status'"], ["requested_at","timestamptz","app.ts(data->'timestamp')"]
    ],
    "assets_transactions": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["asset_id","text","data->>'assetId'"],
      ["asset_name","text","data->>'assetName'"], ["action","text","data->>'action'"], ["category","text","data->>'category'"],
      ["condition","text","data->>'condition'"], ["remarks","text","data->>'remarks'"], ["checkout_id","text","data->>'checkoutId'"],
      ["at","timestamptz","app.ts(data->'timestamp')"]
    ],
    "accessories_transactions": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["asset_id","text","data->>'assetId'"],
      ["asset_name","text","data->>'assetName'"], ["sn","text","data->>'sn'"], ["action","text","data->>'action'"],
      ["category","text","data->>'category'"], ["condition","text","data->>'condition'"], ["remarks","text","data->>'remarks'"],
      ["checkout_id","text","data->>'checkoutId'"], ["at","timestamptz","app.ts(data->'timestamp')"]
    ],
    "licenses_transactions": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["license_id","text","data->>'licenseId'"],
      ["license_name","text","coalesce(data->>'licenseName', data->>'assetName')"], ["action","text","data->>'action'"],
      ["category","text","data->>'category'"], ["condition","text","data->>'condition'"], ["remarks","text","data->>'remarks'"],
      ["key_code","text","data->>'keyCode'"], ["checkout_id","text","data->>'checkoutId'"],
      ["at","timestamptz","app.ts(data->'timestamp')"]
    ]
  }
  $j$;
  t text;
  c jsonb;
begin
  for t in select jsonb_object_keys(spec) loop
    for c in select * from jsonb_array_elements(spec->t) loop
      execute format('alter table public.%I add column if not exists %I %s generated always as (%s) stored',
        t, c->>0, c->>1, c->>2);
    end loop;
  end loop;
end $$;

-- ค้นบ่อย
create index if not exists employees_emp_id on public.employees (emp_id);
create index if not exists assets_asset_tag on public.assets (asset_tag);
create index if not exists assets_sn on public.assets (sn);

-- ──────── supabase/migrations/20261110000400_report_views.sql ────────
-- ═══════════════════════════════════════════════════════════════════
-- หมวด report — ตารางสำหรับดู/ทำรายงาน (view) มีแค่คอลัมน์อ่านง่าย ไม่มีก้อน data
--   ใช้ใน SQL Editor / Power BI / Excel: select * from report.employees
--
-- ทำไมไม่ลบ data ออกจากตารางจริง: คอลัมน์แยกคำนวณจาก data · data มีข้อมูลที่ไม่ได้แยก
-- (ลิงก์ ผู้ถือครอง รูป การประเมินสภาพ) · แอปบันทึกลง data
--
-- security_invoker: view ใช้สิทธิ์ของคนที่ดู → RLS ของตารางจริงยังกั้นเหมือนเดิม
-- (ถ้าไม่ใส่ view จะใช้สิทธิ์เจ้าของ = เห็นทุกแถว ข้าม RLS)
-- คอลัมน์ในตารางจริงเพิ่มทีหลัง → รันไฟล์นี้ซ้ำได้ (create or replace)
-- ═══════════════════════════════════════════════════════════════════

create schema if not exists report;

do $$
declare
  t text;
  cols text;
begin
  foreach t in array array[
    'employees', 'deleted_employees', 'assets', 'accessories', 'licenses', 'office_supplies',
    'repair_requests', 'supply_requests', 'accessory_requests', 'replacement_requests',
    'assets_transactions', 'accessories_transactions', 'licenses_transactions'
  ] loop
    -- id → คอลัมน์ที่แยกจาก data (ตามลำดับที่สร้าง) → created_at, updated_at
    select string_agg(format('%I', column_name), ', ' order by
             case column_name when 'id' then 0 when 'created_at' then 2 when 'updated_at' then 3 else 1 end,
             ordinal_position)
      into cols
      from information_schema.columns
     where table_schema = 'public' and table_name = t and column_name <> 'data';
    execute format('drop view if exists report.%I', t);
    execute format('create view report.%I with (security_invoker = true) as select %s from public.%I', t, cols, t);
  end loop;
end $$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema report to authenticated, service_role;
    grant select on all tables in schema report to authenticated, service_role;
    revoke all on all tables in schema report from anon;
  end if;
end $$;

-- ──────── supabase/migrations/20261110000500_staff_auth.sql ────────
-- ═══════════════════════════════════════════════════════════════════
-- ระบบเข้าสู่ระบบบน Supabase Auth (ระยะที่ 3)
--
-- พนักงาน = ผู้ใช้ Supabase Auth ที่ api/staff-login สร้างให้ (อีเมลสังเคราะห์)
--   ค่าอยู่ที่ app_metadata = { app_role: 'staff', emp_id, emp_doc_id }
--   app_metadata ตั้งได้เฉพาะ service role — ผู้ใช้แก้ของตัวเองไม่ได้ (ต่างจาก user_metadata)
--   อ่านค่าบนสุดของ JWT สำรองไว้ (token ของ Supabase ไม่มีคีย์เหล่านี้บนสุด ผู้ใช้ใส่เองไม่ได้)
--
-- "ผู้ใช้ที่ login" (signed_in) ต้องเป็นคนที่ระบบรู้จักเท่านั้น
--   ผู้ดูแล (มีแถวใน admin_users) · พนักงานที่ยังทำงานอยู่ · บัญชีที่ตั้ง app_role = 'hr'
--   เดิม (Firebase) แค่มีบัญชีก็อ่านข้อมูลได้ — ถ้ามีคนสมัครบัญชีเองได้ จะเห็นข้อมูลทั้งหมด
--   พนักงานที่ถูกลบ / ถึงวันที่ออก หมดสิทธิ์ทันทีแม้ token ยังไม่หมดอายุ (staff-login กันแค่ตอนเข้า)
-- ═══════════════════════════════════════════════════════════════════

create or replace function app.claim(k text) returns text
language sql stable as $$
  select coalesce(app.claims()->'app_metadata'->>k, app.claims()->>k)
$$;

create or replace function app.emp_id() returns text
language sql stable as $$ select app.claim('emp_id') $$;

create or replace function app.emp_doc_id() returns text
language sql stable as $$ select app.claim('emp_doc_id') $$;

-- พนักงานตาม token ยังอยู่ใน employees และยังไม่ถึงวันที่ออก (เวลาไทย) — เหมือน api/staff-login
create or replace function app.staff_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.employees e
    where e.id = app.claim('emp_doc_id')
      and not (coalesce(e.data->>'resignDate', '') ~ '^\d{4}-\d{2}-\d{2}$'
               and e.data->>'resignDate' <= to_char(now() at time zone 'Asia/Bangkok', 'YYYY-MM-DD'))
  )
$$;

create or replace function app.signed_in() returns boolean
language sql stable security definer set search_path = public as $$
  select app.claims()->>'role' = 'authenticated' and (
    case coalesce(app.claim('app_role'), '')
      when 'staff' then app.staff_active()
      when 'hr' then true
      else exists (select 1 from public.admin_users where id = app.uid())
    end)
$$;

create or replace function app.is_staff() returns boolean
language sql stable as $$ select app.claim('app_role') = 'staff' and app.signed_in() $$;

-- token ของพนักงาน / hr ไม่นับเป็น admin แม้ sub จะบังเอิญตรงกับ id ใน admin_users
create or replace function app.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select app.claims()->>'role' = 'authenticated' and coalesce(app.claim('app_role'), '') = ''
     and exists (select 1 from public.admin_users where id = app.uid())
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on all functions in schema app to anon, authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on all functions in schema app to service_role;
  end if;
end $$;

-- ──────── supabase/migrations/20261110000600_name_columns.sql ────────
-- ═══════════════════════════════════════════════════════════════════
-- ชื่อจริง / นามสกุล แยกคอลัมน์ (ไทย + อังกฤษ) — หลักเดียวกับไฟล์ส่งออก CSV (src/utils/nameUtils.js resolveName)
--   มี firstName / lastName ในข้อมูล → ใช้ตามนั้น
--   ไม่มี (ข้อมูลรุ่นเก่า ~44 คน เก็บแค่ fullName) → ตัดที่ช่องว่างแรก: ก่อน = ชื่อ · ที่เหลือ = นามสกุล
-- + report.employees / report.deleted_employees เรียงคอลัมน์ตามไฟล์ CSV และมีคอลัมน์ "สถานะ"
-- ═══════════════════════════════════════════════════════════════════

create or replace function app.name_part(first_name text, last_name text, full_name text, want_last boolean)
returns text language plpgsql immutable as $$
declare
  f text := btrim(coalesce(first_name, ''));
  l text := btrim(coalesce(last_name, ''));
  s text := btrim(regexp_replace(coalesce(full_name, ''), '\s+', ' ', 'g'));
  i int;
begin
  if f <> '' or l <> '' then
    return nullif(case when want_last then l else f end, '');
  end if;
  if s = '' then return null; end if;
  i := position(' ' in s);
  if i = 0 then return case when want_last then null else s end; end if;
  return nullif(case when want_last then substr(s, i + 1) else left(s, i - 1) end, '');
end $$;

do $$
declare t text;
begin
  foreach t in array array['employees', 'deleted_employees'] loop
    execute format($f$
      alter table public.%1$I
        add column if not exists first_name text generated always as
          (app.name_part(data->>'firstName', data->>'lastName', data->>'fullName', false)) stored,
        add column if not exists last_name text generated always as
          (app.name_part(data->>'firstName', data->>'lastName', data->>'fullName', true)) stored,
        add column if not exists first_name_eng text generated always as
          (app.name_part(data->>'firstNameEng', data->>'lastNameEng', data->>'fullNameEng', false)) stored,
        add column if not exists last_name_eng text generated always as
          (app.name_part(data->>'firstNameEng', data->>'lastNameEng', data->>'fullNameEng', true)) stored
    $f$, t);
  end loop;
end $$;

-- view เรียงแบบไฟล์ CSV: บริษัท · รหัส · คำนำหน้า · ชื่อ · นามสกุล · ชื่อ-นามสกุล · ชื่อเล่น · (EN) · ตำแหน่ง · แผนก ·
-- อีเมล · เบอร์ · วันเริ่ม · วันออก · แบรนด์ · สถานะ · รหัสหัวหน้า · ชื่อหัวหน้า
-- สถานะ: ถึงวันที่ออก (เวลาไทย) = ออกแล้ว · ตาราง deleted_employees = ออกแล้วเสมอ
drop view if exists report.employees;
create view report.employees with (security_invoker = true) as
select id, company, emp_id, name_prefix, first_name, last_name, full_name, nickname,
       first_name_eng, last_name_eng, full_name_eng, position, department, m365_email, phone,
       start_date, resign_date, brands,
       case when resign_date <= (now() at time zone 'Asia/Bangkok')::date then 'ออกแล้ว' else 'ทำงานอยู่' end as status,
       manager_emp_id, manager, created_at, updated_at
  from public.employees;

drop view if exists report.deleted_employees;
create view report.deleted_employees with (security_invoker = true) as
select id, company, emp_id, name_prefix, first_name, last_name, full_name, nickname,
       first_name_eng, last_name_eng, full_name_eng, position, department, m365_email, phone,
       start_date, resign_date, brands, 'ออกแล้ว'::text as status,
       manager_emp_id, manager, deleted_at, created_at, updated_at
  from public.deleted_employees;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on report.employees, report.deleted_employees to authenticated, service_role;
    revoke all on report.employees, report.deleted_employees from anon;
  end if;
end $$;

