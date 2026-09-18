import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function AdminTournaments({ onBack }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  async function loadTournaments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("tournament_date", { ascending: true })
      .order("scheduled_start_time", { ascending: true });

    if (error) {
      setMessage(error.message);
      setTournaments([]);
    } else {
      setTournaments(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  async function startTournament(tournament) {
    const confirmed = window.confirm(
      "Tournament is not full. Are you sure you want to start this tournament?"
    );
    if (!confirmed) return;

    setBusyId(tournament.id);
    setMessage("");

    const { error } = await supabase.rpc("admin_start_tournament", {
      p_tournament_id: tournament.id,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Tournament started successfully.");
      await loadTournaments();
    }

    setBusyId(null);
  }

  function scheduledStart(tournament) {
    return new Date(
      `${tournament.tournament_date}T${tournament.scheduled_start_time.slice(0, 8)}+06:00`
    ).getTime();
  }

  function canManualStart(tournament) {
    if (!["REGISTRATION", "FULL"].includes(tournament.status)) return false;
    return Date.now() >= scheduledStart(tournament);
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>ADMIN PANEL</div>
          <h1 style={styles.title}>Tournament Control</h1>
        </div>
        <button type="button" onClick={onBack} style={styles.backButton}>
          User App
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {loading ? (
        <div style={styles.empty}>Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div style={styles.empty}>No tournaments available.</div>
      ) : (
        <div style={styles.list}>
          {tournaments.map((tournament) => (
            <article key={tournament.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.mode}>{tournament.mode}</span>
                  <h2 style={styles.cardTitle}>Tournament #{tournament.id}</h2>
                </div>
                <span style={statusStyle(tournament.status)}>
                  {tournament.status}
                </span>
              </div>

              <div style={styles.meta}>
                <span>{tournament.tournament_date}</span>
                <span>{tournament.scheduled_start_time.slice(0, 5)}</span>
                <span>Capacity {tournament.max_players}</span>
              </div>

              {canManualStart(tournament) && (
                <button
                  type="button"
                  disabled={busyId === tournament.id}
                  onClick={() => startTournament(tournament)}
                  style={styles.startButton}
                >
                  {busyId === tournament.id ? "Starting..." : "Start Tournament"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function statusStyle(status) {
  const colors = {
    STARTED: "#ff6b52",
    COMPLETED: "#8f8b92",
    CANCELLED: "#d96b6b",
    FULL: "#ffc064",
    REGISTRATION: "#77e39b",
  };

  return {
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#1c191c",
    color: colors[status] || "#c7c3c8",
    fontSize: "9px",
    fontWeight: "900",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0e",
    color: "#f7f7f8",
    padding: "20px 18px 40px",
    maxWidth: "760px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  kicker: {
    color: "#ff7130",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "2px",
  },
  title: {
    margin: "5px 0 0",
    fontSize: "24px",
  },
  backButton: {
    border: "1px solid #5a2a20",
    borderRadius: "10px",
    background: "#1b1415",
    color: "#ff9b4a",
    padding: "10px 12px",
    fontWeight: "800",
  },
  message: {
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "12px",
    background: "#171417",
    border: "1px solid #3b2928",
    color: "#ffc064",
    fontSize: "12px",
  },
  list: {
    display: "grid",
    gap: "11px",
  },
  card: {
    padding: "15px",
    borderRadius: "17px",
    background: "#121216",
    border: "1px solid #29272b",
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
  cardTitle: {
    margin: "5px 0 0",
    fontSize: "17px",
  },
  meta: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "11px",
    color: "#918d94",
    fontSize: "10px",
  },
  startButton: {
    width: "100%",
    marginTop: "13px",
    padding: "11px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #ff7a2f, #e94231)",
    color: "#fff",
    fontWeight: "900",
  },
  empty: {
    padding: "18px",
    borderRadius: "15px",
    background: "#121216",
    border: "1px solid #29272b",
    color: "#8f8c93",
  },
};
