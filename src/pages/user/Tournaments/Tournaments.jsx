import React, { useEffect, useMemo, useState } from "react";
import { useTournaments } from "../../../hooks/useTournaments.js";
import TournamentDetails from "./TournamentDetails.jsx";

const FILTERS = ["ALL", "SOLO", "DUO", "SQUAD"];

export default function Tournaments() {
  const { tournaments, loading, error } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const byMode = filter === "ALL"
      ? tournaments
      : tournaments.filter((tournament) => tournament.mode === filter);

    return [...byMode].sort((a, b) => {
      const aFinished = isFinishedForDisplay(a, now);
      const bFinished = isFinishedForDisplay(b, now);
      if (aFinished !== bFinished) return aFinished ? 1 : -1;

      const dateCompare = String(a.tournament_date).localeCompare(String(b.tournament_date));
      if (dateCompare !== 0) return dateCompare;

      return Number(a.slot_id) - Number(b.slot_id);
    });
  }, [tournaments, filter, now]);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  const upcoming = filtered.filter((tournament) =>
    tournament.tournament_date === today &&
    !isFinishedForDisplay(tournament, now)
  );

  const lowerSection = filtered.filter((tournament) =>
    !(
      tournament.tournament_date === today &&
      !isFinishedForDisplay(tournament, now)
    )
  );

  if (selectedTournament) {
    return (
      <TournamentDetails
        tournament={selectedTournament}
        onBack={() => setSelectedTournament(null)}
      />
    );
  }

  const renderCard = (tournament) => {
    const finished = isFinishedForDisplay(tournament, now);
    const live = tournament.status === "STARTED" && !finished;
    const mode = String(tournament.mode || "").toUpperCase();

    return (
      <article
        key={tournament.id}
        className={`tournament-card ${finished ? "is-finished" : ""} ${live ? "is-live" : ""}`}
        style={styles.card}
      >
        <div style={styles.cardGlow} />
        <div style={styles.poster}>
          <HeroArt mode={mode} />
          <div style={styles.posterShade} />
          <div style={styles.posterLabel}>
            <span style={styles.posterKicker}>BATTLE ROYALE</span>
            <strong>{mode}</strong>
            <span style={styles.posterSeason}>DAILY MATCH</span>
          </div>
          {live && <div style={styles.posterLive}>● LIVE</div>}
        </div>
        <div style={styles.cardContent}>
          <div style={styles.cardTop}>
          <div style={styles.cardIdentity}>
            <div style={styles.modeRow}>
              <span style={styles.modeBadge}><span style={styles.modeDot} />{mode}</span>
              {live && <span style={styles.livePill}>● LIVE NOW</span>}
            </div>
            <h2 style={styles.time}>{formatTime(tournament.scheduled_start_time)}</h2>
            <span style={styles.date}>{formatDateDDMMYYYY(tournament.tournament_date)}</span>
          </div>
          <div style={styles.headerStatus}>
            <span style={statusStyle(tournament.status)}>{displayStatus(tournament, now)}</span>
            <strong style={styles.capacityMini}>{tournament.playerCount ?? 0}/{tournament.max_players}</strong>
            <span style={styles.neededMini}>
              {Math.max(0, Number(tournament.max_players) - Number(tournament.playerCount ?? 0))} slots left
            </span>
            {tournament.mode !== "SOLO" && (
              <span style={styles.teamMini}>{tournament.teamCount ?? 0}/{tournament.max_teams} teams</span>
            )}
          </div>
        </div>

        </div>
        <div style={styles.divider} />

        <div style={styles.stats}>
          <Stat label="ENTRY FEE" value={`৳${Number(tournament.entry_fee).toFixed(0)}`} accent />
          <Stat label="1ST PRIZE" value={`৳${Number(tournament.first_prize).toFixed(0)}`} />
          <Stat label="PER KILL" value={`৳${Number(tournament.kill_reward).toFixed(0)}`} />
        </div>

        <div style={styles.actionRow}>
          <div style={styles.countdownBlock}>
            <span style={styles.countdownLabel}>{finished ? "NEXT REGISTRATION" : live ? "MATCH STATUS" : "REGISTRATION"}</span>
            {finished &&
            Number.isFinite(nextRegistrationOpenTimestamp(tournament)) &&
            now < nextRegistrationOpenTimestamp(tournament) &&
            tournament.nextRegistrationTournament?.tournament_date ? (
              <div style={styles.reRegistrationInfo}>
                <span style={styles.nextRegistrationDate}>
                  {formatDateDDMMYYYY(tournament.nextRegistrationTournament.tournament_date)}
                </span>
                <span style={styles.openAgain}>
                  Opens in {formatCountdown(nextRegistrationOpenTimestamp(tournament) - now)}
                </span>
              </div>
            ) : (
              <span style={{ ...styles.countdown, ...(live ? styles.countdownLive : {}), ...(finished ? styles.countdownFinished : {}) }}>
                {registrationLabel(tournament, now)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedTournament(tournament)}
            style={{ ...styles.joinButton, ...(finished ? styles.viewButton : {}), ...(live ? styles.liveButton : {}) }}
          >
            <span>{tournament.status === "REGISTRATION" && !finished ? "VIEW & JOIN" : "VIEW TOURNAMENT"}</span>
            <span style={styles.buttonArrow}>›</span>
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="tournaments-page" style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerCopy}>
          <div style={styles.kicker}><span style={styles.kickerLine} /> FREE FIRE • BATTLE ROYALE</div>
          <h1 style={styles.title}>Tournaments</h1>
          <p style={styles.subtitle}>Choose your battle. Play hard. Win rewards.</p>
        </div>
        <div style={styles.brBadge}><span style={styles.brTiny}>BR</span><span>ONLY</span></div>
      </div>

      <div style={styles.filters}>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`tournament-filter ${filter === item ? "is-active" : ""}`}
            onClick={() => setFilter(item)}
            style={{ ...styles.filterButton, ...(filter === item ? styles.filterActive : null) }}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && <div style={styles.statusCard}>Loading tournaments...</div>}
      {error && <div style={styles.errorCard}>Unable to load tournaments right now. Please refresh once.</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>◈</div>
          <h2 style={styles.emptyTitle}>No upcoming tournaments</h2>
          <p style={styles.emptyText}>New daily Battle Royale slots are generated automatically.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {upcoming.length > 0 && (
            <>
              <h2 style={styles.sectionTitle}>Upcoming Tournaments</h2>
              <div style={styles.list}>{upcoming.map(renderCard)}</div>
            </>
          )}

          {lowerSection.length > 0 && (
            <>
              <h2 style={{ ...styles.sectionTitle, marginTop: "26px" }}>
                Completed & Next Registration
              </h2>
              <div style={styles.list}>{lowerSection.map(renderCard)}</div>
            </>
          )}
        </>
      )}
    </main>
  );
}

