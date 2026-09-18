import React from "react";

export default function BottomNav({ activePage, onChange }) {
  const items = [
    { id: "home", label: "Home", icon: "⌂" },
    { id: "tournaments", label: "Tournaments", icon: "🏆" },
    { id: "my-tournaments", label: "My Tournaments", icon: "🎮" },
    { id: "wallet", label: "Wallet", icon: "৳" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <nav style={styles.nav}>
      {items.map((item) => {
        const active = activePage === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              ...styles.button,
              ...(active ? styles.activeButton : {}),
            }}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span style={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
    background: "#111827",
    borderTop: "1px solid #283247",
  },

  button: {
    border: "none",
    background: "transparent",
    color: "#7f8ba3",
    padding: "7px 2px",
    display: "grid",
    justifyItems: "center",
    gap: "3px",
    cursor: "pointer",
  },

  activeButton: {
    color: "#b8a0ff",
  },

  icon: {
    fontSize: "18px",
    lineHeight: 1,
  },

  label: {
    fontSize: "9px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
};
