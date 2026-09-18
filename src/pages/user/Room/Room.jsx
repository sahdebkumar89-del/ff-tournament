import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function Room() {
  const [matches, setMatches] = useState([]);
  const [rooms, setRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  async function loadMatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("tournament_participants")
      .select("tournament_id, tournaments(*)")
      .eq("status", "JOINED");

    if (error) {
      setMessage(error.message);
      setMatches([]);
    } else {
      const joined = (data || [])
        .map((row) => row.tournaments)
        .filter(Boolean)
        .filter((tournament) => !["COMPLETED", "CANCELLED"].includes(tournament.status))
        .sort((a, b) => tournamentStart(a) - tournamentStart(b));

      setMatches(joined);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMatches();
    const refresh = window.setInterval(loadMatches, 30000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      window.clearInterval(refresh);
      window.clearInterval(clock);
    };
  }, []);

  const activeMatches = useMemo(() => matches, [matches]);

  async function loadRoom(tournamentId) {
    setMessage("");

    const { data, error } = await supabase.rpc("get_tournament_room", {
      p_tournament_id: tournamentId,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRooms((current) => ({
      ...current,
      [tournamentId]: data?.[0] || null,
    }));
  }

  useEffect(() => {
    activeMatches.forEach((tournament) => {
      loadRoom(tournament.id);
    });
  }, [activeMatches]);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>MATCH ACCESS</div>
          <h1 style={styles.title}>Room & Password</h1>
        </div>
        <span style={styles.badge}>🔒</span>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <section style={styles.infoCard}>
        <div style={styles.infoTitle}>Secure Room Delivery</div>
        <p style={styles.infoText}>
          Room ID and password are returned only for tournaments you have
          joined after the room has been released.
        </p>
      </section>

      {loading ? (
        <div style={styles.empty}>Loading your joined matches...</div>
      ) : activeMatches.length === 0 ? (
        <div style={styles.empty}>
          <strong>No active joined tournament</strong>
          <p style={styles.emptyText}>
            Room details will appear here when you join a tournament.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {activeMatches.map((tournament) => {
            const room = rooms[tournament.id];
            const start = tournamentStart(tournament);
            const releaseAt = start - 10 * 60 * 1000;
            const released = Boolean(room?.released_at);
            const releaseText = released
              ? "Room released"
              : now >= releaseAt
                ? "Release is being processed"
                : `Releases in ${formatCountdown(releaseAt - now)}`;

            return (
              <article key={tournament.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <span style={styles.mode}>{tournament.mode} • BR</span>
                    <h2 style={styles.cardTitle}>
                      Tournament #{tournament.id}
                    </h2>
                  </div>
                  <span style={released ? styles.releasedBadge : styles.lockedBadge}>
                    {released ? "RELEASED" : "LOCKED"}
                  </span>
                </div>

                <div style={styles.meta}>
                  <span>{tournament.tournament_date}</span>
                  <span>{tournament.scheduled_start_time.slice(0, 5)}</span>
                  <span>{releaseText}</span>
                </div>

                {released ? (
                  <div style={styles.credentials}>
                    <div style={styles.credentialBox}>
                      <span style={styles.label}>ROOM ID</span>
                      <strong style={styles.value}>{room.room_id}</strong>
                    </div>
                    <div style={styles.credentialBox}>
                      <span style={styles.label}>PASSWORD</span>
                      <strong style={styles.value}>{room.room_password}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={styles.lockedCard}>
                    <div style={styles.lockIcon}>🔒</div>
                    <div>
                      <strong>Room details are locked</strong>
                      <p>
                        Only joined players can access the credentials after
                        the Admin/system releases them.
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Room Release Rules</h2>
        <div style={styles.row}>
          <span>Automatic release</span>
          <strong>10 minutes before match</strong>
        </div>
        <div style={styles.row}>
          <span>Access</span>
          <strong>Joined players only</strong>
        </div>
        <div style={styles.row}>
          <span>Admin override</span>
          <strong>Release Now</strong>
        </div>
      </section>
    </main>
  );
}

function tournamentStart(tournament) {
  return new Date(
    `${tournament.tournament_date}T${tournament.scheduled_start_time.slice(0, 8)}+06:00`
  ).getTime();
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

const styles = {
  page: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "22px 18px 40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },
  smallText: {
    fontSize: "10px",
    letterSpacing: "2px",
    fontWeight: "900",
    color: "#ff7130",
  },
  title: {
    margin: "5px 0 0",
    fontSize: "26px",
  },
  badge: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    background: "#1b1415",
    border: "1px solid #4d2822",
  },
  message: {
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "12px",
    background: "#241517",
    border: "1px solid #5a2a20",
    color: "#ffb36a",
    fontSize: "11px",
  },
  infoCard: {
    padding: "16px 18px",
    borderRadius: "16px",
    background: "#121216",
    border: "1px solid #2b292d",
    marginBottom: "14px",
  },
  infoTitle: {
    color: "#ff8a4d",
    fontSize: "13px",
    fontWeight: "900",
  },
  infoText: {
    margin: "7px 0 0",
    color: "#9a969d",
    fontSize: "11px",
    lineHeight: 1.6,
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  card: {
    padding: "17px",
    borderRadius: "19px",
    background: "#121216",
    border: "1px solid #2b292d",
    marginBottom: "14px",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  mode: {
    color: "#ff765a",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
  },
  cardTitle: {
    margin: "5px 0 0",
    fontSize: "17px",
  },
  lockedBadge: {
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#241d1f",
    color: "#b7a8aa",
    fontSize: "9px",
    fontWeight: "900",
  },
  releasedBadge: {
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#19291f",
    color: "#77e39b",
    fontSize: "9px",
    fontWeight: "900",
  },
  meta: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "11px",
    color: "#918d94",
    fontSize: "10px",
  },
  credentials: {
    display: "grid",
    gap: "9px",
    marginTop: "14px",
  },
  credentialBox: {
    padding: "14px",
    borderRadius: "13px",
    background: "#0e0e12",
    border: "1px solid #3a2b2c",
  },
  label: {
    display: "block",
    color: "#8f8b92",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
    marginBottom: "6px",
  },
  value: {
    color: "#fff",
    fontSize: "18px",
    wordBreak: "break-all",
  },
  lockedCard: {
    display: "flex",
    gap: "11px",
    alignItems: "center",
    marginTop: "14px",
    padding: "13px",
    borderRadius: "13px",
    background: "#171417",
    border: "1px solid #30282b",
    color: "#d8d2d5",
  },
  lockIcon: {
    width: "38px",
    height: "38px",
    flex: "0 0 auto",
    borderRadius: "11px",
    display: "grid",
    placeItems: "center",
    background: "#241d1f",
  },
  lockedCard: {
    display: "flex",
    gap: "11px",
    alignItems: "center",
    marginTop: "14px",
    padding: "13px",
    borderRadius: "13px",
    background: "#171417",
    border: "1px solid #30282b",
    color: "#d8d2d5",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "11px 0",
    borderTop: "1px solid #262328",
    color: "#9d989f",
    fontSize: "12px",
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "17px",
  },
  empty: {
    padding: "20px",
    borderRadius: "16px",
    background: "#121216",
    border: "1px solid #2b292d",
    color: "#c8c3c8",
  },
  emptyText: {
    margin: "7px 0 0",
    color: "#8f8b92",
    fontSize: "11px",
  },
};
