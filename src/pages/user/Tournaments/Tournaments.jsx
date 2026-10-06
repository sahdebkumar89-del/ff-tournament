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
    const list = filter === "ALL" ? tournaments : tournaments.filter((t) => String(t.mode).toUpperCase() === filter);
    return [...list].sort((a, b) => {
      const af = isFinishedForDisplay(a, now);
      const bf = isFinishedForDisplay(b, now);
      if (af !== bf) return af ? 1 : -1;
      const dc = String(a.tournament_date).localeCompare(String(b.tournament_date));
      return dc !== 0 ? dc : Number(a.slot_id) - Number(b.slot_id);
    });
  }, [tournaments, filter, now]);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  const visible = filtered.filter((t) => t.tournament_date === today && !isFinishedForDisplay(t, now));
  const finished = filtered.filter((t) => !(t.tournament_date === today && !isFinishedForDisplay(t, now)));

  const testing = visible.filter(isTestingTournament).slice(0, 3);
  const real = visible.filter((t) => !isTestingTournament(t));
  const testingFinished = finished.filter(isTestingTournament);
  const realFinished = finished.filter((t) => !isTestingTournament(t));

  if (selectedTournament) {
    return <TournamentDetails tournament={selectedTournament} onBack={() => setSelectedTournament(null)} />;
  }

  return (
    <main className="tournaments-page" style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTitle}>Tournaments</div>
        <div style={styles.ffLogo}><span>FREE</span> <b>F</b><span>RE</span></div>
      </header>

      <div style={styles.filters}>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? "tournament-filter is-active" : "tournament-filter"}
            onClick={() => setFilter(item)}
            style={{ ...styles.filterButton, ...(filter === item ? styles.filterActive : {}) }}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && <div style={styles.statusCard}>Loading tournaments...</div>}
      {error && <div style={styles.errorCard}>Unable to load tournaments right now. Please refresh once.</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={styles.emptyCard}>No tournaments available.</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {testing.length > 0 && (
            <TournamentSection
              title="TESTING TOURNAMENTS"
              subtitle="Testing চলছে — No Entry Fee • No Prize"
              type="testing"
              tournaments={testing}
              now={now}
              onSelect={setSelectedTournament}
            />
          )}

          {real.length > 0 && (
            <TournamentSection
              title="REAL TOURNAMENTS"
              subtitle="Regular prize tournaments"
              type="real"
              tournaments={real}
              now={now}
              onSelect={setSelectedTournament}
            />
          )}

          {testingFinished.length > 0 && (
            <TournamentSection
              title="TESTING TOURNAMENTS"
              subtitle="Completed & next registration"
              type="testing"
              tournaments={testingFinished}
              now={now}
              onSelect={setSelectedTournament}
              lower
            />
          )}

          {realFinished.length > 0 && (
            <TournamentSection
              title="REAL TOURNAMENTS"
              subtitle="Completed & next registration"
              type="real"
              tournaments={realFinished}
              now={now}
              onSelect={setSelectedTournament}
              lower
            />
          )}
        </>
      )}
    </main>
  );
}

function TournamentSection({ title, subtitle, type, tournaments, now, onSelect, lower }) {
  const testing = type === "testing";
  return (
    <section style={{ ...styles.section, ...(lower ? styles.lowerSection : {}) }}>
      <div style={{ ...styles.sectionBanner, ...(testing ? styles.testingBanner : styles.realBanner) }}>
        <div style={styles.sectionCopy}>
          <div style={styles.sectionTitle}>{title}</div>
          <div style={styles.sectionSubtitle}>{subtitle}</div>
        </div>
      </div>
      <div style={styles.grid}>
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} now={now} type={type} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function TournamentCard({ tournament, now, type, onSelect }) {
  const mode = String(tournament.mode || "").toUpperCase();
  const finished = isFinishedForDisplay(tournament, now);
  const testing = type === "testing";

  return (
    <article style={{ ...styles.card, ...(testing ? styles.testingCard : styles.realCard), ...(finished ? styles.finishedCard : {}) }}>
      {testing ? (
        <div style={styles.testingVisual}>
          <div style={styles.testingBadge}>TESTING</div>
          <div style={styles.testingMode}>{mode}</div>
          <div style={styles.testingSlot}>SLOT {tournament.slot_id ?? "—"}</div>
        </div>
      ) : (
        <div style={styles.realVisual}>
          <div style={styles.realVisualMode}>{mode}</div>
        </div>
      )}

      <div style={styles.cardBody}>
        <div style={styles.modeTitle}>
          <strong>{testing ? `${mode} Testing` : `${mode} Tournament`}</strong>
        </div>

        {testing ? (
          <>
            <InfoRow text="FREE ENTRY" kind="green" />
            <InfoRow text="NO PRIZE" kind="red" />
            <div style={styles.slotRow}>
              <span>START</span>
              <strong>{formatTime(tournament.scheduled_start_time)}</strong>
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Entry Fee" value={money(tournament.entry_fee)} />
            <InfoRow label="Prize" value={prizeText(tournament)} />
            <InfoRow label="Kill Reward" value={money(tournament.kill_reward)} />
          </>
        )}

        <button type="button" onClick={() => onSelect(tournament)} style={styles.actionButton}>
          {testing ? "JOIN FREE" : "VIEW TOURNAMENT"}
        </button>
      </div>
    </article>
  );
}

function InfoRow({ icon, text, label, value, kind }) {
  if (text) {
    return (
      <div style={{ ...styles.infoRow, ...(kind === "green" ? styles.greenRow : kind === "red" ? styles.redRow : styles.darkRow) }}>
        <span style={styles.infoIcon}>{icon}</span><strong>{text}</strong>
      </div>
    );
  }
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLeft}><span style={styles.detailIcon}>{icon}</span>{label}</span>
      <strong style={styles.detailValue}>{value}</strong>
    </div>
  );
}

