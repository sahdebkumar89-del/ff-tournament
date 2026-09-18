import { supabase } from "../../lib/supabase/client.js";

export async function getTournaments() {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
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

export async function confirmTournamentJoin(requestId) {
  const { data, error } = await supabase.rpc("confirm_tournament_join", {
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }

  return data;
}
