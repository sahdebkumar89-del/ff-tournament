import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function AdminWallet({ onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("id,user_id,amount,transaction_type,payment_method,payment_reference,status,created_at")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });
    if (error) setMessage(error.message);
    else setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function review(id, status) {
    const note = window.prompt(
      status === "APPROVED" ? "Approval note (optional):" : "Rejection reason (required):",
      ""
    );
    if (status === "REJECTED" && !note?.trim()) return;

    const { error } = await supabase.rpc("admin_review_payment_transaction", {
      p_payment_transaction_id: id,
      p_status: status,
      p_admin_note: note?.trim() || null,
    });

    if (error) setMessage(error.message);
    else {
      setMessage(status === "APPROVED" ? "Payment approved." : "Payment rejected.");
      load();
    }
  }

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>FINANCE CONTROL</div>
          <h2 style={styles.title}>Payment Requests</h2>
        </div>
        <button type="button" onClick={onBack} style={styles.back}>Back</button>
      </div>

      {message && <div style={styles.message}>{message}</div>}
      {loading ? <p>Loading...</p> : rows.length === 0 ? (
        <p style={styles.empty}>No pending payment requests.</p>
      ) : rows.map((row) => (
        <article key={row.id} style={styles.card}>
          <div style={styles.top}>
            <strong>{row.transaction_type}</strong>
            <strong>৳{Number(row.amount).toFixed(2)}</strong>
          </div>
          <div style={styles.meta}>User: {row.user_id}</div>
          <div style={styles.meta}>Method: {row.payment_method}</div>
          <div style={styles.meta}>Reference: {row.payment_reference || "—"}</div>
          <div style={styles.actions}>
            <button type="button" onClick={() => review(row.id, "APPROVED")} style={styles.approve}>Approve</button>
            <button type="button" onClick={() => review(row.id, "REJECTED")} style={styles.reject}>Reject</button>
          </div>
        </article>
      ))}
    </section>
  );
}

const styles = {
  panel:{padding:"16px",borderRadius:"18px",background:"#131116",border:"1px solid #3b2930"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  kicker:{fontSize:10,letterSpacing:2,color:"#999"},
  title:{margin:"5px 0 0",fontSize:20},
  back:{padding:"8px 12px",borderRadius:9,border:"1px solid #49323a",background:"#181519",color:"#ddd"},
  message:{margin:"12px 0",padding:9,borderRadius:9,background:"#21191b",color:"#ffc064",fontSize:12},
  card:{marginTop:10,padding:13,borderRadius:14,background:"#18151a",border:"1px solid #30262d"},
  top:{display:"flex",justifyContent:"space-between",color:"#fff"},
  meta:{marginTop:6,color:"#9b93a0",fontSize:11},
  actions:{display:"flex",gap:8,marginTop:12},
  approve:{flex:1,padding:10,border:0,borderRadius:9,background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:800},
  reject:{flex:1,padding:10,border:"1px solid #6b3840",borderRadius:9,background:"#24181c",color:"#ffb0a0",fontWeight:800},
  empty:{color:"#888"},
};