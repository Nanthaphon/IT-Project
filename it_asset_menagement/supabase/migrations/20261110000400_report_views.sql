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
