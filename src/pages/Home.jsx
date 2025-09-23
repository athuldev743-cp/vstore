// Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Auth from "./Auth";
import * as StoreAPI from "../api/StoreAPI";
import "./Home.css";

export default function Home() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [page, setPage] = useState("home"); // home | dashboard | applyVendor
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setUserLoggedIn(true);
    setPage("dashboard"); // show products & vendor button
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="logo">VStore</h1>
        {!userLoggedIn && (
          <button
            className="signup-btn"
            onClick={() => setPage("auth")}
          >
            Signup / Login
          </button>
        )}
      </header>

      <main className="home-content">
        {page === "home" && <h2>Welcome to VStore!</h2>}

        {page === "auth" && <Auth onLoginSuccess={handleLoginSuccess} />}

        {page === "dashboard" && userLoggedIn && (
          <div>
            <h2>Products</h2>
            {/* fetch and display products */}
            <button onClick={() => setPage("applyVendor")}>Apply as Vendor</button>
          </div>
        )}

        {page === "applyVendor" && <ApplyVendor />}
      </main>
    </div>
  );
}
