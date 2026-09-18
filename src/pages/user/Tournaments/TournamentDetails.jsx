import React, { useState } from "react";
import { joinTournament } from "../../../services/tournaments/tournamentService.js";

export default function TournamentDetails({ tournament, onBack }) {
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!tournament) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Tournament not found</h2>

          <button type="button" onClick={onBack} style={styles.backButton}>
            Back to Tournaments
          </button>
        </div>
      </main>
    );
  }

  const isSolo = tournament.mode === "SOLO";
  const canJoin =
    isSolo &&
    tournament.status === "REGISTRATION" &&
    !joining &&
    !message;

  async function handleJoin() {
    if (!isSolo) {
      return;
    }

    setJoining(true);
    setMessage("");
    setError("");

    try {
      await joinTournament(tournament.id);

      setMessage(
        "Tournament joined successfully. Your entry fee has been deducted from your wallet."
      );
    } catch (err) {
      setError(err?.message || "Unable to join tournament.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <main style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← Back
      </button>

      <section style={styles.hero}>
        <div style={styles.smallText}>FREE FIRE BR</div>

        <div style={styles.heroRow}>
          <div>
            <h1 style={styles.title}>{tournament.mode}</h1>

            <p style={styles.subtitle}>
              Battle Royale Tournament
            </p>
          </div>

          <span style={styles.status}>
            {tournament.status}
          </span>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Tournament Details</h2>

        <div style={styles.row}>
          <span>Match Time</span>
          <strong>{tournament.scheduled_start_time}</strong>
        </div>

        <div style={styles.row}>
          <span>End Time</span>
          <strong>{tournament.scheduled_end_time}</strong>
        </div>

        <div style={styles.row}>
          <span>Entry Fee</span>
          <strong>৳{tournament.entry_fee}</strong>
        </div>

        <div style={styles.row}>
          <span>Maximum Players</span>
          <strong>{tournament.max_players}</strong>
        </div>

        {tournament.max_teams && (
          <div style={styles.row}>
            <span>Maximum Teams</span>
            <strong>{tournament.max_teams}</strong>
          </div>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Prize Breakdown</h2>

        <div style={styles.prizeRow}>
          <span>🥇 1st Place</span>
          <strong>৳{tournament.first_prize}</strong>
        </div>

        <div style={styles.prizeRow}>
          <span>🥈 2nd Place</span>
          <strong>৳{tournament.second_prize}</strong>
        </div>

        <div style={styles.prizeRow}>
          <span>🥉 3rd Place</span>
          <strong>৳{tournament.third_prize}</strong>
        </div>

        <div style={styles.prizeRow}>
          <span>🎯 Kill Reward</span>
          <strong>৳{tournament.kill_reward} / kill</strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Rules</h2>

        <div style={styles.rule}>
          • Free Fire Battle Royale only
        </div>

        <div style={styles.rule}>
          • Kill reward is given individually
        </div>

        {tournament.mode !== "SOLO" && (
          <div style={styles.rule}>
            • No revive in {tournament.mode}
          </div>
        )}

        <div style={styles.rule}>
          • Room ID and Password will be released 10 minutes before the match
        </div>

        {tournament.mode !== "SOLO" && (
          <div style={styles.rule}>
            • Duo and Squad team joining will be available after the team system is connected
          </div>
        )}
      </section>

      {message && (
        <div style={styles.successBox}>
          {message}
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleJoin}
        disabled={!canJoin}
        style={{
          ...styles.joinButton,
          ...(canJoin ? styles.joinButtonActive : styles.joinButtonDisabled),
        }}
      >
        {joining
          ? "Joining..."
          : message
            ? "Joined Successfully"
            : !isSolo
              ? "Team Joining Coming Soon"
              : tournament.status !== "REGISTRATION"
                ? "Registration Closed"
                : "Join Tournament"}
      </button>

      {!message && !error && isSolo && tournament.status === "REGISTRATION" && (
        <p style={styles.note}>
          Entry fee will be deducted from your wallet only after the secure
          tournament join check succeeds.
        </p>
      )}

      {!message && !error && !isSolo && (
        <p style={styles.note}>
          Duo and Squad joining will be enabled after the team system is
          completed.
        </p>
      )}
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "20px 18px 40px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#b8a0ff",
    padding: "6px 0",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "16px",
  },

  hero: {
    padding: "22px",
    borderRadius: "20px",
    background: "#151c2b",
    border: "1px solid #283247",
    marginBottom: "14px",
  },

  heroRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "6px",
  },

  smallText: {
    fontSize: "10px",
    letterSpacing: "2px",
    fontWeight: "800",
    color: "#9ca3af",
  },

  title: {
    margin: "5px 0 0",
    fontSize: "30px",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#9ca3af",
    fontSize: "13px",
  },

  status: {
    padding: "7px 10px",
    borderRadius: "9px",
    background: "#142c20",
    color: "#86efac",
    fontSize: "10px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  card: {
    padding: "18px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
    marginBottom: "14px",
  },

  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "18px",
  },

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "10px 0",
    borderTop: "1px solid #202a3d",
    color: "#aeb7c7",
    fontSize: "13px",
  },

  prizeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 0",
    borderTop: "1px solid #202a3d",
    color: "#d9deea",
    fontSize: "13px",
  },

  rule: {
    padding: "9px 0",
    borderTop: "1px solid #202a3d",
    color: "#aeb7c7",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  successBox: {
    padding: "13px 14px",
    marginBottom: "12px",
    borderRadius: "12px",
    background: "#123322",
    border: "1px solid #23643d",
    color: "#86efac",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  errorBox: {
    padding: "13px 14px",
    marginBottom: "12px",
    borderRadius: "12px",
    background: "#35191d",
    border: "1px solid #713039",
    color: "#fca5a5",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  joinButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
  },

  joinButtonActive: {
    background: "#7c3aed",
    color: "#ffffff",
    cursor: "pointer",
  },

  joinButtonDisabled: {
    background: "#3b4354",
    color: "#8f98aa",
    cursor: "not-allowed",
  },

  note: {
    margin: "10px 8px 0",
    color: "#7f8ba3",
    fontSize: "11px",
    lineHeight: 1.5,
    textAlign: "center",
  },
};
