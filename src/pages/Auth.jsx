import React, { useState } from "react";
import * as StoreAPI from "../api/StoreAPI";

export default function Auth({ setPage }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  // -------------------------
  // Signup Handler
  // -------------------------
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await StoreAPI.signup({
        username,
        email,
        password,
        mobile,
        address,
      });

      if (result?.access_token) {
        localStorage.setItem("token", result.access_token);
        setPage("dashboard");
      }
    } catch (err) {
      setError(err.detail || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Sign Up</h2>
      <form onSubmit={handleSignup} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          required
        />
        <textarea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
