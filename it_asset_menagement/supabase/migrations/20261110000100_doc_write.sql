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
