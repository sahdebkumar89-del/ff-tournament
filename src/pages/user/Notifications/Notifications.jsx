import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client.js";

const TYPE_META = {
  ANNOUNCEMENT: { label: "Announcement", icon: "◈" },
  MATCH_REMINDER: { label: "Match", icon: "◷" },
  ROOM_RELEASED: { label: "Room", icon: "▣" },
  RESULT_PUBLISHED: { label: "Result", icon: "✓" },
  WALLET: { label: "Wallet", icon: "৳" },
  PAYMENT: { label: "Payment", icon: "↕" },
  CANCELLATION: { label: "Cancelled", icon: "!" },
  REFUND: { label: "Refund", icon: "↩" },
  SECURITY: { label: "Security", icon: "◆" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error: notificationError } = await supabase
      .from("notifications")
      .select("id,tournament_id,notification_type,title,body,deep_link,is_mandatory,created_at")
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (notificationError) {
      setError("Unable to load notifications right now.");
      setLoading(false);
      return;
    }

    const ids = (data || []).map((item) => item.id);
    let reads = [];
    if (ids.length) {
      const { data: readData } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id)
        .in("notification_id", ids);
      reads = readData || [];
    }

    setNotifications(data || []);
    setReadIds(new Set(reads.map((item) => item.notification_id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readIds.has(item.id)).length,
    [notifications, readIds]
  );

  async function markRead(notificationId) {
    if (readIds.has(notificationId)) return;

    const { error: markError } = await supabase.rpc("mark_notification_read", {
      p_notification_id: notificationId,
    });

    if (!markError) {
      setReadIds((current) => {
        const next = new Set(current);
        next.add(notificationId);
        return next;
      });
    }
  }

  async function openNotification(notification) {
    await markRead(notification.id);
    if (notification.deep_link) {
      window.dispatchEvent(
        new CustomEvent("ff-notification-deeplink", {
          detail: { deepLink: notification.deep_link, notification },
        })
      );
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.smallText}>UPDATES</div>
          <h1 style={styles.title}>Notifications</h1>
        </div>
        <div style={styles.headerActions}>
          <span style={styles.badge}>{unreadCount}</span>
          <button type="button" onClick={loadNotifications} style={styles.refreshButton} aria-label="Refresh notifications">
            ↻
          </button>
        </div>
      </div>

      {loading && <div style={styles.statusCard}>Loading notifications...</div>}
      {error && <div style={styles.statusCard}>{error}</div>}

      {!loading && !error && notifications.length === 0 && (
        <section style={styles.emptyCard}>
          <div style={styles.icon}>♢</div>
          <h2 style={styles.emptyTitle}>No notifications yet</h2>
          <p style={styles.emptyText}>
            Tournament updates, room details, results, wallet updates,
            cancellations, and other important notifications will appear here.
          </p>
        </section>
      )}

      {!loading && !error && notifications.length > 0 && (
        <section style={styles.list}>
          {notifications.map((notification) => {
            const unread = !readIds.has(notification.id);
            const meta = TYPE_META[notification.notification_type] || TYPE_META.ANNOUNCEMENT;

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                style={{ ...styles.item, ...(unread ? styles.unreadItem : {}) }}
              >
                <div style={{ ...styles.itemIcon, ...(unread ? styles.unreadIcon : {}) }}>
                  {meta.icon}
                </div>
                <div style={styles.itemContent}>
                  <div style={styles.itemTop}>
                    <span style={styles.type}>{meta.label}</span>
                    {notification.is_mandatory && <span style={styles.important}>IMPORTANT</span>}
                    <span style={styles.date}>{formatDate(notification.created_at)}</span>
                  </div>
                  <div style={styles.itemTitle}>{notification.title}</div>
                  <div style={styles.itemBody}>{notification.body}</div>
                </div>
                {unread && <span style={styles.unreadDot} />}
              </button>
            );
          })}
        </section>
      )}
    </main>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

const styles = {
  page: { maxWidth: "760px", margin: "0 auto", padding: "22px 18px 40px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" },
  smallText: { fontSize: "10px", letterSpacing: "2px", fontWeight: "900", color: "#8f8a8b" },
  title: { margin: "5px 0 0", fontSize: "26px", letterSpacing: "-.5px" },
  headerActions: { display: "flex", alignItems: "center", gap: "8px" },
  badge: {
    minWidth: "30px", height: "30px", padding: "0 8px", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "#3a1716", color: "#ff8d55", fontSize: "11px", fontWeight: "900",
  },
  refreshButton: {
    width: "38px", height: "38px", borderRadius: "12px", border: "1px solid #3b2929",
    background: "#151216", color: "#ff9b4a", fontSize: "20px",
  },
  statusCard: {
    padding: "18px", borderRadius: "18px", background: "#131113",
    border: "1px solid #2f2527", color: "#aaa4a6", textAlign: "center", fontSize: "13px",
  },
  emptyCard: {
    padding: "38px 20px", borderRadius: "20px", background: "#131113",
    border: "1px solid #33282a", textAlign: "center",
  },
  icon: {
    width: "56px", height: "56px", margin: "0 auto 12px", borderRadius: "17px",
    display: "grid", placeItems: "center", background: "#271718", color: "#ff7844", fontSize: "26px",
  },
  emptyTitle: { margin: "0 0 8px", fontSize: "20px" },
  emptyText: { maxWidth: "460px", margin: "0 auto", color: "#9b9597", fontSize: "13px", lineHeight: 1.6 },
  list: { display: "grid", gap: "10px" },
  item: {
    position: "relative", width: "100%", display: "flex", gap: "12px", textAlign: "left",
    padding: "15px", borderRadius: "18px", border: "1px solid #2c2628",
    background: "#121113", color: "#f7f7f8", cursor: "pointer",
  },
  unreadItem: { borderColor: "#5b3026", background: "linear-gradient(135deg, #1b1415, #121113)" },
  itemIcon: {
    flex: "0 0 42px", width: "42px", height: "42px", borderRadius: "13px",
    display: "grid", placeItems: "center", background: "#211c1e", color: "#a8a1a3", fontWeight: "900",
  },
  unreadIcon: { background: "#3a1b18", color: "#ff814b" },
  itemContent: { minWidth: 0, flex: 1 },
  itemTop: { display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" },
  type: { color: "#ff824b", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" },
  important: { color: "#ffb15d", fontSize: "8px", fontWeight: "900", letterSpacing: ".7px" },
  date: { marginLeft: "auto", color: "#686365", fontSize: "9px", whiteSpace: "nowrap" },
  itemTitle: { fontSize: "14px", fontWeight: "850", marginBottom: "5px" },
  itemBody: { color: "#aaa4a6", fontSize: "12px", lineHeight: 1.5 },
  unreadDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#ef4b35", marginTop: "5px" },
};
