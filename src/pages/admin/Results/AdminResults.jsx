import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

export default function AdminResults({ onBack }) {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [results, setResults] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [proofUrl, setProofUrl] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { loadTournaments(); }, []);

  async function loadTournaments() {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id,mode,tournament_date,scheduled_start_time,status")
      .in("status", ["STARTED", "COMPLETED"])
      .order("tournament_date", { ascending: false })
      .order("scheduled_start_time", { ascending: false })
      .limit(100);
    if (error) setMessage(error.message);
    else setTournaments(data || []);
  }

  function makeDrafts(list) {
    const next = {};
    (list || []).forEach((p) => {
      const uids = Array.isArray(p.free_fire_uids) ? p.free_fire_uids : [];
      next[p.participant_id] = {
        position: "",
        kills: Object.fromEntries(uids.map((uid) => [uid, ""])),
      };
    });
    return next;
  }

  async function loadData(id = tournamentId) {
    if (!id) return;
    setLoading(true);
    setMessage("");
    const [p, r] = await Promise.all([
      supabase.rpc("admin_get_tournament_participants", { p_tournament_id: Number(id) }),
      supabase.from("tournament_results").select("*").eq("tournament_id", Number(id)).order("position", { ascending: true }),
    ]);
    if (p.error) setMessage(p.error.message);
    if (r.error) setMessage(r.error.message);
    const participantRows = p.data || [];
    setParticipants(participantRows);
    setResults(r.data || []);
    setDrafts(makeDrafts(participantRows));
    setProofUrl("");
    setSearch("");
    setLoading(false);
  }

  async function completeTournament() {
    if (!tournamentId || !window.confirm("Mark this tournament as completed?")) return;
    setBusy("complete");
    const { error } = await supabase.rpc("admin_complete_tournament", { p_tournament_id: Number(tournamentId) });
    setMessage(error?.message || "Tournament completed.");
    if (!error) { await loadTournaments(); await loadData(); }
    setBusy("");
  }

  function updatePosition(participantId, value) {
    setDrafts((prev) => ({ ...prev, [participantId]: { ...prev[participantId], position: value } }));
  }

  function updateKills(participantId, uid, value) {
    setDrafts((prev) => ({
      ...prev,
      [participantId]: { ...prev[participantId], kills: { ...prev[participantId].kills, [uid]: value } },
    }));
  }

  async function saveAllResults() {
    if (!tournamentId) return;
    const payload = [];
    const usedPositions = new Set();

    for (const p of participants) {
      const draft = drafts[p.participant_id];
      const position = Number(draft?.position);
      if (!Number.isInteger(position) || position < 1) {
        setMessage(`Enter a valid finishing position for ${p.full_name || "every participant"}.`);
        return;
      }
      if (usedPositions.has(position)) {
        setMessage(`Position ${position} is used more than once.`);
        return;
      }
      usedPositions.add(position);

      const uids = Array.isArray(p.free_fire_uids) ? p.free_fire_uids : [];
      const playerKills = {};
      for (const uid of uids) {
        const value = draft?.kills?.[uid];
        if (value === "" || value === undefined || !Number.isInteger(Number(value)) || Number(value) < 0) {
          setMessage(`Enter valid kills for UID ${uid}.`);
          return;
        }
        playerKills[uid] = Number(value);
      }
      payload.push({ participant_id: Number(p.participant_id), position, player_kills: playerKills });
    }

    if (!payload.length) return setMessage("No joined participants found.");

    setBusy("saveAll");
    setMessage("");
    const { error } = await supabase.rpc("admin_create_bulk_uid_results", {
      p_tournament_id: Number(tournamentId),
      p_results: payload,
      p_proof_url: proofUrl.trim() || null,
    });
    if (error) setMessage(error.message);
    else { setMessage(`All ${payload.length} participant results saved for verification.`); await loadData(); }
    setBusy("");
  }

  async function verify(id, status) {
    const note = status === "REJECTED" ? window.prompt("Reason for rejection?") : null;
    if (status === "REJECTED" && !note?.trim()) return;
    setBusy("verify" + id);
    const { error } = await supabase.rpc("admin_set_result_verification", { p_result_id: id, p_status: status, p_note: note || null });
    setMessage(error?.message || `Result marked ${status}.`);
    if (!error) await loadData();
    setBusy("");
  }

  async function publish(id) {
    if (!window.confirm("Publish this verified result? Published results are locked.")) return;
    setBusy("publish" + id);
    const { error } = await supabase.rpc("publish_tournament_result", { p_result_id: id });
    setMessage(error?.message || "Result published and locked.");
    if (!error) await loadData();
    setBusy("");
  }

  async function approvePayout(id) {
    if (!window.confirm("Approve UID-wise wallet payout? Position prize goes to Captain; each player's kill reward goes to that UID account, or Captain if no account exists.")) return;
    setBusy("payout" + id);
    const { error } = await supabase.rpc("admin_approve_result_payout", { p_result_id: id });
    setMessage(error?.message || "UID-wise payout approved.");
    if (!error) await loadData();
    setBusy("");
  }

  async function verifyAll() {
    const pending = results.filter((r) => r.verification_status === "PENDING");
    if (!pending.length) return;
    if (!window.confirm(`Verify all ${pending.length} results? Check the result sheet first.`)) return;
    setBusy("verifyAll");
    for (const r of pending) {
      const { error } = await supabase.rpc("admin_set_result_verification", { p_result_id: r.id, p_status: "VERIFIED", p_note: null });
      if (error) { setMessage(error.message); setBusy(""); return; }
    }
    setMessage(`All ${pending.length} results verified.`);
    await loadData();
    setBusy("");
  }

  async function publishAll() {
    const verified = results.filter((r) => r.verification_status === "VERIFIED" && !r.published_at);
    if (!verified.length) return;
    if (!window.confirm(`Publish and lock all ${verified.length} verified results?`)) return;
    setBusy("publishAll");
    for (const r of verified) {
      const { error } = await supabase.rpc("publish_tournament_result", { p_result_id: r.id });
      if (error) { setMessage(error.message); setBusy(""); return; }
    }
    setMessage(`All ${verified.length} results published and locked.`);
    await loadData();
    setBusy("");
  }

  async function payoutAll() {
    const published = results.filter((r) => r.published_at);
    if (!published.length) return;
    if (!window.confirm(`Approve wallet payout for all ${published.length} published results?`)) return;
    setBusy("payoutAll");
    for (const r of published) {
      const { error } = await supabase.rpc("admin_approve_result_payout", { p_result_id: r.id });
      if (error) { setMessage(error.message); setBusy(""); return; }
    }
    setMessage(`Wallet payout approved for all ${published.length} results.`);
    await loadData();
    setBusy("");
  }

  const selected = tournaments.find((t) => String(t.id) === String(tournamentId));
  const hasResults = results.length > 0;
  const hasParticipants = participants.length > 0;
  const pendingCount = results.filter((r) => r.verification_status === "PENDING").length;
  const verifiedCount = results.filter((r) => r.verification_status === "VERIFIED" && !r.published_at).length;
  const publishedCount = results.filter((r) => r.published_at).length;

  const filteredParticipants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => {
      const uids = Array.isArray(p.free_fire_uids) ? p.free_fire_uids : [];
      return String(p.participant_id).includes(q) || String(p.full_name || "").toLowerCase().includes(q) || uids.some((uid) => String(uid).includes(q));
    });
  }, [participants, search]);

  const enteredCount = Object.values(drafts).filter((d) => d?.position).length;
  const totalCount = participants.length;

  return (
    <main style={s.page}>
      <header style={s.header}>
        <div><div style={s.kicker}>ADMIN PANEL</div><h1 style={s.title}>Results & Prize Control</h1></div>
        <button type="button" onClick={onBack} style={s.back}>Back</button>
      </header>

      {message && <div style={s.message}>{message}</div>}

      <section style={s.card}>
        <label style={s.label}>Tournament
          <select value={tournamentId} onChange={(e) => { setTournamentId(e.target.value); loadData(e.target.value); }} style={s.input}>
            <option value="">Select started/completed tournament</option>
            {tournaments.map((t) => <option key={t.id} value={t.id}>#{t.id} • {t.mode} • {t.tournament_date} • {t.scheduled_start_time.slice(0,5)} • {t.status}</option>)}
          </select>
        </label>
        {selected?.status === "STARTED" && <button type="button" disabled={busy === "complete"} onClick={completeTournament} style={s.secondary}>{busy === "complete" ? "Completing..." : "Mark Tournament Completed"}</button>}
      </section>

      {tournamentId && !loading && !hasParticipants && !hasResults && (
        <section style={s.emptyCard}>
          <div style={s.emptyIcon}>!</div>
          <h2 style={s.emptyTitle}>No participants joined</h2>
          <p style={s.emptyText}>এই tournament-এ কোনো player/team join করেনি। তাই এই match-এর জন্য result entry বা payout দেওয়ার কিছু নেই।</p>
          <button type="button" onClick={() => { setTournamentId(""); setParticipants([]); setResults([]); setDrafts({}); }} style={s.secondarySmall}>Choose Another Tournament</button>
        </section>
      )}

      {tournamentId && !hasResults && hasParticipants && (
        <section style={s.card}>
          <div style={s.sheetHeader}>
            <div><h2 style={s.sub}>Fast Result Sheet</h2><p style={s.sheetHint}>সব participant একসাথে আছে। Free Fire result sheet দেখে Position + Kills বসালেই হবে। UID খুঁজতে profile খুলতে হবে না।</p></div>
            <div style={s.progress}>{enteredCount}/{totalCount}</div>
          </div>

          <div style={s.info}>
            <strong>How to use</strong>
            <span>1. Free Fire result-এ নাম দেখে একই participant/UID খুঁজুন</span>
            <span>2. Position দিন</span>
            <span>3. প্রতিটি UID-এর kills দিন</span>
            <span>4. একবারে Proof URL দিয়ে Save All করুন</span>
          </div>

          <label style={s.label}>Search player / UID
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, UID or participant ID" style={s.input}/>
          </label>

          <label style={s.label}>Result Proof URL <span style={s.optional}>(একই result screenshot/link)</span>
            <input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://..." style={s.input}/>
          </label>

          <div style={s.list}>
            {filteredParticipants.length === 0 ? <div style={s.empty}>No matching participant.</div> :
              filteredParticipants.map((p) => {
                const uids = Array.isArray(p.free_fire_uids) ? p.free_fire_uids : [];
                const draft = drafts[p.participant_id] || { position: "", kills: {} };
                return <article key={p.participant_id} style={s.teamCard}>
                  <div style={s.teamHeader}>
                    <div><strong style={s.teamName}>{p.full_name || "Player"}</strong><div style={s.teamMeta}>Participant #{p.participant_id} • Captain UID {p.captain_free_fire_uid || "—"}</div></div>
                    <label style={s.positionBox}><span>POSITION</span><input type="number" min="1" value={draft.position} onChange={(e) => updatePosition(p.participant_id, e.target.value)} placeholder="#" style={s.positionInput}/></label>
                  </div>
                  <div style={s.uidList}>
                    {uids.map((uid) => <div key={uid} style={s.uidRow}>
                      <div style={s.uidInfo}><strong>{uid}</strong>{uid === p.captain_free_fire_uid && <span style={s.captain}>CAPTAIN</span>}</div>
                      <label style={s.killBox}><span>KILLS</span><input type="number" min="0" value={draft.kills?.[uid] ?? ""} onChange={(e) => updateKills(p.participant_id, uid, e.target.value)} placeholder="0" style={s.killInput}/></label>
                    </div>)}
                  </div>
                </article>;
              })}
          </div>

          <div style={s.rule}>Position prize → Captain wallet<br/>Kill reward → each UID's wallet; no account → Captain wallet</div>
          <button type="button" disabled={busy === "saveAll" || loading || totalCount === 0} onClick={saveAllResults} style={s.primary}>
            {busy === "saveAll" ? "Saving All Results..." : `Save All ${totalCount} Results for Verification`}
          </button>
        </section>
      )}

      {tournamentId && hasResults && (
        <section style={s.card}>
          <div style={s.sheetHeader}>
            <div><h2 style={s.sub}>Verification & Publish</h2><p style={s.sheetHint}>Result entry একবারে হয়ে গেছে। এখন প্রতিটি ধাপে একটি করে bulk action ব্যবহার করতে পারবে।</p></div>
            <div style={s.progress}>{results.length}</div>
          </div>
          <div style={s.stageGrid}>
            {pendingCount > 0 && <button type="button" disabled={busy === "verifyAll"} onClick={verifyAll} style={s.primarySmall}>{busy === "verifyAll" ? "Verifying..." : `✓ Verify All (${pendingCount})`}</button>}
            {verifiedCount > 0 && <button type="button" disabled={busy === "publishAll"} onClick={publishAll} style={s.primarySmall}>{busy === "publishAll" ? "Publishing..." : `Publish & Lock All (${verifiedCount})`}</button>}
            {publishedCount > 0 && <button type="button" disabled={busy === "payoutAll"} onClick={payoutAll} style={s.secondarySmall}>{busy === "payoutAll" ? "Processing..." : `Approve All Payouts (${publishedCount})`}</button>}
          </div>
          <div style={s.stageNote}>প্রতিটি bulk button-এর আগে confirmation থাকবে। কোনো একটি step fail হলে সেখানেই থামবে এবং error দেখাবে।</div>
        </section>
      )}

      <section style={s.list}>
        {loading ? <div style={s.empty}>Loading results...</div> : results.length === 0 && tournamentId && hasParticipants ? <div style={s.empty}>No results entered yet.</div> :
          results.map((r) => <article key={r.id} style={s.result}>
            <div style={s.resultTop}>
              <div><strong>#{r.position} Position</strong><div style={s.muted}>{r.kills} total kills • Position ৳{Number(r.position_prize).toFixed(0)} • Kill ৳{Number(r.kill_reward).toFixed(0)}</div></div>
              <span style={badge(r.verification_status)}>{r.verification_status}</span>
            </div>
            <div style={s.total}>Total payout: ৳{Number(r.total_payout).toFixed(0)}</div>
            {r.proof_url && <a href={r.proof_url} target="_blank" rel="noreferrer" style={s.link}>Open Proof</a>}
            <div style={s.actions}>
              {r.verification_status === "PENDING" && <><button type="button" disabled={busy === "verify" + r.id} onClick={() => verify(r.id, "VERIFIED")} style={s.primarySmall}>Verify</button><button type="button" disabled={busy === "verify" + r.id} onClick={() => verify(r.id, "REJECTED")} style={s.danger}>Reject</button></>}
              {r.verification_status === "VERIFIED" && !r.published_at && <button type="button" disabled={busy === "publish" + r.id} onClick={() => publish(r.id)} style={s.primarySmall}>Publish & Lock</button>}
              {r.published_at && <button type="button" disabled={busy === "payout" + r.id} onClick={() => approvePayout(r.id)} style={s.secondarySmall}>Approve UID-wise Wallet Payout</button>}
            </div>
          </article>)}
      </section>
    </main>
  );
}

function badge(v) { return { ...s.badge, color: v === "VERIFIED" ? "#77e39b" : v === "REJECTED" ? "#ff6b6b" : "#ffc064" }; }

const s = {
  page:{minHeight:"100vh",background:"#0b0b0e",color:"#f7f7f8",padding:"20px 18px 40px",maxWidth:"760px",margin:"0 auto"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:20},
  kicker:{color:"#ff7130",fontSize:10,fontWeight:900,letterSpacing:2},
  title:{margin:"5px 0",fontSize:24},
  back:{border:"1px solid #5a2a20",borderRadius:10,background:"#1b1415",color:"#ff9b4a",padding:"10px 12px",fontWeight:800},
  message:{padding:12,marginBottom:14,borderRadius:12,background:"#171417",border:"1px solid #3b2928",color:"#ffc064",fontSize:12},
  card:{padding:16,borderRadius:18,background:"#121216",border:"1px solid #29272b",marginBottom:12},
  emptyCard:{padding:18,borderRadius:18,background:"#121216",border:"1px solid #3a2b2f",marginBottom:12,textAlign:"center"},
  emptyIcon:{width:38,height:38,borderRadius:"50%",background:"#2a1919",color:"#ff9b63",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontWeight:900},
  emptyTitle:{margin:"0 0 6px",fontSize:18},
  emptyText:{margin:"0 auto 14px",maxWidth:480,color:"#8f8c93",fontSize:11,lineHeight:1.6},
  label:{display:"grid",gap:6,marginTop:10,color:"#aaa4aa",fontSize:10,fontWeight:800},
  optional:{fontWeight:600,color:"#666"},
  input:{width:"100%",boxSizing:"border-box",border:"1px solid #3b2c2e",borderRadius:10,background:"#0f0e11",color:"#fff",padding:11,outline:"none"},
  sub:{fontSize:17,margin:"0 0 4px"},
  sheetHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12},
  sheetHint:{margin:"5px 0 0",color:"#8f8c93",fontSize:10,lineHeight:1.5},
  progress:{minWidth:34,height:34,borderRadius:10,background:"#24191a",color:"#ff9b63",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:11},
  info:{display:"grid",gap:4,marginTop:12,padding:11,borderRadius:11,background:"#181416",border:"1px solid #33282c",color:"#b9aeb2",fontSize:9,lineHeight:1.5},
  list:{display:"grid",gap:10},
  teamCard:{padding:13,borderRadius:15,background:"#151317",border:"1px solid #32282d"},
  teamHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10},
  teamName:{fontSize:14,color:"#fff"},
  teamMeta:{marginTop:4,color:"#8d8790",fontSize:9},
  positionBox:{display:"grid",gap:4,textAlign:"right",color:"#ff9b63",fontSize:8,fontWeight:900},
  positionInput:{width:58,boxSizing:"border-box",padding:"8px",border:"1px solid #5a342d",borderRadius:9,background:"#0f0e11",color:"#fff",textAlign:"center",fontWeight:900},
  uidList:{marginTop:9,borderTop:"1px solid #282329"},
  uidRow:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #242126"},
  uidInfo:{display:"flex",alignItems:"center",gap:7,minWidth:0},
  captain:{padding:"3px 5px",borderRadius:5,background:"#2a1a1a",color:"#ff9b63",fontSize:7,fontWeight:900},
  killBox:{display:"grid",gridTemplateColumns:"auto 58px",alignItems:"center",gap:6,color:"#8e878f",fontSize:8,fontWeight:900},
  killInput:{width:58,boxSizing:"border-box",border:"1px solid #453139",borderRadius:8,background:"#0f0e11",color:"#fff",padding:"8px",textAlign:"center"},
  primary:{width:"100%",marginTop:15,padding:13,border:0,borderRadius:11,background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:900},
  secondary:{width:"100%",marginTop:12,padding:11,border:"1px solid #743021",borderRadius:10,background:"#291716",color:"#ffae6d",fontWeight:900},
  stageGrid:{display:"grid",gap:8,marginTop:14},
  stageNote:{marginTop:10,color:"#7f7780",fontSize:9,lineHeight:1.5},
  rule:{marginTop:12,padding:10,borderRadius:9,background:"#1a1516",color:"#c9a18c",fontSize:9,lineHeight:1.6},
  empty:{padding:16,borderRadius:15,background:"#121216",border:"1px solid #29272b",color:"#8f8c93"},
  result:{padding:15,borderRadius:16,background:"#121216",border:"1px solid #29272b"},
  resultTop:{display:"flex",justifyContent:"space-between",gap:10},
  muted:{marginTop:6,color:"#8f8c93",fontSize:10},
  badge:{padding:"6px 8px",borderRadius:8,background:"#1c191c",fontSize:9,fontWeight:900},
  total:{marginTop:9,color:"#ffc064",fontWeight:900},
  link:{display:"inline-block",marginTop:8,color:"#ff9b63",fontSize:10},
  actions:{display:"flex",gap:8,flexWrap:"wrap",marginTop:12},
  primarySmall:{padding:"9px 11px",border:0,borderRadius:9,background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:900,fontSize:10},
  danger:{padding:"9px 11px",border:"1px solid #71302b",borderRadius:9,background:"#261516",color:"#ff7d70",fontWeight:900,fontSize:10},
  secondarySmall:{padding:"9px 11px",border:"1px solid #743021",borderRadius:9,background:"#291716",color:"#ffae6d",fontWeight:900,fontSize:10},
};