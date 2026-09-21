import { supabase } from "../../lib/supabase/client.js";

function normalizeUid(value) {
  return String(value ?? "").trim();
}

export async function signUp(email, password, freeFireUid) {
  const uid = normalizeUid(freeFireUid);
  if (!/^[0-9]{5,20}$/.test(uid)) {
    throw new Error("Free Fire UID must contain 5 to 20 digits.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { free_fire_uid: uid } },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email, password, freeFireUid) {
  const uid = normalizeUid(freeFireUid);
  if (!/^[0-9]{5,20}$/.test(uid)) {
    throw new Error("Please enter your 5 to 20 digit Free Fire UID.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const userId = data?.user?.id;
  if (!userId) throw new Error("Unable to confirm your account.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("free_fire_uid")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    throw new Error("Unable to verify your Free Fire UID. Please try again.");
  }

  const storedUid = normalizeUid(profile?.free_fire_uid);
  if (!storedUid) {
    await supabase.auth.signOut();
    throw new Error("No Free Fire UID is linked to this account. Set your UID before signing in.");
  }

  if (storedUid !== uid) {
    await supabase.auth.signOut();
    throw new Error("Free Fire UID does not match this account. Login was not completed.");
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
