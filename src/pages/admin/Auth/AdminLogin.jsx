import React, { useState } from "react";
import { signInAdmin } from "../../../services/auth/authService.js";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await signInAdmin(email.trim(), password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Unable to sign in as Admin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>FF TOURNAMENT</div>
        <div style={styles.badge}>ADMIN PANEL</div>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.subtitle}>Sign in with an authorized Admin account.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)}
              placeholder="Admin email" autoComplete="username" required style={styles.input} />
          </label>
          <label style={styles.label}>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password" autoComplete="current-password" required style={styles.input} />
          </label>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Verifying Admin..." : "Sign In as Admin"}
          </button>
        </form>

        <button type="button" onClick={() => { window.location.href = "/"; }} style={styles.backButton}>
          Back to User Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 18px", background: "#0b0f19" },
  card: { width: "100%", maxWidth: "420px", padding: "28px 22px", borderRadius: "22px", background: "#131a28", border: "1px solid #283247" },
  brand: { fontSize: "11px", letterSpacing: "2px", fontWeight: "800", color: "#b8a0ff" },
  badge: { display: "inline-block", marginTop: "12px", padding: "6px 8px", borderRadius: "7px", background: "#241719", color: "#ff9b4a", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" },
  title: { margin: "10px 0 6px", fontSize: "28px", color: "#f5f7fb" },
  subtitle: { margin: "0 0 24px", color: "#aeb7c7", fontSize: "14px", lineHeight: 1.5 },
  form: { display: "grid", gap: "16px" },
  label: { display: "grid", gap: "7px", color: "#d9deea", fontSize: "13px", fontWeight: "600" },
  input: { width: "100%", padding: "13px 14px", borderRadius: "12px", border: "1px solid #303b51", background: "#0f1522", color: "#f5f7fb", outline: "none", boxSizing: "border-box" },
  error: { padding: "11px 12px", borderRadius: "10px", background: "#321b24", color: "#fca5a5", fontSize: "13px" },
  button: { width: "100%", padding: "14px", border: "none", borderRadius: "12px", background: "#7c5cff", color: "#fff", fontWeight: "800", cursor: "pointer" },
  backButton: { width: "100%", marginTop: "18px", padding: "11px", border: "none", background: "transparent", color: "#b8a0ff", fontSize: "13px", fontWeight: "700", cursor: "pointer" },
};
