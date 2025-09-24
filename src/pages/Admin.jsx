import React, { useEffect, useState } from "react";
import * as StoreAPI from "../api/StoreAPI";

export default function Admin() {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await StoreAPI.listPendingVendors();
        setPendingVendors(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load pending vendors.");
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []); // ✅ no warnings

  const approve = async (id) => {
    try {
      await StoreAPI.approveVendor(id);
      alert("Vendor approved!");
      setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err.message || "Failed to approve.");
    }
  };

  const reject = async (id) => {
    try {
      await StoreAPI.rejectVendor(id);
      alert("Vendor rejected!");
      setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err.message || "Failed to reject.");
    }
  };

  return (
    <div className="admin-container">
      <h2>Pending Vendor Applications</h2>
      {loading ? (
        <p>Loading...</p>
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
