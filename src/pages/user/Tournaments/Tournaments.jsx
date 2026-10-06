import React, { useEffect, useMemo, useState } from "react";
import { useTournaments } from "../../../hooks/useTournaments.js";
import TournamentDetails from "./TournamentDetails.jsx";

const FILTERS = ["ALL", "SOLO", "DUO", "SQUAD"];

const CHARACTER_ART = {
  maleA: "https://cdn.imgbin.com/16/1/14/imgbin-call-of-duty-modern-warfare-3-call-of-duty-ghosts-call-of-duty-advanced-warfare-call-of-duty-wwii-call-of-duty-black-ops-soldiers-game-characters-soldier-carrying-rifle-B69th5ftVjJtXfMq5sGjYxsiV.jpg",
  femaleA: "https://staticdelivery.nexusmods.com/images/1151/32430455-1599756701.png",
  maleB: "https://3dprop.store/uploads/product_images/original/240104_14AC_webshop_color_v02_01_2000px-texture-3388.jpg",
  femaleB: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/2b0452ba-b660-467d-b111-121e4c627767/dfk6d06-f3fc7233-3064-4ac8-957e-03494ca8e44e.png/v1/fill/w_894%2Ch_894%2Cq_70%2Cstrp/call_of_duty_female_character_by_immortalxuniverse_dfk6d06-pre.jpg",
};

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

  const testing = visible.filter(isTestingTournament);
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
  return (
    <section style={{ ...styles.section, ...(lower ? styles.lowerSection : {}) }}>
      <div style={styles.sectionBanner}>
        <div style={styles.sectionIcon}>{type === "testing" ? "⚗" : "🏆"}</div>
        <div style={styles.sectionCopy}>
          <div style={styles.sectionTitle}>
            <span style={type === "testing" ? styles.yellow : styles.orange}>{type === "testing" ? "TESTING" : "REAL"}</span>{" "}
            <span>TOURNAMENTS</span>
          </div>
          <div style={styles.sectionSubtitle}>{subtitle}</div>
        </div>
        <div style={{ ...styles.bannerArt, ...(type === "real" ? styles.bannerArtReal : {}) }}>
          <img src={type === "testing" ? CHARACTER_ART.maleB : CHARACTER_ART.femaleB} alt="" />
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
  const live = tournament.status === "STARTED" && !finished;
  const testing = type === "testing";

  return (
    <article style={{ ...styles.card, ...(testing ? styles.testingCard : styles.realCard), ...(finished ? styles.finishedCard : {}) }}>
      <div style={styles.cardArtwork}>
        <HeroArt mode={mode} />
        <div style={styles.testingBadge}>{testing ? "TESTING" : ""}</div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.modeTitle}>
          <span style={styles.modeIcon}>{mode === "SOLO" ? "♟" : mode === "DUO" ? "♟♟" : "♟♟♟"}</span>
          <strong>{mode}</strong>
        </div>
        <div style={styles.tournamentName}>{testing ? "Testing Tournament" : "Tournament"}</div>

        {testing ? (
          <>
            <InfoRow icon="🎁" text="FREE ENTRY" kind="green" />
            <InfoRow icon="🏆" text="NO PRIZE" kind="red" />
            <InfoRow icon="⚗" text="Testing Only" kind="dark" />
          </>
        ) : (
          <>
            <InfoRow icon="▣" label="Entry Fee" value={money(tournament.entry_fee)} />
            <InfoRow icon="🏆" label="Prize" value={prizeText(tournament)} />
            <InfoRow icon="☠" label="Kill Reward" value={money(tournament.kill_reward)} />
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

function HeroArt({ mode }) {
  const people = mode === "SOLO"
    ? [CHARACTER_ART.maleA]
    : mode === "DUO"
      ? [CHARACTER_ART.maleA, CHARACTER_ART.femaleA]
      : [CHARACTER_ART.maleA, CHARACTER_ART.femaleA, CHARACTER_ART.maleB, CHARACTER_ART.femaleB];

  return (
    <div style={styles.heroArt}>
      {people.map((src, index) => (
        <img
          key={src + index}
          src={src}
          alt=""
          loading="lazy"
          draggable="false"
          style={{
            ...styles.character,
            ...(people.length === 1 ? styles.oneCharacter : {}),
            ...(people.length === 2 ? styles.twoCharacter : {}),
            ...(people.length === 4 ? styles.fourCharacter : {}),
            ...(index % 2 ? styles.characterAlt : {}),
          }}
        />
      ))}
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
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 12px 16px"},
  headerTitle:{fontSize:"30px",fontWeight:"950",letterSpacing:"-.8px"},
  ffLogo:{fontSize:"17px",fontStyle:"italic",fontWeight:"950",letterSpacing:"-1px",color:"#f7f7f7"},
  ffLogo b:{color:"#ff9d00"},
  filters:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px",padding:"0 6px 10px"},
  filterButton:{height:"40px",border:"1px solid #34383e",borderRadius:"9px",background:"linear-gradient(#15191d,#0e1114)",color:"#aeb4c0",fontSize:"12px",fontWeight:"900"},
  filterActive:{background:"linear-gradient(135deg,#ff7a14,#ff4d12)",borderColor:"#ff8a21",color:"#111",boxShadow:"0 5px 14px rgba(255,91,20,.2)"},
  section:{marginTop:"10px"},
  lowerSection:{marginTop:"24px",paddingTop:"18px",borderTop:"1px solid #25282c"},
  sectionBanner:{position:"relative",height:"88px",overflow:"hidden",display:"flex",alignItems:"center",gap:"12px",padding:"0 15px",border:"1px solid #34383e",borderRadius:"14px",background:"linear-gradient(90deg,#0b0d10,#11151a 55%,#14100e)"},
  sectionIcon:{position:"relative",zIndex:2,fontSize:"31px",color:"#ff9f00",filter:"drop-shadow(0 2px 5px rgba(255,145,0,.25))"},
  sectionCopy:{position:"relative",zIndex:3},
  sectionTitle:{fontSize:"22px",fontWeight:"950",letterSpacing:"-.4px",whiteSpace:"nowrap"},
  yellow:{color:"#ffd21f"},
  orange:{color:"#ff7418"},
  sectionSubtitle:{marginTop:"5px",fontSize:"11px",color:"#b9bdc5",fontWeight:"650"},
  bannerArt:{position:"absolute",right:"-5px",bottom:"-18px",width:"47%",height:"115px",opacity:".95",overflow:"hidden",maskImage:"linear-gradient(90deg,transparent 0%,black 42%,black 100%)"},
  bannerArtReal:{width:"49%"},
  bannerArt img:{width:"100%",height:"100%",objectFit:"contain",objectPosition:"right bottom",filter:"drop-shadow(0 4px 8px rgba(0,0,0,.7))"},
  grid:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"9px",marginTop:"10px"},
  card:{position:"relative",overflow:"hidden",borderRadius:"11px",background:"#0b0e11",border:"1px solid #3b3f43",boxShadow:"0 5px 16px rgba(0,0,0,.4)"},
  testingCard:{borderColor:"#7b6815"},
  realCard:{borderColor:"#8d5a12"},
  finishedCard:{opacity:".78"},
  cardArtwork:{position:"relative",height:"142px",overflow:"hidden",background:"#111"},
  heroArt:{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",justifyContent:"center",overflow:"hidden",background:"linear-gradient(135deg,#2b130d,#08111e)"},
  character:{height:"118%",width:"auto",maxWidth:"68%",objectFit:"contain",objectPosition:"center bottom",filter:"drop-shadow(0 3px 7px rgba(0,0,0,.8)) saturate(1.12) contrast(1.05)"},
  oneCharacter:{height:"132%",maxWidth:"92%"},
  twoCharacter:{height:"122%",maxWidth:"59%"},
  fourCharacter:{height:"112%",maxWidth:"42%"},
  characterAlt:{transform:"translateY(2px) scale(.96)"},
  testingBadge:{position:"absolute",top:"7px",right:"7px",minHeight:"22px",padding:"4px 7px",borderRadius:"5px",background:"#ffd719",color:"#111",fontSize:"9px",fontWeight:"950",boxShadow:"0 2px 6px rgba(0,0,0,.35)"},
  cardBody:{padding:"8px 8px 9px"},
  modeTitle:{display:"flex",alignItems:"center",gap:"7px",fontSize:"15px",fontWeight:"950"},
  modeIcon:{fontSize:"19px",color:"#fff",lineHeight:1},
  tournamentName:{margin:"4px 0 7px",fontSize:"12px",fontWeight:"800",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  infoRow:{display:"flex",alignItems:"center",gap:"7px",height:"35px",marginTop:"5px",padding:"0 8px",borderRadius:"7px",fontSize:"11px",fontWeight:"900",border:"1px solid transparent"},
  infoIcon:{fontSize:"17px",width:"20px",textAlign:"center"},
  greenRow:{background:"linear-gradient(90deg,#073b1d,#052719)",borderColor:"#08762f",color:"#f0fff3"},
  redRow:{background:"linear-gradient(90deg,#4d1117,#270b0f)",borderColor:"#d31e2e",color:"#fff0f0"},
  darkRow:{background:"linear-gradient(#24282d,#181b1f)",borderColor:"#333840",color:"#e9ebef"},
  detailRow:{display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"42px",padding:"0 3px",borderBottom:"1px solid #30343a",fontSize:"11px"},
  detailLeft:{display:"flex",alignItems:"center",gap:"7px",color:"#c6cad0"},
  detailIcon:{fontSize:"17px",color:"#fff"},
  detailValue:{color:"#ffd600",fontSize:"14px",whiteSpace:"nowrap"},
  actionButton:{width:"100%",height:"40px",marginTop:"8px",border:0,borderRadius:"8px",background:"linear-gradient(135deg,#ff8a18,#ff4e10)",color:"#111",fontSize:"11px",fontWeight:"950",letterSpacing:".1px",boxShadow:"0 4px 10px rgba(255,76,12,.22)"},
  statusCard:{margin:"14px 6px",padding:"18px",borderRadius:"12px",background:"#101317",border:"1px solid #292d33",color:"#aeb3bb"},
  errorCard:{margin:"14px 6px",padding:"18px",borderRadius:"12px",background:"#2a1014",border:"1px solid #6d2730",color:"#ffb2b7"},
  emptyCard:{margin:"20px 6px",padding:"35px",textAlign:"center",borderRadius:"14px",background:"#101317",border:"1px solid #292d33",color:"#9ea4ad"}
};
