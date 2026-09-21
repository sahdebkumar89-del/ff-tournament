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

  const rawTournaments = data ?? [];
  if (rawTournaments.length === 0) return rawTournaments;

  // The player-facing list is a rolling 30-slot board.
  // A next-day slot replaces today's completed slot only after its
  // registration_open_at time has actually arrived. This prevents
  // tomorrow's ready slots from being shown in addition to today's slots.
  const now = new Date();
  const bySlot = new Map();

  for (const tournament of rawTournaments) {
    const slotId = Number(tournament.slot_id);
    const existing = bySlot.get(slotId);

    if (!existing) {
      bySlot.set(slotId, tournament);
      continue;
    }

    const currentDate = String(existing.tournament_date);
    const candidateDate = String(tournament.tournament_date);
    const candidateIsReady =
      candidateDate === tomorrow &&
      tournament.registration_opens_at &&
      new Date(tournament.registration_opens_at) <= now;

    if (candidateIsReady) {
      bySlot.set(slotId, tournament);
    } else if (
      candidateDate === currentDate &&
      tournament.status !== "COMPLETED" &&
      tournament.status !== "CANCELLED"
    ) {
      bySlot.set(slotId, tournament);
    }
  }

  const tournaments = Array.from(bySlot.values()).sort((a, b) => {
    const dateCompare = String(a.tournament_date).localeCompare(String(b.tournament_date));
    return dateCompare || Number(a.slot_id) - Number(b.slot_id);
  });

  const ids = tournaments.map((tournament) => tournament.id);
  const { data: counts, error: countError } = await supabase.rpc(
    "get_tournament_capacity_counts",
    { p_tournament_ids: ids }
  );

  if (countError) throw countError;

  const countMap = new Map(
    (counts ?? []).map((row) => [
      Number(row.tournament_id),
      {
        playerCount: Number(row.player_count ?? 0),
        teamCount: Number(row.team_count ?? 0),
      },
    ])
  );

  return tournaments.map((tournament) => ({
    ...tournament,
    playerCount: countMap.get(Number(tournament.id))?.playerCount ?? 0,
    teamCount: countMap.get(Number(tournament.id))?.teamCount ?? 0,
  }));
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
