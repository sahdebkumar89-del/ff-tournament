import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../../app/providers/AuthProvider.jsx";
import { supabase } from "../../../lib/supabase/client.js";

export default function Profile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [freeFireUid, setFreeFireUid] = useState("");
  const [freeFireIgn, setFreeFireIgn] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!user) return;
      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("id,full_name,phone,free_fire_uid,free_fire_ign,role,created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (loadError) setError(loadError.message);
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setFreeFireUid(data.free_fire_uid || "");
        setFreeFireIgn(data.free_fire_ign || "");
      }
      setLoading(false);
    }
    loadProfile();
    return () => { active = false; };
  }, [user?.id]);

  async function saveProfile() {
    const uid = freeFireUid.trim();
    if (uid && !/^\d{5,20}$/.test(uid)) {
      setError("Free Fire UID must contain 5–20 digits.");
      return;
    }
    if (uid && !freeFireIgn.trim()) {
      setError("Please enter your Free Fire In-Game Name (IGN).");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { data, error: saveError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        free_fire_uid: uid || null,
        free_fire_ign: freeFireIgn.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)
      .select("id,full_name,phone,free_fire_uid,free_fire_ign,role,created_at")
      .single();

    if (saveError) {
      setError(saveError.code === "23505"
        ? "This Free Fire UID is already linked to another account."
        : saveError.message);
    } else {
      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setFreeFireUid(data.free_fire_uid || "");
      setFreeFireIgn(data.free_fire_ign || "");
      setEditing(false);
      setMessage("Profile updated successfully.");
    }
    setSaving(false);
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) setError(signOutError.message);
  }

  const displayName = profile?.full_name || (user?.email ? user.email.split("@")[0] : "Player");

  return (
    <main className="profile-page" style={styles.page}>
      <div style={styles.header}>
        <div><div style={styles.smallText}>ACCOUNT</div><h1 style={styles.title}>My Profile</h1></div>
        <span style={styles.badge}>BR ONLY</span>
      </div>

      {loading ? <section style={styles.card}><p style={styles.muted}>Loading profile...</p></section> : <>
        <section style={styles.profileCard}>
          <div style={styles.avatar}>{displayName.slice(0,1).toUpperCase()}</div>
          <h2 style={styles.name}>{displayName}</h2>
          <p style={styles.email}>{user?.email || "No email available"}</p>
          {profile?.free_fire_uid && <p style={styles.gameIdentity}>{profile.free_fire_ign || "Free Fire Player"} · UID {profile.free_fire_uid}</p>}
        </section>

        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Personal Information</h2>
          <div style={styles.row}><span>Email</span><strong>{user?.email || "—"}</strong></div>
          {editing ? <>
            <label style={styles.label}>Full Name<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" style={styles.input}/></label>
            <label style={styles.label}>Phone<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" style={styles.input}/></label>
            <div style={styles.buttonRow}>
              <button type="button" disabled={saving} onClick={saveProfile} style={styles.primaryButton}>{saving ? "Saving..." : "Save Changes"}</button>
              <button type="button" disabled={saving} onClick={()=>setEditing(false)} style={styles.secondaryButton}>Cancel</button>
            </div>
          </> : <>
            <div style={styles.row}><span>Full Name</span><strong>{profile?.full_name || "Not set"}</strong></div>
            <div style={styles.row}><span>Phone</span><strong>{profile?.phone || "Not set"}</strong></div>
          </>}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Free Fire Identity</h2>
          {editing ? <>
            <label style={styles.label}>Free Fire UID
              <input value={freeFireUid} onChange={e=>setFreeFireUid(e.target.value.replace(/\D/g,"").slice(0,20))} placeholder="Enter your Free Fire UID" inputMode="numeric" style={styles.input}/>
            </label>
            <label style={styles.label}>In-Game Name (IGN)
              <input value={freeFireIgn} onChange={e=>setFreeFireIgn(e.target.value)} placeholder="Your Free Fire in-game name" maxLength={50} style={styles.input}/>
            </label>
            <p style={styles.hint}>Use the UID and IGN of the Free Fire account you actually play with. The UID is unique and is used to identify your tournament player identity.</p>
            <div style={styles.buttonRow}>
              <button type="button" disabled={saving} onClick={saveProfile} style={styles.primaryButton}>{saving ? "Saving..." : "Save Game Identity"}</button>
              <button type="button" disabled={saving} onClick={()=>setEditing(false)} style={styles.secondaryButton}>Cancel</button>
            </div>
          </> : <>
            <div style={styles.row}><span>Free Fire UID</span><strong>{profile?.free_fire_uid || "Not set"}</strong></div>
            <div style={styles.row}><span>In-Game Name</span><strong>{profile?.free_fire_ign || "Not set"}</strong></div>
            <button type="button" onClick={()=>{setMessage("");setError("");setEditing(true)}} style={styles.primaryButton}>Edit Profile</button>
          </>}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Account</h2>
          <div style={styles.row}><span>Game Mode</span><strong>Battle Royale</strong></div>
          <div style={styles.row}><span>Role</span><strong>{profile?.role || "USER"}</strong></div>
          <div style={styles.row}><span>Account Status</span><strong style={styles.active}>Active</strong></div>
          <button type="button" className="profile-signout" onClick={signOut} style={styles.logoutButton}>Sign Out</button>
        </section>
      </>}
    </main>
  );
}

