// src/pages/Auth.jsx
import React, { useState } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Auth.css";

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await StoreAPI.login({ email, password });
      localStorage.setItem("token", result.access_token);
      onLoginSuccess();
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const result = await StoreAPI.signup({ username, email, password });
      localStorage.setItem("token", result.access_token);
      onLoginSuccess();
    } catch (err) {
      alert(err.message || "Signup failed");
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
            <button type="submit">Login</button>
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
            <button type="submit">Sign Up</button>
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
