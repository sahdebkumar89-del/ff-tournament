import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

const categories = [
  ["PAYMENT", "💳 Payment / Deposit"],
  ["TOURNAMENT", "🎮 Tournament / Join"],
  ["ROOM", "🔐 Room ID / Password"],
  ["RESULT", "🏆 Result / Payout"],
  ["WITHDRAWAL", "💰 Withdrawal"],
  ["OTHER", "⚙️ Other"],
];

export default function HelpInbox() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [category, setCategory] = useState("OTHER");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [unread, setUnread] = useState(0);

  async function loadTickets() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTickets(data || []);
    const ids = (data || []).map((item) => item.id);
    if (!ids.length) {
      setUnread(0);
      return;
    }

    const { data: unreadRows } = await supabase
      .from("support_messages")
      .select("id")
      .in("ticket_id", ids)
      .eq("sender_role", "ADMIN")
      .eq("read_by_user", false);

    setUnread((unreadRows || []).length);
  }

  async function loadMessages(ticketId) {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessages(data || []);

    await supabase
      .from("support_messages")
      .update({ read_by_user: true })
      .eq("ticket_id", ticketId)
      .eq("sender_role", "ADMIN")
      .eq("read_by_user", false);

    await loadTickets();
  }

  useEffect(() => {
    setLoading(true);
    loadTickets().finally(() => setLoading(false));
    const timer = window.setInterval(loadTickets, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selected) loadMessages(selected.id);
  }, [selected?.id]);

  async function createTicket(event) {
    event.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Please sign in again."); setSending(false); return; }

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        category,
        subject: subject.trim(),
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      setSending(false);
      return;
    }

    const { error: messageError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        sender_user_id: user.id,
        sender_role: "USER",
        message: body.trim(),
      });

    if (messageError) {
      setMessage(messageError.message);
      setSending(false);
      return;
    }

    setSubject("");
    setBody("");
    setShowNew(false);
    await loadTickets();
    setSelected(ticket);
    setSending(false);
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;

    setSending(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Please sign in again."); setSending(false); return; }

    const { error } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: selected.id,
        sender_user_id: user.id,
        sender_role: "USER",
        message: reply.trim(),
      });

    if (error) {
      setMessage(error.message);
    } else {
      setReply("");
      await loadMessages(selected.id);
    }

    setSending(false);
  }

  const selectedLabel = useMemo(
    () => categories.find(([value]) => value === selected?.category)?.[1] || "Help",
    [selected]
  );

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>SUPPORT</div>
          <h1 style={styles.title}>📩 Help Inbox {unread > 0 ? <span style={styles.unreadBadge}>{unread}</span> : null}</h1>
          <p style={styles.subtitle}>Admin-এর সাথে আপনার সমস্যার বিষয়ে সরাসরি যোগাযোগ করুন।</p>
        </div>
        <button type="button" onClick={() => setShowNew(true)} style={styles.primary}>+ New Help</button>
      </header>

      {message && <div style={styles.notice}>{message}</div>}

      {selected ? (
        <section style={styles.chatCard}>
          <div style={styles.chatHeader}>
            <div>
              <div style={styles.kicker}>{selectedLabel}</div>
              <h2 style={styles.chatTitle}>{selected.subject}</h2>
            </div>
            <button type="button" onClick={() => setSelected(null)} style={styles.smallButton}>Inbox</button>
          </div>

          <div style={styles.messages}>
            {messages.map((item) => (
              <div key={item.id} style={{ ...styles.messageBubble, ...(item.sender_role === "USER" ? styles.userBubble : styles.adminBubble) }}>
                <div style={styles.sender}>{item.sender_role === "USER" ? "You" : "Admin"}</div>
                <div>{item.message}</div>
                <small>{formatDate(item.created_at)}</small>
              </div>
            ))}
          </div>

          <form onSubmit={sendReply} style={styles.replyRow}>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your message..." style={styles.textarea} maxLength={2000} />
            <button type="submit" disabled={sending || !reply.trim()} style={styles.primary}>{sending ? "Sending..." : "Send"}</button>
          </form>
        </section>
      ) : (
        <section style={styles.list}>
          {loading ? <div style={styles.empty}>Loading Help Inbox...</div> : null}
          {!loading && !tickets.length ? (
            <div style={styles.empty}>No help requests yet.<br /><span>Need help? Tap “+ New Help”.</span></div>
          ) : null}
          {tickets.map((ticket) => (
            <button key={ticket.id} type="button" onClick={() => setSelected(ticket)} style={styles.ticket}>
              <div>
                <div style={styles.ticketCategory}>{categories.find(([v]) => v === ticket.category)?.[1] || "Other"}</div>
                <strong>{ticket.subject}</strong>
                <div style={styles.ticketMeta}>{ticket.status} • {formatDate(ticket.updated_at)}</div>
              </div>
              <span style={styles.arrow}>→</span>
            </button>
          ))}
        </section>
      )}

      {showNew && (
        <div style={styles.backdrop}>
          <form onSubmit={createTicket} style={styles.modal}>
            <div style={styles.kicker}>NEW HELP REQUEST</div>
            <h2 style={styles.chatTitle}>Tell Admin what happened</h2>
            <label style={styles.label}>Topic
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.input}>
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label style={styles.label}>Subject
              <input value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} maxLength={120} placeholder="Example: Deposit not credited" />
            </label>
            <label style={styles.label}>Message
              <textarea value={body} onChange={(e) => setBody(e.target.value)} style={styles.textarea} maxLength={2000} placeholder="Explain your problem..." />
            </label>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setShowNew(false)} style={styles.smallButton}>Cancel</button>
              <button type="submit" disabled={sending || !subject.trim() || !body.trim()} style={styles.primary}>{sending ? "Sending..." : "Send Request"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

const styles = {
  page: { minHeight: "100vh", padding: "20px 18px 30px", maxWidth: "760px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "15px" },
  kicker: { color: "#ff7130", fontSize: "9px", fontWeight: "900", letterSpacing: "1.7px" },
  title: { margin: "5px 0 0", fontSize: "25px" },
  subtitle: { margin: "6px 0 0", color: "#858087", fontSize: "10px", lineHeight: 1.5 },
  primary: { border: "none", borderRadius: "11px", background: "linear-gradient(135deg,#ff7a2f,#e94231)", color: "#fff", padding: "10px 12px", fontWeight: "900", whiteSpace: "nowrap" },
  unreadBadge: { display: "inline-grid", placeItems: "center", minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "10px", background: "#ef3f31", color: "#fff", fontSize: "9px", verticalAlign: "middle" },
  notice: { padding: "11px", marginBottom: "12px", borderRadius: "11px", background: "#2a1718", color: "#ffb08d", fontSize: "10px" },
  list: { display: "grid", gap: "9px" },
  ticket: { width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "14px", borderRadius: "15px", border: "1px solid #2d292d", background: "#121216", color: "#f7f7f8" },
  ticketCategory: { color: "#ff8f55", fontSize: "9px", fontWeight: "900", marginBottom: "5px" },
  ticketMeta: { marginTop: "6px", color: "#77747b", fontSize: "9px" },
  arrow: { color: "#ff7130", fontSize: "20px", fontWeight: "900" },
  empty: { padding: "22px", borderRadius: "15px", background: "#121216", border: "1px solid #29272b", color: "#8f8c93", textAlign: "center", lineHeight: 1.6 },
  chatCard: { padding: "14px", borderRadius: "17px", background: "#121216", border: "1px solid #29272b" },
  chatHeader: { display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", marginBottom: "12px" },
  chatTitle: { margin: "5px 0 0", fontSize: "17px" },
  smallButton: { border: "1px solid #3b3032", borderRadius: "9px", background: "#171519", color: "#c6c0c6", padding: "9px 11px", fontWeight: "800" },
  messages: { display: "grid", gap: "8px", maxHeight: "55vh", overflowY: "auto", padding: "3px 0 10px" },
  messageBubble: { padding: "10px 11px", borderRadius: "13px", fontSize: "11px", lineHeight: 1.5 },
  userBubble: { background: "#241714", border: "1px solid #4b2925", marginLeft: "12%" },
  adminBubble: { background: "#171519", border: "1px solid #302c31", marginRight: "12%" },
  sender: { color: "#ff9b5a", fontSize: "8px", fontWeight: "900", marginBottom: "3px" },
  replyRow: { display: "grid", gap: "8px", marginTop: "5px" },
  textarea: { width: "100%", minHeight: "74px", boxSizing: "border-box", resize: "vertical", border: "1px solid #3b2c2e", borderRadius: "10px", background: "#0f0e11", color: "#fff", padding: "11px", outline: "none", fontFamily: "inherit" },
  backdrop: { position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.72)", display: "grid", placeItems: "center", padding: "18px" },
  modal: { width: "100%", maxWidth: "430px", boxSizing: "border-box", padding: "17px", borderRadius: "18px", background: "#171417", border: "1px solid #5a302a" },
  label: { display: "grid", gap: "6px", marginTop: "11px", color: "#aaa4aa", fontSize: "10px", fontWeight: "800" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #3b2c2e", borderRadius: "10px", background: "#0f0e11", color: "#fff", padding: "11px", outline: "none" },
  modalActions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "14px" },
};
