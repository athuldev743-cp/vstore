import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ApplyVendor from "./pages/ApplyVendor";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";

const getUserRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).role;
  } catch {
    return null;
  }
};

export default function App() {
  const role = getUserRole();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/apply-vendor"
          element={role === "customer" ? <ApplyVendor /> : <Navigate to="/auth" />}
        />
        <Route
          path="/auth"
          element={role ? <Navigate to={role === "admin" ? "/admin" : "/"} /> : <Auth />}
        />
        <Route
          path="/admin"
          element={role === "admin" ? <Admin /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}
