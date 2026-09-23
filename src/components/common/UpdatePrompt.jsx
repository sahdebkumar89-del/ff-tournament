import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";

const APK_URL =
  "https://github.com/sahdebkumar89-del/ff-tournament/releases/latest/download/FF-Tournament.apk";

export default function UpdatePrompt() {
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkForUpdate() {
      try {
        const nativeInfo = await CapacitorApp.getInfo();
        const response = await fetch(`/update.json?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const latest = await response.json();
        const currentVersion = nativeInfo.version || "0.0.0";
        const latestVersion = String(latest.version || "");

        if (
          active &&
          latestVersion &&
          compareVersions(latestVersion, currentVersion) > 0
        ) {
          setUpdate(latest);
        }
      } catch {
        // Web browsers and older builds may not expose native app info.
      }
    }

    checkForUpdate();

    return () => {
      active = false;
    };
  }, []);

  if (!update || dismissed) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.icon}>↻</div>

        <div style={styles.kicker}>NEW UPDATE AVAILABLE</div>

        <h2 style={styles.title}>
          FF Tournament {update.version}
        </h2>

        <p style={styles.text}>
          নতুন feature এবং improvement এসেছে। সর্বশেষ version ব্যবহার করতে
          এখনই update করো।
        </p>

        {Array.isArray(update.changelog) && update.changelog.length > 0 && (
          <div style={styles.changelog}>
            {update.changelog.map((item, index) => (
              <div key={index} style={styles.item}>
                <span style={styles.bullet}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            window.location.href = APK_URL;
          }}
          style={styles.updateButton}
        >
          Update Now
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={styles.laterButton}
        >
          Later
        </button>
      </div>
    </div>
  );
}

function compareVersions(a, b) {
  const left = String(a)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const right = String(b)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const x = left[i] || 0;
    const y = right[i] || 0;

    if (x > y) return 1;
    if (x < y) return -1;
  }

  return 0;
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: "20px",
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(6px)",
  },
  card: {
    width: "min(100%, 380px)",
    padding: "22px",
    borderRadius: "22px",
    background: "linear-gradient(145deg, #201315, #111115)",
    border: "1px solid #683126",
    boxShadow: "0 24px 70px rgba(0,0,0,.55)",
  },
  icon: {
    width: "48px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    borderRadius: "15px",
    background: "#321916",
    color: "#ff8b4a",
    fontSize: "27px",
    fontWeight: "900",
    marginBottom: "14px",
  },
  kicker: {
    color: "#ff7130",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.8px",
  },
  title: {
    margin: "7px 0 0",
    fontSize: "22px",
  },
  text: {
    margin: "9px 0 15px",
    color: "#aaa5aa",
    fontSize: "12px",
    lineHeight: 1.55,
  },
  changelog: {
    display: "grid",
    gap: "8px",
    padding: "12px",
    borderRadius: "13px",
    background: "#151216",
    border: "1px solid #30282b",
    color: "#d5d0d4",
    fontSize: "11px",
    lineHeight: 1.45,
  },
  item: {
    display: "flex",
    gap: "8px",
  },
  bullet: {
    color: "#ff7a3d",
    fontWeight: "900",
  },
  updateButton: {
    width: "100%",
    marginTop: "15px",
    padding: "12px",
    border: "none",
    borderRadius: "11px",
    background: "linear-gradient(135deg, #ff7a2f, #e94231)",
    color: "#fff",
    fontWeight: "900",
    fontSize: "12px",
  },
  laterButton: {
    width: "100%",
    marginTop: "8px",
    padding: "10px",
    border: "1px solid #3a3033",
    borderRadius: "11px",
    background: "transparent",
    color: "#aaa5aa",
    fontWeight: "800",
    fontSize: "11px",
  },
};