function HeroArt({ mode }) {
  const count = mode === "SOLO" ? 1 : mode === "DUO" ? 2 : 4;
  const positions = count === 1
    ? [{ x: 105, scale: 1.16 }]
    : count === 2
      ? [{ x: 78, scale: 0.98 }, { x: 132, scale: 1.02 }]
      : [{ x: 55, scale: 0.78 }, { x: 90, scale: 0.92 }, { x: 122, scale: 0.92 }, { x: 157, scale: 0.78 }];

  return (
    <div style={styles.heroArt} aria-hidden="true">
      <svg viewBox="0 0 210 112" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`heroBg-${mode}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#27120f" />
            <stop offset=".55" stopColor="#121116" />
            <stop offset="1" stopColor="#09090b" />
          </linearGradient>
          <radialGradient id={`heroGlow-${mode}`}>
            <stop offset="0" stopColor="#ff7a36" stopOpacity=".46" />
            <stop offset="1" stopColor="#ff3d24" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`heroArmor-${mode}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f7b26b" />
            <stop offset=".45" stopColor="#e64d32" />
            <stop offset="1" stopColor="#701f26" />
          </linearGradient>
        </defs>
        <rect width="210" height="112" fill={`url(#heroBg-${mode})`} />
        <circle cx="160" cy="35" r="58" fill={`url(#heroGlow-${mode})`} />
        <path d="M0 94 Q70 60 126 91 T210 76 V112 H0Z" fill="#0b0b0e" />
        {positions.map((p, i) => (
          <g key={i} transform={`translate(${p.x} 4) scale(${p.scale})`}>
            <circle cx="0" cy="18" r="11" fill="#17151a" stroke="#ff7741" strokeWidth="1.2" />
            <path d="M-8 16 Q0 5 8 16 L6 23 Q0 27 -6 23Z" fill="#0a0a0d" />
            <path d="M-17 42 Q-12 29 0 28 Q12 29 17 42 L13 70 L-13 70Z" fill={`url(#heroArmor-${mode})`} stroke="#ff7540" strokeWidth="1" />
            <path d="M-11 35 L-22 55 L-16 58 L-5 43 M11 35 L22 53 L16 58 L5 43" fill="#242127" stroke="#ff6338" strokeWidth=".9" />
            <path d="M-12 70 L-17 99 L-5 99 L0 72 L5 99 L17 99 L12 70Z" fill="#17161c" stroke="#9b3a2e" strokeWidth=".8" />
            <path d="M-6 42 L6 42 L9 62 L0 68 L-9 62Z" fill="#f2a45f" opacity=".45" />
          </g>
        ))}
        <path d="M12 88 H198" stroke="#ff6338" strokeOpacity=".38" />
        <path d="M20 92 H118" stroke="#fff" strokeOpacity=".08" />
      </svg>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ ...styles.stat, ...(accent ? styles.statAccent : {}) }}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

