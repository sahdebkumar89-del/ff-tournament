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

export async function joinTournament(tournament) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in to join a tournament.");
  }

  const { data, error } = await supabase
    .from("tournament_participants")
    .insert({
      tournament_id: tournament.id,
      user_id: user.id,
      entry_fee: tournament.entry_fee,
      first_prize: tournament.first_prize,
      second_prize: tournament.second_prize,
      third_prize: tournament.third_prize,
      kill_reward: tournament.kill_reward,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
