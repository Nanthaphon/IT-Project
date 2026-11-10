/* backend ของ compat.js บน Supabase จริง (supabase-js)
   ตาราง: id + data (jsonb) · subcollection อยู่ที่ doc_chunks · เขียนผ่าน RPC doc_write (RLS ของผู้ใช้ยังใช้เต็ม)
   realtime: postgres_changes 1 ช่องต่อ 1 ตาราง ใช้ร่วมทุกผู้ฟัง */
import { CHUNK_TABLE } from './codec.js';

const PAGE = 1000;   // PostgREST ส่งได้ครั้งละไม่เกิน 1000 แถว

const permissionError = (e) => {
  const err = new Error(e.message);
  err.code = e.code === '42501' ? 'permission-denied' : e.code === 'P0002' ? 'not-found' : e.code === '23505' ? 'already-exists' : e.code;
  return err;
};

const chunkFilter = (q, p) => q.eq('parent_collection', p.parentCollection).eq('parent_id', p.parentId).eq('sub', p.sub);

export function createSupabaseBackend(supabase) {
  const channels = new Map();   // table → { channel, listeners:Set }

  return {
    async list(table, parent) {
      const out = [];
      for (let from = 0; ; from += PAGE) {
        let q = supabase.from(table).select('id,data').order('id').range(from, from + PAGE - 1);
        if (table === CHUNK_TABLE) q = chunkFilter(q, parent);
        const { data, error } = await q;
        if (error) throw permissionError(error);
        out.push(...data);
        if (data.length < PAGE) return out;
      }
    },

    async get(table, id, parent) {
      let q = supabase.from(table).select('id,data').eq('id', id);
      if (table === CHUNK_TABLE) q = chunkFilter(q, parent);
      const { data, error } = await q.maybeSingle();
      if (error) throw permissionError(error);
      return data;
    },

    async write(table, id, mode, ops) {
      const { data, error } = await supabase.rpc('doc_write', { p_table: table, p_id: id, p_mode: mode, p_ops: ops });
      if (error) throw permissionError(error);
      return data;
    },

    async putChunk(parent, id, data) {
      const { error } = await supabase.from(CHUNK_TABLE).upsert({
        parent_collection: parent.parentCollection, parent_id: parent.parentId, sub: parent.sub, id, data,
      });
      if (error) throw permissionError(error);
    },

    async remove(table, id, parent) {
      let q = supabase.from(table).delete().eq('id', id);
      if (table === CHUNK_TABLE) q = chunkFilter(q, parent);
      const { error } = await q;
      if (error) throw permissionError(error);
    },

    /* onChange({ type: 'upsert'|'delete', id, data }) — subcollection ไม่มี realtime (อ่านครั้งเดียวพอ) */
    subscribe(table, parent, onChange) {
      if (table === CHUNK_TABLE) return () => {};
      let entry = channels.get(table);
      if (!entry) {
        const listeners = new Set();
        const channel = supabase.channel(`db:${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, (p) => {
            const ev = p.eventType === 'DELETE'
              ? { type: 'delete', id: p.old?.id }
              : { type: 'upsert', id: p.new.id, data: p.new.data };
            listeners.forEach((fn) => fn(ev));
          })
          .subscribe();
        entry = { channel, listeners };
        channels.set(table, entry);
      }
      entry.listeners.add(onChange);
      return () => {
        entry.listeners.delete(onChange);
        if (!entry.listeners.size) { supabase.removeChannel(entry.channel); channels.delete(table); }
      };
    },
  };
}
