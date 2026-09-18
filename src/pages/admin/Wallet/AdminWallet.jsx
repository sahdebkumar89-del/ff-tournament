import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

const TABS = ["PENDING", "APPROVED", "REJECTED"];

export default function AdminWallet({ onBack }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("id,user_id,amount,transaction_type,payment_method,payment_reference,status,admin_note,approved_at,created_at")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    else setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const visibleRows = useMemo(
    () => rows.filter((row) => row.status === tab),
    [rows, tab]
  );

  async function review(id, status) {
    const note = window.prompt(
      status === "APPROVED" ? "Approval note (optional):" : "Rejection reason (required):",
      ""
    );
    if (status === "REJECTED" && !note?.trim()) return;

    setBusyId(id);
    setMessage("");
    const { error } = await supabase.rpc("admin_review_payment_transaction", {
      p_payment_transaction_id: id,
      p_status: status,
      p_admin_note: note?.trim() || null,
    });
    setBusyId(null);

    if (error) setMessage(error.message);
    else {
      setMessage(status === "APPROVED" ? "Payment approved successfully." : "Payment rejected successfully.");
      await load();
      setTab(status);
    }
  }

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>FINANCE CONTROL</div>
          <h2 style={styles.title}>Wallet & Payment Requests</h2>
        </div>
        <button type="button" onClick={onBack} style={styles.back}>Back</button>
      </div>

      <div style={styles.tabs}>
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            style={{ ...styles.tab, ...(tab === item ? styles.activeTab : {}) }}
          >
            {item === "PENDING" ? "Pending" : item === "APPROVED" ? "Approved" : "Rejected"}
            <span style={styles.count}>{rows.filter((row) => row.status === item).length}</span>
          </button>
        ))}
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {loading ? <p style={styles.empty}>Loading payment history...</p> : visibleRows.length === 0 ? (
        <p style={styles.empty}>No {tab.toLowerCase()} payment requests.</p>
      ) : visibleRows.map((row) => (
        <article key={row.id} style={styles.card}>
          <div style={styles.top}>
            <strong>{row.transaction_type}</strong>
            <strong style={row.transaction_type === "WITHDRAWAL" ? styles.amountOut : styles.amountIn}>
              {row.transaction_type === "WITHDRAWAL" ? "-" : "+"}৳{Number(row.amount).toFixed(2)}
            </strong>
          </div>
          <div style={styles.meta}>User: {row.user_id}</div>
          <div style={styles.meta}>Method: {row.payment_method}</div>
          <div style={styles.meta}>Reference: {row.payment_reference || "—"}</div>
          <div style={styles.meta}>Requested: {new Date(row.created_at).toLocaleString("en-BD")}</div>
          {row.approved_at && <div style={styles.meta}>Reviewed: {new Date(row.approved_at).toLocaleString("en-BD")}</div>}
          {row.admin_note && <div style={styles.note}>Admin note: {row.admin_note}</div>}

          {row.status === "PENDING" && (
            <div style={styles.actions}>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => review(row.id, "APPROVED")}
                style={styles.approve}
              >
                {busyId === row.id ? "Processing..." : "Approve"}
              </button>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => review(row.id, "REJECTED")}
                style={styles.reject}
              >
                Reject
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

const styles = {
  panel:{padding:"16px",borderRadius:"18px",background:"#131116",border:"1px solid #3b2930"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10},
  kicker:{fontSize:10,letterSpacing:2,color:"#999"},
  title:{margin:"5px 0 0",fontSize:20,color:"#fff"},
  back:{padding:"8px 12px",borderRadius:9,border:"1px solid #49323a",background:"#181519",color:"#ddd"},
  tabs:{display:"flex",gap:7,marginTop:16},
  tab:{flex:1,padding:"9px 6px",borderRadius:10,border:"1px solid #34282e",background:"#19161b",color:"#9f96a1",fontWeight:800,fontSize:11},
  activeTab:{borderColor:"#ff6b35",background:"#24191a",color:"#fff"},
  count:{display:"inline-block",marginLeft:5,minWidth:18,padding:"2px 5px",borderRadius:8,background:"#30242a",fontSize:9},
  message:{margin:"12px 0",padding:9,borderRadius:9,background:"#21191b",color:"#ffc064",fontSize:12},
  card:{marginTop:10,padding:13,borderRadius:14,background:"#18151a",border:"1px solid #30262d"},
  top:{display:"flex",justifyContent:"space-between",gap:10,color:"#fff"},
  amountIn:{color:"#8df0b0"},
  amountOut:{color:"#ff9a86"},
  meta:{marginTop:6,color:"#9b93a0",fontSize:11,wordBreak:"break-word"},
  note:{marginTop:9,padding:8,borderRadius:8,background:"#211c20",color:"#d9cbd0",fontSize:11},
  actions:{display:"flex",gap:8,marginTop:12},
  approve:{flex:1,padding:10,border:0,borderRadius:9,background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:800},
  reject:{flex:1,padding:10,border:"1px solid #6b3840",borderRadius:9,background:"#24181c",color:"#ffb0a0",fontWeight:800},
  empty:{color:"#888"},
};