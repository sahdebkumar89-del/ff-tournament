import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function Room() {
  const [matches, setMatches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  async function loadRoomData() {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId) {
      setMatches([]);
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: joined, error: joinedError } = await supabase
      .from("tournament_participants")
      .select(
        `tournament_id,
        joined_at,
        tournaments (
          id,
          mode,
          tournament_date,
          scheduled_start_time,
          status
        )`
      )
      .eq("user_id", userId)
      .eq("status", "JOINED")
      .order("joined_at", { ascending: false });

    if (joinedError) {
      setMessage(joinedError.message);
      setMatches([]);
      setRooms([]);
      setLoading(false);
      return;
    }

    const joinedMatches = (joined || [])
      .map((item) => item.tournaments)
      .filter(Boolean);

    const tournamentIds = [...new Set(joinedMatches.map((item) => item.id))];

    let roomRows = [];
    if (tournamentIds.length > 0) {
      const { data: roomData, error: roomError } = await supabase
        .from("tournament_rooms")
        .select(
          `id,
          tournament_id,
          room_id,
          room_password,
          released_at,
          tournaments (
            id,
            mode,
            tournament_date,
            scheduled_start_time,
            status
          )
        `)
        .in("tournament_id", tournamentIds);

      if (roomError) {
        setMessage(roomError.message);
      } else {
        roomRows = roomData || [];
      }
    }

    setMatches(joinedMatches);
    setRooms(roomRows);
    setLoading(false);
  }

  useEffect(() => {
    loadRoomData();
    const interval = window.setInterval(loadRoomData, 15000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(clock);
    };
  }, []);

  const roomByTournament = useMemo(
    () => new Map(rooms.map((room) => [room.tournament_id, room])),
    [rooms]
  );

  const visibleMatches = useMemo(() => {
    return [...matches].sort(
      (a, b) => tournamentStartTimestamp(a) - tournamentStartTimestamp(b)
    );
  }, [matches]);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>MATCH ACCESS</div>
          <h1 style={styles.title}>Room & Password</h1>
        </div>
        <span style={styles.headerBadge}>🔒</span>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {loading ? (
        <div style={styles.empty}>Loading your match rooms...</div>
      ) : visibleMatches.length === 0 ? (
        <section style={styles.emptyCard}>
          <div style={styles.emptyIcon}>◉</div>
          <h2 style={styles.emptyTitle}>No joined tournaments</h2>
          <p style={styles.emptyText}>
            Join a tournament first. Room credentials will appear here when
            they are released.
          </p>
        </section>
      ) : (
        <div style={styles.list}>
          {visibleMatches.map((tournament) => {
            const room = roomByTournament.get(tournament.id);
            const start = tournamentStartTimestamp(tournament);
            const releaseAt = start - 10 * 60 * 1000;
            const released = Boolean(room?.released_at);
            const releaseRemaining = releaseAt - now;

            return (
              <article key={tournament.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <span style={styles.mode}>{tournament.mode}</span>
                    <h2 style={styles.cardTitle}>
                      Battle Royale • {formatDate(tournament.tournament_date)}
                    </h2>
                  </div>
                  <span style={statusStyle(tournament.status)}>
                    {tournament.status}
                  </span>
                </div>

                <div style={styles.meta}>
                  <span>Match {formatTime(tournament.scheduled_start_time)}</span>
                  <span>Release 10 min before</span>
                </div>

                {released ? (
                  <div style={styles.credentials}>
                    <Credential label="ROOM ID" value={room.room_id} />
                    <Credential label="PASSWORD" value={room.room_password} />
                    <div style={styles.releasedNote}>
                      Released {formatReleasedAt(room.released_at)}
                    </div>
                  </div>
                ) : room ? (
                  <div style={styles.locked}>
                    <div style={styles.lockedIcon}>🔐</div>
                    <div>
                      <strong style={styles.lockedTitle}>Room locked</strong>
                      <div style={styles.lockedText}>
                        {releaseRemaining > 0
                          ? `Available in ${formatCountdown(releaseRemaining)}`
                          : "Waiting for room release"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.locked}>
                    <div style={styles.lockedIcon}>🔒</div>
                    <div>
                      <strong style={styles.lockedTitle}>
                        Room not configured yet
                      </strong>
                      <div style={styles.lockedText}>
                        Admin has not added the room credentials for this match.
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section style={styles.securityCard}>
        <div style={styles.securityTitle}>SECURITY</div>
        <p style={styles.securityText}>
          Room ID and password are returned only when the database confirms
          that you joined the tournament and the room has been released.
        </p>
      </section>
    </main>
  );
}

function Credential({ label, value }) {
  return (
    <div style={styles.credentialRow}>
      <div>
        <div style={styles.credentialLabel}>{label}</div>
        <strong style={styles.credentialValue}>{value}</strong>
      </div>
      <button
        type="button"
        style={styles.copyButton}
        onClick={() => navigator.clipboard?.writeText(value)}
      >
        Copy
      </button>
    </div>
  );
}

function tournamentStartTimestamp(tournament) {
  if (!tournament?.tournament_date || !tournament?.scheduled_start_time) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(
    `${tournament.tournament_date}T${tournament.scheduled_start_time.slice(
      0,
      8
    )}+06:00`
  ).getTime();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00+06:00`);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Dhaka",
  });
}

function formatTime(value) {
  return value ? value.slice(0, 5) : "—";
}

function formatReleasedAt(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function statusStyle(status) {
  const colors = {
    STARTED: "#ff6b52",
    FULL: "#ffc064",
    REGISTRATION: "#77e39b",
    COMPLETED: "#8f8b92",
    CANCELLED: "#d96b6b",
  };

  return {
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#1c1718",
    color: colors[status] || "#c7c3c8",
    fontSize: "9px",
    fontWeight: "900",
  };
}

const styles = {
  page: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "22px 18px 40px",
    color: "#f7f7f8",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  kicker: {
    color: "#ff7130",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "2px",
  },
  title: { margin: "5px 0 0", fontSize: "26px" },
  headerBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    background: "#241718",
    border: "1px solid #5a2a20",
    fontSize: "18px",
  },
  message: {
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "12px",
    background: "#241717",
    border: "1px solid #61302b",
    color: "#ffad68",
    fontSize: "11px",
  },
  list: { display: "grid", gap: "12px" },
  card: {
    padding: "16px",
    borderRadius: "18px",
    background: "#121216",
    border: "1px solid #2c2729",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  mode: {
    color: "#ff795f",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
  },
  cardTitle: { margin: "5px 0 0", fontSize: "17px" },
  meta: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "10px",
    color: "#918d94",
    fontSize: "10px",
  },
  credentials: {
    marginTop: "14px",
    padding: "10px",
    borderRadius: "14px",
    background: "#1b1314",
    border: "1px solid #663024",
  },
  credentialRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "11px 3px",
    borderBottom: "1px solid #302123",
  },
  credentialLabel: {
    color: "#a29a9d",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: "1.3px",
  },
  credentialValue: {
    display: "block",
    marginTop: "4px",
    color: "#ffc064",
    fontSize: "18px",
    letterSpacing: ".4px",
    wordBreak: "break-all",
  },
  copyButton: {
    border: "1px solid #6b3425",
    borderRadius: "9px",
    background: "#251716",
    color: "#ff9b63",
    padding: "8px 10px",
    fontSize: "9px",
    fontWeight: "900",
  },
  releasedNote: {
    paddingTop: "9px",
    color: "#77e39b",
    fontSize: "9px",
    fontWeight: "800",
  },
  locked: {
    marginTop: "14px",
    padding: "15px",
    borderRadius: "14px",
    background: "#151316",
    border: "1px solid #30292b",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  lockedIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    background: "#24191a",
    fontSize: "18px",
  },
  lockedTitle: { fontSize: "12px" },
  lockedText: {
    marginTop: "4px",
    color: "#8f8a90",
    fontSize: "10px",
    lineHeight: 1.45,
  },
  empty: {
    padding: "18px",
    borderRadius: "15px",
    background: "#121216",
    border: "1px solid #29272b",
    color: "#8f8c93",
    fontSize: "12px",
  },
  emptyCard: {
    padding: "26px 18px",
    borderRadius: "19px",
    background: "#121216",
    border: "1px solid #29272b",
    textAlign: "center",
  },
  emptyIcon: { color: "#ff7130", fontSize: "28px" },
  emptyTitle: { margin: "10px 0 6px", fontSize: "18px" },
  emptyText: { margin: 0, color: "#8f8c93", fontSize: "11px", lineHeight: 1.6 },
  securityCard: {
    marginTop: "18px",
    padding: "15px 17px",
    borderRadius: "16px",
    background: "#111115",
    border: "1px solid #29272b",
  },
  securityTitle: {
    color: "#ff7130",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.5px",
  },
  securityText: {
    margin: "7px 0 0",
    color: "#87838a",
    fontSize: "10px",
    lineHeight: 1.55,
  },
};
