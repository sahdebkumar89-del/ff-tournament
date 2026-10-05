import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

const topics = [
  ["PAYMENT", "💳 Payment / Deposit"],
  ["TOURNAMENT", "🎮 Tournament / Join"],
  ["ROOM", "🔐 Room ID / Password"],
  ["RESULT", "🏆 Result / Payout"],
  ["WITHDRAWAL", "💰 Withdrawal"],
  ["OTHER", "⚙️ Other"],
];

export default function HelpInbox() {
  const [tickets, setTickets] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [topic, setTopic] = useState("OTHER");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(0);

  async function loadTickets() {
    const { data, error: loadError } = await supabase
      .from("support_tickets").select("*").order("updated_at", { ascending: false });
    if (loadError) { setError(loadError.message); return; }
    setTickets(data || []);
    const ids = (data || []).map((item) => item.id);
    if (!ids.length) { setUnread(0); return; }
    const { data: unreadRows } = await supabase.from("support_messages")
      .select("id").in("ticket_id", ids).eq("sender_role", "ADMIN").eq("read_by_user", false);
    setUnread((unreadRows || []).length);
  }

  async function openTicket(item) {
    setTicket(item);
    setError("");
    const { data, error: loadError } = await supabase
      .from("support_messages").select("*").eq("ticket_id", item.id).order("created_at");
    if (loadError) setError(loadError.message);
    else setMessages(data || []);
    await supabase.from("support_messages").update({ read_by_user: true })
      .eq("ticket_id", item.id).eq("sender_role", "ADMIN").eq("read_by_user", false);
    await loadTickets();
  }

  useEffect(() => {
    loadTickets();
    const timer = window.setInterval(loadTickets, 15000);
    return () => window.clearInterval(timer);
  }, []);

  async function createTicket(event) {
    event.preventDefault();
    if (!subject.trim() || !text.trim()) return;
    setBusy(true); setError("");
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) { setError("Please sign in again."); setBusy(false); return; }

    const { data: created, error: createError } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, category: topic, subject: subject.trim() })
      .select().single();

    if (createError) { setError(createError.message); setBusy(false); return; }

    const { error: messageError } = await supabase.from("support_messages").insert({
      ticket_id: created.id, sender_user_id: user.id, sender_role: "USER", message: text.trim()
    });

    if (messageError) setError(messageError.message);
    else {
      setSubject(""); setText(""); setShowNew(false);
      await loadTickets(); await openTicket(created);
    }
    setBusy(false);
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!ticket || !reply.trim()) return;
    setBusy(true); setError("");
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) { setError("Please sign in again."); setBusy(false); return; }

    const { error: sendError } = await supabase.from("support_messages").insert({
      ticket_id: ticket.id, sender_user_id: user.id, sender_role: "USER", message: reply.trim()
    });
    if (sendError) setError(sendError.message);
    else { setReply(""); await openTicket(ticket); }
    setBusy(false);
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div><div style={styles.kicker}>SUPPORT</div><h1 style={styles.title}>📩 Help Inbox {unread ? <span style={styles.badge}>{unread}</span> : null}</h1><p style={styles.sub}>Admin-এর সাথে সমস্যার বিষয়ে সরাসরি যোগাযোগ করুন।</p></div>
        <button type="button" onClick={() => setShowNew(true)} style={styles.primary}>+ New Help</button>
      </header>
      {error && <div style={styles.notice}>{error}</div>}

      {ticket ? (
        <section style={styles.card}>
          <div style={styles.top}><div><div style={styles.kicker}>{topicLabel(ticket.category)}</div><h2 style={styles.heading}>{ticket.subject}</h2></div><button type="button" onClick={() => setTicket(null)} style={styles.secondary}>Inbox</button></div>
          <div style={styles.messages}>{messages.map((item) => <div key={item.id} style={{...styles.bubble,...(item.sender_role === "USER" ? styles.user : styles.admin)}}><b>{item.sender_role === "USER" ? "You" : "Admin"}</b><div>{item.message}</div><small>{formatDate(item.created_at)}</small></div>)}</div>
          <form onSubmit={sendReply}><textarea value={reply} onChange={(e) => setReply(e.target.value)} style={styles.textarea} maxLength={2000} placeholder="Write your message..." /><button type="submit" disabled={busy || !reply.trim()} style={{...styles.primary, marginTop:8}}>{busy ? "Sending..." : "Send Reply"}</button></form>
        </section>
      ) : (
        <section style={styles.list}>
          {!tickets.length && <div style={styles.empty}>No help requests yet.<br />Tap “+ New Help” when you need Admin support.</div>}
          {tickets.map((item) => <button key={item.id} type="button" onClick={() => openTicket(item)} style={styles.ticket}><div><div style={styles.kicker}>{topicLabel(item.category)}</div><strong>{item.subject}</strong><div style={styles.meta}>{item.status} • {formatDate(item.updated_at)}</div></div><span style={styles.arrow}>→</span></button>)}
        </section>
      )}

      {showNew && <div style={styles.backdrop}><form onSubmit={createTicket} style={styles.modal}>
        <div style={styles.kicker}>NEW HELP REQUEST</div><h2 style={styles.heading}>Tell Admin what happened</h2>
        <label style={styles.label}>Topic<select value={topic} onChange={(e) => setTopic(e.target.value)} style={styles.input}>{topics.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label style={styles.label}>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} maxLength={120} placeholder="Example: Deposit not credited" /></label>
        <label style={styles.label}>Message<textarea value={text} onChange={(e) => setText(e.target.value)} style={styles.textarea} maxLength={2000} placeholder="Explain your problem..." /></label>
        <div style={styles.actions}><button type="button" onClick={() => setShowNew(false)} style={styles.secondary}>Cancel</button><button type="submit" disabled={busy || !subject.trim() || !text.trim()} style={styles.primary}>{busy ? "Sending..." : "Send Request"}</button></div>
      </form></div>}
    </main>
  );
}

