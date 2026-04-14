import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PendingDriversPage() {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [photoTitle, setPhotoTitle] = useState(""); // 🚨 To title the modal
  const [rejectingDriver, setRejectingDriver] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/pending-drivers",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPendingDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this driver?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `http://localhost:5000/api/admin/driver/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPendingDrivers(pendingDrivers.filter((d) => d.driver_id !== id));
    } catch (error) {
      alert("Error approving driver.");
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return alert("Please provide a reason.");
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `http://localhost:5000/api/admin/driver/${rejectingDriver.driver_id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPendingDrivers(
        pendingDrivers.filter((d) => d.driver_id !== rejectingDriver.driver_id),
      );
      setRejectingDriver(null);
      setRejectReason("");
    } catch (error) {
      alert("Error rejecting driver.");
    }
  };

  const openPhoto = (path, title) => {
    setViewingPhoto(`http://localhost:5000${path}`);
    setPhotoTitle(title);
  };

  if (loading)
    return (
      <div style={styles.page}>
        <h2>Loading...</h2>
      </div>
    );

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Pending Driver Approvals</h1>
        <span style={styles.countBadge}>{pendingDrivers.length} Pending</span>
      </div>

      <div style={styles.tableContainer}>
        {pendingDrivers.length === 0 ? (
          <div style={styles.emptyState}>
            ✅ No pending driver applications!
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Student Info</th>
                <th style={styles.th}>Vehicle Details</th>
                <th style={styles.th}>Images</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDrivers.map((driver) => (
                <tr key={driver.driver_id} style={styles.tdRow}>
                  <td style={styles.td}>
                    <strong>{driver.full_name}</strong>
                    <br />
                    <span style={styles.subText}>
                      {driver.roll_no} | {driver.phone_number}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <strong>{driver.vehicle_details}</strong>
                    <br />
                    <span style={styles.subText}>
                      Plate: {driver.plate_number} | DL: {driver.license_no}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        flexDirection: "column",
                      }}
                    >
                      <button
                        onClick={() =>
                          openPhoto(
                            driver.license_image_path,
                            "Driving License",
                          )
                        }
                        style={styles.photoBtn}
                      >
                        📸 View DL
                      </button>
                      <button
                        onClick={() =>
                          openPhoto(driver.vehicle_image_path, "Vehicle Photo")
                        }
                        style={styles.photoBtn}
                      >
                        🚗 View Vehicle
                      </button>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionRow}>
                      <button
                        onClick={() => handleApprove(driver.driver_id)}
                        style={styles.approveBtn}
                      >
                        Approve ✓
                      </button>
                      <button
                        onClick={() => setRejectingDriver(driver)}
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

      {viewingPhoto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{photoTitle}</h3>
            <img src={viewingPhoto} alt={photoTitle} style={styles.largeImg} />
            <button
              onClick={() => setViewingPhoto(null)}
              style={styles.closeBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {rejectingDriver && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Reject {rejectingDriver.full_name}'s Vehicle?</h3>
            <textarea
              style={styles.textArea}
              placeholder="Reason (e.g., License plate not visible)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={styles.modalActions}>
              <button
                onClick={() => setRejectingDriver(null)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={submitReject} style={styles.confirmRejectBtn}>
                Reject
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
    fontSize: "12px",
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
  largeImg: {
    width: "100%",
    borderRadius: "8px",
    margin: "20px 0",
    objectFit: "contain",
  },
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