const styles = {
  page:{maxWidth:"760px",margin:"0 auto",padding:"22px 18px 40px"},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"22px"},
  smallText:{fontSize:"10px",letterSpacing:"2px",fontWeight:"800",color:"#9ca3af"},
  title:{margin:"5px 0 0",fontSize:"26px"},
  badge:{padding:"7px 10px",borderRadius:"9px",background:"#241719",color:"#ff9b5a",fontSize:"10px",fontWeight:"800"},
  profileCard:{padding:"28px 20px",borderRadius:"20px",background:"linear-gradient(145deg,#1d1517,#151116)",border:"1px solid #4b2925",textAlign:"center",marginBottom:"14px"},
  avatar:{width:"70px",height:"70px",margin:"0 auto 12px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"#2d1b1b",color:"#ff9b5a",fontSize:"28px",fontWeight:"900"},
  name:{margin:0,fontSize:"21px"},
  email:{margin:"6px 0 0",color:"#9ca3af",fontSize:"13px"},
  gameIdentity:{margin:"10px 0 0",color:"#ff9b5a",fontSize:"11px",fontWeight:"800"},
  card:{padding:"18px",borderRadius:"20px",background:"#131116",border:"1px solid #3b2930",marginBottom:"14px"},
  sectionTitle:{margin:"0 0 12px",fontSize:"18px"},
  row:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",padding:"11px 0",borderTop:"1px solid #2b2529",color:"#aaa4a8",fontSize:"13px"},
  label:{display:"grid",gap:"7px",marginTop:"12px",color:"#d8d2d5",fontSize:"12px",fontWeight:"800"},
  input:{width:"100%",boxSizing:"border-box",padding:"12px",borderRadius:"10px",border:"1px solid #443137",background:"#0f0e11",color:"#fff",outline:"none"},
  hint:{margin:"10px 0 0",color:"#77757c",fontSize:"11px",lineHeight:1.5},
  buttonRow:{display:"flex",gap:"8px",marginTop:"12px"},
  primaryButton:{width:"100%",marginTop:"12px",padding:"12px",border:0,borderRadius:"11px",background:"linear-gradient(135deg,#ff7a2f,#e84231)",color:"#fff",fontWeight:"900"},
  secondaryButton:{flex:1,padding:"12px",border:"1px solid #44363a",borderRadius:"11px",background:"#1a171a",color:"#ccc",fontWeight:"800"},
  logoutButton:{width:"100%",marginTop:"13px",padding:"12px",border:"1px solid #713038",borderRadius:"11px",background:"#2b171b",color:"#ffaaa8",fontWeight:"900"},
  active:{color:"#86efac"}, muted:{color:"#999"},
  success:{marginBottom:"12px",padding:"12px",borderRadius:"11px",background:"#14251a",border:"1px solid #245a38",color:"#8af0a8",fontSize:"12px"},
  error:{marginBottom:"12px",padding:"12px",borderRadius:"11px",background:"#2b1518",border:"1px solid #713038",color:"#ffaaa8",fontSize:"12px"}
};