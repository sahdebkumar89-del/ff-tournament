import React from "react";

const sections = [
  {
    title: "🎮 Tournament Basics",
    items: [
      ["Mode", "শুধু Free Fire BR — Solo, Duo ও Squad। Clash Squad / CS নেই।"],
      ["Entry Fee", "Solo ৳10 • Duo ৳20 • Squad ৳50"],
      ["Capacity", "Solo 50 players • Duo 25 teams • Squad 12 teams"],
      ["Schedule", "প্রতিটি slot 30 মিনিট পরপর Solo → Duo → Squad rotation-এ চলে।"],
    ],
  },
  {
    title: "🏆 Prize & Kill Reward",
    items: [
      ["Solo", "1st ৳50 • 2nd ৳40 • 3rd ৳30 • প্রতি Kill ৳5"],
      ["Duo", "1st ৳70 • 2nd ৳50 • 3rd ৳30 • প্রতি Kill ৳5"],
      ["Squad", "1st ৳120 • 2nd ৳80 • 3rd ৳60 • প্রতি Kill ৳5"],
      ["Kill Reward", "Kill reward individual player অনুযায়ী হিসাব করা হয়।"],
    ],
  },
  {
    title: "🔐 Room ID & Password",
    items: [
      ["Release", "Match শুরু হওয়ার 10 মিনিট আগে joined players-দের জন্য Room ID & Password release হয়।"],
      ["Access", "শুধু joined players room details দেখতে পারে।"],
      ["Admin", "প্রয়োজনে Admin Release Now করতে পারেন।"],
    ],
  },
  {
    title: "📋 Result & Payout",
    items: [
      ["Result", "Admin position, kills ও প্রয়োজনীয় proof verify করে result publish করেন।"],
      ["Payout", "Verified ও published result-এর payout Admin approval-এর পর wallet-এ credit হয়।"],
      ["History", "Published result-এ position, kills, payout এবং payment status দেখা যাবে।"],
    ],
  },
  {
    title: "💳 Wallet",
    items: [
      ["Deposit", "Deposit-এর জন্য bKash / Nagad ব্যবহার করা যাবে। App-এ Admin-configured number দেখাবে।"],
      ["Withdrawal", "Minimum withdrawal ৳50।"],
      ["Approval", "Deposit ও payout-related wallet credit Admin approval-এর মাধ্যমে হয়।"],
    ],
  },
  {
    title: "🔄 Re-registration Rule",
    items: [
      ["After Completion", "Tournament complete হওয়ার 1 hour পরে একই permanent slot-এর next-day registration ready হয়।"],
      ["No Participants", "0 participant থাকলে 5-minute wait নেই — next-day registration directly ready হয়।"],
      ["Short Match", "Capacity-এর কম participant থাকলে start time-এর পর সর্বোচ্চ 5 মিনিট পর্যন্ত Admin manual start করতে পারেন। Start না হলে next-day registration ready হয়।"],
      ["Important", "Next-day registration একই scheduled time slot অনুযায়ী হবে।"],
    ],
  },
  {
    title: "⚠️ Important",
    items: [
      ["BR Only", "সব tournament Free Fire Battle Royale-এর জন্য।"],
      ["No Late Slots", "11 PM-এর পরে নতুন tournament নেই; 11:30 PM slot schedule-এর শেষ slot।"],
      ["Fair Play", "সঠিক UID ও প্রয়োজনীয় তথ্য দিয়ে register করুন এবং tournament-এর নিয়ম মেনে খেলুন।"],
    ],
  },
];

export default function HelpRules() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>PLAYER GUIDE</div>
          <h1 style={styles.title}>Help & Rules</h1>
          <p style={styles.subtitle}>Tournament, room, result এবং wallet কীভাবে কাজ করে — সহজভাবে এক জায়গায়।</p>
        </div>
        <span style={styles.badge}>BR ONLY</span>
      </header>

      <section style={styles.notice}>
        <strong>📌 আগে এটা জানুন</strong>
        <p>Join করার আগে আপনার tournament mode, entry fee এবং scheduled time দেখে নিন।</p>
      </section>

      <div style={styles.list}>
        {sections.map((section) => (
          <section key={section.title} style={styles.card}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>
            <div>
              {section.items.map(([label, text]) => (
                <div key={label} style={styles.row}>
                  <span style={styles.label}>{label}</span>
                  <span style={styles.text}>{text}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div style={styles.footer}>Need help? Check Notifications for important tournament updates and room information.</div>
    </main>
  );
}

const styles = {
  page: { maxWidth: "760px", margin: "0 auto", padding: "22px 18px 40px" },
  header: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", marginBottom: "16px" },
  kicker: { fontSize: "9px", letterSpacing: "1.8px", fontWeight: "900", color: "#ff7130" },
  title: { margin: "5px 0 0", fontSize: "27px", letterSpacing: "-.6px" },
  subtitle: { margin: "6px 0 0", color: "#85828a", fontSize: "11px", lineHeight: 1.5 },
  badge: { padding: "7px 9px", borderRadius: "8px", background: "#241719", color: "#ff8964", fontSize: "9px", fontWeight: "900", whiteSpace: "nowrap" },
  notice: { padding: "13px 14px", borderRadius: "15px", background: "linear-gradient(145deg, #211714, #141316)", border: "1px solid #4b2925", marginBottom: "12px" },
  noticeStrong: { color: "#ff9b5a" },
  notice: { padding: "13px 14px", borderRadius: "15px", background: "linear-gradient(145deg, #211714, #141316)", border: "1px solid #4b2925", marginBottom: "12px", color: "#f4eff0" },
  noticeP: { margin: "5px 0 0", color: "#9a9498", fontSize: "10px", lineHeight: 1.5 },
  list: { display: "grid", gap: "11px" },
  card: { padding: "14px", borderRadius: "17px", background: "#121216", border: "1px solid #2e2a2d" },
  sectionTitle: { margin: "0 0 10px", fontSize: "14px", color: "#ff9b5a" },
  row: { display: "grid", gridTemplateColumns: "94px minmax(0, 1fr)", gap: "10px", padding: "9px 0", borderTop: "1px solid #27252a" },
  label: { color: "#77747d", fontSize: "9px", fontWeight: "900", textTransform: "uppercase" },
  text: { color: "#d5d1d3", fontSize: "10px", lineHeight: 1.5 },
  footer: { marginTop: "12px", padding: "11px", borderRadius: "12px", background: "#171416", color: "#89858a", fontSize: "9px", lineHeight: 1.5, textAlign: "center" },
};