function tournamentStartTimestamp(tournament) {
  if (!tournament?.tournament_date || !tournament?.scheduled_start_time) return Number.POSITIVE_INFINITY;
  return new Date(`${tournament.tournament_date}T${String(tournament.scheduled_start_time).slice(0, 8)}+06:00`).getTime();
}

function formatTime(value) {
  if (!value) return "—";
  const [hourText, minuteText] = String(value).slice(0, 5).split(":");
  let hour = Number(hourText);
  const minute = minuteText || "00";
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

function isFinishedForDisplay(tournament, now) {
  if (!tournament) return false;
  if (tournament.status === "COMPLETED" || tournament.status === "CANCELLED") {
    return true;
  }

  const end = tournamentEndTimestamp(tournament);
  return Number.isFinite(end) && now >= end;
}

function displayStatus(tournament, now) {
  if (tournament.status === "CANCELLED") return "CANCELLED";
  if (isFinishedForDisplay(tournament, now)) return "COMPLETED";
  if (tournament.status === "STARTED") return "LIVE";
  if (tournament.status === "REGISTRATION") return "OPEN";
  return tournament.status;
}

function tournamentEndTimestamp(tournament) {
  if (!tournament?.tournament_date || !tournament?.scheduled_end_time) {
    return Number.POSITIVE_INFINITY;
  }

  const start = tournamentStartTimestamp(tournament);
  const end = new Date(
    `${tournament.tournament_date}T${String(tournament.scheduled_end_time).slice(0, 8)}+06:00`
  ).getTime();

  // The final 11:30 PM slot can end after midnight. In that case the
  // end time belongs to the following day, not earlier on the same day.
  if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
    return end + 24 * 60 * 60 * 1000;
  }

  return end;
}

