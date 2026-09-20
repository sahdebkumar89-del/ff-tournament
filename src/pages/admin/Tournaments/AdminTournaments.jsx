import React, { useEffect, useState } from "react";
import AdminWallet from "../Wallet/AdminWallet.jsx";
import AdminResults from "../Results/AdminResults.jsx";
import AdminNotifications from "../Notifications/AdminNotifications.jsx";
import { supabase } from "../../../lib/supabase/client.js";

export default function AdminTournaments({ onBack }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  const [roomTournamentId, setRoomTournamentId] =
    useState(null);

  const [roomLoading, setRoomLoading] =
    useState(false);

  const [roomSaving, setRoomSaving] =
    useState(false);

  const [roomReleasing, setRoomReleasing] =
    useState(false);

  const [room, setRoom] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] =
    useState("");

  const [showWallet, setShowWallet] =
    useState(false);

  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    mode: "SOLO",
    tournamentDate: "",
    startTime: "09:00",
  });

  async function loadTournaments() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("tournament_date", {
        ascending: true,
      })
      .order("scheduled_start_time", {
        ascending: true,
      });

    if (error) {
      setMessage(error.message);
      setTournaments([]);
    } else {
      setTournaments(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  async function createTournament() {
    if (!createForm.tournamentDate || !createForm.startTime) {
      setMessage("Tournament date and start time are required.");
      return;
    }

    setBusyId("create");
    setMessage("");

    const { error } = await supabase.rpc("admin_create_tournament", {
      p_mode: createForm.mode,
      p_tournament_date: createForm.tournamentDate,
      p_scheduled_start_time: createForm.startTime,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Tournament created with the approved mode preset.");
      setShowCreate(false);
      await loadTournaments();
    }

    setBusyId(null);
  }

  async function toggleTournament(tournament) {
    const nextEnabled = tournament.is_enabled === false;
    const action = nextEnabled ? "enable" : "disable";
    if (!window.confirm(`Are you sure you want to ${action} this tournament?`)) return;

    setBusyId(tournament.id);
    setMessage("");

    const { error } = await supabase.rpc("admin_set_tournament_enabled", {
      p_tournament_id: tournament.id,
      p_enabled: nextEnabled,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(nextEnabled ? "Tournament enabled." : "Tournament disabled.");
      await loadTournaments();
    }

    setBusyId(null);
  }

  async function cancelTournament(tournament) {
    const reason = window.prompt(
      "Cancellation reason is required:",
      ""
    );

    if (!reason?.trim()) return;

    const confirmed = window.confirm(
      `Cancel Tournament #${tournament.id} and automatically refund valid participants?`
    );

    if (!confirmed) return;

    setBusyId(tournament.id);
    setMessage("");

    const { error } = await supabase.rpc("admin_cancel_tournament", {
      p_tournament_id: tournament.id,
      p_reason: reason.trim(),
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Tournament cancelled and eligible refunds processed.");
      await loadTournaments();
    }

    setBusyId(null);
  }

  async function startTournament(tournament) {
    const confirmed = window.confirm(
      "Tournament is not full. Are you sure you want to start this tournament?"
    );

    if (!confirmed) return;

    setBusyId(tournament.id);
    setMessage("");

    const { error } = await supabase.rpc(
      "admin_start_tournament",
      {
        p_tournament_id: tournament.id,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Tournament started successfully."
      );

      await loadTournaments();
    }

    setBusyId(null);
  }

  async function openRoomManager(tournamentId) {
    setRoomTournamentId(tournamentId);
    setRoomLoading(true);
    setRoom(null);
    setRoomId("");
    setRoomPassword("");
    setMessage("");

    const { data, error } = await supabase.rpc(
      "admin_get_tournament_room",
      {
        p_tournament_id: tournamentId,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      const row = Array.isArray(data)
        ? data[0]
        : data;

      setRoom(row || null);
      setRoomId(row?.room_id || "");
      setRoomPassword(
        row?.room_password || ""
      );
    }

    setRoomLoading(false);
  }

  async function saveRoom() {
    if (!roomTournamentId) return;

    if (!roomId.trim() || !roomPassword.trim()) {
      setMessage(
        "Room ID and password are required."
      );
      return;
    }

    setRoomSaving(true);
    setMessage("");

    const { error } = await supabase.rpc(
      "admin_upsert_tournament_room",
      {
        p_tournament_id: roomTournamentId,
        p_room_id: roomId.trim(),
        p_room_password: roomPassword.trim(),
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Room credentials saved.");

      await openRoomManager(
        roomTournamentId
      );
    }

    setRoomSaving(false);
  }

  async function releaseRoom() {
    if (!roomTournamentId) return;

    const confirmed = window.confirm(
      "Release the room credentials to joined players now?"
    );

    if (!confirmed) return;

    setRoomReleasing(true);
    setMessage("");

    const { error } = await supabase.rpc(
      "admin_release_tournament_room",
      {
        p_tournament_id: roomTournamentId,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Room credentials released to joined players."
      );

      await openRoomManager(
        roomTournamentId
      );
    }

    setRoomReleasing(false);
  }

  function scheduledStart(tournament) {
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

  function canManualStart(tournament) {
    if (
      !["REGISTRATION", "FULL"].includes(
        tournament.status
      )
    ) {
      return false;
    }

    return Date.now() >= scheduledStart(tournament);
  }

  if (showWallet) {
    return (
      <AdminWallet
        onBack={() => setShowWallet(false)}
      />
    );
  }

  if (showResults) {
    return (
      <AdminResults
        onBack={() => setShowResults(false)}
      />
    );
  }

  if (showNotifications) {
    return (
      <AdminNotifications
        onBack={() => setShowNotifications(false)}
      />
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>
            ADMIN PANEL
          </div>

          <h1 style={styles.title}>
            Tournament Control
          </h1>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            style={styles.walletButton}
          >
            {showCreate ? "Close Create" : "Create"}
          </button>

          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            style={styles.walletButton}
          >
            Notifications
          </button>

          <button
            type="button"
            onClick={() => setShowResults(true)}
            style={styles.walletButton}
          >
            Results
          </button>

          <button
            type="button"
            onClick={() => setShowWallet(true)}
            style={styles.walletButton}
          >
            Wallet
          </button>

          <button
            type="button"
            onClick={onBack}
            style={styles.backButton}
          >
            User App
          </button>
        </div>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {showCreate && (
        <section style={styles.createPanel}>
          <div style={styles.roomKicker}>CREATE TOURNAMENT</div>
          <h2 style={styles.createTitle}>New BR Tournament</h2>

          <label style={styles.label}>
            Mode
            <select
              value={createForm.mode}
              onChange={(event) =>
                setCreateForm((value) => ({
                  ...value,
                  mode: event.target.value,
                }))
              }
              style={styles.input}
            >
              <option value="SOLO">SOLO</option>
              <option value="DUO">DUO</option>
              <option value="SQUAD">SQUAD</option>
            </select>
          </label>

          <label style={styles.label}>
            Tournament date
            <input
              type="date"
              value={createForm.tournamentDate}
              onChange={(event) =>
                setCreateForm((value) => ({
                  ...value,
                  tournamentDate: event.target.value,
                }))
              }
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Start time
            <input
              type="time"
              step="1800"
              value={createForm.startTime}
              onChange={(event) =>
                setCreateForm((value) => ({
                  ...value,
                  startTime: event.target.value,
                }))
              }
              style={styles.input}
            />
          </label>

          <div style={styles.createNote}>
            Approved entry fees, prizes, kill reward and capacity are used automatically from the selected mode preset.
          </div>

          <button
            type="button"
            disabled={busyId === "create"}
            onClick={createTournament}
            style={styles.startButton}
          >
            {busyId === "create" ? "Creating..." : "Create Tournament"}
          </button>
        </section>
      )}

      {loading ? (
        <div style={styles.empty}>
          Loading tournaments...
        </div>
      ) : tournaments.length === 0 ? (
        <div style={styles.empty}>
          No tournaments available.
        </div>
      ) : (
        <div style={styles.list}>
          {tournaments.map((tournament) => (
            <article
              key={tournament.id}
              style={styles.card}
            >
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.mode}>
                    {tournament.mode}
                  </span>

                  <h2 style={styles.cardTitle}>
                    Tournament #{tournament.id}
                  </h2>
                </div>

                <span
                  style={statusStyle(
                    tournament.status
                  )}
                >
                  {tournament.status}
                </span>
              </div>

              <div style={styles.meta}>
                <span>
                  {tournament.tournament_date}
                </span>

                <span>
                  {tournament.scheduled_start_time?.slice(
                    0,
                    5
                  )}
                </span>

                <span>
                  Capacity{" "}
                  {tournament.max_players}
                </span>
              </div>

              <div style={styles.adminCardActions}>
                <button
                  type="button"
                  disabled={busyId === tournament.id}
                  onClick={() => toggleTournament(tournament)}
                  style={styles.roomButton}
                >
                  {tournament.is_enabled === false ? "Enable Tournament" : "Disable Tournament"}
                </button>

                <button
                  type="button"
                  onClick={() => openRoomManager(tournament.id)}
                  style={styles.roomButton}
                >
                  Manage Room
                </button>
              </div>

              {canManualStart(tournament) && (
                <button
                  type="button"
                  disabled={
                    busyId === tournament.id
                  }
                  onClick={() =>
                    startTournament(
                      tournament
                    )
                  }
                  style={styles.startButton}
                >
                  {busyId === tournament.id
                    ? "Starting..."
                    : "Start Tournament"}
                </button>
              )}

              {["REGISTRATION", "FULL"].includes(tournament.status) && (
                <button
                  type="button"
                  disabled={busyId === tournament.id}
                  onClick={() => cancelTournament(tournament)}
                  style={styles.cancelButton}
                >
                  Cancel Tournament
                </button>
              )}

              {roomTournamentId ===
                tournament.id && (
                <section
                  style={styles.roomPanel}
                >
                  <div
                    style={
                      styles.roomPanelHeader
                    }
                  >
                    <div>
                      <div
                        style={
                          styles.roomKicker
                        }
                      >
                        ROOM DELIVERY
                      </div>

                      <h3
                        style={
                          styles.roomTitle
                        }
                      >
                        Room Credentials
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRoomTournamentId(
                          null
                        );
                        setRoom(null);
                      }}
                      style={styles.closeButton}
                    >
                      Close
                    </button>
                  </div>

                  {roomLoading ? (
                    <div
                      style={
                        styles.roomLoading
                      }
                    >
                      Loading room...
                    </div>
                  ) : (
                    <>
                      <label
                        style={styles.label}
                      >
                        Room ID

                        <input
                          value={roomId}
                          onChange={(event) =>
                            setRoomId(
                              event.target.value
                            )
                          }
                          placeholder="Enter Room ID"
                          style={styles.input}
                        />
                      </label>

                      <label
                        style={styles.label}
                      >
                        Password

                        <input
                          value={roomPassword}
                          onChange={(event) =>
                            setRoomPassword(
                              event.target.value
                            )
                          }
                          placeholder="Enter Room Password"
                          style={styles.input}
                        />
                      </label>

                      <div
                        style={
                          styles.roomActions
                        }
                      >
                        <button
                          type="button"
                          disabled={roomSaving}
                          onClick={saveRoom}
                          style={
                            styles.saveButton
                          }
                        >
                          {roomSaving
                            ? "Saving..."
                            : "Save Room"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            !room ||
                            roomReleasing
                          }
                          onClick={
                            releaseRoom
                          }
                          style={
                            styles.releaseButton
                          }
                        >
                          {roomReleasing
                            ? "Releasing..."
                            : "Release Now"}
                        </button>
                      </div>

                      <div
                        style={
                          styles.releaseInfo
                        }
                      >
                        {room?.released_at
                          ? `Released at ${formatReleasedAt(
                              room.released_at
                            )}`
                          : "Automatic release: 10 minutes before match when the tournament is full/started."}
                      </div>
                    </>
                  )}
                </section>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function formatReleasedAt(value) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString(
    "en-BD",
    {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dhaka",
    }
  );
}

function statusStyle(status) {
  const colors = {
    STARTED: "#ff6b52",
    COMPLETED: "#8f8b92",
    CANCELLED: "#d96b6b",
    FULL: "#ffc064",
    REGISTRATION: "#77e39b",
  };

  return {
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#1c191c",
    color:
      colors[status] || "#c7c3c8",
    fontSize: "9px",
    fontWeight: "900",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0e",
    color: "#f7f7f8",
    padding: "20px 18px 40px",
    maxWidth: "760px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  kicker: {
    color: "#ff7130",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "2px",
  },

  title: {
    margin: "5px 0 0",
    fontSize: "24px",
  },

  walletButton: {
    padding: "9px 12px",
    border: "1px solid #743021",
    borderRadius: "10px",
    background: "#291716",
    color: "#ffae6d",
    fontWeight: "900",
  },

  backButton: {
    border: "1px solid #5a2a20",
    borderRadius: "10px",
    background: "#1b1415",
    color: "#ff9b4a",
    padding: "10px 12px",
    fontWeight: "800",
  },

  message: {
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "12px",
    background: "#171417",
    border: "1px solid #3b2928",
    color: "#ffc064",
    fontSize: "12px",
  },

  list: {
    display: "grid",
    gap: "11px",
  },

  card: {
    padding: "15px",
    borderRadius: "17px",
    background: "#121216",
    border: "1px solid #29272b",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  mode: {
    color: "#ff795f",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  cardTitle: {
    margin: "5px 0 0",
    fontSize: "17px",
  },

  meta: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "11px",
    color: "#918d94",
    fontSize: "10px",
  },

  createPanel: {
    marginBottom: "16px",
    padding: "15px",
    borderRadius: "17px",
    background: "#121216",
    border: "1px solid #4d2924",
  },

  createTitle: {
    margin: "5px 0 8px",
    fontSize: "17px",
  },

  createNote: {
    marginTop: "10px",
    color: "#858087",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  adminCardActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "13px",
  },

  roomButton: {
    width: "100%",
    marginTop: "13px",
    padding: "11px",
    border: "1px solid #71351f",
    borderRadius: "10px",
    background: "#241615",
    color: "#ff9b63",
    fontWeight: "900",
  },

  cancelButton: {
    width: "100%",
    marginTop: "9px",
    padding: "11px",
    border: "1px solid #71302b",
    borderRadius: "10px",
    background: "#261516",
    color: "#ff9f91",
    fontWeight: "900",
  },

  startButton: {
    width: "100%",
    marginTop: "9px",
    padding: "11px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #ff7a2f, #e94231)",
    color: "#fff",
    fontWeight: "900",
  },

  roomPanel: {
    marginTop: "13px",
    padding: "14px",
    borderRadius: "15px",
    background: "#171315",
    border: "1px solid #4d2924",
  },

  roomPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  roomKicker: {
    color: "#ff7130",
    fontSize: "8px",
    fontWeight: "900",
    letterSpacing: "1.5px",
  },

  roomTitle: {
    margin: "4px 0 0",
    fontSize: "15px",
  },

  closeButton: {
    border: "1px solid #3b3032",
    borderRadius: "8px",
    background: "#171519",
    color: "#a8a2a8",
    padding: "7px 9px",
    fontSize: "9px",
    fontWeight: "800",
  },

  label: {
    display: "grid",
    gap: "6px",
    marginTop: "10px",
    color: "#aaa4aa",
    fontSize: "10px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #3b2c2e",
    borderRadius: "10px",
    background: "#0f0e11",
    color: "#fff",
    padding: "11px",
    outline: "none",
  },

  roomActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "12px",
  },

  saveButton: {
    padding: "11px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #ff7a2f, #e94231)",
    color: "#fff",
    fontWeight: "900",
  },

  releaseButton: {
    padding: "11px",
    border: "1px solid #743021",
    borderRadius: "10px",
    background: "#291716",
    color: "#ffae6d",
    fontWeight: "900",
  },

  releaseInfo: {
    marginTop: "10px",
    color: "#858087",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  roomLoading: {
    padding: "12px",
    color: "#8f8c93",
    fontSize: "11px",
  },

  empty: {
    padding: "18px",
    borderRadius: "15px",
    background: "#121216",
    border: "1px solid #29272b",
    color: "#8f8c93",
  },
};
