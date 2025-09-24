// pages/ApplyVendor.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./ApplyVendor.css";

export default function ApplyVendor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ shop_name: "", whatsapp: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Make sure your API expects shop_name, whatsapp, description
      await StoreAPI.applyVendor(form);
      alert("Application submitted successfully!");
      navigate("/"); // go back home
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Apply as Vendor</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="shop_name"
          placeholder="Shop Name"
          value={form.shop_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="whatsapp"
          placeholder="WhatsApp Number"
          value={form.whatsapp}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
