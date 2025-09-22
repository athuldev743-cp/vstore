// Home.jsx
import React, { useEffect, useState } from "react";
import { ShoppingCart, Store, Shield, User2 } from "lucide-react";
import * as StoreAPI from "./api/StoreAPI";
import "./Home.css";

export default function Home() {
  const [page, setPage] = useState("login"); // login | signup | dashboard
  const [role, setRole] = useState(null); // customer | vendor | admin
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);

  // -------------------------
  // Auth Handlers
  // -------------------------
  const handleSignup = async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert(
        "Password must be at least 8 characters and include:\n" +
          "- 1 uppercase letter\n" +
          "- 1 lowercase letter\n" +
          "- 1 number\n" +
          "- 1 special character (@$!%*?&)"
      );
      return;
    }

    try {
      const res = await fetch(
        "https://virtual-store-backed.onrender.com/api/users/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }
      );
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        setUser({ email, id: payload.sub });
        setRole(payload.role || "customer");
        setPage("dashboard");
      } else {
        alert(data.detail || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Server connection failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const res = await fetch(
        "https://virtual-store-backed.onrender.com/api/users/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        setUser({ email, id: payload.sub });
        setRole(payload.role || "customer");
        setPage("dashboard");
      } else {
        alert(data.detail || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server connection failed");
    }
  };

  // -------------------------
  // Fetchers
  // -------------------------
  const fetchProducts = async () => {
    try {
      const data = await StoreAPI.listProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await StoreAPI.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err.message);
    }
  };

  const fetchPendingVendors = async () => {
    try {
      const data = await StoreAPI.listPendingVendors();
      setPendingVendors(data);
    } catch (err) {
      console.error("Failed to fetch pending vendors:", err.message);
    }
  };

  const fetchVendorProducts = async () => {
    if (role !== "vendor" || !user) return;
    try {
      const allProducts = await StoreAPI.listProducts();
      const myProducts = allProducts.filter((p) => p.vendor_id === user.id);
      setVendorProducts(myProducts);
    } catch (err) {
      console.error("Failed to fetch vendor products:", err.message);
    }
  };

  // -------------------------
  // Load dashboard data
  // -------------------------
  useEffect(() => {
    if (page === "dashboard") {
      fetchProducts();
      fetchOrders();
      if (role === "vendor") fetchVendorProducts();
      if (role === "admin") fetchPendingVendors();
    }
  }, [page, role, user]);

  // -------------------------
  // Renderers
  // -------------------------
  const renderLogin = () => (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <p>
        Don’t have an account?{" "}
        <span className="link" onClick={() => setPage("signup")}>
          Sign up
        </span>
      </p>
    </div>
  );

  const renderSignup = () => (
    <div className="auth-container">
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <input type="text" name="username" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account?{" "}
        <span className="link" onClick={() => setPage("login")}>
          Login
        </span>
      </p>
    </div>
  );

  const renderAccount = () => (
    <div className="account-info">
      <h3>Account Info</h3>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Role:</strong> {role}</p>
    </div>
  );

  const renderCustomer = () => (
    <div>
      <h3>Products</h3>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} - ${p.price}{" "}
            <button
              onClick={async () => {
                await StoreAPI.placeOrder(p.id, 1);
                fetchOrders();
              }}
            >
              Order
            </button>
          </li>
        ))}
      </ul>
      <h3>My Orders</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>{o.product_id} - {o.status}</li>
        ))}
      </ul>
      <button onClick={() => setPage("apply-vendor")}>Apply as Vendor</button>
    </div>
  );

  const renderVendor = () => (
    <div>
      <h3>My Products</h3>
      <ul>
        {vendorProducts.map((p) => (
          <li key={p.id}>
            {p.name} - ${p.price} - Stock: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );

  const renderAdmin = () => (
    <div>
      <h3>Pending Vendors</h3>
      <ul>
        {pendingVendors.map((v) => (
          <li key={v.id}>
            {v.name} - {v.status}{" "}
            <button onClick={async () => { await StoreAPI.approveVendor(v.id); fetchPendingVendors(); }}>Approve</button>
            <button onClick={async () => { await StoreAPI.rejectVendor(v.id); fetchPendingVendors(); }}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderApplyVendor = () => {
    const handleApply = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to apply as vendor");
        setPage("login");
        return;
      }

      const form = e.target;
      const data = {
        name: form.name.value.trim(),
        whatsapp: form.whatsapp.value.trim(),
      };

      try {
        const res = await fetch(
          "https://virtual-store-backed.onrender.com/api/apply-vendor",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }
        );

        const result = await res.json();
        if (res.ok) {
          alert("Vendor application submitted! Wait for admin approval via WhatsApp.");
          setPage("dashboard");
        } else {
          alert(result.detail || "Application failed");
        }
      } catch (err) {
        console.error("Apply vendor error:", err);
        alert("Server connection failed");
      }
    };

    return (
      <div className="auth-container">
        <h3>Apply as Vendor</h3>
        <form onSubmit={handleApply}>
          <input name="name" placeholder="Vendor Name" required />
          <input name="whatsapp" placeholder="WhatsApp Number" required pattern="^\+?\d{10,15}$" title="Enter valid WhatsApp number with country code" />
          <button type="submit">Apply</button>
        </form>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="content">
        {page === "apply-vendor" && renderApplyVendor()}
        {page === "account" && renderAccount()}
        {role === "customer" && page !== "apply-vendor" && page !== "account" && renderCustomer()}
        {role === "vendor" && page !== "account" && renderVendor()}
        {role === "admin" && page !== "account" && renderAdmin()}
      </div>

      <div className="bottom-nav">
        <button className={role === "customer" ? "active" : ""} onClick={() => setPage("dashboard")}><ShoppingCart size={20} /> Customer</button>
        <button className={role === "vendor" ? "active" : ""} onClick={() => setPage("dashboard")}><Store size={20} /> Vendor</button>
        <button className={role === "admin" ? "active" : ""} onClick={() => setPage("dashboard")}><Shield size={20} /> Admin</button>
        <button onClick={() => setPage("account")}><User2 size={20} /> Account</button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {page === "login" && renderLogin()}
      {page === "signup" && renderSignup()}
      {page === "dashboard" && renderDashboard()}
    </div>
  );
}
