import React, { useEffect, useState } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Admin.css";

export default function Admin() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");

  // -------------------------
  // Fetch pending vendors
  // -------------------------
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await StoreAPI.listPendingVendors();
      setVendors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // -------------------------
  // Approve / Reject handlers
  // -------------------------
  const handleAction = async (vendorId, action) => {
    try {
      setActionLoading({ ...actionLoading, [vendorId]: true });
      if (action === "approve") await StoreAPI.approveVendor(vendorId);
      else await StoreAPI.rejectVendor(vendorId);
      // Remove vendor from list
      setVendors(vendors.filter((v) => v.id !== vendorId));
    } catch (err) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading({ ...actionLoading, [vendorId]: false });
    }
  };

  if (loading) return <p className="loading">Loading pending vendors...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin-container">
      <h2>Pending Vendor Applications</h2>
      {vendors.length === 0 && <p>No pending applications</p>}
      <div className="vendor-list">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="vendor-card">
            <h3>{vendor.shop_name}</h3>
            {vendor.whatsapp && <p>WhatsApp: {vendor.whatsapp}</p>}
            {vendor.description && <p>{vendor.description}</p>}
            <div className="vendor-actions">
              <button
                className="approve-btn"
                disabled={actionLoading[vendor.id]}
                onClick={() => handleAction(vendor.id, "approve")}
              >
                {actionLoading[vendor.id] ? "Processing..." : "Approve"}
              </button>
              <button
                className="reject-btn"
                disabled={actionLoading[vendor.id]}
                onClick={() => handleAction(vendor.id, "reject")}
              >
                {actionLoading[vendor.id] ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
