import React, { useEffect, useMemo, useState } from "react";
import Login from "./pages/user/Auth/Login.jsx";
import AdminLogin from "./pages/admin/Auth/AdminLogin.jsx";
import Signup from "./pages/user/Auth/Signup.jsx";
import BottomNav from "./components/common/BottomNav.jsx";
import Tournaments from "./pages/user/Tournaments/Tournaments.jsx";
import TournamentDetails from "./pages/user/Tournaments/TournamentDetails.jsx";
import MyTournaments from "./pages/user/MyTournaments/MyTournaments.jsx";
import Profile from "./pages/user/Profile/Profile.jsx";
import Wallet from "./pages/user/Wallet/Wallet.jsx";
import Notifications from "./pages/user/Notifications/Notifications.jsx";
import Room from "./pages/user/Room/Room.jsx";
import AdminTournaments from "./pages/admin/Tournaments/AdminTournaments.jsx";
import { useAuthContext } from "./app/providers/AuthProvider.jsx";
import { useTournaments } from "./hooks/useTournaments.js";
import { supabase } from "./lib/supabase/client.js";

export default function App() {
  const { user, loading: authLoading } = useAuthContext();
  const isAdminLoginPath = window.location.pathname === "/admin-login";
  const isAdminPath = window.location.pathname === "/admin";

  const [authPage, setAuthPage] = useState("login");
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  if (authLoading) {
    return (
      <div style={styles.loadingPage}>
        Loading FF Tournament...
      </div>
    );
  }

  if (!user) {
    if (isAdminLoginPath) {
      return <AdminLogin />;
    }

    return authPage === "signup" ? (
      <Signup
        onBackToLogin={() => setAuthPage("login")}
      />
    ) : (
      <Login
        onCreateAccount={() => setAuthPage("signup")}
      />
    );
  }

  if (isAdminLoginPath || isAdminPath) {
    return (
      <AuthenticatedApp
        user={user}
        role={role}
        setRole={setRole}
        roleLoading={roleLoading}
        setRoleLoading={setRoleLoading}
        showAdmin={true}
        setShowAdmin={setShowAdmin}
      />
    );
  }

  return (
    <AuthenticatedApp
      user={user}
      role={role}
      setRole={setRole}
      roleLoading={roleLoading}
      setRoleLoading={setRoleLoading}
      showAdmin={showAdmin}
      setShowAdmin={setShowAdmin}
    />
  );
}

function AuthenticatedApp({
  user,
  role,
  setRole,
  roleLoading,
  setRoleLoading,
  showAdmin,
  setShowAdmin,
}) {
  useEffect(() => {
    let active = true;

    async function loadRole() {
      setRoleLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setRole("USER");
      } else {
        setRole(data?.role || "USER");
      }

      setRoleLoading(false);
    }

    loadRole();

    return () => {
      active = false;
    };
  }, [user.id, setRole, setRoleLoading]);

  if (roleLoading || !role) {
    return (
      <div style={styles.loadingPage}>
        Loading FF Tournament...
      </div>
    );
  }

  if (showAdmin && role === "ADMIN") {
    return (
      <AdminTournaments
        onBack={() => setShowAdmin(false)}
      />
    );
  }

  return (
    <Home
      isAdmin={role === "ADMIN"}
      onOpenAdmin={() => setShowAdmin(true)}
    />
  );
}