function isTestingTournament(t) {
  return Number(t?.entry_fee || 0) === 0 && Number(t?.first_prize || 0) === 0;
}

function money(value) {
  return `৳${Number(value || 0).toFixed(0)}`;
}

function prizeText(t) {
  const values = [t.first_prize, t.second_prize, t.third_prize].filter((v) => v !== null && v !== undefined);
  if (values.length >= 3) return values.map((v) => money(v)).join(" / ");
  return money(t.first_prize);
}

function tournamentStartTimestamp(t) {
  if (!t?.tournament_date || !t?.scheduled_start_time) return Number.POSITIVE_INFINITY;
  return new Date(`${t.tournament_date}T${String(t.scheduled_start_time).slice(0, 8)}+06:00`).getTime();
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function tournamentEndTimestamp(t) {
  if (!t?.tournament_date || !t?.scheduled_end_time) return Number.POSITIVE_INFINITY;
  const start = tournamentStartTimestamp(t);
  const end = new Date(`${t.tournament_date}T${String(t.scheduled_end_time).slice(0, 8)}+06:00`).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end <= start ? end + 86400000 : end;
}

function isFinishedForDisplay(t, now) {
  if (!t) return false;
  if (t.status === "COMPLETED" || t.status === "CANCELLED") return true;
  const end = tournamentEndTimestamp(t);
  return Number.isFinite(end) && now >= end;
}

function nextRegistrationOpenTimestamp(t) {
  const next = t?.nextRegistrationTournament;
  if (!next?.is_enabled || !next.registration_opens_at) return Number.POSITIVE_INFINITY;
  const ts = new Date(next.registration_opens_at).getTime();
  return Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
}

const styles = {
  page:{maxWidth:"780px",margin:"0 auto",padding:"0 8px 32px",minHeight:"calc(100vh - 80px)",background:"#050607",color:"#f7f7f7"},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"48px 12px 16px"},
  headerTitle:{fontSize:"28px",fontWeight:"950",letterSpacing:"-.8px",whiteSpace:"nowrap"},
  ffLogo:{fontSize:"17px",fontStyle:"italic",fontWeight:"950",letterSpacing:"-1px",color:"#f7f7f7"},
  "ffLogo b":{color:"#ff9d00"},
  filters:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px",padding:"0 6px 10px"},
  filterButton:{height:"40px",border:"1px solid #34383e",borderRadius:"9px",background:"linear-gradient(#15191d,#0e1114)",color:"#aeb4c0",fontSize:"12px",fontWeight:"900"},
  filterActive:{background:"linear-gradient(135deg,#ff7a14,#ff4d12)",borderColor:"#ff8a21",color:"#111",boxShadow:"0 5px 14px rgba(255,91,20,.2)"},
  section:{marginTop:"10px"},
  lowerSection:{marginTop:"24px",paddingTop:"18px",borderTop:"1px solid #25282c"},
  sectionBanner:{position:"relative",height:"78px",display:"flex",alignItems:"center",padding:"0 16px",border:"1px solid #34383e",borderRadius:"14px"},
  testingBanner:{background:"linear-gradient(135deg,#17140b,#0d0f11)",borderColor:"#6e5a18"},
  realBanner:{background:"linear-gradient(135deg,#15100c,#0d0f11)",borderColor:"#66421a"},
  sectionCopy:{position:"relative",zIndex:3},
  sectionTitle:{fontSize:"22px",fontWeight:"950",letterSpacing:"-.4px",whiteSpace:"nowrap"},
  yellow:{color:"#ffd21f"},
  orange:{color:"#ff7418"},
  sectionSubtitle:{marginTop:"5px",fontSize:"11px",color:"#b9bdc5",fontWeight:"650"},
  bannerArt:{position:"absolute",right:"-5px",bottom:"-18px",width:"47%",height:"115px",opacity:".95",overflow:"hidden",maskImage:"linear-gradient(90deg,transparent 0%,black 42%,black 100%)"},
  bannerArtReal:{width:"49%"},
  grid:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"7px",marginTop:"10px"},
  card:{position:"relative",overflow:"hidden",borderRadius:"11px",background:"#0b0e11",border:"1px solid #3b3f43",boxShadow:"0 5px 16px rgba(0,0,0,.4)"},
  testingCard:{borderColor:"#7b6815"},
  realCard:{borderColor:"#8d5a12"},
  finishedCard:{opacity:".78"},
  testingVisual:{height:"118px",padding:"13px",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"radial-gradient(circle at 80% 20%,rgba(255,170,20,.14),transparent 42%),linear-gradient(145deg,#20180b,#0c1014)",borderBottom:"1px solid #463913"},
  testingMode:{fontSize:"25px",lineHeight:1,fontWeight:"950",letterSpacing:"1px",color:"#fff"},
  testingSlot:{fontSize:"9px",fontWeight:"900",letterSpacing:"1px",color:"#a9a39a"},
  realVisual:{height:"118px",display:"grid",placeItems:"center",background:"linear-gradient(145deg,#1a1110,#0c1014)",borderBottom:"1px solid #3c2a1b"},
  realVisualMode:{fontSize:"24px",fontWeight:"950",color:"#ff9d32"},
  testingBadge:{alignSelf:"flex-start",padding:"4px 7px",borderRadius:"5px",background:"#ffd719",color:"#111",fontSize:"9px",fontWeight:"950"},
  cardBody:{padding:"7px 6px 8px",minWidth:0},
  modeTitle:{display:"flex",alignItems:"center",gap:"5px",fontSize:"14px",fontWeight:"950",whiteSpace:"nowrap",minWidth:0},
  modeIcon:{fontSize:"19px",color:"#fff",lineHeight:1},
  infoRow:{display:"flex",alignItems:"center",gap:"7px",height:"35px",marginTop:"5px",padding:"0 8px",borderRadius:"7px",fontSize:"11px",fontWeight:"900",border:"1px solid transparent"},
  infoIcon:{fontSize:"17px",width:"20px",textAlign:"center"},
  greenRow:{background:"linear-gradient(90deg,#073b1d,#052719)",borderColor:"#08762f",color:"#f0fff3"},
  redRow:{background:"linear-gradient(90deg,#4d1117,#270b0f)",borderColor:"#d31e2e",color:"#fff0f0"},
  darkRow:{background:"linear-gradient(#24282d,#181b1f)",borderColor:"#333840",color:"#e9ebef"},
  detailRow:{display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"42px",padding:"0 2px",borderBottom:"1px solid #30343a",fontSize:"10px",minWidth:0},
  detailLeft:{display:"flex",alignItems:"center",gap:"4px",color:"#c6cad0",minWidth:0},
  detailIcon:{fontSize:"17px",color:"#fff"},
  detailValue:{color:"#ffd600",fontSize:"13px",whiteSpace:"nowrap",marginLeft:"3px"},
  actionButton:{width:"100%",height:"40px",marginTop:"8px",border:0,borderRadius:"8px",background:"linear-gradient(135deg,#ff8a18,#ff4e10)",color:"#111",fontSize:"10px",fontWeight:"950",letterSpacing:".1px",boxShadow:"0 4px 10px rgba(255,76,12,.22)",whiteSpace:"normal",lineHeight:"1.05",padding:"0 3px"},
  statusCard:{margin:"14px 6px",padding:"18px",borderRadius:"12px",background:"#101317",border:"1px solid #292d33",color:"#aeb3bb"},
  errorCard:{margin:"14px 6px",padding:"18px",borderRadius:"12px",background:"#2a1014",border:"1px solid #6d2730",color:"#ffb2b7"},
  emptyCard:{margin:"20px 6px",padding:"35px",textAlign:"center",borderRadius:"14px",background:"#101317",border:"1px solid #292d33",color:"#9ea4ad"}
};
