import { supabase } from "../../lib/supabase/client.js";

const TOURNAMENT_SELECT = [
  "id",
  "template_id",
  "slot_id",
  "tournament_date",
  "mode",
  "scheduled_start_time",
  "scheduled_end_time",
  "entry_fee",
  "first_prize",
  "second_prize",
  "third_prize",
  "kill_reward",
  "max_players",
  "max_teams",
  "status",
  "created_at",
  "updated_at",
  "registration_opens_at",
  "completed_at",
  "is_enabled",
].join(",");

export async function getTournaments() {
  const { data, error } = await supabase
    .from("tournaments")
    .select(TOURNAMENT_SELECT)
    .eq("is_enabled", true)
    .lte("registration_opens_at", new Date().toISOString())
    .order("tournament_date", { ascending: true })
    .order("scheduled_start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function requestTournamentJoin(tournamentId, freeFireUids) {
  const { data, error } = await supabase.rpc("request_tournament_join", {
    p_tournament_id: tournamentId,
    p_free_fire_uids: freeFireUids,
  });

  if (error) {
    throw error;
  }

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

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function confirmTournamentJoin(requestId) {
  const { data, error } = await supabase.rpc("confirm_tournament_join", {
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }

  return data;
}
