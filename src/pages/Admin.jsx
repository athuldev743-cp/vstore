import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Admin.css";

export default function Admin({ user }) {
  const navigate = useNavigate();
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect non-admin users
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/"); // redirect to home if not admin
    }
  }, [user]);

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await StoreAPI.listPendingVendors();
      setPendingVendors(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load pending vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approve = async (id) => {
    try {
      await StoreAPI.approveVendor(id);
      alert("Vendor approved!");
      fetchPending();
    } catch (err) {
      alert(err.message || "Failed to approve.");
    }
  };

  const reject = async (id) => {
    try {
      await StoreAPI.rejectVendor(id);
      alert("Vendor rejected!");
      fetchPending();
    } catch (err) {
      alert(err.message || "Failed to reject.");
    }
  };

  return (
    <div className="admin-container">
      <h2>Pending Vendor Applications</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : pendingVendors.length === 0 ? (
        <p>No pending applications.</p>
      ) : (
        <ul className="vendor-list">
          {pendingVendors.map((v) => (
            <li key={v.id} className="vendor-card">
              <h3>{v.shop_name}</h3>
              {v.description && <p>{v.description}</p>}
              {v.whatsapp && <p>WhatsApp: {v.whatsapp}</p>}
              <div className="vendor-actions">
                <button onClick={() => approve(v.id)}>Approve</button>
                <button onClick={() => reject(v.id)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
