import React, { useEffect, useMemo, useState } from "react";
import { useTournaments } from "../../../hooks/useTournaments.js";
import TournamentDetails from "./TournamentDetails.jsx";

const FILTERS = ["ALL", "SOLO", "DUO", "SQUAD"];

export default function Tournaments() {
  const { tournaments, loading, error } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const byMode = filter === "ALL"
      ? tournaments
      : tournaments.filter((tournament) => tournament.mode === filter);

    return [...byMode].sort((a, b) => {
      const aFinished = isFinishedForDisplay(a, now);
      const bFinished = isFinishedForDisplay(b, now);
      if (aFinished !== bFinished) return aFinished ? 1 : -1;

      const dateCompare = String(a.tournament_date).localeCompare(String(b.tournament_date));
      if (dateCompare !== 0) return dateCompare;

      return Number(a.slot_id) - Number(b.slot_id);
    });
  }, [tournaments, filter]);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  const upcoming = filtered.filter((tournament) =>
    tournament.tournament_date === today &&
    !isFinishedForDisplay(tournament, now)
  );

  const lowerSection = filtered.filter((tournament) =>
    !(
      tournament.tournament_date === today &&
      !isFinishedForDisplay(tournament, now)
    )
  );

  if (selectedTournament) {
    return (
      <TournamentDetails
        tournament={selectedTournament}
        onBack={() => setSelectedTournament(null)}
      />
    );
  }

  const renderCard = (tournament) => (
    <article key={tournament.id} className="tournament-card" style={styles.card}>
      <div style={styles.cardTop}>
        <div>
          <span style={styles.modeBadge}>{tournament.mode}</span>
          <h2 style={styles.time}>{formatTime(tournament.scheduled_start_time)}</h2>
          <span style={styles.date}>{tournament.tournament_date}</span>
        </div>
        <div style={styles.headerStatus}>
          <span style={statusStyle(tournament.status)}>
            {displayStatus(tournament, now)}
          </span>
          <span style={styles.capacityMini}>
            {tournament.playerCount ?? 0}/{tournament.max_players} Players
          </span>
          <span style={styles.neededMini}>
            {Math.max(0, Number(tournament.max_players) - Number(tournament.playerCount ?? 0))} needed
          </span>
          {tournament.mode !== "SOLO" && (
            <span style={styles.teamMini}>
              {tournament.teamCount ?? 0}/{tournament.max_teams} Teams
            </span>
          )}
        </div>
      </div>

      <div style={styles.stats}>
        <Stat label="ENTRY" value={`৳${Number(tournament.entry_fee).toFixed(0)}`} />
        <Stat label="1ST PRIZE" value={`৳${Number(tournament.first_prize).toFixed(0)}`} />
        <Stat label="KILL" value={`৳${Number(tournament.kill_reward).toFixed(0)}`} />
      </div>

      <div style={styles.countdownRow}>
        <span style={styles.countdown}>{registrationLabel(tournament, now)}</span>
      </div>

      <button
        type="button"
        onClick={() => setSelectedTournament(tournament)}
        style={styles.joinButton}
      >
        {tournament.status === "REGISTRATION" ? "View & Join" : "View Tournament"}
      </button>
    </article>
  );

  return (
    <main className="tournaments-page" style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>FREE FIRE • BATTLE ROYALE</div>
          <h1 style={styles.title}>Tournaments</h1>
        </div>
        <span style={styles.brBadge}>BR ONLY</span>
      </div>

      <div style={styles.filters}>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`tournament-filter ${filter === item ? "is-active" : ""}`}
            onClick={() => setFilter(item)}
            style={{ ...styles.filterButton, ...(filter === item ? styles.filterActive : null) }}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && <div style={styles.statusCard}>Loading tournaments...</div>}
      {error && <div style={styles.errorCard}>Unable to load tournaments right now. Please refresh once.</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>◈</div>
          <h2 style={styles.emptyTitle}>No upcoming tournaments</h2>
          <p style={styles.emptyText}>New daily Battle Royale slots are generated automatically.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {upcoming.length > 0 && (
            <>
              <h2 style={styles.sectionTitle}>Upcoming Tournaments</h2>
              <div style={styles.list}>{upcoming.map(renderCard)}</div>
            </>
          )}

          {lowerSection.length > 0 && (
            <>
              <h2 style={{ ...styles.sectionTitle, marginTop: "26px" }}>
                Completed & Next Registration
              </h2>
              <div style={styles.list}>{lowerSection.map(renderCard)}</div>
            </>
          )}
        </>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return <div style={styles.stat}><span>{label}</span><strong>{value}</strong></div>;
}

function tournamentStartTimestamp(tournament) {
  if (!tournament?.tournament_date || !tournament?.scheduled_start_time) return Number.POSITIVE_INFINITY;
  return new Date(`${tournament.tournament_date}T${String(tournament.scheduled_start_time).slice(0, 8)}+06:00`).getTime();
}

