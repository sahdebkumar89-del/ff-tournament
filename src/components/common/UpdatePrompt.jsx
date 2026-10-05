import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { FileOpener } from "@capacitor-community/file-opener";

const APK_URL = "https://ff-tournament-livid.vercel.app/downloads/FF-Tournament.apk";
const APK_FILE_NAME = "FF-Tournament-latest.apk";

export default function UpdatePrompt() {
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadError, setDownloadError] = useState("");

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

  const startUpdate = async () => {
    if (downloading) return;

    if (!Capacitor.isNativePlatform()) {
      window.location.href = "/download";
      return;
    }

    setDownloading(true);
    setProgress(0);
    setDownloadError("");

    let progressHandle;

    try {
      const fileInfo = await Filesystem.getUri({
        directory: Directory.Cache,
        path: APK_FILE_NAME,
      });

      progressHandle = await FileTransfer.addListener("progress", (event) => {
        if (event.type !== "download" || event.url !== APK_URL) return;

        if (event.lengthComputable && event.contentLength > 0) {
          const percent = Math.min(
            100,
            Math.round((event.bytes / event.contentLength) * 100)
          );
          setProgress(percent);
        }
      });

      await FileTransfer.downloadFile({
        url: APK_URL,
        path: fileInfo.uri,
        progress: true,
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      setProgress(100);

      // Give the final progress state a moment to render before opening
      // Android's package installer.
      await new Promise((resolve) => setTimeout(resolve, 450));

      await FileOpener.open({
        filePath: fileInfo.uri,
        contentType: "application/vnd.android.package-archive",
        openWithDefault: true,
      });
    } catch (error) {
      console.error("FF Tournament update failed:", error);
      setDownloadError(
        "Update download failed. Please check your internet connection and try again."
      );
      setDownloading(false);
    } finally {
      if (progressHandle) {
        try {
          await progressHandle.remove();
        } catch {
          // Ignore listener cleanup errors.
        }
      }
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.icon}>{downloading ? "↓" : "↻"}</div>

        <div style={styles.kicker}>
          {downloading ? "UPDATING FF TOURNAMENT" : "NEW UPDATE AVAILABLE"}
        </div>

        <h2 style={styles.title}>
          FF Tournament {update.version}
        </h2>

        {!downloading ? (
          <>
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

            {downloadError && (
              <div style={styles.errorBox}>{downloadError}</div>
            )}

            <button
              type="button"
              onClick={startUpdate}
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
          </>
        ) : (
          <>
            <p style={styles.text}>
              Update download হচ্ছে। শেষ হলে Android installer নিজে থেকেই
              খুলবে।
            </p>

            <div style={styles.progressWrap}>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div style={styles.progressRow}>
                <span>
                  {progress >= 100
                    ? "Download complete"
                    : "Downloading update..."}
                </span>
                <strong>{progress}%</strong>
              </div>
            </div>

            <div style={styles.installNote}>
              {progress >= 100
                ? "Opening installer… Please confirm Install on the Android screen."
                : "Please keep the app open until the download finishes."}
            </div>
          </>
        )}
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
  errorBox: {
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "11px",
    background: "rgba(210, 48, 48, .12)",
    border: "1px solid rgba(255, 82, 82, .28)",
    color: "#ffb0b0",
    fontSize: "10px",
    lineHeight: 1.45,
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
  progressWrap: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "14px",
    background: "#151216",
    border: "1px solid #30282b",
  },
  progressTrack: {
    width: "100%",
    height: "8px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "#29262a",
  },
  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "#168cff",
    transition: "width .18s ease",
    boxShadow: "0 0 12px rgba(22, 140, 255, .45)",
  },
  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "9px",
    color: "#8e898d",
    fontSize: "10px",
  },
  installNote: {
    marginTop: "13px",
    color: "#b8b2b5",
    fontSize: "10px",
    lineHeight: 1.5,
    textAlign: "center",
  },
};
