import React, { useState } from "react";
import Login from "./pages/user/Auth/Login.jsx";
import Signup from "./pages/user/Auth/Signup.jsx";
import BottomNav from "./components/common/BottomNav.jsx";
import Tournaments from "./pages/user/Tournaments/Tournaments.jsx";
import { useAuthContext } from "./app/providers/AuthProvider.jsx";
import { useTournaments } from "./hooks/useTournaments.js";

export default function App() {
  const { user, loading: authLoading } = useAuthContext();
  const [authPage, setAuthPage] = useState("login");

  if (authLoading) {
    return (
      <div style={styles.loadingPage}>
        Loading FF Tournament...
      </div>
    );
  }

  if (!user) {
    if (authPage === "signup") {
      return <Signup onBackToLogin={() => setAuthPage("login")} />;
    }

    return <Login onCreateAccount={() => setAuthPage("signup")} />;
  }

  return <Home />;
}

function Home() {
  const { tournaments, loading, error } = useTournaments();
  const [activePage, setActivePage] = useState("home");

  function handlePageChange(page) {
    setActivePage(page);
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <div style={styles.smallText}>FREE FIRE BR</div>
          <h1 style={styles.title}>FF Tournament</h1>
        </div>

        <button
          style={styles.notificationButton}
          aria-label="Notifications"
        >
          🔔
        </button>
      </header>

      <main style={styles.main}>
        {activePage === "home" && (
          <>
            <section style={styles.welcomeCard}>
              <div>
                <div style={styles.smallText}>WELCOME</div>
                <h2 style={styles.welcomeTitle}>
                  Battle. Compete. Earn.
                </h2>
                <p style={styles.muted}>
                  Daily Battle Royale tournaments from 9:00 AM to 11:30 PM.
                </p>
              </div>
            </section>

            <section>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Tournaments</h2>
                <span style={styles.brBadge}>BR ONLY</span>
              </div>

              {loading && (
                <div style={styles.statusCard}>
                  Loading tournaments...
                </div>
              )}

              {error && (
                <div style={styles.statusCard}>
                  Unable to load tournaments.
                </div>
              )}

              {!loading && !error && tournaments.length === 0 && (
                <div style={styles.statusCard}>
                  No tournaments available right now.
                </div>
              )}

              {!loading && !error && tournaments.length > 0 && (
                <div style={styles.list}>
                  {tournaments.map((tournament) => (
                    <article key={tournament.id} style={styles.card}>
                      <div style={styles.cardHeader}>
                        <h3 style={styles.mode}>
                          {tournament.mode}
                        </h3>

                        <span style={styles.openBadge}>
                          {tournament.status}
                        </span>
                      </div>

                      <div style={styles.row}>
                        <span>Entry Fee</span>
                        <strong>৳{tournament.entry_fee}</strong>
                      </div>

                      <div style={styles.row}>
                        <span>1st Prize</span>
                        <strong>৳{tournament.first_prize}</strong>
                      </div>

                      <div style={styles.row}>
                        <span>2nd Prize</span>
                        <strong>৳{tournament.second_prize}</strong>
                      </div>

                      <div style={styles.row}>
                        <span>3rd Prize</span>
                        <strong>৳{tournament.third_prize}</strong>
                      </div>

                      <div style={styles.row}>
                        <span>Kill Reward</span>
                        <strong>৳{tournament.kill_reward}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activePage === "tournaments" && <Tournaments />}

        {activePage === "my-tournaments" && (
          <div style={styles.statusCard}>
            My Tournaments page will be added next.
          </div>
        )}

        {activePage === "wallet" && (
          <div style={styles.statusCard}>
            Wallet page will be added later.
          </div>
        )}

        {activePage === "profile" && (
          <div style={styles.statusCard}>
            Profile page will be added later.
          </div>
        )}
      </main>

      <BottomNav
        activePage={activePage}
        onChange={handlePageChange}
      />
    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b0f19",
    color: "#f5f7fb",
  },

  app: {
    minHeight: "100vh",
    paddingBottom: "82px",
    background: "#0b0f19",
    color: "#f5f7fb",
  },

  header: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "22px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  smallText: {
    fontSize: "11px",
    letterSpacing: "2px",
    fontWeight: "800",
    color: "#9ca3af",
  },

  title: {
    margin: "4px 0 0",
    fontSize: "27px",
  },

  notificationButton: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    border: "1px solid #283247",
    background: "#151c2b",
    color: "#ffffff",
    fontSize: "19px",
  },

  main: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "0 18px 40px",
  },

  welcomeCard: {
    padding: "22px",
    borderRadius: "20px",
    background: "#151c2b",
    border: "1px solid #283247",
    marginBottom: "28px",
  },

  welcomeTitle: {
    margin: "7px 0",
    fontSize: "23px",
  },

  muted: {
    margin: 0,
    color: "#aeb7c7",
    lineHeight: 1.5,
    fontSize: "14px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },

  brBadge: {
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#1b2436",
    color: "#b8a0ff",
    fontSize: "10px",
    fontWeight: "800",
  },

  list: {
    display: "grid",
    gap: "12px",
  },

  statusCard: {
    padding: "18px",
    borderRadius: "18px",
    background: "#131a28",
    border: "1px solid #283247",
    color: "#aeb7c7",
    fontSize: "14px",
  },

  card: {
    padding: "18px",
    borderRadius: "18px",
    background: "#131a28",
    border: "1px solid #283247",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
  },

  mode: {
    margin: 0,
    fontSize: "18px",
    letterSpacing: "1px",
  },

  openBadge: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#86efac",
  },

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    borderTop: "1px solid #202a3d",
    color: "#aeb7c7",
    fontSize: "13px",
  },
};
