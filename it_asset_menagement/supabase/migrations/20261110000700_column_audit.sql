-- ═══════════════════════════════════════════════════════════════════
-- ตรวจคอลัมน์ทั้งระบบ (11/2026) — เติมส่วนที่ขาดให้ครบเท่าไฟล์ CSV ที่เว็บส่งออก + ทุกฟิลด์ข้อความ/ตัวเลขที่มีจริง
--   1) ตัวแปลงวันที่แบบ วัน/เดือน/ปี (วันที่เบิกสิทธิ์ License ที่ระบบสร้างเอง) — ต่างจากทรัพย์สิน Snipe-IT (เดือน/วัน/ปี)
--   2) คอลัมน์ที่ขาดในตารางเดิม + ตารางที่ยังไม่มีคอลัมน์เลย
--   3) report.license_seats — 1 แถวต่อ 1 สิทธิ์ แบบเดียวกับ CSV ของหน้า License
--      report.accessory_holders — 1 แถวต่อ 1 ชิ้นที่จ่ายออก (ใครถืออะไร)
--   4) report.employees: รหัสหัวหน้าหาแบบเดียวกับ CSV (managerCodeOf) · report.deleted_employees: วันที่ออก = วันที่ลบถ้าไม่ได้ตั้ง
-- ไม่แยกเป็นคอลัมน์ (ตั้งใจ): รหัสผ่าน · เลขบัตรประชาชน · รูป/ไฟล์ base64 · settings / it_report (ค่าตั้งค่า/ร่างรายงาน)
-- ═══════════════════════════════════════════════════════════════════

-- วัน/เดือน/ปี (ระบบสร้างด้วย formatDateShort) · ISO ก็รับ
create or replace function app.dt_dmy(v jsonb) returns date
language plpgsql immutable as $$
declare
  s text;
  m text[];
  y int;