function formatTime(value) {
  if (!value) return "—";
  const [hourText, minuteText] = String(value).slice(0, 5).split(":");
  let hour = Number(hourText);
  const minute = minuteText || "00";
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

function isFinishedForDisplay(tournament, now) {
  if (!tournament) return false;
  if (tournament.status === "COMPLETED" || tournament.status === "CANCELLED") {
    return true;
  }

  const end = tournamentEndTimestamp(tournament);
  return Number.isFinite(end) && now >= end;
}

function displayStatus(tournament, now) {
  if (tournament.status === "CANCELLED") return "CANCELLED";
  if (isFinishedForDisplay(tournament, now)) return "COMPLETED";
  if (tournament.status === "STARTED") return "LIVE";
  if (tournament.status === "REGISTRATION") return "OPEN";
  return tournament.status;
}

function tournamentEndTimestamp(tournament) {
  if (!tournament?.tournament_date || !tournament?.scheduled_end_time) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(
    `${tournament.tournament_date}T${String(tournament.scheduled_end_time).slice(0, 8)}+06:00`
  ).getTime();
}

function nextRegistrationOpenTimestamp(tournament) {
  const scheduledEnd = tournamentEndTimestamp(tournament);
  const scheduledEndPlusHour = Number.isFinite(scheduledEnd)
    ? scheduledEnd + 60 * 60 * 1000
    : Number.POSITIVE_INFINITY;

  const completedAt = tournament.completed_at
    ? new Date(tournament.completed_at).getTime() + 60 * 60 * 1000
    : Number.NEGATIVE_INFINITY;

  return Math.max(scheduledEndPlusHour, completedAt);
}

function registrationLabel(tournament, now) {
  if (tournament.status === "CANCELLED") return "CANCELLED";

  if (isFinishedForDisplay(tournament, now)) {
    const nextOpen = nextRegistrationOpenTimestamp(tournament);

    if (Number.isFinite(nextOpen) && now < nextOpen) {
      return `Registration opens again in ${formatCountdown(nextOpen - now)}`;
    }

    return "Registration Open";
  }

  if (tournament.status !== "REGISTRATION") {
    return tournament.status.replace("_", " ");
  }

  const registrationOpen = tournament.registration_opens_at
    ? new Date(tournament.registration_opens_at).getTime()
    : Number.NEGATIVE_INFINITY;

  if (now < registrationOpen) return "Registration not open yet";

  const start = tournamentStartTimestamp(tournament);
  const remaining = start - 30 * 60 * 1000 - now;

  if (remaining <= 0) return "Registration closed";
  if (remaining > 30 * 60 * 1000) return "Registration open";

  return `Closes in ${formatCountdown(remaining)}`;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, "0")}s`;
}

function statusStyle(status) {
  if (status === "REGISTRATION") return { ...styles.status, background: "#162b20", color: "#7fe4a0" };
  if (status === "STARTED") return { ...styles.status, background: "#382316", color: "#ffb267" };
  return { ...styles.status, background: "#24252a", color: "#aaa9af" };
}

const styles = {
  page: { maxWidth: "760px", margin: "0 auto", padding: "22px 18px 40px" },
  header: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: "12px", marginBottom: "18px" },
  kicker: { fontSize: "9px", letterSpacing: "1.8px", fontWeight: "900", color: "#ff7130" },
  title: { margin: "5px 0 0", fontSize: "27px", letterSpacing: "-.5px" },
  brBadge: { padding: "7px 9px", borderRadius: "8px", background: "#241719", color: "#ff8964", fontSize: "9px", fontWeight: "900" },
  filters: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "7px", padding: "5px", borderRadius: "13px", background: "#121216", border: "1px solid #29272b", marginBottom: "16px" },
  filterButton: { border: "none", borderRadius: "9px", background: "transparent", color: "#85828a", padding: "9px 4px", fontSize: "10px", fontWeight: "900" },
  filterActive: { background: "#351b18", color: "#ff9b5a" },
  sectionTitle: { margin: "0 0 11px", fontSize: "14px", fontWeight: "900", color: "#eee" },
  list: { display: "grid", gap: "12px" },
  card: { padding: "16px", borderRadius: "19px", background: "#121216", border: "1px solid #29272b", boxShadow: "0 8px 24px rgba(0,0,0,.18)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: "10px" },
  modeBadge: { display: "inline-block", padding: "5px 7px", borderRadius: "7px", background: "#311919", color: "#ff795f", fontSize: "9px", fontWeight: "900" },
  time: { margin: "9px 0 1px", fontSize: "23px", fontWeight: "900" },
  date: { color: "#77757c", fontSize: "10px" },
  status: { padding: "5px 8px", borderRadius: "8px", fontSize: "8px", fontWeight: "900", whiteSpace: "nowrap" },
  headerStatus: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", minWidth: "90px" },
  capacityMini: { color: "#d5d2d8", fontSize: "9px", fontWeight: "800", whiteSpace: "nowrap" },
  neededMini: { color: "#77757c", fontSize: "8px", whiteSpace: "nowrap" },
  teamMini: { color: "#77757c", fontSize: "8px", whiteSpace: "nowrap" },
  stats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "15px" },
  stat: { padding: "10px", borderRadius: "11px", background: "#19181c", border: "1px solid #27262a", display: "grid", gap: "4px" },
  countdownRow: { display: "flex", justifyContent: "flex-end", marginTop: "8px" },
  countdown: { color: "#ffad68", fontWeight: "800", textAlign: "right" },
  joinButton: { width: "100%", marginTop: "13px", padding: "12px", border: "none", borderRadius: "11px", background: "linear-gradient(135deg, #ff9a3d 0%, #ff7130 48%, #d83d31 100%)", color: "#fff", fontWeight: "900", boxShadow: "0 8px 22px rgba(235,72,42,.20)" },
  statusCard: { padding: "16px", borderRadius: "15px", background: "#121216", border: "1px solid #29272b", color: "#8f8c93", fontSize: "12px" },
  errorCard: { padding: "16px", borderRadius: "15px", background: "#2b1518", border: "1px solid #713038", color: "#ffaaa8", fontSize: "12px" },
  emptyCard: { padding: "35px 20px", borderRadius: "19px", background: "#121216", border: "1px solid #29272b", textAlign: "center" },
  emptyIcon: { color: "#ff7130", fontSize: "31px", marginBottom: "9px" },
  emptyTitle: { margin: "0 0 7px", fontSize: "19px" },
  emptyText: { margin: 0, color: "#87848b", fontSize: "12px", lineHeight: 1.5 },
};