function nextRegistrationOpenTimestamp(tournament) {
  // A completed slot may show a countdown only when the actual next-day
  // tournament exists and is enabled. If Admin turned that next-day slot
  // OFF, there is no next registration cycle to advertise.
  const nextTournament = tournament?.nextRegistrationTournament;

  if (!nextTournament?.is_enabled) {
    return Number.POSITIVE_INFINITY;
  }

  if (!nextTournament.registration_opens_at) {
    return Number.POSITIVE_INFINITY;
  }

  const nextOpen = new Date(
    nextTournament.registration_opens_at
  ).getTime();

  return Number.isFinite(nextOpen)
    ? nextOpen
    : Number.POSITIVE_INFINITY;
}

function registrationLabel(tournament, now) {
  if (tournament.status === "CANCELLED") return "CANCELLED";

  if (isFinishedForDisplay(tournament, now)) {
    const nextOpen = nextRegistrationOpenTimestamp(tournament);

    if (Number.isFinite(nextOpen) && now < nextOpen) {
      const nextDate = tournament.nextRegistrationTournament?.tournament_date;
      return nextDate
        ? `Registration opens again in ${formatCountdown(nextOpen - now)} • Next Registration: ${nextDate}`
        : `Registration opens again in ${formatCountdown(nextOpen - now)}`;
    }

    // Do not claim that this completed slot is reopening. The next
    // registration belongs to the separate next-day tournament instance.
    if (!Number.isFinite(nextOpen)) {
      return "COMPLETED";
    }

    return "Registration Open";
  }

  if (tournament.status !== "REGISTRATION") {
    return tournament.status.replace("_", " ");
  }

  const registrationOpen = tournament.registration_opens_at
    ? new Date(tournament.registration_opens_at).getTime()
    : Number.NEGATIVE_INFINITY;

  if (now < registrationOpen) return "Registration not open yet";

  const start = tournamentStartTimestamp(tournament);
  const remaining = start - 30 * 60 * 1000 - now;

  if (remaining <= 0) return "Registration closed";
  if (remaining > 30 * 60 * 1000) return "Registration open";

  return `Closes in ${formatCountdown(remaining)}`;
}