begin
  if v is null or jsonb_typeof(v) = 'null' then return null; end if;
  s := trim(case when jsonb_typeof(v) = 'object' then v->>'__ts' else v #>> '{}' end);
  if s ~ '^\d{4}-\d{2}-\d{2}' then return left(s, 10)::date; end if;
  m := regexp_match(s, '^(\d{1,2})/(\d{1,2})/(\d{4})$');
  if m is null then return null; end if;
  y := m[3]::int;
  if y > 2400 then y := y - 543; end if;
  return make_date(y, m[2]::int, m[1]::int);
exception when others then return null;
end $$;

-- ค่าแรกที่ไม่ว่าง (เหมือน a || b ใน JavaScript: ข้อความว่างถือว่าไม่มี)
create or replace function app.nz(a jsonb, b jsonb) returns jsonb
language sql immutable as $$
  select case when a is null or jsonb_typeof(a) = 'null' or (jsonb_typeof(a) = 'string' and a #>> '{}' = '') then b else a end
$$;

create or replace function app.bool(v jsonb) returns boolean
language sql immutable as $$
  select case when v is null or jsonb_typeof(v) = 'null' then null
              when jsonb_typeof(v) = 'boolean' then (v #>> '{}')::boolean
              else lower(v #>> '{}') in ('true', '1', 'yes') end
$$;

-- ── คอลัมน์ที่เพิ่ม ─────────────────────────────────────────────────
do $$
declare
  spec jsonb := $j$
  {
    "assets": [["scrap_value","numeric","app.num(data->'scrapValue')"], ["assigned_to","text","data->>'assignedTo'"]],
    "accessories": [["request_disabled","boolean","app.bool(data->'requestDisabled')"], ["asset_group","text","data->>'assetGroup'"]],
    "licenses": [
      ["product_key","text","data->>'productKey'"], ["min_qty","numeric","app.num(data->'minQty')"],
      ["termination_date","date","app.dt(data->'terminationDate')"], ["reassignable","text","data->>'reassignable'"],
      ["assigned_to","text","data->>'assignedTo'"], ["assigned_name","text","data->>'assignedName'"]
    ],
    "office_supplies": [
      ["cost","numeric","app.num(data->'cost')"], ["purchase_date","date","app.dt(data->'purchaseDate')"],
      ["vendor","text","data->>'vendor'"], ["note","text","data->>'note'"]
    ],
    "repair_requests": [
      ["speed_rating","numeric","app.num(data->'evaluation'->'speedRating')"],
      ["quality_rating","numeric","app.num(data->'evaluation'->'qualityRating')"],
      ["service_rating","numeric","app.num(data->'evaluation'->'serviceRating')"],
      ["rating_comment","text","data->'evaluation'->>'comment'"],
      ["evaluated_by_name","text","data->'evaluation'->>'evaluatedByName'"],
      ["evaluated_at","timestamptz","app.ts(data->'evaluation'->'evaluatedAt')"]
    ],
    "supply_requests": [["supply_id","text","data->>'supplyId'"]],
    "accessory_requests": [["accessory_id","text","data->>'accessoryId'"], ["manager","text","data->>'manager'"]],
    "replacement_requests": [["reason","text","data->>'reason'"]],
    "assets_transactions": [
      ["checkout_notes","text","data->>'checkoutNotes'"], ["checkout_defects_note","text","data->>'checkoutDefectsNote'"],
      ["return_notes","text","data->>'returnNotes'"], ["return_defects_note","text","data->>'returnDefectsNote'"]
    ],
    "licenses_transactions": [
      ["asset_id","text","data->>'assetId'"], ["is_asset_bound","boolean","app.bool(data->'isAssetBound')"],
      ["seat_id","text","data->>'seatId'"], ["product_key","text","data->>'productKey'"]
    ],
    "bundled_items": [
      ["name","text","data->>'name'"], ["type","text","data->>'type'"], ["model","text","data->>'model'"], ["note","text","data->>'note'"]
    ],
    "admin_users": [
      ["email","text","data->>'email'"], ["display_name","text","data->>'displayName'"],
      ["is_super_admin","boolean","app.bool(data->'isSuperAdmin')"]
    ],
    "transaction_attachments": [
      ["checkout_id","text","data->>'checkoutId'"], ["asset_id","text","data->>'assetId'"],
      ["file_name","text","data->>'fileName'"], ["file_type","text","data->>'fileType'"],
      ["file_size","numeric","app.num(data->'fileSize')"], ["doc_type","text","data->>'docType'"],
      ["doc_label","text","data->>'docLabel'"], ["uploaded_at","timestamptz","app.ts(data->'uploadedAt')"]
    ],
    "asset_purchase_docs": [
      ["asset_id","text","data->>'assetId'"], ["history_id","text","data->>'historyId'"],
      ["file_name","text","data->>'fileName'"], ["file_type","text","data->>'fileType'"],
      ["file_size","numeric","app.num(data->'fileSize')"], ["uploaded_at","timestamptz","app.ts(data->'uploadedAt')"]
    ],
    "printed_documents": [
      ["employee_id","text","data->>'employeeId'"], ["employee_name","text","data->>'employeeName'"],
      ["emp_code","text","data->>'empCode'"], ["form_type","text","data->>'formType'"],
      ["doc_number","text","data->>'docNumber'"], ["form_date","text","data->>'formDate'"],
      ["asset_names","text","app.list(data->'assetNames')"], ["size_bytes","numeric","app.num(data->'sizeBytes')"]
    ],
    "line_users": [
      ["user_id","text","data->>'userId'"], ["display_name","text","data->>'displayName'"],
      ["source_type","text","data->>'sourceType'"], ["last_event_type","text","data->>'lastEventType'"],
      ["last_message","text","data->>'lastMessage'"], ["last_seen","timestamptz","app.ts(data->'lastSeen')"]
    ],
    "asset_handovers": [
      ["emp_id","text","data->>'empId'"], ["emp_name","text","data->>'empName'"], ["department","text","data->>'department'"],
      ["asset_id","text","data->>'assetId'"], ["asset_name","text","data->>'assetName'"],
      ["serial_number","text","data->>'serialNumber'"], ["status","text","data->>'status'"],
      ["checkout_date","text","data->>'checkoutDate'"], ["return_date","text","data->>'returnDate'"],
      ["checkout_at","timestamptz","app.ts(data->'checkoutDateTimestamp')"], ["return_at","timestamptz","app.ts(data->'returnDateTimestamp')"],
      ["checkout_id","text","data->>'checkoutId'"], ["collection_name","text","data->>'collectionName'"],
      ["remarks","text","data->>'remarks'"]
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

-- ── สร้าง view หมวด report ใหม่ให้มีคอลัมน์ที่เพิ่ม (ทุกตาราง ยกเว้นพนักงาน ซึ่งเรียงแบบ CSV ด้านล่าง) ──
do $$
declare
  t text;
  cols text;
begin
  foreach t in array array[
    'assets', 'accessories', 'licenses', 'office_supplies', 'bundled_items',
    'repair_requests', 'supply_requests', 'accessory_requests', 'replacement_requests',
    'assets_transactions', 'accessories_transactions', 'licenses_transactions',
    'transaction_attachments', 'asset_purchase_docs', 'printed_documents', 'line_users', 'asset_handovers', 'admin_users'
  ] loop
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

-- ── พนักงาน: เรียงแบบ CSV · รหัสหัวหน้าหาแบบเดียวกับ CSV (managerCodeOf) ──
-- รหัสใน managerEmpId ที่ชื่อยังตรง → ใช้เลย · ไม่ตรง/ไม่มี → หาคนที่ชื่อเต็มตรงกับ "หัวหน้า" (คนทำงานอยู่ก่อน) · ไม่เจอ → managerEmpId เดิม
create or replace view report.people_index with (security_invoker = true) as
select emp_id, full_name, 0 as pri from public.employees
union all
select emp_id, full_name, 1 as pri from public.deleted_employees;

drop view if exists report.employees;
create view report.employees with (security_invoker = true) as
select e.id, e.company, e.emp_id, e.name_prefix, e.first_name, e.last_name, e.full_name, e.nickname,
       e.first_name_eng, e.last_name_eng, e.full_name_eng, e.position, e.department, e.m365_email, e.phone,
       e.start_date, e.resign_date, e.brands,
       case when e.resign_date <= (now() at time zone 'Asia/Bangkok')::date then 'ออกแล้ว' else 'ทำงานอยู่' end as status,
       case when coalesce(e.manager, '') = '' then null else coalesce(
         (select p.emp_id from report.people_index p
           where lower(btrim(p.emp_id)) = lower(btrim(e.manager_emp_id)) and p.full_name = e.manager order by p.pri limit 1),
         (select p.emp_id from report.people_index p where p.full_name = e.manager order by p.pri limit 1),
         e.manager_emp_id) end as manager_emp_id,
       e.manager, e.created_at, e.updated_at
  from public.employees e;

drop view if exists report.deleted_employees;
create view report.deleted_employees with (security_invoker = true) as
select e.id, e.company, e.emp_id, e.name_prefix, e.first_name, e.last_name, e.full_name, e.nickname,
       e.first_name_eng, e.last_name_eng, e.full_name_eng, e.position, e.department, e.m365_email, e.phone,
       e.start_date,
       coalesce(e.resign_date, (e.deleted_at at time zone 'Asia/Bangkok')::date) as resign_date,   -- เหมือน CSV: ไม่ได้ตั้ง = วันที่ลบ
       e.brands, 'ออกแล้ว'::text as status,
       case when coalesce(e.manager, '') = '' then null else coalesce(
         (select p.emp_id from report.people_index p
           where lower(btrim(p.emp_id)) = lower(btrim(e.manager_emp_id)) and p.full_name = e.manager order by p.pri limit 1),
         (select p.emp_id from report.people_index p where p.full_name = e.manager order by p.pri limit 1),
         e.manager_emp_id) end as manager_emp_id,
       e.manager, e.deleted_at, e.created_at, e.updated_at
  from public.deleted_employees e;

-- ── สิทธิ์ License รายตัว (เหมือน CSV หน้า License) ──
-- จำนวนสิทธิ์ = quantity (0/ว่าง = 1) · สิทธิ์ที่ใช้อยู่จาก assignees · ที่เหลือ = ว่าง (ค่ารายสิทธิ์จาก available*[i])
-- ค่าว่างของสิทธิ์ใช้ค่าของ License แทน (Product Key / รหัส Key / Supplier / วันที่ซื้อ / วันหมดอายุ)
drop view if exists report.license_seats;
create view report.license_seats with (security_invoker = true) as
with l as (
  select id, data d, greatest(coalesce(nullif(app.num(data->'quantity'), 0), 1), 0)::int as total,
         app.len(data->'assignees') as used
    from public.licenses
)
select l.id as license_id, l.d->>'name' as license_name, a.n::int as seat_no,
       nullif(a.e->>'seatLabel', '') as seat_label,
       case when app.bool(a.e->'isAssetBound') or coalesce(a.e->>'assignedAssetId', '') <> ''
            then case when coalesce(a.e->>'empId', '') <> '' then 'ใช้งาน (ผูกเครื่อง)' else 'ติดตั้งบนเครื่อง' end
            else 'ใช้งาน' end as seat_status,
       nullif(a.e->>'empName', '') as emp_name, nullif(a.e->>'empId', '') as emp_id,
       nullif(a.e->>'assignedAssetName', '') as bound_asset,
       app.dt_dmy(a.e->'checkoutDate') as checkout_date,
       app.nz(a.e->'productKey', l.d->'productKey') #>> '{}' as product_key,
       app.nz(a.e->'keyCode', l.d->'keyCode') #>> '{}' as key_code,
       app.nz(a.e->'seatSupplier', l.d->'supplier') #>> '{}' as supplier,
       app.dt(app.nz(a.e->'seatPurchaseDate', l.d->'purchaseDate')) as purchase_date,
       app.dt(app.nz(a.e->'seatExpirationDate', l.d->'expirationDate')) as expiration_date,
       app.num(a.e->'seatCost') as seat_cost,
       nullif(app.nz(a.e->'seatNote', a.e->'remarks') #>> '{}', '') as note,
       app.len(a.e->'seatDocuments') as doc_count
  from l, jsonb_array_elements(case when jsonb_typeof(l.d->'assignees') = 'array' then l.d->'assignees' else '[]'::jsonb end)
          with ordinality as a(e, n)
union all
select l.id, l.d->>'name', l.used + i + 1,
       app.nz(l.d->'availableSeatLabels'->i, l.d->'name') #>> '{}',
       'ว่าง', null, null, null, null,
       app.nz(l.d->'availableKeys'->i, l.d->'productKey') #>> '{}',
       app.nz(l.d->'availableKeyCodes'->i, l.d->'keyCode') #>> '{}',
       app.nz(l.d->'availableSeatSuppliers'->i, l.d->'supplier') #>> '{}',
       app.dt(app.nz(l.d->'availableSeatPurchaseDates'->i, l.d->'purchaseDate')),
       app.dt(app.nz(l.d->'availableSeatExpirationDates'->i, l.d->'expirationDate')),
       app.num(l.d->'availableSeatCosts'->i),
       nullif(l.d->'availableSeatNotes'->>i, ''),
       app.len(l.d->'availableSeatDocs'->(i::text))
  from l, generate_series(0, greatest(l.total - l.used, 0) - 1) as i;

-- ── ชิ้นอุปกรณ์เสริมที่จ่ายออก (ใครถืออะไร) ──
drop view if exists report.accessory_holders;
create view report.accessory_holders with (security_invoker = true) as
select x.id as accessory_id, x.data->>'name' as accessory_name, x.data->>'type' as accessory_type,
       nullif(h.e->>'empId', '') as emp_id, nullif(h.e->>'empName', '') as emp_name,
       nullif(h.e->>'serialNumber', '') as serial_number, nullif(h.e->>'model', '') as model,
       app.num(h.e->'itemCost') as item_cost,
       app.dt(h.e->'purchaseDate') as purchase_date, app.dt(h.e->'warrantyDate') as warranty_date,
       app.ts(h.e->'assignedAt') as assigned_at,
       coalesce(app.bool(h.e->'isBorrow'), false) as is_borrow, app.dt(h.e->'returnDate') as return_date,
       nullif(h.e->>'note', '') as note, nullif(h.e->>'checkoutId', '') as checkout_id
  from public.accessories x,
       jsonb_array_elements(case when jsonb_typeof(x.data->'assignees') = 'array' then x.data->'assignees' else '[]'::jsonb end) as h(e);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema report to authenticated, service_role;
    grant select on all tables in schema report to authenticated, service_role;
    revoke all on all tables in schema report from anon;
  end if;
end $$;
