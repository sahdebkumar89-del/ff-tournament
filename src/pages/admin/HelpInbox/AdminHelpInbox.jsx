import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function AdminHelpInbox({ onBack }) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadTickets() {
    const { data, error: loadError } = await supabase.from("support_tickets")
      .select("*, profiles:user_id(full_name,free_fire_uid)")
      .order("updated_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setTickets(data || []);
  }

  async function openTicket(ticket) {
    setSelected(ticket);
    const { data, error: loadError } = await supabase.from("support_messages")
      .select("*").eq("ticket_id", ticket.id).order("created_at");
    if (loadError) setError(loadError.message);
    else setMessages(data || []);
    await supabase.from("support_messages").update({ read_by_admin: true })
      .eq("ticket_id", ticket.id).eq("sender_role", "USER").eq("read_by_admin", false);
    await loadTickets();
  }

  useEffect(() => {
    loadTickets();
    const timer = setInterval(loadTickets, 15000);
    return () => clearInterval(timer);
  }, []);

  async function sendReply(event) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setBusy(true); setError("");
    const { error: sendError } = await supabase.from("support_messages").insert({
      ticket_id: selected.id, sender_role: "ADMIN", message: reply.trim()
    });
    if (sendError) setError(sendError.message);
    else { setReply(""); await openTicket(selected); }
    setBusy(false);
  }

  async function closeTicket() {
    if (!selected) return;
    const { error: closeError } = await supabase.from("support_tickets")
      .update({ status: "CLOSED" }).eq("id", selected.id);
    if (closeError) setError(closeError.message);
    else { setSelected({ ...selected, status: "CLOSED" }); await loadTickets(); }
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div><div style={styles.kicker}>ADMIN SUPPORT</div>
          <h1 style={styles.title}>📩 Help Inbox</h1>
          <p style={styles.sub}>User support requests manage করুন এবং reply দিন।</p>
        </div>
        <button onClick={onBack} style={styles.back}>Admin Panel</button>
      </header>

      {error && <div style={styles.notice}>{error}</div>}

      {!selected ? (
        <section style={styles.list}>
          {!tickets.length && <div style={styles.empty}>No Help Inbox requests yet.</div>}
          {tickets.map((ticket) => (
            <button key={ticket.id} onClick={() => openTicket(ticket)} style={styles.ticket}>
              <div>
                <div style={styles.cat}>{ticket.category} • {ticket.status}</div>
                <strong>{ticket.subject}</strong>
                <div style={styles.meta}>{ticket.profiles?.full_name || "User"} • {formatDate(ticket.updated_at)}</div>
              </div>
              <span style={styles.arrow}>→</span>
            </button>
          ))}
        </section>
      ) : (
        <section style={styles.chat}>
          <div style={styles.chatHead}>
            <div>
              <div style={styles.kicker}>{selected.category}</div>
              <h2 style={styles.chatTitle}>{selected.subject}</h2>
              <div style={styles.meta}>{selected.profiles?.full_name || "User"} • UID {selected.profiles?.free_fire_uid || "—"}</div>
            </div>
            <button onClick={() => setSelected(null)} style={styles.back}>Inbox</button>
          </div>

          <div style={styles.messages}>
            {messages.map((item) => (
              <div key={item.id} style={{...styles.bubble,...(item.sender_role === "ADMIN" ? styles.admin : styles.user)}}>
                <b>{item.sender_role}</b>
                <div>{item.message}</div>
                <small>{formatDate(item.created_at)}</small>
              </div>
            ))}
          </div>

          {selected.status !== "CLOSED" && (
            <form onSubmit={sendReply}>
              <textarea value={reply} onChange={(e)=>setReply(e.target.value)} style={styles.textarea} maxLength={2000} placeholder="Reply to user..." />
              <div style={styles.actions}>
                <button type="button" onClick={closeTicket} style={styles.close}>Close Ticket</button>
                <button type="submit" disabled={busy || !reply.trim()} style={styles.primary}>{busy ? "Sending..." : "Send Reply"}</button>
              </div>
            </form>
          )}
        </section>
      )}
    </main>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-BD", {
    day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", timeZone:"Asia/Dhaka"
  });
}

const styles = {
  page:{minHeight:"100vh",padding:"20px 18px 40px",maxWidth:"760px",margin:"0 auto",color:"#f7f7f8"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",marginBottom:"15px"},
  kicker:{color:"#ff7130",fontSize:"9px",fontWeight:"900",letterSpacing:"1.7px"},
  title:{margin:"5px 0 0",fontSize:"25px"},
  sub:{margin:"6px 0 0",color:"#858087",fontSize:"10px"},
  back:{border:"1px solid #5a2a20",borderRadius:"10px",background:"#1b1415",color:"#ff9b4a",padding:"10px 12px",fontWeight:"800"},
  notice:{padding:"11px",marginBottom:"12px",borderRadius:"11px",background:"#2a1718",color:"#ffb08d",fontSize:"10px"},
  list:{display:"grid",gap:"9px"},
  ticket:{width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px",padding:"14px",borderRadius:"15px",border:"1px solid #2d292d",background:"#121216",color:"#f7f7f8"},
  cat:{color:"#ff8f55",fontSize:"9px",fontWeight:"900"},
  meta:{marginTop:"6px",color:"#77747b",fontSize:"9px"},
  arrow:{color:"#ff7130",fontSize:"20px",fontWeight:"900"},
  empty:{padding:"22px",borderRadius:"15px",background:"#121216",border:"1px solid #29272b",color:"#8f8c93",textAlign:"center"},
  chat:{padding:"14px",borderRadius:"17px",background:"#121216",border:"1px solid #29272b"},
  chatHead:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px",marginBottom:"12px"},
  chatTitle:{margin:"5px 0 0",fontSize:"17px"},
  messages:{display:"grid",gap:"8px",maxHeight:"55vh",overflowY:"auto",padding:"3px 0 10px"},
  bubble:{padding:"10px 11px",borderRadius:"13px",fontSize:"11px",lineHeight:1.5},
  admin:{background:"#241714",border:"1px solid #4b2925",marginLeft:"12%"},
  user:{background:"#171519",border:"1px solid #302c31",marginRight:"12%"},
  textarea:{width:"100%",minHeight:"74px",boxSizing:"border-box",resize:"vertical",border:"1px solid #3b2c2e",borderRadius:"10px",background:"#0f0e11",color:"#fff",padding:"11px",outline:"none",fontFamily:"inherit"},
  actions:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"8px"},
  primary:{border:"none",borderRadius:"10px",background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",padding:"11px",fontWeight:"900"},
  close:{border:"1px solid #71302b",borderRadius:"10px",background:"#261516",color:"#ff9f91",padding:"11px",fontWeight:"900"}
};