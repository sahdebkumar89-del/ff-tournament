import React from "react";

export default function Room() {
  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>MATCH ACCESS</div>
          <h1 style={styles.title}>Room & Password</h1>
        </div>

        <span style={styles.badge}>🔒</span>
      </div>

      <section style={styles.statusCard}>
        <div style={styles.lockIcon}>🔒</div>

        <h2 style={styles.statusTitle}>
          Room details are locked
        </h2>

        <p style={styles.statusText}>
          Room ID and Password will be available only to players
          who have successfully joined the tournament.
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Room Release</h2>

        <div style={styles.row}>
          <span>Release Time</span>
          <strong>10 minutes before match</strong>
        </div>

        <div style={styles.row}>
          <span>Access</span>
          <strong>Joined Players Only</strong>
        </div>

        <div style={styles.row}>
          <span>Notification</span>
          <strong>Automatic</strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Room Information</h2>

        <div style={styles.roomBox}>
          <span style={styles.roomLabel}>ROOM ID</span>
          <strong style={styles.hiddenValue}>••••••••</strong>
        </div>

        <div style={styles.roomBox}>
          <span style={styles.roomLabel}>PASSWORD</span>
          <strong style={styles.hiddenValue}>••••••••</strong>
        </div>

        <p style={styles.note}>
          Your room credentials will appear here automatically when
          the Admin releases them.
        </p>
      </section>

      <section style={styles.infoCard}>
        <div style={styles.infoTitle}>Security</div>

        <p style={styles.infoText}>
          Room credentials are protected and are not visible to users
          who have not joined the tournament. Access activity will be
          securely recorded.
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
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1b2436",
    fontSize: "17px",
  },

  statusCard: {
    padding: "26px 20px",
    borderRadius: "20px",
    background: "#151c2b",
    border: "1px solid #283247",
    textAlign: "center",
    marginBottom: "14px",
  },

  lockIcon: {
    width: "54px",
    height: "54px",
    margin: "0 auto 12px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f2940",
    fontSize: "24px",
  },

  statusTitle: {
    margin: "0 0 8px",
    fontSize: "19px",
  },

  statusText: {
    maxWidth: "440px",
    margin: "0 auto",
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.6,
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
    padding: "11px 0",
    borderTop: "1px solid #202a3d",
    color: "#aeb7c7",
    fontSize: "13px",
  },

  roomBox: {
    padding: "15px",
    marginTop: "10px",
    borderRadius: "14px",
    background: "#0f1522",
    border: "1px solid #263149",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  roomLabel: {
    color: "#8f98aa",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  hiddenValue: {
    color: "#707b90",
    letterSpacing: "3px",
  },

  note: {
    margin: "14px 4px 0",
    color: "#7f8ba3",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  infoCard: {
    padding: "16px 18px",
    borderRadius: "16px",
    background: "#101725",
    border: "1px solid #263149",
  },

  infoTitle: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#d9deea",
  },

  infoText: {
    margin: "7px 0 0",
    color: "#8f98aa",
    fontSize: "11px",
    lineHeight: 1.6,
  },
};
