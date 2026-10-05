import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client.js";

export default function Leaderboard() {
  const [period, setPeriod] = useState("WEEKLY");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setLoading(true);
      setError("");

      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!data?.user) throw new Error("Please sign in to view the leaderboard.");

        const { data: leaderboard, error: leaderboardError } =
          await supabase.rpc("get_public_leaderboard", { p_period: period });

        if (leaderboardError) throw leaderboardError;

        if (active) setRows(leaderboard || []);
      } catch (err) {
        if (active) setError(err?.message || "Unable to load leaderboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [period]);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>COMPETITIVE RANKING</div>
          <h1 style={styles.title}>Leaderboard</h1>
          <p style={styles.subtitle}>
            Top BR players ranked automatically from verified published results.
          </p>
        </div>
        <span style={styles.badge}>BR ONLY</span>
      </header>

      <div style={styles.periodBar}>
        {[
          ["WEEKLY", "Weekly"],
          ["MONTHLY", "Monthly"],
          ["ALL", "All Time"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            style={{
              ...styles.periodButton,
              ...(period === value ? styles.periodActive : {}),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardKicker}>{period === "ALL" ? "ALL TIME" : period}</div>
            <h2 style={styles.cardTitle}>Top Players</h2>
          </div>
          <span style={styles.autoBadge}>AUTO</span>
        </div>

        {loading && <div style={styles.state}>Loading rankings...</div>}

        {!loading && error && (
          <div style={styles.error}>{error}</div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={styles.state}>
            No verified results are available for this period yet.
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div style={styles.list}>
            {rows.map((row) => (
              <article key={`${row.rank}-${row.full_name}`} style={styles.row}>
                <div style={styles.rank}>
                  #{row.rank}
                </div>

                <div style={styles.player}>
                  <strong style={styles.playerName}>{row.full_name}</strong>
                  <span style={styles.playerMeta}>
                    {row.wins} Win{Number(row.wins) === 1 ? "" : "s"} •{" "}
                    {row.top_three} Top 3 • {row.kills} Kills
                  </span>
                </div>

                <div style={styles.earnings}>
                  <strong style={styles.earningsValue}>৳{Number(row.earnings || 0).toFixed(0)}</strong>
                  <span style={styles.earningsLabel}>EARNINGS</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div style={styles.note}>
        Only verified and published tournament results count. Email, mobile number,
        Free Fire UID, and wallet balance are never shown on the leaderboard.
      </div>
    </main>
  );
}

const styles = {
  page: { maxWidth: "760px", margin: "0 auto", padding: "22px 18px 40px" },
  header: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: "12px", marginBottom: "18px" },
  kicker: { fontSize: "9px", letterSpacing: "1.8px", fontWeight: "900", color: "#ff7130" },
  title: { margin: "5px 0 0", fontSize: "27px", letterSpacing: "-.6px" },
  subtitle: { margin: "6px 0 0", color: "#85828a", fontSize: "11px", lineHeight: 1.45 },
  badge: { padding: "7px 9px", borderRadius: "8px", background: "#241719", color: "#ff8964", fontSize: "9px", fontWeight: "900", whiteSpace: "nowrap" },
  periodBar: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "7px", padding: "5px", borderRadius: "13px", background: "#121216", border: "1px solid #29272b", marginBottom: "15px" },
  periodButton: { border: "none", borderRadius: "9px", background: "transparent", color: "#77747d", padding: "10px 3px", fontSize: "9px", fontWeight: "900" },
  periodActive: { background: "#351b18", color: "#ff9b5a" },
  card: { padding: "16px", borderRadius: "20px", background: "#121216", border: "1px solid #302b2d", boxShadow: "0 10px 28px rgba(0,0,0,.2)" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px" },
  cardKicker: { color: "#6f6c73", fontSize: "8px", fontWeight: "900", letterSpacing: "1.2px" },
  cardTitle: { margin: "4px 0 0", fontSize: "19px" },
  autoBadge: { padding: "5px 7px", borderRadius: "7px", background: "#17281f", color: "#79e09b", fontSize: "8px", fontWeight: "900" },
  list: { display: "grid", gap: "7px" },
  row: { display: "grid", gridTemplateColumns: "38px minmax(0, 1fr) auto", alignItems: "center", gap: "9px", padding: "11px 10px", borderRadius: "12px", background: "#19181c", border: "1px solid #27262a" },
  rank: { color: "#ff9b5a", fontSize: "11px", fontWeight: "900" },
  player: { minWidth: 0, display: "grid", gap: "4px" },
  playerName: { color: "#f4f2f4", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  playerMeta: { color: "#77747d", fontSize: "8px" },
  earnings: { display: "grid", gap: "3px", textAlign: "right" },
  earningsValue: { color: "#ffb06c", fontSize: "11px" },
  earningsLabel: { color: "#6f6c73", fontSize: "7px", fontWeight: "900", letterSpacing: ".8px" },
  state: { padding: "34px 12px", textAlign: "center", color: "#85828a", fontSize: "11px", lineHeight: 1.5 },
  error: { padding: "16px", borderRadius: "11px", background: "#2a171b", color: "#fca5a5", fontSize: "10px", lineHeight: 1.5 },
  note: { marginTop: "11px", padding: "10px 12px", borderRadius: "10px", background: "#171619", color: "#77747d", fontSize: "8px", lineHeight: 1.5 },
};