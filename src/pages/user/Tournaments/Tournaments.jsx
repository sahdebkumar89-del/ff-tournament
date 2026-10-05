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
  }, [tournaments, filter, now]);

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
        {isFinishedForDisplay(tournament, now) &&
        Number.isFinite(nextRegistrationOpenTimestamp(tournament)) &&
        now < nextRegistrationOpenTimestamp(tournament) &&
        tournament.nextRegistrationTournament?.tournament_date ? (
          <div style={styles.reRegistrationInfo}>
            <span style={styles.nextRegistrationDate}>
              Next Registration : {formatDateDDMMYYYY(tournament.nextRegistrationTournament.tournament_date)}
            </span>
            <span style={styles.openAgain}>
              Open Again in {formatCountdown(nextRegistrationOpenTimestamp(tournament) - now)}
            </span>
          </div>
        ) : (
          <span style={styles.countdown}>{registrationLabel(tournament, now)}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSelectedTournament(tournament)}
        style={styles.joinButton}
      >
        {tournament.status === "REGISTRATION" && !isFinishedForDisplay(tournament, now)
          ? "View & Join"
          : "View Tournament"}
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

  const start = tournamentStartTimestamp(tournament);
  const end = new Date(
    `${tournament.tournament_date}T${String(tournament.scheduled_end_time).slice(0, 8)}+06:00`
  ).getTime();

  // The final 11:30 PM slot can end after midnight. In that case the
  // end time belongs to the following day, not earlier on the same day.
  if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
    return end + 24 * 60 * 60 * 1000;
  }

  return end;
}

function nextRegistrationOpenTimestamp(tournament) {
  // A completed slot may show a countdown only when the actual next-day
  // tournament exists and is enabled. If Admin turned that next-day slot
  // OFF, there is no next registration cycle to advertise.
  const nextTournament = tournament?.nextRegistrationTournament;

  if (!nextTournament?.is_enabled) {
    return Number.POSITIVE_INFINITY;
  }

  if (!nextTournament.registration_opens_at) {
    return Number.POSITIVE_INFINITY;
  }

  const nextOpen = new Date(
    nextTournament.registration_opens_at
  ).getTime();

  return Number.isFinite(nextOpen)
    ? nextOpen
    : Number.POSITIVE_INFINITY;
}

