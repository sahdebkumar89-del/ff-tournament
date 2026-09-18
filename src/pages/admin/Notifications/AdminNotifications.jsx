import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function AdminNotifications({ onBack }) {
  const [audience, setAudience] = useState("EVERYONE");
  const [type, setType] = useState("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [userIds, setUserIds] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.from("tournaments").select("id,mode,tournament_date,scheduled_start_time")
      .order("tournament_date",{ascending:false}).order("scheduled_start_time",{ascending:false})
      .limit(100).then(({data}) => setTournaments(data || []));
  }, []);

  async function sendNotification() {
    setMessage("");
    if (!title.trim() || !body.trim()) {
      setMessage("Title and message are required.");
      return;
    }
    if (audience === "TOURNAMENT" && !tournamentId) {
      setMessage("Select a tournament.");
      return;
    }
    const ids = userIds.split(/[\s,]+/).map((id)=>id.trim()).filter(Boolean);
    if (audience === "USERS" && !ids.length) {
      setMessage("Enter at least one user ID.");
      return;
    }

    setSending(true);
    const { data, error } = await supabase.rpc("admin_send_notification", {
      p_audience: audience,
      p_title: title.trim(),
      p_body: body.trim(),
      p_notification_type: type,
      p_deep_link: deepLink.trim() || null,
      p_tournament_id: tournamentId ? Number(tournamentId) : null,
      p_user_ids: audience === "USERS" ? ids : null,
    });

    if (error) setMessage(error.message);
    else {
      setMessage(`Notification sent to ${Number(data) || 0} user(s).`);
      setTitle(""); setBody(""); setDeepLink(""); setUserIds("");
    }
    setSending(false);
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div><div style={styles.kicker}>ADMIN PANEL</div><h1 style={styles.title}>Send Notification</h1></div>
        <button type="button" onClick={onBack} style={styles.back}>Back</button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <section style={styles.card}>
        <label style={styles.label}>Audience
          <select value={audience} onChange={(e)=>setAudience(e.target.value)} style={styles.input}>
            <option value="EVERYONE">Everyone</option>
            <option value="TOURNAMENT">Tournament Participants</option>
            <option value="USERS">Selected Users</option>
          </select>
        </label>

        <label style={styles.label}>Notification Type
          <select value={type} onChange={(e)=>setType(e.target.value)} style={styles.input}>
            {["ANNOUNCEMENT","MATCH_REMINDER","ROOM_RELEASED","RESULT_PUBLISHED","WALLET","PAYMENT","CANCELLATION","REFUND","SECURITY"].map((v)=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}
          </select>
        </label>

        {audience === "TOURNAMENT" && (
          <label style={styles.label}>Tournament
            <select value={tournamentId} onChange={(e)=>setTournamentId(e.target.value)} style={styles.input}>
              <option value="">Select tournament</option>
              {tournaments.map((t)=><option key={t.id} value={t.id}>#{t.id} • {t.mode} • {t.tournament_date} • {t.scheduled_start_time.slice(0,5)}</option>)}
            </select>
          </label>
        )}

        {audience === "USERS" && (
          <label style={styles.label}>User IDs
            <textarea value={userIds} onChange={(e)=>setUserIds(e.target.value)} placeholder="Paste UUIDs separated by comma or space" style={styles.textarea}/>
          </label>
        )}

        <label style={styles.label}>Title
          <input maxLength={120} value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Notification title" style={styles.input}/>
        </label>

        <label style={styles.label}>Message
          <textarea maxLength={1000} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Write notification message" style={styles.textarea}/>
        </label>

        <label style={styles.label}>Deep Link <span style={styles.optional}>(optional)</span>
          <select value={deepLink} onChange={(e)=>setDeepLink(e.target.value)} style={styles.input}>
            <option value="">No deep link</option>
            <option value="/my-tournaments">My Tournaments</option>
            <option value="/room">Room</option>
            <option value="/wallet">Wallet</option>
            <option value="/notifications">Notifications</option>
          </select>
        </label>

        <button type="button" disabled={sending} onClick={sendNotification} style={styles.send}>
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </section>
    </main>
  );
}

const styles={
  page:{minHeight:"100vh",background:"#0b0b0e",color:"#f7f7f8",padding:"20px 18px 40px",maxWidth:"760px",margin:"0 auto"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",marginBottom:"20px"},
  kicker:{color:"#ff7130",fontSize:"10px",fontWeight:"900",letterSpacing:"2px"},
  title:{margin:"5px 0 0",fontSize:"24px"},
  back:{border:"1px solid #5a2a20",borderRadius:"10px",background:"#1b1415",color:"#ff9b4a",padding:"10px 12px",fontWeight:"800"},
  card:{padding:"16px",borderRadius:"18px",background:"#121216",border:"1px solid #29272b"},
  label:{display:"grid",gap:"6px",marginTop:"12px",color:"#aaa4aa",fontSize:"10px",fontWeight:"800"},
  optional:{fontWeight:"600",color:"#666"},
  input:{width:"100%",boxSizing:"border-box",border:"1px solid #3b2c2e",borderRadius:"10px",background:"#0f0e11",color:"#fff",padding:"11px",outline:"none"},
  textarea:{width:"100%",minHeight:"90px",boxSizing:"border-box",resize:"vertical",border:"1px solid #3b2c2e",borderRadius:"10px",background:"#0f0e11",color:"#fff",padding:"11px",outline:"none",fontFamily:"inherit"},
  send:{width:"100%",marginTop:"18px",padding:"12px",border:"none",borderRadius:"11px",background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:"900"},
  message:{padding:"12px",marginBottom:"14px",borderRadius:"12px",background:"#171417",border:"1px solid #3b2928",color:"#ffc064",fontSize:"12px"}
};