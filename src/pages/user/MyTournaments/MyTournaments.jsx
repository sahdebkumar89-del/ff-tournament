import React from "react";

export default function MyTournaments() {
  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>YOUR MATCHES</div>
          <h1 style={styles.title}>My Tournaments</h1>
        </div>

        <span style={styles.badge}>BR ONLY</span>
      </div>

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

  emptyCard: {
    padding: "36px 20px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
    textAlign: "center",
  },

  icon: {
    fontSize: "38px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },

  emptyText: {
    maxWidth: "430px",
    margin: "0 auto",
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};
