import React from "react";
import logo from "../../logo.png.png";

const APK_URL = "https://github.com/sahdebkumar89-del/ff-tournament/releases/latest/download/FF-Tournament.apk";

export default function DownloadPage() {
  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <main style={styles.card}>
        <img src={logo} alt="FF Tournament" style={styles.logo} />
        <div style={styles.kicker}>FF TOURNAMENT</div>
        <h1 style={styles.title}>Download the App</h1>
        <p style={styles.text}>
          Free Fire BR Tournament-এর জন্য অফিসিয়াল Android app।
        </p>

        <a href={APK_URL} style={styles.button}>
          DOWNLOAD NOW
        </a>

        <div style={styles.info}>
          <div style={styles.infoTitle}>Latest Android APK</div>
          <div style={styles.infoText}>Download → Install → Start Playing</div>
        </div>

        <p style={styles.note}>
          Android-এ download করার পর APK install করুন।
        </p>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px 18px",
    boxSizing: "border-box",
    background: "radial-gradient(circle at 50% 15%, #321914 0%, #100d10 42%, #08080a 100%)",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(255, 92, 40, .12)",
    filter: "blur(70px)",
    top: "5%",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box",
    padding: "34px 24px 28px",
    textAlign: "center",
    borderRadius: "28px",
    background: "rgba(20, 17, 20, .94)",
    border: "1px solid #4a2824",
    boxShadow: "0 24px 70px rgba(0,0,0,.45)",
    position: "relative",
    zIndex: 1,
  },
  logo: {
    width: "92px",
    height: "92px",
    objectFit: "cover",
    borderRadius: "22px",
    border: "1px solid #633026",
    boxShadow: "0 12px 30px rgba(0,0,0,.35)",
  },
  kicker: {
    marginTop: "20px",
    color: "#ff7130",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "3px",
  },
  title: {
    margin: "8px 0 0",
    fontSize: "30px",
    lineHeight: 1.15,
  },
  text: {
    margin: "12px auto 24px",
    maxWidth: "310px",
    color: "#aaa4a7",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  button: {
    display: "block",
    textDecoration: "none",
    padding: "15px 18px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #ff7a2f, #e94231)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: ".6px",
    boxShadow: "0 12px 28px rgba(239, 72, 40, .22)",
  },
  info: {
    marginTop: "18px",
    padding: "13px 14px",
    borderRadius: "13px",
    background: "#151216",
    border: "1px solid #2f292d",
  },
  infoTitle: {
    color: "#e8e1e4",
    fontSize: "12px",
    fontWeight: 800,
  },
  infoText: {
    marginTop: "4px",
    color: "#777177",
    fontSize: "10px",
  },
  note: {
    margin: "18px 0 0",
    color: "#716b70",
    fontSize: "10px",
    lineHeight: 1.5,
  },
};
