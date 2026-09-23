import React, { useState } from "react";
import logo from "../../../logo.png.png";
import { signIn } from "../../../services/auth/authService.js";

export default function Login({ onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [freeFireUid, setFreeFireUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await signIn(email, password, freeFireUid);
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src={logo} alt="FF Tournament" style={styles.logo} />
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>
          Sign in with your account and confirm your Free Fire UID.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input type="email" value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email" required style={styles.input} />
          </label>

          <label style={styles.label}>
            Password
            <input type="password" value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password" required style={styles.input} />
          </label>

          <label style={styles.label}>
            Free Fire UID
            <input type="text" inputMode="numeric" autoComplete="off"
              value={freeFireUid}
              onChange={(event) => setFreeFireUid(event.target.value.replace(/\D/g, "").slice(0, 20))}
              placeholder="Enter your Free Fire UID" required minLength={5}
              maxLength={20} pattern="[0-9]{5,20}" style={styles.input} />
          </label>

          <div style={styles.securityNote}>
            Your UID must match the UID linked to this account. If it does not match, the login will be rejected.
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Verifying..." : "Sign In & Verify UID"}
          </button>
        </form>

        <button type="button" onClick={onCreateAccount} style={styles.createButton}>
          Create a new account
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 18px", background: "#0b0f19" },
  card: { width: "100%", maxWidth: "420px", padding: "28px 22px", borderRadius: "22px", background: "#131a28", border: "1px solid #283247" },
  logo: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "18px", marginBottom: "12px", border: "1px solid #4b2925", boxShadow: "0 8px 22px rgba(0,0,0,.28)" },
  brand: { fontSize: "11px", letterSpacing: "2px", fontWeight: "800", color: "#b8a0ff" },
  title: { margin: "8px 0 6px", fontSize: "28px", color: "#f5f7fb" },
  subtitle: { margin: "0 0 24px", color: "#aeb7c7", fontSize: "14px", lineHeight: 1.5 },
  form: { display: "grid", gap: "16px" },
  label: { display: "grid", gap: "7px", color: "#d9deea", fontSize: "13px", fontWeight: "600" },
  input: { width: "100%", padding: "13px 14px", borderRadius: "12px", border: "1px solid #303b51", background: "#0f1522", color: "#f5f7fb", outline: "none", boxSizing: "border-box" },
  securityNote: { padding: "11px 12px", borderRadius: "10px", background: "#171d2a", color: "#9ea9bb", fontSize: "12px", lineHeight: 1.45 },
  error: { padding: "11px 12px", borderRadius: "10px", background: "#321b24", color: "#fca5a5", fontSize: "13px" },
  button: { width: "100%", padding: "14px", border: "none", borderRadius: "12px", background: "#7c5cff", color: "#ffffff", fontWeight: "800", cursor: "pointer" },
  createButton: { width: "100%", marginTop: "18px", padding: "11px", border: "none", background: "transparent", color: "#b8a0ff", fontSize: "13px", fontWeight: "700", cursor: "pointer" },
};
