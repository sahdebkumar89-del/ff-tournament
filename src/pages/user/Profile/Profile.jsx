import React from "react";
import { useAuthContext } from "../../../app/providers/AuthProvider.jsx";

export default function Profile() {
  const { user } = useAuthContext();

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>ACCOUNT</div>
          <h1 style={styles.title}>My Profile</h1>
        </div>

        <span style={styles.badge}>BR ONLY</span>
      </div>

      <section style={styles.profileCard}>
        <div style={styles.avatar}>
          👤
        </div>

        <h2 style={styles.name}>
          {user?.email ? user.email.split("@")[0] : "Player"}
        </h2>

        <p style={styles.email}>
          {user?.email || "No email available"}
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Account Information</h2>

        <div style={styles.row}>
          <span>Email</span>
          <strong>{user?.email || "—"}</strong>
        </div>

        <div style={styles.row}>
          <span>Game Mode</span>
          <strong>Battle Royale</strong>
        </div>

        <div style={styles.row}>
          <span>Account Status</span>
          <strong style={styles.active}>Active</strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Profile Settings</h2>

        <button type="button" disabled style={styles.disabledButton}>
          Edit Profile
        </button>

        <button type="button" disabled style={styles.disabledButton}>
          Change Password
        </button>
      </section>

      <p style={styles.note}>
        Profile editing and additional account settings will be connected
        after the secure profile system is completed.
      </p>
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

  profileCard: {
    padding: "28px 20px",
    borderRadius: "20px",
    background: "#151c2b",
    border: "1px solid #283247",
    textAlign: "center",
    marginBottom: "14px",
  },

  avatar: {
    width: "70px",
    height: "70px",
    margin: "0 auto 12px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f2940",
    fontSize: "30px",
  },

  name: {
    margin: 0,
    fontSize: "21px",
  },

  email: {
    margin: "6px 0 0",
    color: "#9ca3af",
    fontSize: "13px",
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

  active: {
    color: "#86efac",
  },

  disabledButton: {
    width: "100%",
    padding: "13px",
    marginTop: "10px",
    border: "1px solid #303b51",
    borderRadius: "12px",
    background: "#1a2232",
    color: "#707b90",
    fontWeight: "700",
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
