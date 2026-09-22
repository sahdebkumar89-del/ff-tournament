import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

const DEFAULT_BKASH_NUMBER = "+8801328594782";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [positionPrizes, setPositionPrizes] = useState(0);
  const [killRewards, setKillRewards] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bkashNumber, setBkashNumber] = useState(DEFAULT_BKASH_NUMBER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({ amount: "", method: "", reference: "" });
  const [actionMessage, setActionMessage] = useState("");

  async function loadWallet() {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Please sign in to view your wallet.");

      const { data: wallet, error: walletError } = await supabase
        .from("wallets").select("id,balance").eq("user_id", user.id).maybeSingle();
      if (walletError) throw walletError;
      if (!wallet) throw new Error("Wallet not found.");

      setBalance(Number(wallet.balance) || 0);

      const { data: settings } = await supabase
        .from("app_settings")
        .select("deposit_bkash_number")
        .eq("id", true)
        .maybeSingle();
      if (settings?.deposit_bkash_number) setBkashNumber(settings.deposit_bkash_number);

      const { data: tx, error: txError } = await supabase
        .from("wallet_transactions")
        .select("id,transaction_type,amount,balance_before,balance_after,tournament_id,description,created_at")
        .eq("wallet_id", wallet.id).order("created_at", { ascending: false });
      if (txError) throw txError;

      const walletTransactions = tx || [];
      setTransactions(walletTransactions);
      setPositionPrizes(walletTransactions.filter(t => t.transaction_type === "POSITION_PRIZE")
        .reduce((s,t) => s + Math.max(Number(t.amount)||0,0), 0));
      setKillRewards(walletTransactions.filter(t => t.transaction_type === "KILL_REWARD")
        .reduce((s,t) => s + Math.max(Number(t.amount)||0,0), 0));

      const { data: paymentRows, error: paymentError } = await supabase
        .from("payment_transactions")
        .select("id,transaction_type,amount,payment_method,payment_reference,status,admin_note,approved_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (paymentError) throw paymentError;
      setPayments(paymentRows || []);
    } catch (err) {
      setError(err?.message || "Unable to load wallet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWallet(); }, []);

  async function copyBkashNumber() {
    try {
      await navigator.clipboard.writeText(bkashNumber);
      setActionMessage("bKash number copied.");
    } catch {
      setActionMessage("Copy failed. Please copy the number manually.");
    }
  }

  async function submitWalletRequest() {
    setActionMessage("");
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setActionMessage("Enter a valid amount.");
    if (action === "WITHDRAWAL" && amount < 50) return setActionMessage("Minimum withdrawal is ৳50.");
    if (!form.method.trim()) return setActionMessage("Payment method is required.");
    if (action === "DEPOSIT" && !form.reference.trim()) return setActionMessage("bKash TrxID is required.");

    const rpc = action === "DEPOSIT" ? "request_deposit" : "request_withdrawal";
    const { error: rpcError } = await supabase.rpc(rpc, {
      p_amount: amount,
      p_payment_method: form.method.trim(),
      p_payment_reference: form.reference.trim() || null,
    });
    if (rpcError) return setActionMessage(rpcError.message);

    setActionMessage("Request submitted. Waiting for Admin approval.");
    setForm({ amount: "", method: "", reference: "" });
    await loadWallet();
  }

  const totalEarnings = positionPrizes + killRewards;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div><div style={styles.smallText}>MONEY & EARNINGS</div><h1 style={styles.title}>My Wallet</h1></div>
        <span style={styles.badge}>৳</span>
      </div>

      {loading && <section style={styles.card}><p>Loading wallet...</p></section>}
      {!loading && error && <section style={styles.errorCard}><strong>Unable to load wallet</strong><p>{error}</p></section>}

      {!loading && !error && <>
        <section style={styles.balanceCard}>
          <div style={styles.balanceLabel}>AVAILABLE BALANCE</div>
          <div style={styles.balance}>৳{balance.toFixed(2)}</div>
          <p style={styles.balanceNote}>Current approved wallet balance.</p>
        </section>

        {action && <section style={styles.requestCard}>
          <h2 style={styles.sectionTitle}>{action === "DEPOSIT" ? "Deposit via bKash" : "Request Withdrawal"}</h2>

          {action === "DEPOSIT" && (
            <div style={styles.bkashBox}>
              <div style={styles.bkashLabel}>SEND MONEY TO</div>
              <div style={styles.bkashRow}>
                <strong style={styles.bkashNumber}>{bkashNumber}</strong>
                <button type="button" onClick={copyBkashNumber} style={styles.copyButton}>Copy</button>
              </div>
              <p style={styles.bkashNote}>Send the exact amount to this bKash number, then enter the TrxID below.</p>
            </div>
          )}

          <input type="number" min="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="Amount (৳)" style={styles.formInput}/>

          {action === "WITHDRAWAL" && (
            <input value={form.method} onChange={e=>setForm({...form,method:e.target.value})} placeholder="Payment method" style={styles.formInput}/>
          )}

          {action === "DEPOSIT" ? (
            <input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="bKash TrxID" style={styles.formInput}/>
          ) : (
            <input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="Payment account/reference (optional)" style={styles.formInput}/>
          )}

          {actionMessage && <div style={styles.actionMessage}>{actionMessage}</div>}
          <div style={styles.formButtons}>
            <button type="button" onClick={submitWalletRequest} style={styles.submitButton}>Submit for Approval</button>
            <button type="button" onClick={()=>{setAction(null);setActionMessage("")}} style={styles.cancelButton}>Cancel</button>
          </div>
        </section>}

        <section style={styles.actions}>
          <button type="button" onClick={()=>{setAction("DEPOSIT");setForm({...form,method:"bKash"});setActionMessage("")}} style={{...styles.actionButton,...styles.depositButton}}>
            <span style={styles.actionIcon}>↓</span>
            <strong>Deposit</strong>
          </button>
          <button type="button" onClick={()=>{setAction("WITHDRAWAL");setForm({...form,method:""});setActionMessage("")}} style={{...styles.actionButton,...styles.withdrawButton}}>
            <span style={styles.actionIcon}>↗</span>
            <strong>Withdraw</strong>
          </button>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Earnings</h2>
          <div style={styles.row}><span>Position Prizes</span><strong>৳{positionPrizes.toFixed(2)}</strong></div>
          <div style={styles.row}><span>Kill Rewards</span><strong>৳{killRewards.toFixed(2)}</strong></div>
          <div style={styles.row}><span>Total Earnings</span><strong>৳{totalEarnings.toFixed(2)}</strong></div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Deposit & Withdrawal Status</h2>
          {payments.length === 0 ? <p style={styles.emptyText}>No deposit or withdrawal requests yet.</p> :
            payments.map(p => <div key={p.id} style={styles.payment}>
              <div><strong>{formatPaymentType(p.transaction_type)}</strong>
                <small>{p.payment_method} • {formatDate(p.created_at)}</small>
                {p.payment_reference && <small>Reference: {p.payment_reference}</small>}
                {p.admin_note && <small>Admin note: {p.admin_note}</small>}
              </div>
              <div style={styles.paymentRight}>
                <strong>৳{Number(p.amount).toFixed(2)}</strong>
                <span style={statusStyle(p.status)}>{p.status}</span>
              </div>
            </div>)}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Transaction History</h2>
          {transactions.length === 0 ? <p style={styles.emptyText}>No wallet transactions yet.</p> :
            transactions.map(t => <div key={t.id} style={styles.payment}>
              <div><strong>{formatTransactionType(t.transaction_type)}</strong>
                <small>{t.description || formatTransactionType(t.transaction_type)}</small>
                <small>{formatDate(t.created_at)}</small>
              </div>
              <strong style={{color:Number(t.amount)>=0?"#86efac":"#fca5a5"}}>
                {Number(t.amount)>=0?"+":"-"}৳{Math.abs(Number(t.amount)||0).toFixed(2)}
              </strong>
            </div>)}
        </section>

        <section style={styles.infoCard}>
          <strong>Wallet Security</strong>
          <p>Wallet balance changes use secure backend processing. Deposits and withdrawals require Admin review, and money movements keep transaction records.</p>
        </section>
      </>}
    </main>
  );
}

function formatPaymentType(type) { return type === "DEPOSIT" ? "Deposit Request" : "Withdrawal Request"; }
function formatTransactionType(type) {
  return {DEPOSIT:"Deposit",ENTRY_FEE:"Tournament Entry",POSITION_PRIZE:"Position Prize",KILL_REWARD:"Kill Reward",REFUND:"Tournament Refund",WITHDRAWAL:"Withdrawal",ADJUSTMENT:"Wallet Adjustment"}[type] || type || "Transaction";
}
function formatDate(value) { const d=new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-BD"); }
function statusStyle(status) {
  const color = status === "APPROVED" ? "#86efac" : status === "REJECTED" ? "#fca5a5" : "#ffc064";
  return {color,fontSize:"10px",fontWeight:900};
}

const styles = {
  page:{maxWidth:"760px",margin:"0 auto",padding:"22px 18px 40px"},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"22px"},
  smallText:{fontSize:"10px",letterSpacing:"2px",fontWeight:"800",color:"#9ca3af"},
  title:{margin:"5px 0 0",fontSize:"26px"},
  badge:{width:"38px",height:"38px",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",background:"#24191a",color:"#ff7a2f",fontSize:"18px",fontWeight:"800"},
  balanceCard:{padding:"24px 20px",borderRadius:"20px",background:"#151116",border:"1px solid #4a2928",marginBottom:"14px"},
  balanceLabel:{fontSize:"10px",letterSpacing:"1.5px",fontWeight:"800",color:"#9ca3af"},
  balance:{marginTop:"8px",fontSize:"34px",fontWeight:"900",color:"#fff"},
  balanceNote:{margin:"6px 0 0",color:"#9f9295",fontSize:"12px"},
  actions:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"},
  actionButton:{minWidth:0,minHeight:"76px",padding:"14px 18px",borderRadius:"16px",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",textAlign:"center",fontSize:"17px",fontWeight:"900",boxShadow:"0 8px 24px rgba(0,0,0,.18)"},
  depositButton:{border:"1px solid #2188ff",background:"linear-gradient(135deg,#1689ff,#075de8)"},
  withdrawButton:{border:"1px solid #62c52a",background:"linear-gradient(135deg,#65c92d,#1f9d2d)"},
  actionIcon:{width:"34px",height:"34px",flexShrink:0,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,.94)",color:"#111",fontSize:"22px",fontWeight:"900"},
  card:{padding:"18px",borderRadius:"20px",background:"#131116",border:"1px solid #3b2930",marginBottom:"14px"},
  requestCard:{padding:"16px",borderRadius:"18px",background:"#171416",border:"1px solid #4b2b25",marginBottom:"14px"},
  bkashBox:{marginBottom:"10px",padding:"14px",borderRadius:"14px",background:"#21191d",border:"1px solid #61352f"},
  bkashLabel:{fontSize:"10px",letterSpacing:"1.5px",fontWeight:"900",color:"#9f969c"},
  bkashRow:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",marginTop:"7px"},
  bkashNumber:{fontSize:"20px",color:"#fff",letterSpacing:"0.5px"},
  copyButton:{padding:"8px 11px",border:"1px solid #ff7a2f",borderRadius:"9px",background:"#2a1a1b",color:"#ff9a5c",fontWeight:"900"},
  bkashNote:{margin:"8px 0 0",color:"#a99da2",fontSize:"11px",lineHeight:1.5},
  sectionTitle:{margin:"0 0 12px",fontSize:"18px",color:"#fff"},
  formInput:{width:"100%",boxSizing:"border-box",marginTop:"9px",padding:"11px",borderRadius:"10px",border:"1px solid #3b2c2e",background:"#0f0e11",color:"#fff",outline:"none"},
  formButtons:{display:"flex",gap:"8px",marginTop:"12px"},
  submitButton:{flex:1,padding:"11px",border:0,borderRadius:"10px",background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:900},
  cancelButton:{padding:"11px 14px",border:"1px solid #493034",borderRadius:"10px",background:"#171417",color:"#aaa",fontWeight:800},
  actionMessage:{marginTop:"9px",padding:"9px",borderRadius:"9px",background:"#211a18",color:"#ffc064",fontSize:"10px"},
  row:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",padding:"11px 0",borderTop:"1px solid #3a2930",color:"#b8afb3",fontSize:"13px"},
  payment:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"14px",padding:"12px 0",borderTop:"1px solid #2b2227"},
  paymentRight:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"5px"},
  emptyText:{color:"#888",fontSize:"12px"},
  infoCard:{padding:"16px 18px",borderRadius:"16px",background:"#171316",border:"1px solid #3b2930",color:"#d9cfd2"},
  errorCard:{padding:"24px",borderRadius:"18px",background:"#2a171b",border:"1px solid #713039",color:"#fecaca"},
};