function registrationLabel(tournament, now) {
  if (tournament.status === "CANCELLED") return "CANCELLED";

  if (isFinishedForDisplay(tournament, now)) {
    const nextOpen = nextRegistrationOpenTimestamp(tournament);

    if (Number.isFinite(nextOpen) && now < nextOpen) {
      const nextDate = tournament.nextRegistrationTournament?.tournament_date;
      return nextDate
        ? `Registration opens again in ${formatCountdown(nextOpen - now)} • Next Registration: ${nextDate}`
        : `Registration opens again in ${formatCountdown(nextOpen - now)}`;
    }

    // Do not claim that this completed slot is reopening. The next
    // registration belongs to the separate next-day tournament instance.
    if (!Number.isFinite(nextOpen)) {
      return "COMPLETED";
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

function formatDateDDMMYYYY(value) {
  if (!value) return "";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return day && month && year ? `${day}-${month}-${year}` : value;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function statusStyle(status) {
  if (status === "REGISTRATION") return { ...styles.status, background: "#162b20", color: "#7fe4a0" };
  if (status === "STARTED") return { ...styles.status, background: "#382316", color: "#ffb267" };
  return { ...styles.status, background: "#24252a", color: "#aaa9af" };
}

const styles = {
  page: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "8px 18px 40px",
    minHeight: "calc(100vh - 80px)",
    background:
      "radial-gradient(circle at 100% 0%, rgba(255,86,37,.08), transparent 30%), radial-gradient(circle at 0% 28%, rgba(218,44,42,.045), transparent 28%)",
  },
  header: {
    position: "relative",
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: "14px",
    margin: "0 -18px",
    padding: "18px 18px 20px",
    overflow: "hidden",
    borderBottom: "1px solid #29262b",
    background:
      "linear-gradient(180deg, rgba(28,18,19,.96), rgba(11,11,14,.2))",
  },
  kicker: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "8px",
    letterSpacing: "1.7px",
    fontWeight: "900",
    color: "#ff7435",
  },
  title: {
    margin: "6px 0 0",
    fontSize: "31px",
    lineHeight: 1,
    fontWeight: "950",
    letterSpacing: "-1px",
  },
  brBadge: {
    flexShrink: 0,
    padding: "8px 10px",
    border: "1px solid #613024",
    borderRadius: "9px",
    background: "#211617",
    color: "#ff9960",
    fontSize: "8px",
    fontWeight: "950",
    letterSpacing: ".5px",
    boxShadow: "0 7px 20px rgba(0,0,0,.2)",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "5px",
    padding: "5px",
    borderRadius: "14px",
    background: "#111115",
    border: "1px solid #29272d",
    boxShadow: "0 8px 22px rgba(0,0,0,.2)",
  },
  filterButton: {
    position: "relative",
    border: "none",
    borderRadius: "10px",
    background: "transparent",
    color: "#77747c",
    padding: "10px 4px",
    fontSize: "9px",
    fontWeight: "950",
    letterSpacing: ".45px",
  },
  filterActive: {
    background: "linear-gradient(135deg, #3b1c18, #2a1718)",
    color: "#ff9b5a",
    boxShadow: "inset 0 0 0 1px rgba(255,113,48,.14)",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: "10px",
    margin: "2px 0 11px",
  },
  sectionKicker: {
    display: "block",
    color: "#ff7130",
    fontSize: "7px",
    fontWeight: "950",
    letterSpacing: "1.7px",
  },
  countBadge: {
    padding: "5px 7px",
    borderRadius: "7px",
    background: "#18181d",
    border: "1px solid #29272d",
    color: "#8f8b94",
    fontSize: "7px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  sectionTitle: {
    margin: "4px 0 11px",
    fontSize: "15px",
    fontWeight: "900",
    color: "#eee",
  },
  list: {
    display: "grid",
    gap: "11px",
  },
  card: {
    position: "relative",
    overflow: "hidden",
    padding: "15px",
    borderRadius: "19px",
    background:
      "linear-gradient(145deg, rgba(24,20,22,.98), rgba(15,15,18,.98))",
    border: "1px solid #302a2e",
    boxShadow: "0 10px 28px rgba(0,0,0,.22)",
  },
  cardFinished: {
    opacity: 0.78,
    background: "linear-gradient(145deg, #17171b, #111115)",
  },
  cardTop: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: "12px",
  },
  modeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 8px",
    borderRadius: "7px",
    background: "#321918",
    color: "#ff7d63",
    fontSize: "8px",
    fontWeight: "950",
    letterSpacing: ".7px",
    boxShadow: "inset 0 0 0 1px rgba(255,113,48,.08)",
  },
  time: {
    margin: "9px 0 1px",
    fontSize: "24px",
    lineHeight: 1,
    fontWeight: "950",
    letterSpacing: "-.6px",
  },
  date: {
    color: "#77747d",
    fontSize: "9px",
    fontWeight: "700",
  },
  headerStatus: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
    minWidth: "96px",
  },
  status: {
    padding: "5px 8px",
    borderRadius: "7px",
    fontSize: "7px",
    fontWeight: "950",
    letterSpacing: ".5px",
    whiteSpace: "nowrap",
  },
  capacityMini: {
    color: "#ded9e0",
    fontSize: "12px",
    fontWeight: "950",
  },
  neededMini: {
    color: "#68656d",
    fontSize: "7px",
    whiteSpace: "nowrap",
  },
  teamMini: {
    color: "#77737c",
    fontSize: "7px",
    whiteSpace: "nowrap",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "7px",
    marginTop: "13px",
  },
  stat: {
    padding: "9px 8px",
    borderRadius: "10px",
    background: "#19181d",
    border: "1px solid #27252a",
    display: "grid",
    gap: "4px",
  },
  statIcon: {
    display: "none",
  },
  statLabel: {
    color: "#65626a",
    fontSize: "6px",
    fontWeight: "900",
    letterSpacing: ".8px",
  },
  statValue: {
    display: "block",
    marginTop: "2px",
    color: "#e9e5ea",
    fontSize: "11px",
    fontWeight: "900",
  },
  countdownRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "11px",
  },
  countdown: {
    color: "#a39ea6",
    fontSize: "9px",
    lineHeight: 1.35,
    fontWeight: "800",
  },
  countdownOpen: {
    color: "#7fe4a0",
  },
  countdownLive: {
    color: "#ffb267",
  },
  countdownFinished: {
    color: "#85818a",
  },
  reRegistrationInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
    fontSize: "9px",
    lineHeight: 1.25,
  },
  nextRegistrationDate: {
    color: "#d8d4da",
    fontWeight: "900",
  },
  openAgain: {
    color: "#ffad68",
    fontWeight: "800",
  },
  joinButton: {
    flexShrink: 0,
    minWidth: "132px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    marginTop: "0",
    padding: "11px 10px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #ff9c42 0%, #ff7130 48%, #d83d31 100%)",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "950",
    letterSpacing: ".35px",
    boxShadow: "0 7px 18px rgba(235,72,42,.18)",
  },
  buttonArrow: {
    fontSize: "15px",
    lineHeight: "8px",
  },
  viewButton: {
    background: "#211f24",
    border: "1px solid #343139",
    color: "#bbb7c0",
    boxShadow: "none",
  },
  liveButton: {
    background: "linear-gradient(135deg, #ff9d49, #df4d35)",
  },
  reRegistrationInfoOld: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
    width: "100%",
  },
  statusCard: {
    padding: "16px",
    borderRadius: "15px",
    background: "#121216",
    border: "1px solid #29272b",
    color: "#8f8c93",
    fontSize: "11px",
  },
  errorCard: {
    padding: "16px",
    borderRadius: "15px",
    background: "#2b1518",
    border: "1px solid #713038",
    color: "#ffaaa8",
    fontSize: "11px",
  },
  emptyCard: {
    padding: "38px 20px",
    borderRadius: "19px",
    background: "#121216",
    border: "1px solid #29272b",
    textAlign: "center",
  },
  emptyIcon: {
    color: "#ff7130",
    fontSize: "25px",
    marginBottom: "9px",
  },
  emptyTitle: {
    margin: "0 0 7px",
    fontSize: "18px",
  },
  emptyText: {
    margin: 0,
    color: "#87848b",
    fontSize: "11px",
    lineHeight: 1.5,
  },
};
