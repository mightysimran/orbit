import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PendingVerificationsPage() {
  // 🚨 Starts completely empty, no dummy data!
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // 1. Fetch live data from PostgreSQL on load
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/pending-users",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Load the real database rows into the table
      setPendingUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Approve to Backend
  const handleApprove = async (id) => {
    if (!window.confirm("Approve this user? This gives them full access."))
      return;

    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `http://localhost:5000/api/admin/user/${id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Remove them from the screen instantly
      setPendingUsers(pendingUsers.filter((u) => u.id !== id));
      alert("User approved successfully!");
    } catch (error) {
      alert("Error approving user. Check console.");
    }
  };

  // 3. Send Reject to Backend
  const submitReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `http://localhost:5000/api/admin/user/${rejectingUser.id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setPendingUsers(pendingUsers.filter((u) => u.id !== rejectingUser.id));
      setRejectingUser(null);
      setRejectReason("");
      alert("User rejected.");
    } catch (error) {
      alert("Error rejecting user.");
    }
  };

  if (loading)
    return (
      <div style={styles.page}>
        <h2>Loading pending verifications...</h2>
      </div>
    );

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Pending Verifications</h1>
        <span style={styles.countBadge}>{pendingUsers.length} Pending</span>
      </div>

      <div style={styles.tableContainer}>
        {pendingUsers.length === 0 ? (
          <div style={styles.emptyState}>
            ✅ All caught up! No pending verifications.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Roll Number</th>
                <th style={styles.th}>Applied On</th>
                <th style={styles.th}>ID Card</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id} style={styles.tdRow}>
                  <td style={styles.td}>
                    {/* Database column is full_name, not name! */}
                    <strong>{user.full_name}</strong>
                    <br />
                    <span style={styles.subText}>{user.email}</span>
                  </td>
                  <td style={styles.td}>{user.roll_no}</td>
                  <td style={styles.td}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    {/* Maps to the live server URL! */}
                    <button
                      onClick={() =>
                        setViewingPhoto(
                          user.image_path
                            ? `http://localhost:5000${user.image_path}`
                            : "null",
                        )
                      }
                      style={styles.photoBtn}
                    >
                      📸 View Photo
                    </button>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionRow}>
                      <button
                        onClick={() => handleApprove(user.id)}
                        style={styles.approveBtn}
                      >
                        Approve ✓
                      </button>
                      <button
                        onClick={() => setRejectingUser(user)}
                        style={styles.rejectBtn}
                      >
                        Reject ✗
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ID CARD MODAL */}
      {viewingPhoto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Uploaded Document</h3>
            {viewingPhoto === "null" || viewingPhoto.endsWith("null") ? (
              <p style={{ color: "red", margin: "20px 0" }}>
                No ID card found for this user.
              </p>
            ) : (
              <img src={viewingPhoto} alt="ID Card" style={styles.largeImg} />
            )}
            <button
              onClick={() => setViewingPhoto(null)}
              style={styles.closeBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Reject {rejectingUser.full_name}?</h3>
            <p style={styles.subText}>
              Please provide a reason so the student can correct it.
            </p>
            <textarea
              style={styles.textArea}
              placeholder="e.g. Invalid Roll Number format."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={styles.modalActions}>
              <button
                onClick={() => setRejectingUser(null)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={submitReject} style={styles.confirmRejectBtn}>
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    backgroundColor: "#F8FAFC",
    minHeight: "calc(100vh - 70px)",
    fontFamily: "system-ui, sans-serif",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },
  title: { margin: 0, color: "#0F172A" },
  countBadge: {
    backgroundColor: "#FEF08A",
    color: "#854D0E",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  emptyState: {
    padding: "50px",
    textAlign: "center",
    color: "#64748B",
    fontSize: "18px",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  thRow: { backgroundColor: "#F1F5F9", borderBottom: "2px solid #E2E8F0" },
  th: {
    padding: "16px",
    color: "#475569",
    fontSize: "13px",
    textTransform: "uppercase",
  },
  tdRow: { borderBottom: "1px solid #E2E8F0" },
  td: {
    padding: "16px",
    color: "#0F172A",
    fontSize: "15px",
    verticalAlign: "middle",
  },
  subText: { color: "#64748B", fontSize: "13px" },
  photoBtn: {
    backgroundColor: "#E0F2FE",
    color: "#0284C7",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
  actionRow: { display: "flex", gap: "10px" },
  approveBtn: {
    backgroundColor: "#22C55E",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  rejectBtn: {
    backgroundColor: "#EF4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "400px",
    maxWidth: "90%",
  },
  largeImg: { width: "100%", borderRadius: "8px", margin: "20px 0" },
  closeBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#F1F5F9",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  textArea: {
    width: "100%",
    height: "100px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    marginTop: "15px",
    marginBottom: "20px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  modalActions: { display: "flex", gap: "10px", justifyContent: "flex-end" },
  cancelBtn: {
    padding: "10px 16px",
    backgroundColor: "#F1F5F9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  confirmRejectBtn: {
    padding: "10px 16px",
    backgroundColor: "#EF4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
