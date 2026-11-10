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
