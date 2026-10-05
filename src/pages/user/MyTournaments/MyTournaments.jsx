import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function MyTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [now, setNow] = useState(Date.now());
  const [publishedResults, setPublishedResults] = useState({});

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMyTournaments() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          if (active) setTournaments([]);
          return;
        }

        const { data, error: tournamentsError } = await supabase
          .from("tournament_participants")
          .select(`
            id,
            tournament_id,
            entry_fee,
            first_prize,
            second_prize,
            third_prize,
            kill_reward,
            status,
            joined_at,
            captain_free_fire_uid,
            free_fire_uids,
            tournaments (
              id,
              tournament_date,
              mode,
              scheduled_start_time,
              scheduled_end_time,
              status,
              entry_fee,
              first_prize,
              second_prize,
              third_prize,
              kill_reward
            )
          `)
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false });

        if (tournamentsError) throw tournamentsError;

        if (active) {
          setTournaments(data ?? []);
          const ids = (data ?? []).map((x) => x.tournament_id);
          const entries = await Promise.all(ids.map(async (id) => {
            const { data: resultData } = await supabase.rpc("get_my_published_tournament_results", { p_tournament_id: id });
            return [id, resultData || []];
          }));
          if (active) setPublishedResults(Object.fromEntries(entries));
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Unable to load your tournaments.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMyTournaments();

    return () => {
      active = false;
    };
  }, []);

  const visibleTournaments = useMemo(() => {
    if (filter === "ALL") return tournaments;
    return tournaments.filter((item) => item.tournaments?.mode === filter);
  }, [tournaments, filter]);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>YOUR MATCH CENTER</div>
          <h1 style={styles.title}>My Tournaments</h1>
          <p style={styles.subtitle}>Your registered Battle Royale matches in one place.</p>
        </div>
        <span style={styles.brBadge}>BR ONLY</span>
      </header>

      {!loading && !error && tournaments.length > 0 && (
        <div style={styles.filterBar}>
          {["ALL", "SOLO", "DUO", "SQUAD"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              style={{
                ...styles.filterButton,
                ...(filter === item ? styles.filterActive : {}),
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <section style={styles.stateCard}>
          <div style={styles.stateIcon}>◈</div>
          <h2 style={styles.stateTitle}>Loading your matches</h2>
          <p style={styles.stateText}>Checking your registered tournaments...</p>
        </section>
      )}

      {!loading && error && (
        <section style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.stateTitle}>Unable to load tournaments</h2>
          <p style={styles.errorText}>{error}</p>
        </section>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <section style={styles.stateCard}>
          <div style={styles.stateIcon}>◈</div>
          <h2 style={styles.stateTitle}>No tournaments yet</h2>
          <p style={styles.stateText}>
            Tournaments you join will appear here with their match time, entry fee, room status, and results.
          </p>
        </section>
      )}

      {!loading && !error && tournaments.length > 0 && visibleTournaments.length === 0 && (
        <section style={styles.stateCard}>
          <div style={styles.stateIcon}>⌁</div>
          <h2 style={styles.stateTitle}>No {filter} matches</h2>
          <p style={styles.stateText}>You have not joined a {filter} tournament yet.</p>
        </section>
      )}

      {!loading && !error && visibleTournaments.length > 0 && (
        <section style={styles.list}>
          {visibleTournaments.map((item) => {
            const tournament = item.tournaments;
            if (!tournament) return null;

            return (
              <TournamentCard
                key={item.id}
                item={item}
                tournament={tournament}
                now={now}
                results={publishedResults[item.tournament_id] || []}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}

function TournamentCard({ item, tournament, now, results = [] }) {
  const isCancelled = tournament.status === "CANCELLED" || item.status === "CANCELLED";
  const isCompleted = tournament.status === "COMPLETED";
  const isStarted = tournament.status === "STARTED";

  return (
    <article style={{
      ...styles.card,
      ...(isCancelled ? styles.cancelledCard : {}),
      ...(isStarted ? styles.liveCard : {}),
    }}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.modeLine}>
            <span style={styles.modeBadge}>{tournament.mode}</span>
            <span style={styles.brText}>BATTLE ROYALE</span>
          </div>
          <h2 style={styles.modeTitle}>{formatMode(tournament.mode)} Match</h2>
        </div>
        <span style={getStatusStyle(tournament.status)}>
          {formatStatus(tournament.status)}
        </span>
      </div>

      <div style={styles.matchHero}>
        <div>
          <span style={styles.heroLabel}>MATCH TIME</span>
          <strong style={styles.heroTime}>{formatTime(tournament.scheduled_start_time)}</strong>
          <span style={styles.heroDate}>{formatDate(tournament.tournament_date)}</span>
        </div>
        <div style={styles.countdownBox}>
          <span style={styles.heroLabel}>STATUS</span>
          <strong style={styles.countdownText}>
            {getMatchTiming(tournament, now)}
          </strong>
        </div>
      </div>

      <div style={styles.stats}>
        <Stat label="ENTRY" value={`৳${Number(item.entry_fee).toFixed(0)}`} />
        <Stat label="1ST PRIZE" value={`৳${Number(item.first_prize).toFixed(0)}`} />
        <Stat label="KILL" value={`৳${Number(item.kill_reward).toFixed(0)}`} />
      </div>

      <div style={styles.metaList}>
        <div style={styles.metaRow}>
          <span>Registration</span>
          <strong>Confirmed</strong>
        </div>
        <div style={styles.metaRow}>
          <span>Joined</span>
          <strong>{formatJoinedDate(item.joined_at)}</strong>
        </div>
        {Array.isArray(item.free_fire_uids) && item.free_fire_uids.length > 0 && (
          <div style={styles.metaRow}>
            <span>{tournament.mode === "SOLO" ? "Free Fire UID" : "Team UIDs"}</span>
            <strong>{item.free_fire_uids.length} UID{item.free_fire_uids.length > 1 ? "s" : ""}</strong>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={styles.resultBox}>
          <div style={styles.resultTitle}>RESULT PUBLISHED</div>
          {results.map((r) => (
            <div key={r.result_id} style={styles.resultRow}>
              <span>Position #{r.result_position} • {r.result_kills} kills</span>
              <strong>৳{Number(r.total_payout).toFixed(0)}</strong>
            </div>
          ))}
          <div style={styles.resultNote}>Wallet payout is credited only after Admin approval.</div>
        </div>
      )}

      <div style={getFooterStyle(tournament.status)}>
        <span>
          {isCancelled
            ? "Entry fee refund is handled through the wallet transaction flow."
            : isCompleted
              ? "Match completed. Published results are shown above when available."
              : isStarted
                ? "Match is live. Room access is restricted to joined players."
                : "You are registered. Room details will be available according to the room-release schedule."}
        </span>
      </div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatMode(mode) {
  return mode ? mode.charAt(0) + mode.slice(1).toLowerCase() : "Battle Royale";
}

function formatStatus(status) {
  const labels = {
    REGISTRATION: "REGISTERED",
    STARTED: "LIVE",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    FULL: "FULL",
  };
  return labels[status] || status || "REGISTERED";
}

function getStatusStyle(status) {
  if (status === "STARTED") return { ...styles.status, background: "#3a2118", color: "#ffb46e" };
  if (status === "COMPLETED") return { ...styles.status, background: "#26201a", color: "#ffc46e" };
  if (status === "CANCELLED") return { ...styles.status, background: "#35191d", color: "#ff9e9e" };
  return { ...styles.status, background: "#17281f", color: "#79e09b" };
}

function getFooterStyle(status) {
  if (status === "CANCELLED") return { ...styles.footer, background: "#261417", color: "#e99b9b" };
  if (status === "COMPLETED") return { ...styles.footer, background: "#211c17", color: "#cdb48e" };
  if (status === "STARTED") return { ...styles.footer, background: "#251914", color: "#ffb174" };
  return { ...styles.footer, background: "#171916", color: "#9da49d" };
}

function getMatchTiming(tournament, now) {
  if (tournament.status === "STARTED") return "LIVE NOW";
  if (tournament.status === "COMPLETED") return "FINISHED";
  if (tournament.status === "CANCELLED") return "CANCELLED";

  const start = new Date(
    `${tournament.tournament_date}T${String(tournament.scheduled_start_time).slice(0, 8)}+06:00`
  ).getTime();

  const remaining = start - now;
  if (remaining <= 0) return "STARTING";
  if (remaining <= 60 * 60 * 1000) return `Starts in ${formatCountdown(remaining)}`;
  return "UPCOMING";
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
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

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00+06:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function formatJoinedDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

const styles = {
  page: { maxWidth: "760px", margin: "0 auto", padding: "22px 18px 40px" },
  header: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: "12px", marginBottom: "18px" },
  kicker: { fontSize: "9px", letterSpacing: "1.8px", fontWeight: "900", color: "#ff7130" },
  title: { margin: "5px 0 0", fontSize: "27px", letterSpacing: "-.6px" },
  subtitle: { margin: "6px 0 0", color: "#85828a", fontSize: "11px", lineHeight: 1.45 },
  brBadge: { padding: "7px 9px", borderRadius: "8px", background: "#241719", color: "#ff8964", fontSize: "9px", fontWeight: "900", whiteSpace: "nowrap" },
  filterBar: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "7px", padding: "5px", borderRadius: "13px", background: "#121216", border: "1px solid #29272b", marginBottom: "15px" },
  filterButton: { border: "none", borderRadius: "9px", background: "transparent", color: "#77747d", padding: "9px 3px", fontSize: "9px", fontWeight: "900" },
  filterActive: { background: "#351b18", color: "#ff9b5a" },
  list: { display: "grid", gap: "13px" },
  card: { padding: "16px", borderRadius: "20px", background: "#121216", border: "1px solid #302b2d", boxShadow: "0 10px 28px rgba(0,0,0,.2)" },
  liveCard: { borderColor: "#754022", background: "linear-gradient(145deg, #1b1413, #121216)" },
  cancelledCard: { borderColor: "#5a292d" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: "10px" },
  modeLine: { display: "flex", alignItems: "center", gap: "7px" },
  modeBadge: { padding: "5px 7px", borderRadius: "7px", background: "#321a18", color: "#ff795f", fontSize: "9px", fontWeight: "900" },
  brText: { color: "#6f6c73", fontSize: "8px", fontWeight: "800", letterSpacing: "1px" },
  modeTitle: { margin: "8px 0 0", fontSize: "20px" },
  status: { padding: "6px 8px", borderRadius: "8px", fontSize: "8px", fontWeight: "900", whiteSpace: "nowrap" },
  matchHero: { marginTop: "15px", padding: "13px", borderRadius: "14px", background: "#19171a", border: "1px solid #29272b", display: "flex", justifyContent: "space-between", gap: "10px" },
  heroLabel: { display: "block", color: "#6f6c73", fontSize: "8px", fontWeight: "900", letterSpacing: "1px" },
  heroTime: { display: "block", marginTop: "4px", fontSize: "22px", fontWeight: "900", color: "#fff" },
  heroDate: { display: "block", marginTop: "3px", color: "#85828a", fontSize: "9px" },
  countdownBox: { minWidth: "92px", paddingLeft: "12px", borderLeft: "1px solid #302d30", alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" },
  countdownText: { display: "block", marginTop: "5px", color: "#ff9f62", fontSize: "10px", lineHeight: 1.35 },
  stats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "11px" },
  stat: { padding: "10px", borderRadius: "11px", background: "#19181c", border: "1px solid #27262a", display: "grid", gap: "4px" },
  stat: { padding: "10px", borderRadius: "11px", background: "#19181c", border: "1px solid #27262a", display: "grid", gap: "4px" },
  metaList: { marginTop: "11px", borderTop: "1px solid #29272b" },
  metaRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 0", borderBottom: "1px solid #29272b", color: "#77747d", fontSize: "10px" },
  resultBox: { marginTop: "12px", padding: "12px", borderRadius: "12px", background: "#1b1715", border: "1px solid #5a3224" },
  resultTitle: { color: "#ff9b5a", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", marginBottom: "8px" },
  resultRow: { display: "flex", justifyContent: "space-between", gap: "10px", padding: "7px 0", color: "#d6d1d3", fontSize: "10px", borderBottom: "1px solid #30272a" },
  resultNote: { marginTop: "8px", color: "#8f8a8d", fontSize: "9px" },
  footer: { marginTop: "12px", padding: "10px 11px", borderRadius: "10px", fontSize: "9px", lineHeight: 1.45 },
  stateCard: { padding: "38px 20px", borderRadius: "20px", background: "#121216", border: "1px solid #29272b", textAlign: "center" },
  errorCard: { padding: "30px 20px", borderRadius: "20px", background: "#2a171b", border: "1px solid #713039", textAlign: "center" },
  stateIcon: { width: "48px", height: "48px", margin: "0 auto 12px", borderRadius: "15px", display: "grid", placeItems: "center", background: "#2d1917", color: "#ff8142", fontSize: "23px" },
  errorIcon: { width: "42px", height: "42px", margin: "0 auto 12px", borderRadius: "50%", background: "#713039", color: "#fecaca", display: "grid", placeItems: "center", fontWeight: "900" },
  stateTitle: { margin: "0 0 7px", fontSize: "19px" },
  stateText: { maxWidth: "430px", margin: "0 auto", color: "#87848b", fontSize: "12px", lineHeight: 1.55 },
  errorText: { maxWidth: "500px", margin: "0 auto", color: "#fca5a5", fontSize: "12px", lineHeight: 1.55 },
};
