import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

const TABS = ["PENDING", "APPROVED", "REJECTED"];
const DEFAULT_BKASH_NUMBER = "+8801328594782";

export default function AdminWallet({ onBack }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [bkashNumber, setBkashNumber] = useState(DEFAULT_BKASH_NUMBER);
  const [savingBkash, setSavingBkash] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    const [{ data, error }, { data: settings }] = await Promise.all([
      supabase
        .from("payment_transactions")
        .select("id,user_id,amount,transaction_type,payment_method,payment_reference,status,admin_note,approved_at,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("app_settings")
        .select("deposit_bkash_number")
        .eq("id", true)
        .maybeSingle(),
    ]);

    if (error) setMessage(error.message);
    else setRows(data || []);
    if (settings?.deposit_bkash_number) setBkashNumber(settings.deposit_bkash_number);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const visibleRows = useMemo(
    () => rows.filter((row) => row.status === tab),
    [rows, tab]
  );

  async function saveBkashNumber() {
    setSavingBkash(true);
    setMessage("");
    const { data, error } = await supabase.rpc("admin_update_deposit_bkash_number", {
      p_bkash_number: bkashNumber.trim(),
    });
    setSavingBkash(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setBkashNumber(data?.deposit_bkash_number || bkashNumber.trim());
    setMessage("Deposit bKash number updated successfully.");
  }

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

      <section style={styles.settingsCard}>
        <div style={styles.settingsLabel}>DEPOSIT PAYMENT NUMBER</div>
        <div style={styles.settingsTitle}>bKash Number</div>
        <div style={styles.settingsRow}>
          <input
            value={bkashNumber}
            onChange={e => setBkashNumber(e.target.value)}
            placeholder="+8801XXXXXXXXX"
            inputMode="tel"
            style={styles.settingsInput}
          />
          <button type="button" onClick={saveBkashNumber} disabled={savingBkash} style={styles.saveButton}>
            {savingBkash ? "Saving..." : "Save"}
          </button>
        </div>
        <div style={styles.settingsNote}>Users will see this number when they open Deposit. You can change it anytime.</div>
      </section>

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
  settingsCard:{marginTop:16,padding:14,borderRadius:14,background:"#1a1519",border:"1px solid #5a302c"},
  settingsLabel:{fontSize:9,letterSpacing:1.5,color:"#9f969c",fontWeight:900},
  settingsTitle:{marginTop:5,fontSize:15,color:"#fff",fontWeight:900},
  settingsRow:{display:"flex",gap:8,marginTop:9},
  settingsInput:{flex:1,minWidth:0,padding:"10px 11px",borderRadius:9,border:"1px solid #403037",background:"#0f0e11",color:"#fff",outline:"none",fontSize:13},
  saveButton:{padding:"10px 14px",border:0,borderRadius:9,background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:900},
  settingsNote:{marginTop:8,color:"#948990",fontSize:10,lineHeight:1.5},
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