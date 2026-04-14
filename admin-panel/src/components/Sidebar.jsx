import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: "/verifications", label: "⏳ Pending Verifications" },
    { path: "/users", label: "👥 All Users" },
    { path: "/driver-approvals", label: "🚗 Driver Approvals" },
    { path: "/reports", label: "📊 Reports" },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>CampusRide Admin</div>
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              ...(location.pathname === item.path ? styles.activeLink : {}),
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} style={styles.logoutBtn}>
        🚪 Logout
      </button>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "250px",
    backgroundColor: "#0F172A",
    color: "white",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
  },
  logo: {
    padding: "24px",
    fontSize: "20px",
    fontWeight: "bold",
    borderBottom: "1px solid #1E293B",
    color: "#38BDF8",
  },
  nav: {
    flex: 1,
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  link: {
    padding: "12px 24px",
    color: "#CBD5E1",
    textDecoration: "none",
    fontSize: "15px",
    transition: "0.2s",
  },
  activeLink: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    borderLeft: "4px solid #38BDF8",
  },
  logoutBtn: {
    padding: "20px 24px",
    borderTop: "1px solid #1E293B",
    backgroundColor: "transparent",
    color: "#F87171",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
    marginTop: "auto",
  },
};
