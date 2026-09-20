import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ehcvxzaoodwpuoqwbrot.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_BYmzvT3Ki7p7BvhJaXKbUA_-Ui7oSXN";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
