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
