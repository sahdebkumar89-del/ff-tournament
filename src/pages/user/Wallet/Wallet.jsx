import React from "react";

export default function Wallet() {
  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>MONEY & EARNINGS</div>
          <h1 style={styles.title}>My Wallet</h1>
        </div>

        <span style={styles.badge}>৳</span>
      </div>

      <section style={styles.balanceCard}>
        <div style={styles.balanceLabel}>AVAILABLE BALANCE</div>

        <div style={styles.balance}>৳0.00</div>

        <p style={styles.balanceNote}>
          Your approved wallet balance will appear here.
        </p>
      </section>

      <section style={styles.actions}>
        <button type="button" disabled style={styles.actionButton}>
          <span style={styles.actionIcon}>＋</span>
          <span>
            <strong>Deposit</strong>
            <small>Add money to wallet</small>
          </span>
        </button>

        <button type="button" disabled style={styles.actionButton}>
          <span style={styles.actionIcon}>↗</span>
          <span>
            <strong>Withdraw</strong>
            <small>Minimum withdrawal ৳50</small>
          </span>
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Earnings</h2>

        <div style={styles.row}>
          <span>Position Prizes</span>
          <strong>৳0.00</strong>
        </div>

        <div style={styles.row}>
          <span>Kill Rewards</span>
          <strong>৳0.00</strong>
        </div>

        <div style={styles.row}>
          <span>Total Earnings</span>
          <strong>৳0.00</strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Transaction History</h2>

        <div style={styles.empty}>
          <div style={styles.emptyIcon}>৳</div>

          <h3 style={styles.emptyTitle}>
            No transactions yet
          </h3>

          <p style={styles.emptyText}>
            Your approved deposits, tournament entries, prizes,
            kill rewards, refunds, and withdrawals will appear here.
          </p>
        </div>
      </section>

      <section style={styles.infoCard}>
        <div style={styles.infoTitle}>Wallet Security</div>

        <p style={styles.infoText}>
          Wallet balance changes require secure system processing and
          Admin approval where required. Money movement will always
          keep a transaction record.
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
    color: "#b8a0ff",
    fontSize: "18px",
    fontWeight: "800",
  },

  balanceCard: {
    padding: "24px 20px",
    borderRadius: "20px",
    background: "#151c2b",
    border: "1px solid #283247",
    marginBottom: "14px",
  },

  balanceLabel: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    fontWeight: "800",
    color: "#9ca3af",
  },

  balance: {
    marginTop: "8px",
    fontSize: "34px",
    fontWeight: "900",
  },

  balanceNote: {
    margin: "6px 0 0",
    color: "#8f98aa",
    fontSize: "12px",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px",
  },

  actionButton: {
    minWidth: 0,
    padding: "15px",
    border: "1px solid #303b51",
    borderRadius: "16px",
    background: "#131a28",
    color: "#707b90",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    cursor: "not-allowed",
  },

  actionIcon: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f2940",
    color: "#8f98aa",
    fontSize: "19px",
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

  empty: {
    padding: "22px 10px 8px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 10px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f2940",
    color: "#9ca3af",
    fontSize: "21px",
    fontWeight: "800",
  },

  emptyTitle: {
    margin: "0 0 7px",
    fontSize: "16px",
  },

  emptyText: {
    maxWidth: "430px",
    margin: "0 auto",
    color: "#8f98aa",
    fontSize: "12px",
    lineHeight: 1.6,
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
