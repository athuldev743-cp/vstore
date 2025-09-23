// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ApplyVendor from "./pages/ApplyVendor";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ role: payload.role, email: payload.email, id: payload.sub });
    } catch {}
  }, []);

  const handleLoginSuccess = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ role: payload.role, email: payload.email, id: payload.sub });
    } catch {}
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route
          path="/apply-vendor"
          element={user?.role === "customer" ? <ApplyVendor /> : <Navigate to="/auth" />}
        />
        <Route
          path="/auth"
          element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} /> : <Auth onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/admin"
          element={user?.role === "admin" ? <Admin /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}