function Home({ isAdmin, onOpenAdmin }) {
  const {
    tournaments,
    loading,
    error,
  } = useTournaments();

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const [activePage, setActivePage] =
    useState("home");

  const [selectedTournament, setSelectedTournament] =
    useState(null);

  const [balance, setBalance] = useState(0);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUnreadNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const {
        data: notificationRows,
      } = await supabase
        .from("notifications")
        .select("id")
        .eq("recipient_user_id", user.id)
        .limit(100);

      const ids = (notificationRows || []).map(
        (item) => item.id
      );

      if (!ids.length) {
        if (active) {
          setUnreadNotifications(0);
        }
        return;
      }

      const { data: readRows } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id)
        .in("notification_id", ids);

      if (!active) return;

      const readIds = new Set(
        (readRows || []).map(
          (item) => item.notification_id
        )
      );

      setUnreadNotifications(
        ids.filter((id) => !readIds.has(id)).length
      );
    }

    loadUnreadNotifications();

    const timer = window.setInterval(
      loadUnreadNotifications,
      15000
    );

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBalance() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (active && data) {
        setBalance(Number(data.balance) || 0);
      }
    }

    loadBalance();

    return () => {
      active = false;
    };
  }, []);

  function handlePageChange(page) {
    setSelectedTournament(null);
    setActivePage(page);
  }

  const nextByMode = useMemo(() => {
    const result = {
      SOLO: null,
      DUO: null,
      SQUAD: null,
    };

    (tournaments || [])
      .filter((tournament) =>
        isRegistrationOpen(tournament, now)
      )
      .sort(
        (a, b) =>
          tournamentStartTimestamp(a) -
          tournamentStartTimestamp(b)
      )
      .forEach((tournament) => {
        if (!result[tournament.mode]) {
          result[tournament.mode] = tournament;
        }
      });

    return result;
  }, [tournaments, now]);

  const liveTournament = (tournaments || []).find(
    (tournament) => tournament.status === "STARTED"
  );

  if (selectedTournament) {
    return (
      <div style={styles.app}>
        <TournamentDetails
          tournament={selectedTournament}
          onBack={() => setSelectedTournament(null)}
        />

        <BottomNav
          activePage={activePage}
          onChange={handlePageChange}
        />
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {activePage === "home" && (
        <header style={styles.header}>
          <div>
            <div style={styles.brandKicker}>
              FF TOURNAMENT
            </div>

            <h1 style={styles.headerTitle}>
              Battle Royale
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                style={styles.adminButton}
              >
                Admin
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setActivePage("notifications")
              }
              style={styles.notificationButton}
              aria-label="Notifications"
            >
              <span style={styles.bell}>♢</span>

              <span style={styles.notificationDot}>
                {unreadNotifications > 99
                  ? "99+"
                  : unreadNotifications}
              </span>
            </button>
          </div>
        </header>
      )}

      <main style={styles.main}>
        {activePage === "home" && (
          <>
            <section style={styles.walletCard}>
              <div>
                <div style={styles.cardKicker}>
                  WALLET BALANCE
                </div>

                <div style={styles.balance}>
                  ৳{balance.toFixed(2)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePage("wallet")}
                style={styles.walletButton}
              >
                Wallet
              </button>
            </section>

            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <div style={styles.sectionKicker}>
                    UP NEXT
                  </div>

                  <h2 style={styles.sectionTitle}>
                    Next Match for Registration
                  </h2>
                </div>

                <span style={styles.brBadge}>
                  BR ONLY
                </span>
              </div>

              {loading && (
                <div style={styles.statusCard}>
                  Loading matches...
                </div>
              )}

              {error && (
                <div style={styles.statusCard}>
                  Unable to load matches right now.
                </div>
              )}

              {!loading && !error && (
                <div style={styles.modeGrid}>
                  {["SOLO", "DUO", "SQUAD"].map((mode) => {
                    const tournament = nextByMode[mode];

                    return (
                      <article
                        key={mode}
                        style={styles.matchCard}
                      >
                        <div style={styles.matchTop}>
                          <span style={styles.modeBadge}>
                            {mode}
                          </span>

                          {tournament && (
                            <span
                              style={styles.openBadge}
                            >
                              OPEN
                            </span>
                          )}
                        </div>

                        {tournament ? (
                          <>
                            <div
                              style={styles.matchTime}
                            >
                              {formatTime(
                                tournament.scheduled_start_time
                              )}
                            </div>

                            <div
                              style={styles.matchMeta}
                            >
                              Entry{" "}
                              <strong>
                                ৳
                                {Number(
                                  tournament.entry_fee
                                ).toFixed(0)}
                              </strong>
                            </div>

                            <div
                              style={styles.matchMeta}
                            >
                              Prize{" "}
                              <strong>
                                ৳
                                {Number(
                                  tournament.first_prize
                                ).toFixed(0)}
                              </strong>
                            </div>

                            <div
                              style={styles.countdown}
                            >
                              {registrationCountdown(
                                tournament,
                                now
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTournament(
                                  tournament
                                )
                              }
                              style={styles.joinButton}
                            >
                              View & Join
                            </button>
                          </>
                        ) : (
                          <div style={styles.noMatch}>
                            No registration slot available.
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <div>
                  <div style={styles.sectionKicker}>
                    LIVE NOW
                  </div>

                  <h2 style={styles.sectionTitle}>
                    Live Tournament
                  </h2>
                </div>
              </div>

              {liveTournament ? (
                <article style={styles.liveCard}>
                  <div>
                    <span style={styles.liveBadge}>
                      ● LIVE
                    </span>

                    <h3 style={styles.liveTitle}>
                      {liveTournament.mode} • Battle Royale
                    </h3>

                    <p style={styles.liveText}>
                      Match is currently running. Room
                      access is available to joined players.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePage("room")}
                    style={styles.liveButton}
                  >
                    Open Room
                  </button>
                </article>
              ) : (
                <div style={styles.emptyLive}>
                  <span style={styles.emptyLiveIcon}>
                    ◉
                  </span>

                  <div>
                    <strong>
                      No live tournament right now
                    </strong>

                    <p>
                      The next live match will appear here
                      automatically.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activePage === "tournaments" && (
          <Tournaments />
        )}

        {activePage === "my-tournaments" && (
          <MyTournaments />
        )}

        {activePage === "room" && <Room />}

        {activePage === "wallet" && <Wallet />}

        {activePage === "profile" && <Profile />}

        {activePage === "notifications" && (
          <Notifications />
        )}
      </main>

      <BottomNav
        activePage={activePage}
        onChange={handlePageChange}
      />
    </div>
  );
}

function formatTime(value) {
  if (!value) return "—";
  return value.slice(0, 5);
}

function tournamentStartTimestamp(tournament) {
  if (
    !tournament?.tournament_date ||
    !tournament?.scheduled_start_time
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(
    `${tournament.tournament_date}T${tournament.scheduled_start_time.slice(
      0,
      8
    )}+06:00`
  ).getTime();
}

function isRegistrationOpen(tournament, now) {
  if (
    !tournament ||
    tournament.status !== "REGISTRATION"
  ) {
    return false;
  }

  const start = tournamentStartTimestamp(tournament);

  if (!Number.isFinite(start) || now >= start) {
    return false;
  }

  const registrationOpen =
    tournament.registration_opens_at
      ? new Date(
          tournament.registration_opens_at
        ).getTime()
      : Number.NEGATIVE_INFINITY;

  const registrationClose =
    start - 30 * 60 * 1000;

  return (
    now >= registrationOpen &&
    now < registrationClose
  );
}

function registrationCountdown(tournament, now) {
  const start = tournamentStartTimestamp(tournament);

  if (!Number.isFinite(start)) {
    return "Registration open";
  }

  const remaining = start - now;

  if (remaining > 30 * 60 * 1000) {
    return "Registration open";
  }

  if (remaining > 0) {
    return `Closes in ${formatCountdown(remaining)}`;
  }

  return "Registration closed";
}

function formatCountdown(ms) {
  const total = Math.max(
    0,
    Math.floor(ms / 1000)
  );

  const hours = Math.floor(total / 3600);

  const minutes = Math.floor(
    (total % 3600) / 60
  );

  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0b0e",
    color: "#f7f7f8",
  },

  app: {
    minHeight: "100vh",
    paddingBottom: "86px",
    background: "#0b0b0e",
    color: "#f7f7f8",
  },

  header: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "20px 18px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandKicker: {
    color: "#ff7130",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "2px",
  },

  headerTitle: {
    margin: "5px 0 0",
    fontSize: "26px",
    letterSpacing: "-.5px",
  },

  adminButton: {
    border: "1px solid #71351f",
    borderRadius: "10px",
    background: "#1b1415",
    color: "#ff9b4a",
    padding: "9px 10px",
    fontSize: "10px",
    fontWeight: "900",
  },

  notificationButton: {
    position: "relative",
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    border: "1px solid #35272a",
    background: "#151216",
    color: "#ff9b4a",
  },

  bell: {
    fontSize: "25px",
    lineHeight: 1,
  },

  notificationDot: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    minWidth: "18px",
    height: "18px",
    padding: "0 4px",
    borderRadius: "9px",
    background: "#ef3f31",
    color: "#fff",
    fontSize: "9px",
    fontWeight: "900",
    display: "grid",
    placeItems: "center",
  },

  main: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "0 18px 30px",
  },

  walletCard: {
    padding: "18px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #241613, #141114)",
    border: "1px solid #5a2a20",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "24px",
  },

  cardKicker: {
    color: "#a59b9b",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.4px",
  },

  balance: {
    marginTop: "6px",
    fontSize: "27px",
    fontWeight: "900",
    color: "#ffc064",
  },

  walletButton: {
    border: "1px solid #71351f",
    borderRadius: "11px",
    background: "#261714",
    color: "#ff9b4a",
    padding: "10px 13px",
    fontWeight: "800",
  },

  section: {
    marginBottom: "25px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "13px",
  },

  sectionKicker: {
    color: "#ff7130",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.8px",
  },

  sectionTitle: {
    margin: "4px 0 0",
    fontSize: "19px",
  },

  brBadge: {
    padding: "6px 8px",
    borderRadius: "8px",
    background: "#241719",
    color: "#ff8964",
    fontSize: "9px",
    fontWeight: "900",
  },

  modeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },

  matchCard: {
    padding: "13px",
    borderRadius: "17px",
    background: "#121216",
    border: "1px solid #29272b",
    minWidth: 0,
  },

  matchTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "5px",
  },

  modeBadge: {
    padding: "5px 7px",
    borderRadius: "7px",
    background: "#311919",
    color: "#ff795f",
    fontSize: "9px",
    fontWeight: "900",
  },

  openBadge: {
    color: "#77e39b",
    fontSize: "8px",
    fontWeight: "900",
  },

  matchTime: {
    marginTop: "13px",
    fontSize: "20px",
    fontWeight: "900",
  },

  matchMeta: {
    marginTop: "7px",
    color: "#88868c",
    fontSize: "10px",
  },

  countdown: {
    marginTop: "10px",
    color: "#ffad68",
    fontSize: "9px",
    fontWeight: "800",
    minHeight: "14px",
  },

  joinButton: {
    width: "100%",
    marginTop: "11px",
    padding: "10px 6px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #ff7a2f, #e94231)",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "900",
  },

  noMatch: {
    marginTop: "15px",
    color: "#77757c",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  liveCard: {
    padding: "17px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, #241416, #151216)",
    border: "1px solid #61302b",
  },

  liveBadge: {
    color: "#ff6b52",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  liveTitle: {
    margin: "7px 0 0",
    fontSize: "18px",
  },

  liveText: {
    margin: "7px 0 13px",
    color: "#96939a",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  liveButton: {
    width: "100%",
    padding: "11px",
    border: "1px solid #753021",
    borderRadius: "10px",
    background: "#281714",
    color: "#ff9e63",
    fontWeight: "800",
  },

  emptyLive: {
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #29272b",
    background: "#111115",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#b7b4bb",
  },

  emptyLiveIcon: {
    color: "#ff7130",
    fontSize: "22px",
  },

  statusCard: {
    padding: "16px",
    borderRadius: "15px",
    background: "#121216",
    border: "1px solid #29272b",
    color: "#8f8c93",
    fontSize: "12px",
  },
};