function topicLabel(value) {
  const item = topics.find((row) => row[0] === value);
  return item ? item[1] : "Other";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-BD", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", timeZone:"Asia/Dhaka" });
}

const styles = {
  page:{minHeight:"100vh",padding:"20px 18px 40px",maxWidth:"760px",margin:"0 auto"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",marginBottom:"15px"},
  kicker:{color:"#ff7130",fontSize:"9px",fontWeight:"900",letterSpacing:"1.7px"},
  title:{margin:"5px 0 0",fontSize:"25px"},sub:{margin:"6px 0 0",color:"#858087",fontSize:"10px"},
  badge:{display:"inline-grid",placeItems:"center",minWidth:"18px",height:"18px",borderRadius:"10px",background:"#ef3f31",color:"#fff",fontSize:"9px"},
  primary:{border:"none",borderRadius:"10px",background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",padding:"10px 12px",fontWeight:"900"},
  secondary:{border:"1px solid #3b3032",borderRadius:"9px",background:"#171519",color:"#c6c0c6",padding:"9px 11px",fontWeight:"800"},
  notice:{padding:"11px",marginBottom:"12px",borderRadius:"11px",background:"#2a1718",color:"#ffb08d",fontSize:"10px"},
  list:{display:"grid",gap:"9px"},ticket:{width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:"15px",border:"1px solid #2d292d",background:"#121216",color:"#f7f7f8"},arrow:{color:"#ff7130",fontSize:"20px"},meta:{marginTop:"6px",color:"#77747b",fontSize:"9px"},
  empty:{padding:"22px",borderRadius:"15px",background:"#121216",border:"1px solid #29272b",color:"#8f8c93",textAlign:"center",lineHeight:1.6},
  card:{padding:"14px",borderRadius:"17px",background:"#121216",border:"1px solid #29272b"},top:{display:"flex",justifyContent:"space-between",gap:"10px",alignItems:"center"},heading:{margin:"5px 0 12px",fontSize:"17px"},
  messages:{display:"grid",gap:"8px",maxHeight:"55vh",overflowY:"auto",padding:"3px 0 10px"},bubble:{padding:"10px 11px",borderRadius:"13px",fontSize:"11px",lineHeight:1.5},user:{background:"#241714",border:"1px solid #4b2925",marginLeft:"12%"},admin:{background:"#171519",border:"1px solid #302c31",marginRight:"12%"},
  textarea:{width:"100%",minHeight:"74px",boxSizing:"border-box",resize:"vertical",border:"1px solid #3b2c2e",borderRadius:"10px",background:"#0f0e11",color:"#fff",padding:"11px",outline:"none",fontFamily:"inherit"},
  backdrop:{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.72)",display:"grid",placeItems:"center",padding:"18px"},modal:{width:"100%",maxWidth:"430px",boxSizing:"border-box",padding:"17px",borderRadius:"18px",background:"#171417",border:"1px solid #5a302a"},label:{display:"grid",gap:"6px",marginTop:"11px",color:"#aaa4aa",fontSize:"10px",fontWeight:"800"},input:{width:"100%",boxSizing:"border-box",border:"1px solid #3b2c2e",borderRadius:"10px",background:"#0f0e11",color:"#fff",padding:"11px",outline:"none"},actions:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"14px"}
};