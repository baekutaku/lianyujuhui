// lib/supabase/server.ts (수정 후)
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 기존 코드와의 호환성을 위해 유지 (단계적 마이그레이션용)
export const supabase = createServerSupabase();