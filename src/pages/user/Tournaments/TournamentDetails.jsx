import React, { useState } from "react";
import {
  requestTournamentJoin,
  confirmTournamentJoin,
} from "../../../services/tournaments/tournamentService.js";

const MODE_UID_COUNT = {
  SOLO: 1,
  DUO: 2,
  SQUAD: 4,
};

function formatMoney(value) {
  return `৳${Number(value ?? 0).toFixed(0)}`;
}

export default function TournamentDetails({ tournament, onBack }) {
  const uidCount = MODE_UID_COUNT[tournament?.mode] ?? 1;
  const [uids, setUids] = useState(() => Array(uidCount).fill(""));
  const [requestId, setRequestId] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!tournament) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Tournament not found</h2>
          <button type="button" onClick={onBack} style={styles.secondaryButton}>
            Back to Tournaments
          </button>
        </div>
      </main>
    );
  }

  const isOpen = tournament.status === "REGISTRATION";
  const isTeamMode = tournament.mode !== "SOLO";

  function updateUid(index, value) {
    setUids((current) =>
      current.map((uid, uidIndex) =>
        uidIndex === index ? value.replace(/\D/g, "").slice(0, 20) : uid
      )
    );
  }

  function validateUids() {
    const normalized = uids.map((uid) => uid.trim());

    if (normalized.some((uid) => !/^\d{5,20}$/.test(uid))) {
      return "Each Free Fire UID must contain 5–20 digits.";
    }

    if (new Set(normalized).size !== normalized.length) {
      return "Free Fire UIDs must be different.";
    }

    return "";
  }

  async function handleRequest() {
    setError("");
    setMessage("");

    const validationError = validateUids();
    if (validationError) {
      setError(validationError);
      return;
    }

    setRequesting(true);

    try {
      const data = await requestTournamentJoin(
        tournament.id,
        uids.map((uid) => uid.trim())
      );

      setRequestId(data);
      setMessage("");
    } catch (err) {
      setError(err?.message || "Unable to create the join request.");
    } finally {
      setRequesting(false);
    }
  }

  async function handleConfirm() {
    if (!requestId) {
      setError("Join request is missing. Please create a new request.");
      return;
    }

    setError("");
    setMessage("");
    setConfirming(true);

    try {
      await confirmTournamentJoin(requestId);

      setMessage(
        isTeamMode
          ? "Tournament joined successfully. The captain's wallet entry fee has been deducted."
          : "Tournament joined successfully. Your wallet entry fee has been deducted."
      );
      setRequestId(null);
    } catch (err) {
      setError(err?.message || "Unable to confirm the tournament join.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <main style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← Back
      </button>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>FREE FIRE • BATTLE ROYALE</div>

        <div style={styles.heroRow}>
          <div>
            <div style={styles.modeBadge}>{tournament.mode}</div>
            <h1 style={styles.title}>Tournament Details</h1>
            <p style={styles.subtitle}>
              {tournament.scheduled_start_time} • Registration
            </p>
          </div>

          <span style={styles.status}>{tournament.status}</span>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Match</h2>

        <div style={styles.row}>
          <span>Start</span>
          <strong>{tournament.scheduled_start_time}</strong>
        </div>

        <div style={styles.row}>
          <span>End</span>
          <strong>{tournament.scheduled_end_time}</strong>
        </div>

        <div style={styles.row}>
          <span>Entry Fee</span>
          <strong style={styles.money}>{formatMoney(tournament.entry_fee)}</strong>
        </div>

        <div style={styles.row}>
          <span>Players</span>
          <strong>{tournament.max_players}</strong>
        </div>

        {tournament.max_teams && (
          <div style={styles.row}>
            <span>Teams</span>
            <strong>{tournament.max_teams}</strong>
          </div>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Prize Breakdown</h2>

        <div style={styles.prizeRow}>
          <span>🥇 1st Place</span>
          <strong>{formatMoney(tournament.first_prize)}</strong>
        </div>

        <div style={styles.prizeRow}>
          <span>🥈 2nd Place</span>
          <strong>{formatMoney(tournament.second_prize)}</strong>
        </div>

        <div style={styles.prizeRow}>
          <span>🥉 3rd Place</span>
          <strong>{formatMoney(tournament.third_prize)}</strong>
        </div>

        <div style={styles.prizeRow}>
          <span>🎯 Individual Kill Reward</span>
          <strong>{formatMoney(tournament.kill_reward)} / kill</strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Join Rules</h2>

        <div style={styles.rule}>• Free Fire Battle Royale only</div>
        <div style={styles.rule}>• Kill reward is given to the individual player</div>

        {isTeamMode && (
          <div style={styles.rule}>
            • No revive in {tournament.mode}
          </div>
        )}

        <div style={styles.rule}>
          • Room ID and Password release 10 minutes before the match
        </div>

        <div style={styles.rule}>
          • Registration closes 30 minutes before match start
        </div>
      </section>

      {!requestId && !message && isOpen && (
        <section style={styles.card}>
          <div style={styles.formHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {isTeamMode ? "Team UIDs" : "Free Fire UID"}
              </h2>
              <p style={styles.helper}>
                {isTeamMode
                  ? "First UID is the captain. The captain's wallet will be charged."
                  : "Enter the Free Fire UID you will use in the tournament."}
              </p>
            </div>
          </div>

          <div style={styles.uidList}>
            {uids.map((uid, index) => (
              <label key={index} style={styles.uidLabel}>
                <span>
                  {isTeamMode
                    ? index === 0
                      ? "Captain UID"
                      : `Teammate ${index} UID`
                    : "Free Fire UID"}
                </span>
                <input
                  inputMode="numeric"
                  value={uid}
                  onChange={(event) => updateUid(index, event.target.value)}
                  placeholder="Enter UID"
                  style={styles.input}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRequest}
            disabled={requesting}
            style={{
              ...styles.primaryButton,
              ...(requesting ? styles.disabledButton : null),
            }}
          >
            {requesting ? "Checking..." : "Continue to Confirmation"}
          </button>

          <p style={styles.note}>
            Your wallet is not charged at this step. The entry fee is deducted
            only after you confirm the join request.
          </p>
        </section>
      )}

      {requestId && !message && (
        <section style={styles.confirmCard}>
          <div style={styles.confirmIcon}>!</div>
          <h2 style={styles.confirmTitle}>Confirm Tournament Join</h2>
          <p style={styles.confirmText}>
            Please check the UIDs below before confirming.
          </p>

          <div style={styles.confirmList}>
            {uids.map((uid, index) => (
              <div key={index} style={styles.confirmRow}>
                <span>
                  {isTeamMode
                    ? index === 0
                      ? "Captain"
                      : `Teammate ${index}`
                    : "Player"}
                </span>
                <strong>{uid}</strong>
              </div>
            ))}
          </div>

          <div style={styles.feeBox}>
            <span>{isTeamMode ? "Captain wallet charge" : "Wallet charge"}</span>
            <strong>{formatMoney(tournament.entry_fee)}</strong>
          </div>

          <p style={styles.confirmWarning}>
            No money has been deducted yet. Tapping confirm will deduct the
            entry fee and complete the join.
          </p>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            style={{
              ...styles.primaryButton,
              ...(confirming ? styles.disabledButton : null),
            }}
          >
            {confirming ? "Confirming..." : "Confirm & Join Tournament"}
          </button>

          <button
            type="button"
            onClick={() => {
              setRequestId(null);
              setMessage("");
              setError("");
            }}
            disabled={confirming}
            style={styles.secondaryButton}
          >
            Edit UIDs
          </button>
        </section>
      )}

      {message && (
        <div style={styles.successBox}>
          <strong>{message}</strong>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {!isOpen && (
        <div style={styles.closedBox}>
          <strong>Registration Closed</strong>
          <span>This tournament is not accepting new join requests.</span>
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "20px 18px 42px",
    color: "#f7f7f8",
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: "#ff9d2e",
    padding: "6px 0",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    marginBottom: "14px",
  },
  hero: {
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, #171217 0%, #211315 55%, #15171c 100%)",
    border: "1px solid #4b2422",
    boxShadow: "0 12px 32px rgba(0,0,0,.28)",
    marginBottom: "14px",
  },
  eyebrow: {
    fontSize: "10px",
    letterSpacing: "1.8px",
    fontWeight: "900",
    color: "#ff7a2f",
  },
  heroRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    marginTop: "10px",
  },
  modeBadge: {
    display: "inline-block",
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#35171b",
    color: "#ff6b5f",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: ".8px",
  },
  title: {
    margin: "9px 0 0",
    fontSize: "27px",
    lineHeight: 1.15,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#9b9ca3",
    fontSize: "13px",
  },
  status: {
    padding: "7px 10px",
    borderRadius: "9px",
    background: "#162d20",
    color: "#8af0a8",
    fontSize: "10px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  card: {
    padding: "18px",
    borderRadius: "20px",
    background: "#111318",
    border: "1px solid #292b31",
    marginBottom: "14px",
  },
  confirmCard: {
    padding: "20px",
    borderRadius: "20px",
    background: "linear-gradient(145deg, #1b1412, #121316)",
    border: "1px solid #63311f",
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
    borderTop: "1px solid #25272d",
    color: "#a9abb3",
    fontSize: "13px",
  },
  money: {
    color: "#ffb04a",
  },
  prizeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 0",
    borderTop: "1px solid #25272d",
    color: "#dedee3",
    fontSize: "13px",
  },
  rule: {
    padding: "9px 0",
    borderTop: "1px solid #25272d",
    color: "#a9abb3",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  formHeader: {
    marginBottom: "14px",
  },
  helper: {
    margin: "-5px 0 0",
    color: "#8d9099",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  uidList: {
    display: "grid",
    gap: "12px",
    marginBottom: "15px",
  },
  uidLabel: {
    display: "grid",
    gap: "7px",
    color: "#c5c6cc",
    fontSize: "12px",
    fontWeight: "800",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 12px",
    borderRadius: "11px",
    border: "1px solid #34363d",
    background: "#0c0e12",
    color: "#ffffff",
    outline: "none",
    fontSize: "14px",
  },
  primaryButton: {
    width: "100%",
    padding: "14px",
    border: "1px solid #ff6a2a",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #ff7a2f, #e83e2f)",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  secondaryButton: {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    border: "1px solid #373940",
    borderRadius: "12px",
    background: "#191b20",
    color: "#d8d8dc",
    fontWeight: "800",
    cursor: "pointer",
  },
  note: {
    margin: "10px 6px 0",
    color: "#777b86",
    fontSize: "11px",
    lineHeight: 1.5,
    textAlign: "center",
  },
  confirmIcon: {
    width: "36px",
    height: "36px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#402016",
    color: "#ff9b42",
    fontWeight: "900",
    marginBottom: "10px",
  },
  confirmTitle: {
    margin: "0",
    fontSize: "20px",
  },
  confirmText: {
    margin: "6px 0 14px",
    color: "#92959e",
    fontSize: "12px",
  },
  confirmList: {
    borderTop: "1px solid #302a28",
    borderBottom: "1px solid #302a28",
    marginBottom: "12px",
  },
  confirmRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "11px 0",
    color: "#a8aab1",
    fontSize: "12px",
  },
  feeBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "13px",
    borderRadius: "12px",
    background: "#241713",
    border: "1px solid #543021",
    color: "#bdbdc3",
    fontSize: "12px",
  },
  confirmWarning: {
    margin: "12px 0",
    color: "#ffb07a",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  successBox: {
    padding: "14px",
    marginBottom: "12px",
    borderRadius: "12px",
    background: "#12251a",
    border: "1px solid #245a38",
    color: "#8af0a8",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  errorBox: {
    padding: "14px",
    marginBottom: "12px",
    borderRadius: "12px",
    background: "#2b1518",
    border: "1px solid #713038",
    color: "#ffaaa8",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  closedBox: {
    display: "grid",
    gap: "4px",
    padding: "14px",
    borderRadius: "12px",
    background: "#1b1c20",
    border: "1px solid #34363d",
    color: "#d7d7dc",
    fontSize: "12px",
  },
};
