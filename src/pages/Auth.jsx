// src/pages/Auth.jsx
import React, { useState } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Auth.css";

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await StoreAPI.login({ email, password });
      localStorage.setItem("token", result.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await StoreAPI.signup({ username, email, password });
      localStorage.setItem("token", result.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {isLogin ? (
        <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
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
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
          <p>
            Don’t have an account?{" "}
            <span className="link" onClick={() => setIsLogin(false)}>
              Sign up
            </span>
          </p>
        </>
      ) : (
        <>
          <h2>Sign Up</h2>
          <form onSubmit={handleSignup}>
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
            <button type="submit" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
          <p>
            Already have an account?{" "}
            <span className="link" onClick={() => setIsLogin(true)}>
              Login
            </span>
          </p>
        </>
      )}
    </div>
  );
}
