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
