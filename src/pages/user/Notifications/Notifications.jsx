import React from "react";

export default function Notifications() {
  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>UPDATES</div>
          <h1 style={styles.title}>Notifications</h1>
        </div>

        <span style={styles.badge}>0</span>
      </div>

      <section style={styles.emptyCard}>
        <div style={styles.icon}>🔔</div>

        <h2 style={styles.emptyTitle}>
          No notifications yet
        </h2>

        <p style={styles.emptyText}>
          Tournament updates, room details, results, wallet updates,
          cancellations, and other important notifications will appear here.
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
    minWidth: "30px",
    height: "30px",
    padding: "0 8px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1b2436",
    color: "#b8a0ff",
    fontSize: "11px",
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
    width: "54px",
    height: "54px",
    margin: "0 auto 12px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f2940",
    fontSize: "25px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },

  emptyText: {
    maxWidth: "450px",
    margin: "0 auto",
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};
