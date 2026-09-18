import React from "react";

const items = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "tournaments", label: "Tournaments", icon: "♛" },
  { id: "my-tournaments", label: "My Tournaments", icon: "◈" },
  { id: "wallet", label: "Wallet", icon: "৳" },
  { id: "profile", label: "Profile", icon: "●" },
];

export default function BottomNav({ activePage, onChange }) {
  return (
    <nav style={styles.nav} aria-label="Primary navigation">
      <div style={styles.inner}>
        {items.map((item) => {
          const active = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={active ? "page" : undefined}
              style={{ ...styles.button, ...(active ? styles.activeButton : {}) }}
            >
              <span style={{ ...styles.icon, ...(active ? styles.activeIcon : {}) }}>
                {item.icon}
              </span>
              <span style={{ ...styles.label, ...(active ? styles.activeLabel : {}) }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
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
    padding: "7px 10px calc(7px + env(safe-area-inset-bottom))",
    background: "rgba(13, 12, 15, .97)",
    borderTop: "1px solid #2b2729",
    backdropFilter: "blur(14px)",
  },
  inner: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
  },
  button: {
    border: "none",
    background: "transparent",
    color: "#77747b",
    padding: "6px 2px",
    display: "grid",
    justifyItems: "center",
    gap: "4px",
  },
  activeButton: { color: "#ff7b35" },
  icon: {
    width: "24px",
    height: "24px",
    display: "grid",
    placeItems: "center",
    fontSize: "19px",
    lineHeight: 1,
    borderRadius: "8px",
  },
  activeIcon: {
    background: "#351a18",
    color: "#ff9b55",
  },
  label: {
    fontSize: "9px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  activeLabel: { color: "#ff9b55" },
};
