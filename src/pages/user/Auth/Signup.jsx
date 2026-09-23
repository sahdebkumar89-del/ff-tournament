import React, { useState } from "react";
import logo from "../../../logo.png.png";
import { signUp } from "../../../services/auth/authService.js";

export default function Signup({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [freeFireUid, setFreeFireUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^[0-9]{5,20}$/.test(freeFireUid)) {
      setError("Free Fire UID must contain 5 to 20 digits.");
      return;
    }

    try {
      setLoading(true);
      const data = await signUp(email, password, freeFireUid);
      setSuccess(data.session
        ? "Account created successfully."
        : "Account created. Please check your email to verify your account.");
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src={logo} alt="FF Tournament" style={styles.logo} />
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>
          Your Free Fire UID is the primary game identity for this account.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input type="email" value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email" required style={styles.input} />
          </label>
          <label style={styles.label}>
            Free Fire UID
            <input type="text" inputMode="numeric" autoComplete="off"
              value={freeFireUid}
              onChange={(event) => setFreeFireUid(event.target.value.replace(/\D/g, "").slice(0, 20))}
              placeholder="Enter your Free Fire UID" required minLength={5}
              maxLength={20} pattern="[0-9]{5,20}" style={styles.input} />
          </label>
          <label style={styles.label}>
            Password
            <input type="password" value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password" required minLength={6} style={styles.input} />
          </label>
          <label style={styles.label}>
            Confirm Password
            <input type="password" value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your password" required minLength={6} style={styles.input} />
          </label>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <button type="button" onClick={onBackToLogin} style={styles.backButton}>
          Already have an account? Sign In
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
  error: { padding: "11px 12px", borderRadius: "10px", background: "#321b24", color: "#fca5a5", fontSize: "13px" },
  success: { padding: "11px 12px", borderRadius: "10px", background: "#142c20", color: "#86efac", fontSize: "13px" },
  button: { width: "100%", padding: "14px", border: "none", borderRadius: "12px", background: "#7c5cff", color: "#ffffff", fontWeight: "800", cursor: "pointer" },
  backButton: { width: "100%", marginTop: "18px", padding: "10px", border: "none", background: "transparent", color: "#b8a0ff", fontSize: "13px", cursor: "pointer" },
};