function formatDateDDMMYYYY(value) {
  if (!value) return "";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return day && month && year ? `${day}-${month}-${year}` : value;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function statusStyle(status) {
  if (status === "REGISTRATION") return { ...styles.status, background: "#162b20", color: "#7fe4a0" };
  if (status === "STARTED") return { ...styles.status, background: "#382316", color: "#ffb267" };
  return { ...styles.status, background: "#24252a", color: "#aaa9af" };
}

const styles = {
  page:{maxWidth:"780px",margin:"0 auto",padding:"0 14px 42px",minHeight:"calc(100vh - 80px)",background:"radial-gradient(circle at 85% 0%,rgba(255,82,28,.13),transparent 28%),radial-gradient(circle at 0% 38%,rgba(205,32,32,.08),transparent 25%)"},
  header:{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",margin:"0 -14px",padding:"22px 18px 20px",overflow:"hidden",borderBottom:"1px solid #292328",background:"linear-gradient(135deg,#171012 0%,#0c0c10 58%,#120d0e 100%)"},
  headerCopy:{position:"relative",zIndex:1},
  kicker:{display:"flex",alignItems:"center",gap:"7px",color:"#ff7134",fontSize:"8px",fontWeight:"950",letterSpacing:"1.5px"},
  kickerLine:{width:"17px",height:"2px",borderRadius:"3px",background:"#ff7134",boxShadow:"0 0 10px rgba(255,113,52,.55)"},
  title:{margin:"7px 0 0",fontSize:"32px",lineHeight:1,fontWeight:"950",letterSpacing:"-1.2px"},
  subtitle:{margin:"8px 0 0",color:"#77727a",fontSize:"9px",fontWeight:"700"},
  brBadge:{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:"5px",flexShrink:0,padding:"7px 9px",border:"1px solid #663025",borderRadius:"9px",background:"rgba(38,19,19,.9)",color:"#ff9360",fontSize:"8px",fontWeight:"950",letterSpacing:".6px",boxShadow:"0 0 24px rgba(245,73,35,.08)"},
  brTiny:{display:"grid",placeItems:"center",width:"19px",height:"19px",borderRadius:"6px",background:"linear-gradient(135deg,#ff8b3d,#d63b31)",color:"#fff",fontSize:"7px"},
  filters:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:"5px",marginTop:"12px",padding:"5px",borderRadius:"14px",background:"rgba(14,14,18,.96)",border:"1px solid #29272d",boxShadow:"0 10px 26px rgba(0,0,0,.28)"},
  filterButton:{border:"1px solid transparent",borderRadius:"10px",background:"transparent",color:"#77737b",padding:"10px 4px",fontSize:"9px",fontWeight:"950",letterSpacing:".5px"},
  filterActive:{background:"linear-gradient(135deg,#4a211b,#2a1718)",borderColor:"#683126",color:"#ff9b5c",boxShadow:"0 0 18px rgba(255,91,39,.08),inset 0 0 14px rgba(255,91,39,.05)"},
  sectionTitle:{margin:"19px 0 10px",paddingLeft:"8px",borderLeft:"3px solid #ff6931",fontSize:"15px",lineHeight:1,fontWeight:"950",color:"#f0ecef",letterSpacing:"-.2px"},
  list:{display:"grid",gap:"12px"},
  card:{position:"relative",overflow:"hidden",padding:"15px",borderRadius:"18px",background:"linear-gradient(145deg,rgba(27,22,25,.99) 0%,rgba(14,14,18,.99) 72%)",border:"1px solid #342d32",boxShadow:"0 12px 30px rgba(0,0,0,.28)"},
  cardGlow:{position:"absolute",top:"-65px",right:"-45px",width:"150px",height:"150px",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,80,32,.12),transparent 66%)",pointerEvents:"none"},
  poster:{position:"relative",height:"132px",margin:"-15px -15px 13px",overflow:"hidden",background:"#0b0b0e",borderBottom:"1px solid #3b2b2d"},
  heroArt:{position:"absolute",inset:0},
  posterShade:{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(7,7,9,.18),rgba(7,7,9,.05) 45%,rgba(7,7,9,.74) 100%),linear-gradient(0deg,rgba(7,7,9,.72),transparent 58%)"},
  posterLabel:{position:"absolute",left:"13px",bottom:"12px",display:"flex",flexDirection:"column",alignItems:"flex-start",textShadow:"0 2px 10px rgba(0,0,0,.8)"},
  posterKicker:{color:"#ff8c55",fontSize:"6px",fontWeight:"950",letterSpacing:"1.4px"},
  posterLabelStrong:{},
  posterSeason:{marginTop:"2px",color:"#b7a9a9",fontSize:"6px",fontWeight:"850",letterSpacing:"1px"},
  posterLive:{position:"absolute",top:"10px",right:"11px",padding:"5px 8px",borderRadius:"7px",background:"rgba(68,24,18,.9)",border:"1px solid #a34a30",color:"#ffb16e",fontSize:"7px",fontWeight:"950"},
  cardContent:{position:"relative",zIndex:1},
  cardTop:{position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"start",gap:"12px"},
  cardIdentity:{minWidth:0},
  modeRow:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:"6px"},
  modeBadge:{display:"inline-flex",alignItems:"center",gap:"6px",padding:"6px 9px",borderRadius:"7px",background:"linear-gradient(135deg,#3b1b19,#241619)",border:"1px solid #5a2925",color:"#ff886c",fontSize:"8px",fontWeight:"950",letterSpacing:".8px"},
  modeDot:{width:"5px",height:"5px",borderRadius:"50%",background:"#ff7548",boxShadow:"0 0 8px rgba(255,117,72,.7)"},
  livePill:{padding:"5px 7px",borderRadius:"6px",background:"#3a2118",color:"#ffae68",fontSize:"7px",fontWeight:"950",letterSpacing:".5px"},
  time:{margin:"10px 0 2px",fontSize:"26px",lineHeight:1,fontWeight:"950",letterSpacing:"-.8px",textShadow:"0 2px 16px rgba(0,0,0,.35)"},
  date:{color:"#77727b",fontSize:"9px",fontWeight:"750"},
  headerStatus:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"4px",minWidth:"104px",paddingTop:"1px"},
  status:{padding:"5px 8px",borderRadius:"7px",fontSize:"7px",fontWeight:"950",letterSpacing:".5px",whiteSpace:"nowrap",border:"1px solid transparent"},
  capacityMini:{color:"#eee9ee",fontSize:"12px",fontWeight:"950"},
  neededMini:{color:"#716d75",fontSize:"7px",whiteSpace:"nowrap"},
  teamMini:{color:"#77727b",fontSize:"7px",whiteSpace:"nowrap"},
  divider:{height:"1px",margin:"13px 0 10px",background:"linear-gradient(90deg,#322c31,rgba(50,44,49,.2),transparent)"},
  stats:{position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"7px"},
  stat:{minWidth:0,padding:"9px 9px 10px",borderRadius:"10px",background:"linear-gradient(145deg,#1b1a1f,#151519)",border:"1px solid #29272d"},
  statAccent:{borderColor:"#583025",background:"linear-gradient(145deg,#241918,#171519)"},
  statLabel:{display:"block",color:"#68646d",fontSize:"6px",fontWeight:"950",letterSpacing:".85px"},
  statValue:{display:"block",marginTop:"4px",color:"#f0ebef",fontSize:"12px",fontWeight:"950"},
  actionRow:{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",marginTop:"11px"},
  countdownBlock:{minWidth:0,display:"flex",flexDirection:"column",gap:"3px"},
  countdownLabel:{color:"#5f5b63",fontSize:"6px",fontWeight:"950",letterSpacing:".9px"},
  countdown:{color:"#aaa5ad",fontSize:"9px",lineHeight:1.3,fontWeight:"850"},
  countdownLive:{color:"#ffb267"},
  countdownFinished:{color:"#918b94"},
  reRegistrationInfo:{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:"2px",fontSize:"9px",lineHeight:1.2},
  nextRegistrationDate:{color:"#ddd8df",fontWeight:"950"},
  openAgain:{color:"#ffad68",fontWeight:"850"},
  joinButton:{flexShrink:0,minWidth:"136px",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",padding:"11px",border:"1px solid rgba(255,170,88,.25)",borderRadius:"10px",background:"linear-gradient(135deg,#ff9e47 0%,#ff7132 52%,#d94232 100%)",color:"#fff",fontSize:"8px",fontWeight:"950",letterSpacing:".4px",boxShadow:"0 8px 20px rgba(238,70,39,.2)"},
  buttonArrow:{fontSize:"16px",lineHeight:"8px",marginTop:"-1px"},
  viewButton:{background:"linear-gradient(145deg,#26242a,#1b1a1f)",borderColor:"#37333a",color:"#bcb7c0",boxShadow:"none"},
  liveButton:{background:"linear-gradient(135deg,#ffae50,#df4c35)"},
  statusCard:{marginTop:"14px",padding:"17px",borderRadius:"15px",background:"#121216",border:"1px solid #29272d",color:"#908b94",fontSize:"11px"},
  errorCard:{marginTop:"14px",padding:"17px",borderRadius:"15px",background:"#2b1518",border:"1px solid #713038",color:"#ffaaa8",fontSize:"11px"},
  emptyCard:{marginTop:"14px",padding:"42px 20px",borderRadius:"19px",background:"linear-gradient(145deg,#17161b,#111115)",border:"1px solid #29272d",textAlign:"center"},
  emptyIcon:{color:"#ff7130",fontSize:"26px",marginBottom:"9px"},
  emptyTitle:{margin:"0 0 7px",fontSize:"18px",fontWeight:"950"},
  emptyText:{margin:0,color:"#87828b",fontSize:"11px",lineHeight:1.5},
};