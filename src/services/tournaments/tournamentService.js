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

export async function joinTournament(tournamentId) {
  const { data, error } = await supabase.rpc("join_tournament", {
    p_tournament_id: tournamentId,
  });

  if (error) {
    throw error;
  }

  return data;
}
