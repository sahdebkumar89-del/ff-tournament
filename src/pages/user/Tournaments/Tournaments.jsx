import React, { useState } from "react";
import { useTournaments } from "../../../hooks/useTournaments.js";
import TournamentDetails from "./TournamentDetails.jsx";

export default function Tournaments() {
  const { tournaments, loading, error } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState(null);

  if (selectedTournament) {
    return (
      <TournamentDetails
        tournament={selectedTournament}
        onBack={() => setSelectedTournament(null)}
      />
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>FREE FIRE BR</div>
          <h1 style={styles.title}>Tournaments</h1>
        </div>

        <span style={styles.badge}>BR ONLY</span>
      </div>

      {loading && (
        <div style={styles.statusCard}>
          Loading tournaments...
        </div>
      )}

      {error && (
        <div style={styles.statusCard}>
          Unable to load tournaments right now.
        </div>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>🏆</div>

          <h2 style={styles.emptyTitle}>
            No tournaments available
          </h2>

          <p style={styles.emptyText}>
            New Battle Royale tournaments will appear here when
            they are available for registration.
          </p>
        </div>
      )}

      {!loading && !error && tournaments.length > 0 && (
        <div style={styles.list}>
          {tournaments.map((tournament) => (
            <article key={tournament.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.modeLabel}>
                    {tournament.mode}
                  </div>

                  <div style={styles.time}>
                    {tournament.scheduled_start_time}
                  </div>
                </div>

                <span style={styles.status}>
                  {tournament.status}
                </span>
              </div>

              <div style={styles.divider} />

              <div style={styles.row}>
                <span>Entry Fee</span>
                <strong>৳{tournament.entry_fee}</strong>
              </div>

              <div style={styles.row}>
                <span>1st Prize</span>
                <strong>৳{tournament.first_prize}</strong>
              </div>

              <div style={styles.row}>
                <span>2nd Prize</span>
                <strong>৳{tournament.second_prize}</strong>
              </div>

              <div style={styles.row}>
                <span>3rd Prize</span>
                <strong>৳{tournament.third_prize}</strong>
              </div>

              <div style={styles.row}>
                <span>Kill Reward</span>
                <strong>৳{tournament.kill_reward}</strong>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTournament(tournament)}
                style={styles.joinButton}
              >
                View Tournament
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
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
    marginBottom: "22px",
  },

  smallText: {
    fontSize: "10px",
    letterSpacing: "2px",
    fontWeight: "800",
    color: "#9ca3af",
  },

  title: {
    margin: "5px 0 0",
    fontSize: "26px",
  },

  badge: {
    padding: "7px 10px",
    borderRadius: "9px",
    background: "#1b2436",
    color: "#b8a0ff",
    fontSize: "10px",
    fontWeight: "800",
  },

  statusCard: {
    padding: "18px",
    borderRadius: "18px",
    background: "#131a28",
    border: "1px solid #283247",
    color: "#aeb7c7",
    fontSize: "14px",
  },

  emptyCard: {
    padding: "32px 20px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "34px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "19px",
  },

  emptyText: {
    margin: 0,
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  list: {
    display: "grid",
    gap: "14px",
  },

  card: {
    padding: "18px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modeLabel: {
    fontSize: "18px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  time: {
    marginTop: "5px",
    color: "#9ca3af",
    fontSize: "12px",
  },

  status: {
    color: "#86efac",
    fontSize: "10px",
    fontWeight: "800",
  },

  divider: {
    height: "1px",
    background: "#202a3d",
    margin: "15px 0 4px",
  },

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    color: "#aeb7c7",
    fontSize: "13px",
  },

  joinButton: {
    width: "100%",
    marginTop: "14px",
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    background: "#7c5cff",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },
};
