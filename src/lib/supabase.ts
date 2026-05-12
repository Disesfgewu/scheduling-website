// ─────────────────────────────────────────────────────────────────────────────
// Supabase Client
// Schema: tripsync（與其他專案共用 DB 時使用獨立 schema）
// ─────────────────────────────────────────────────────────────────────────────
//
// 啟用步驟：
//   1. npm install @supabase/supabase-js
//   2. 在 .env.local 填入：
//        NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//        NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
//        SUPABASE_SERVICE_ROLE_KEY=eyJ...（僅後端使用）
//   3. Supabase Dashboard → Settings → API → Extra Schema → 填入 tripsync → Save
//   4. 把下方 import/export 的註解移除
//
// ─────────────────────────────────────────────────────────────────────────────

// import { createClient } from '@supabase/supabase-js';
// import type { Database } from './database.types';
//
// const SCHEMA = 'tripsync' as const;
//
// /** 前端用（受 RLS 保護，用 anon key） */
// export const supabase = createClient<Database, typeof SCHEMA>(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//   { db: { schema: SCHEMA } },
// );
//
// /** 後端 / API Routes 用（繞過 RLS，只能在 server 端使用） */
// export const supabaseAdmin = createClient<Database, typeof SCHEMA>(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   { db: { schema: SCHEMA } },
// );
//
// ─── 生成 TypeScript 型別 ────────────────────────────────────────────────────
// npx supabase gen types typescript \
//   --project-id <your-project-id> \
//   --schema tripsync \
//   > src/lib/database.types.ts
//
// ─── 常用查詢範例（schema 已在 client 設定，不需要加前綴）──────────────────
//
// // 取得所有行程
// const { data: trips } = await supabase.from('trips').select('*');
//
// // 取得行程詳細（含 events 和 candidates）
// const { data } = await supabase
//   .from('trips')
//   .select(`
//     *,
//     trip_members ( *, profiles(*) ),
//     trip_events (*),
//     candidate_places (*)
//   `)
//   .eq('id', tripId)
//   .single();
//
// // 新增候選地點
// const { data: candidate } = await supabase
//   .from('candidate_places')
//   .insert({ trip_id: tripId, name: '淺草寺', category: 'culture', ... })
//   .select()
//   .single();
//
// // 上傳封面圖片
// const { data: upload } = await supabase.storage
//   .from('trip-images')
//   .upload(`trips/${tripId}/${Date.now()}.jpg`, file);
// const { data: { publicUrl } } = supabase.storage
//   .from('trip-images')
//   .getPublicUrl(upload.path);
//
// ─────────────────────────────────────────────────────────────────────────────

export const SUPABASE_SCHEMA = 'tripsync';
