import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [positionPrizes, setPositionPrizes] = useState(0);
  const [killRewards, setKillRewards] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWallet() {
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
          setBalance(0);
          setPositionPrizes(0);
          setKillRewards(0);
          setTransactions([]);
          return;
        }

        const { data: wallet, error: walletError } = await supabase
          .from("wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletError) {
          throw walletError;
        }

        if (!wallet) {
          throw new Error("Wallet not found.");
        }

        setBalance(Number(wallet.balance) || 0);

        const { data: transactionData, error: transactionError } =
          await supabase
            .from("wallet_transactions")
            .select(
              `
                id,
                transaction_type,
                amount,
                balance_before,
                balance_after,
                tournament_id,
                description,
                created_at
              `
            )
            .eq("wallet_id", wallet.id)
            .order("created_at", { ascending: false });

        if (transactionError) {
          throw transactionError;
        }

        const walletTransactions = transactionData ?? [];

        setTransactions(walletTransactions);

        const positionTotal = walletTransactions
          .filter(
            (transaction) =>
              transaction.transaction_type === "POSITION_PRIZE"
          )
          .reduce(
            (total, transaction) =>
              total + Math.max(Number(transaction.amount) || 0, 0),
            0
          );

        const killTotal = walletTransactions
          .filter(
            (transaction) =>
              transaction.transaction_type === "KILL_REWARD"
          )
          .reduce(
            (total, transaction) =>
              total + Math.max(Number(transaction.amount) || 0, 0),
            0
          );

        setPositionPrizes(positionTotal);
        setKillRewards(killTotal);
      } catch (err) {
        setError(err?.message || "Unable to load wallet.");
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, []);

  const totalEarnings = positionPrizes + killRewards;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>MONEY & EARNINGS</div>
          <h1 style={styles.title}>My Wallet</h1>
        </div>

        <span style={styles.badge}>৳</span>
      </div>

      {loading && (
        <section style={styles.loadingCard}>
          <div style={styles.loadingIcon}>৳</div>

          <h2 style={styles.loadingTitle}>
            Loading wallet...
          </h2>

          <p style={styles.loadingText}>
            Please wait while we load your wallet information.
          </p>
        </section>
      )}

      {!loading && error && (
        <section style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>

          <h2 style={styles.errorTitle}>
            Unable to load wallet
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>
        </section>
      )}

      {!loading && !error && (
        <>
          <section style={styles.balanceCard}>
            <div style={styles.balanceLabel}>
              AVAILABLE BALANCE
            </div>

            <div style={styles.balance}>
              ৳{balance.toFixed(2)}
            </div>

            <p style={styles.balanceNote}>
              Your current approved wallet balance.
            </p>
          </section>

          <section style={styles.actions}>
            <button
              type="button"
              disabled
              style={styles.actionButton}
            >
              <span style={styles.actionIcon}>＋</span>

              <span>
                <strong>Deposit</strong>
                <small>Add money to wallet</small>
              </span>
            </button>

            <button
              type="button"
              disabled
              style={styles.actionButton}
            >
              <span style={styles.actionIcon}>↗</span>

              <span>
                <strong>Withdraw</strong>
                <small>Minimum withdrawal ৳50</small>
              </span>
            </button>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>
              Earnings
            </h2>

            <div style={styles.row}>
              <span>Position Prizes</span>
              <strong>৳{positionPrizes.toFixed(2)}</strong>
            </div>

            <div style={styles.row}>
              <span>Kill Rewards</span>
              <strong>৳{killRewards.toFixed(2)}</strong>
            </div>

            <div style={styles.row}>
              <span>Total Earnings</span>
              <strong>৳{totalEarnings.toFixed(2)}</strong>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>
              Transaction History
            </h2>

            {transactions.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>৳</div>

                <h3 style={styles.emptyTitle}>
                  No transactions yet
                </h3>

                <p style={styles.emptyText}>
                  Your approved deposits, tournament entries,
                  prizes, kill rewards, refunds, and withdrawals
                  will appear here.
                </p>
              </div>
            ) : (
              <div style={styles.transactionList}>
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    style={styles.transaction}
                  >
                    <div style={styles.transactionLeft}>
                      <strong>
                        {formatTransactionType(
                          transaction.transaction_type
                        )}
                      </strong>

                      <small>
                        {transaction.description ||
                          formatTransactionType(
                            transaction.transaction_type
                          )}
                      </small>

                      <small style={styles.transactionDate}>
                        {formatTransactionDate(
                          transaction.created_at
                        )}
                      </small>
                    </div>

                    <div
                      style={{
                        ...styles.transactionAmount,
                        color:
                          Number(transaction.amount) >= 0
                            ? "#86efac"
                            : "#fca5a5",
                      }}
                    >
                      {Number(transaction.amount) >= 0
                        ? "+"
                        : ""}
                      ৳{Math.abs(Number(transaction.amount) || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={styles.infoCard}>
            <div style={styles.infoTitle}>
              Wallet Security
            </div>

            <p style={styles.infoText}>
              Wallet balance changes require secure system
              processing and Admin approval where required.
              Money movement always keeps a transaction record.
            </p>
          </section>
        </>
      )}
    </main>
  );
}

function formatTransactionType(type) {
  const labels = {
    DEPOSIT: "Deposit",
    ENTRY_FEE: "Tournament Entry",
    POSITION_PRIZE: "Position Prize",
    KILL_REWARD: "Kill Reward",
    REFUND: "Tournament Refund",
    WITHDRAWAL: "Withdrawal",
    ADJUSTMENT: "Wallet Adjustment",
  };

  return labels[type] || type || "Transaction";
}

function formatTransactionDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
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

  transactionList: {
    borderTop: "1px solid #202a3d",
  },

  transaction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "13px 0",
    borderBottom: "1px solid #202a3d",
  },

  transactionLeft: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  transactionAmount: {
    flexShrink: 0,
    fontSize: "13px",
    fontWeight: "800",
  },

  transactionDate: {
    color: "#69758b",
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

  loadingCard: {
    padding: "36px 20px",
    borderRadius: "20px",
    background: "#131a28",
    border: "1px solid #283247",
    textAlign: "center",
  },

  loadingIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 12px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1f2940",
    color: "#b8a0ff",
    fontSize: "21px",
    fontWeight: "800",
  },

  loadingTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },

  loadingText: {
    margin: 0,
    color: "#8f98aa",
    fontSize: "12px",
  },

  errorCard: {
    padding: "28px 20px",
    borderRadius: "20px",
    background: "#2a171b",
    border: "1px solid #713039",
    textAlign: "center",
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

  errorTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
    color: "#fecaca",
  },

  errorText: {
    maxWidth: "500px",
    margin: "0 auto",
    color: "#fca5a5",
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
