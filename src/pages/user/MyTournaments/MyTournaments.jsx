import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function MyTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMyTournaments() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setTournaments([]);
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

        if (tournamentsError) {
          throw tournamentsError;
        }

        setTournaments(data ?? []);
      } catch (err) {
        setError(
          err?.message || "Unable to load your tournaments."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMyTournaments();
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>YOUR MATCHES</div>
          <h1 style={styles.title}>My Tournaments</h1>
        </div>

        <span style={styles.badge}>BR ONLY</span>
      </div>

      {loading && (
        <section style={styles.infoCard}>
          <div style={styles.icon}>🎮</div>

          <h2 style={styles.infoTitle}>
            Loading tournaments...
          </h2>

          <p style={styles.infoText}>
            Please wait while we load your joined tournaments.
          </p>
        </section>
      )}

      {!loading && error && (
        <section style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>

          <h2 style={styles.errorTitle}>
            Unable to load tournaments
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>
        </section>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <section style={styles.emptyCard}>
          <div style={styles.icon}>🎮</div>

          <h2 style={styles.emptyTitle}>
            No tournaments yet
          </h2>

          <p style={styles.emptyText}>
            Tournaments you join will appear here with their
            match time, room details, status, and results.
          </p>
        </section>
      )}

      {!loading && !error && tournaments.length > 0 && (
        <section style={styles.list}>
          {tournaments.map((item) => {
            const tournament = item.tournaments;

            if (!tournament) {
              return null;
            }

            return (
              <article
                key={item.id}
                style={styles.tournamentCard}
              >
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.modeLabel}>
                      FREE FIRE BR
                    </div>

                    <h2 style={styles.modeTitle}>
                      {tournament.mode}
                    </h2>
                  </div>

                  <span style={getStatusStyle(tournament.status)}>
                    {tournament.status}
                  </span>
                </div>

                <div style={styles.details}>
                  <div style={styles.detailRow}>
                    <span>Match Date</span>
                    <strong>
                      {tournament.tournament_date}
                    </strong>
                  </div>

                  <div style={styles.detailRow}>
                    <span>Match Time</span>
                    <strong>
                      {tournament.scheduled_start_time}
                    </strong>
                  </div>

                  <div style={styles.detailRow}>
                    <span>Entry Fee</span>
                    <strong>
                      ৳{item.entry_fee}
                    </strong>
                  </div>

                  <div style={styles.detailRow}>
                    <span>Joined</span>
                    <strong>
                      {formatJoinedDate(item.joined_at)}
                    </strong>
                  </div>
                </div>

                <div style={styles.joinedStatus}>
                  <span style={styles.joinedDot} />
                  You are registered for this tournament
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function formatJoinedDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function getStatusStyle(status) {
  if (status === "STARTED") {
    return {
      ...styles.status,
      background: "#2d2412",
      color: "#facc15",
    };
  }

  if (status === "COMPLETED") {
    return {
      ...styles.status,
      background: "#172033",
      color: "#93c5fd",
    };
  }

  if (status === "CANCELLED") {
    return {
      ...styles.status,
      background: "#35191d",
      color: "#fca5a5",
    };
  }

  return styles.status;
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

  list: {
    display: "grid",
    gap: "14px",
  },

  tournamentCard: {
    padding: "18px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  },

  modeLabel: {
    fontSize: "9px",
    letterSpacing: "1.8px",
    fontWeight: "800",
    color: "#7f8ba3",
  },

  modeTitle: {
    margin: "5px 0 0",
    fontSize: "22px",
  },

  status: {
    padding: "7px 10px",
    borderRadius: "9px",
    background: "#142c20",
    color: "#86efac",
    fontSize: "9px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  details: {
    borderTop: "1px solid #202a3d",
  },

  detailRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "10px 0",
    borderBottom: "1px solid #202a3d",
    color: "#aeb7c7",
    fontSize: "12px",
  },

  joinedStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "14px",
    color: "#86efac",
    fontSize: "11px",
    fontWeight: "700",
  },

  joinedDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#4ade80",
    display: "inline-block",
  },

  emptyCard: {
    padding: "36px 20px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
    textAlign: "center",
  },

  infoCard: {
    padding: "36px 20px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
    textAlign: "center",
  },

  errorCard: {
    padding: "28px 20px",
    borderRadius: "20px",
    background: "#2a171b",
    border: "1px solid #713039",
    textAlign: "center",
  },

  icon: {
    fontSize: "38px",
    marginBottom: "12px",
  },

  errorIcon: {
    width: "38px",
    height: "38px",
    margin: "0 auto 12px",
    borderRadius: "50%",
    background: "#713039",
    color: "#fecaca",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "800",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },

  infoTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },

  errorTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
    color: "#fecaca",
  },

  emptyText: {
    maxWidth: "430px",
    margin: "0 auto",
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  infoText: {
    maxWidth: "430px",
    margin: "0 auto",
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  errorText: {
    maxWidth: "500px",
    margin: "0 auto",
    color: "#fca5a5",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};
