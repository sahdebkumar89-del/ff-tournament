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
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("tournaments")
    .select(TOURNAMENT_SELECT)
    .eq("is_enabled", true)
    .gte("tournament_date", today)
    .lte("tournament_date", tomorrow)
    .order("slot_id", { ascending: true })
    .order("tournament_date", { ascending: true });

  if (error) throw error;

  const bySlot = new Map();

  for (const tournament of data ?? []) {
    const existing = bySlot.get(tournament.slot_id);

    if (!existing) {
      bySlot.set(tournament.slot_id, tournament);
      continue;
    }

    const tournamentOpen =
      tournament.registration_opens_at &&
      tournament.registration_opens_at <= now;

    const existingFinished =
      existing.status === "COMPLETED" || existing.status === "CANCELLED";

    const tournamentActive =
      tournament.status !== "COMPLETED" &&
      tournament.status !== "CANCELLED";

    // Once the next-day replacement is open, it completely replaces
    // the finished previous-day row for this slot.
    if (
      tournament.tournament_date > existing.tournament_date &&
      tournamentOpen &&
      tournamentActive
    ) {
      bySlot.set(tournament.slot_id, tournament);
    } else if (existingFinished && tournamentOpen && tournamentActive) {
      bySlot.set(tournament.slot_id, tournament);
    }
  }

  return [...bySlot.values()].sort((a, b) => {
    const aFinished = a.status === "COMPLETED" || a.status === "CANCELLED";
    const bFinished = b.status === "COMPLETED" || b.status === "CANCELLED";

    if (aFinished !== bFinished) return aFinished ? 1 : -1;
    return Number(a.slot_id) - Number(b.slot_id);
  });
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
