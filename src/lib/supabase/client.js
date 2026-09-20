import { createClient } from "@supabase/supabase-js";

// Production is intentionally pinned to the approved Supabase project.
// Vercel environment variables are not allowed to silently redirect the app
// to a different Supabase project.
const SUPABASE_URL = "https://ehcvxzaoodwpuoqwbrot.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BYmzvT3Ki7p7BvhJaXKbUA_-Ui7oSXN";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
