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
      await StoreAPI.applyVendor(form);
      alert("Application submitted successfully!");
      navigate("/"); // go back home
    } catch (err) {
      setError(err.message);
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
          placeholder="WhatsApp"
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
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
