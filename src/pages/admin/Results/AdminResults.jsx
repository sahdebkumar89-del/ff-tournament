import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

const TYPES=["PENDING","VERIFIED","REJECTED"];

export default function AdminResults({ onBack }) {
  const [tournaments,setTournaments]=useState([]);
  const [tournamentId,setTournamentId]=useState("");
  const [participants,setParticipants]=useState([]);
  const [results,setResults]=useState([]);
  const [form,setForm]=useState({participantId:"",position:"",kills:"0",proofUrl:""});
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");

  useEffect(()=>{ loadTournaments(); },[]);

  async function loadTournaments(){
    const {data,error}=await supabase.from("tournaments").select("id,mode,tournament_date,scheduled_start_time,status")
      .in("status",["STARTED","COMPLETED"]).order("tournament_date",{ascending:false}).order("scheduled_start_time",{ascending:false}).limit(100);
    if(error)setMessage(error.message); else setTournaments(data||[]);
  }

  async function loadData(id=tournamentId){
    if(!id)return;
    setLoading(true); setMessage("");
    const [pRes,rRes]=await Promise.all([
      supabase.rpc("admin_get_tournament_participants",{p_tournament_id:Number(id)}),
      supabase.from("tournament_results").select("*").eq("tournament_id",Number(id)).order("position",{ascending:true})
    ]);
    if(pRes.error)setMessage(pRes.error.message);
    if(rRes.error)setMessage(rRes.error.message);
    setParticipants(pRes.data||[]); setResults(rRes.data||[]); setLoading(false);
  }

  async function completeTournament(){
    if(!tournamentId)return;
    if(!window.confirm("Mark this tournament as completed?"))return;
    setBusy("complete"); setMessage("");
    const {error}=await supabase.rpc("admin_complete_tournament",{p_tournament_id:Number(tournamentId)});
    setMessage(error?.message||"Tournament completed.");
    if(!error){await loadTournaments(); await loadData();}
    setBusy("");
  }

  async function enterResult(){
    if(!tournamentId||!form.participantId||!form.position)return setMessage("Participant, position and kills are required.");
    setBusy("entry"); setMessage("");
    const {error}=await supabase.rpc("admin_create_tournament_result",{
      p_tournament_id:Number(tournamentId),p_participant_id:Number(form.participantId),
      p_position:Number(form.position),p_kills:Number(form.kills||0),p_proof_url:form.proofUrl.trim()||null
    });
    if(error)setMessage(error.message);
    else {setMessage("Result entered as PENDING.");setForm({participantId:"",position:"",kills:"0",proofUrl:""});await loadData();}
    setBusy("");
  }

  async function verify(id,status){
    const note=status==="REJECTED" ? window.prompt("Reason for rejection?") : null;
    if(status==="REJECTED" && !note?.trim())return;
    setBusy("verify"+id);
    const {error}=await supabase.rpc("admin_set_result_verification",{p_result_id:id,p_status:status,p_note:note||null});
    setMessage(error?.message||`Result marked ${status}.`);
    if(!error)await loadData();
    setBusy("");
  }

  async function publish(id){
    if(!window.confirm("Publish this verified result? Published results are locked."))return;
    setBusy("publish"+id);
    const {error}=await supabase.rpc("publish_tournament_result",{p_result_id:id});
    setMessage(error?.message||"Result published and locked.");
    if(!error)await loadData();
    setBusy("");
  }

  async function approvePayout(id){
    if(!window.confirm("Approve this published payout to the player's wallet?"))return;
    setBusy("payout"+id);
    const {error}=await supabase.rpc("admin_approve_result_payout",{p_result_id:id});
    setMessage(error?.message||"Prize payout approved.");
    if(!error)await loadData();
    setBusy("");
  }

  const selected=tournaments.find(t=>String(t.id)===String(tournamentId));

  return <main style={s.page}>
    <header style={s.header}><div><div style={s.kicker}>ADMIN PANEL</div><h1 style={s.title}>Results & Prize Control</h1></div><button onClick={onBack} style={s.back}>Back</button></header>
    {message&&<div style={s.message}>{message}</div>}
    <section style={s.card}>
      <label style={s.label}>Tournament
        <select value={tournamentId} onChange={e=>{setTournamentId(e.target.value);loadData(e.target.value)}} style={s.input}>
          <option value="">Select started/completed tournament</option>
          {tournaments.map(t=><option key={t.id} value={t.id}>#{t.id} • {t.mode} • {t.tournament_date} • {t.scheduled_start_time.slice(0,5)} • {t.status}</option>)}
        </select>
      </label>
      {selected?.status==="STARTED"&&<button disabled={busy==="complete"} onClick={completeTournament} style={s.secondary}>{busy==="complete"?"Completing...":"Mark Tournament Completed"}</button>}
    </section>

    {tournamentId&&<section style={s.card}>
      <h2 style={s.sub}>Enter Result</h2>
      <label style={s.label}>Participant
        <select value={form.participantId} onChange={e=>setForm({...form,participantId:e.target.value})} style={s.input}>
          <option value="">Select participant</option>
          {participants.map(p=><option key={p.participant_id} value={p.participant_id}>#{p.participant_id} • {p.full_name||"Player"} • UID {Array.isArray(p.free_fire_uids)?p.free_fire_uids.join(", "):""}</option>)}
        </select>
      </label>
      <div style={s.row}>
        <label style={s.label}>Position<input type="number" min="1" value={form.position} onChange={e=>setForm({...form,position:e.target.value})} style={s.input}/></label>
        <label style={s.label}>Kills<input type="number" min="0" value={form.kills} onChange={e=>setForm({...form,kills:e.target.value})} style={s.input}/></label>
      </div>
      <label style={s.label}>Proof URL <span style={s.optional}>(result screenshot link)</span><input value={form.proofUrl} onChange={e=>setForm({...form,proofUrl:e.target.value})} placeholder="https://..." style={s.input}/></label>
      <button disabled={busy==="entry"} onClick={enterResult} style={s.primary}>{busy==="entry"?"Saving...":"Save Result for Verification"}</button>
    </section>}

    <section style={s.list}>
      {loading?<div style={s.empty}>Loading results...</div>:results.length===0&&tournamentId?<div style={s.empty}>No results entered yet.</div>:results.map(r=><article key={r.id} style={s.result}>
        <div style={s.resultTop}><div><strong>#{r.position} Position</strong><div style={s.muted}>{r.kills} kills • Position ৳{Number(r.position_prize).toFixed(0)} • Kill ৳{Number(r.kill_reward).toFixed(0)}</div></div><span style={badge(r.verification_status)}>{r.verification_status}</span></div>
        <div style={s.total}>Total payout: ৳{Number(r.total_payout).toFixed(0)}</div>
        {r.proof_url&&<a href={r.proof_url} target="_blank" rel="noreferrer" style={s.link}>Open Proof</a>}
        <div style={s.actions}>
          {r.verification_status==="PENDING"&&<><button disabled={busy==="verify"+r.id} onClick={()=>verify(r.id,"VERIFIED")} style={s.primarySmall}>Verify</button><button disabled={busy==="verify"+r.id} onClick={()=>verify(r.id,"REJECTED")} style={s.danger}>Reject</button></>}
          {r.verification_status==="VERIFIED"&&!r.published_at&&<button disabled={busy==="publish"+r.id} onClick={()=>publish(r.id)} style={s.primarySmall}>Publish & Lock</button>}
          {r.published_at&&<button disabled={busy==="payout"+r.id} onClick={()=>approvePayout(r.id)} style={s.secondarySmall}>Approve Wallet Payout</button>}
        </div>
      </article>)}
    </section>
  </main>;
}
function badge(v){return {...s.badge,color:v==="VERIFIED"?"#77e39b":v==="REJECTED"?"#ff6b6b":"#ffc064"}}
const s={page:{minHeight:"100vh",background:"#0b0b0e",color:"#f7f7f8",padding:"20px 18px 40px",maxWidth:"760px",margin:"0 auto"},header:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:20},kicker:{color:"#ff7130",fontSize:10,fontWeight:900,letterSpacing:2},title:{margin:"5px 0",fontSize:24},back:{border:"1px solid #5a2a20",borderRadius:10,background:"#1b1415",color:"#ff9b4a",padding:"10px 12px",fontWeight:800},message:{padding:12,marginBottom:14,borderRadius:12,background:"#171417",border:"1px solid #3b2928",color:"#ffc064",fontSize:12},card:{padding:16,borderRadius:18,background:"#121216",border:"1px solid #29272b",marginBottom:12},label:{display:"grid",gap:6,marginTop:10,color:"#aaa4aa",fontSize:10,fontWeight:800},optional:{fontWeight:600,color:"#666"},input:{width:"100%",boxSizing:"border-box",border:"1px solid #3b2c2e",borderRadius:10,background:"#0f0e11",color:"#fff",padding:11,outline:"none"},row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},sub:{fontSize:15,margin:"0 0 5px"},primary:{width:"100%",marginTop:15,padding:12,border:0,borderRadius:11,background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:900},secondary:{width:"100%",marginTop:12,padding:11,border:"1px solid #743021",borderRadius:10,background:"#291716",color:"#ffae6d",fontWeight:900},list:{display:"grid",gap:10},empty:{padding:16,borderRadius:15,background:"#121216",border:"1px solid #29272b",color:"#8f8c93"},result:{padding:15,borderRadius:16,background:"#121216",border:"1px solid #29272b"},resultTop:{display:"flex",justifyContent:"space-between",gap:10},muted:{marginTop:6,color:"#8f8c93",fontSize:10},badge:{padding:"6px 8px",borderRadius:8,background:"#1c191c",fontSize:9,fontWeight:900},total:{marginTop:9,color:"#ffc064",fontWeight:900},link:{display:"inline-block",marginTop:8,color:"#ff9b63",fontSize:10},actions:{display:"flex",gap:8,flexWrap:"wrap",marginTop:12},primarySmall:{padding:"9px 11px",border:0,borderRadius:9,background:"linear-gradient(135deg,#ff7a2f,#e94231)",color:"#fff",fontWeight:900,fontSize:10},danger:{padding:"9px 11px",border:"1px solid #71302b",borderRadius:9,background:"#261516",color:"#ff7d70",fontWeight:900,fontSize:10},secondarySmall:{padding:"9px 11px",border:"1px solid #743021",borderRadius:9,background:"#291716",color:"#ffae6d",fontWeight:900,fontSize:10}};
