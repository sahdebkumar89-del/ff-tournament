import { supabase } from "../../lib/supabase/client.js";

const TOURNAMENT_SELECT = [
  "id","template_id","slot_id","tournament_date","mode",
  "scheduled_start_time","scheduled_end_time","entry_fee",
  "first_prize","second_prize","third_prize","kill_reward",
  "max_players","max_teams","status","created_at","updated_at",
  "registration_opens_at","completed_at","is_enabled",
].join(",");

function getDhakaDate(offsetDays = 0) {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(base);
}

export async function getTournaments() {
  const today = getDhakaDate(0);
  const tomorrow = getDhakaDate(1);

  const { data, error } = await supabase
    .from("tournaments")
    .select(TOURNAMENT_SELECT)
    .eq("is_enabled", true)
    .gte("tournament_date", today)
    .lte("tournament_date", tomorrow)
    .order("tournament_date", { ascending: true })
    .order("slot_id", { ascending: true });

  if (error) throw error;

  // Keep both records when a completed slot has its next-day
  // registration ready. The UI is responsible for placing the
  // next-day registration in the lower section, never in Upcoming.
  return data ?? [];
}

export async function requestTournamentJoin(tournamentId, freeFireUids) {
  const { data, error } = await supabase.rpc("request_tournament_join", {
    p_tournament_id: tournamentId,
    p_free_fire_uids: freeFireUids,
  });
  if (error) throw error;
  return data;
}

export async function getPendingTournamentJoinRequest(tournamentId) {
  const { data, error } = await supabase
    .from("tournament_join_requests")
    .select("id, free_fire_uids, expires_at")
    .eq("tournament_id", tournamentId)
    .eq("status", "PENDING")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function confirmTournamentJoin(requestId) {
  const { data, error } = await supabase.rpc("confirm_tournament_join", {
    p_request_id: requestId,
  });
  if (error) throw error;
  return data;
}
