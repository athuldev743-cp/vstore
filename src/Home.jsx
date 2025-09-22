// Home.jsx
import React, { useEffect, useState, useCallback } from "react";
import { ShoppingCart, User2 } from "lucide-react"; // Removed unused icons
import * as StoreAPI from "./api/StoreAPI";
import "./Home.css";

export default function Home() {
  const [page, setPage] = useState("login");
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);

  // -------------------------
  // Persistent login
  // -------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ id: payload.sub, email: payload.email || "" });
      setRole(payload.role || "customer");
      setPage("dashboard");
    }
  }, []);

  // -------------------------
  // Fetch dashboard data
  // -------------------------
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const allProducts = await StoreAPI.listProducts();
      setProducts(allProducts);

      const allOrders = await StoreAPI.getOrders();
      setOrders(allOrders);

      if (role === "vendor") {
        const myProducts = allProducts.filter((p) => p.vendor_id === user.id);
        setVendorProducts(myProducts);
      }

      if (role === "admin") {
        const pending = await StoreAPI.listPendingVendors();
        setPendingVendors(pending);
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err.message);
    }
  }, [role, user]);

  useEffect(() => {
    if (page === "dashboard" && user) fetchDashboardData();
  }, [page, user, fetchDashboardData]);

  // -------------------------
  // Auth Handlers
  // -------------------------
  const handleSignup = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      username: form.username.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
    };

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(data.password)) {
      return alert(
        "Password must be 8+ chars with 1 uppercase, 1 lowercase, 1 number, 1 special char"
      );
    }

    try {
      const res = await fetch(
        "https://virtual-store-backed.onrender.com/api/users/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const result = await res.json();
      if (res.ok) {
        localStorage.setItem("token", result.access_token);
        const payload = JSON.parse(atob(result.access_token.split(".")[1]));
        setUser({ id: payload.sub, email: data.email });
        setRole(payload.role || "customer");
        setPage("dashboard");
      } else {
        alert(result.detail || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = { email: form.email.value.trim(), password: form.password.value };

    try {
      const res = await fetch(
        "https://virtual-store-backed.onrender.com/api/users/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const result = await res.json();
      if (res.ok) {
        localStorage.setItem("token", result.access_token);
        const payload = JSON.parse(atob(result.access_token.split(".")[1]));
        setUser({ id: payload.sub, email: data.email });
        setRole(payload.role || "customer");
        setPage("dashboard");
      } else {
        alert(result.detail || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
    setPage("login");
  };

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
        <span className="link" onClick={() => setPage("signup")}>Sign up</span>
      </p>
    </div>
  );

  const renderSignup = () => (
    <div className="auth-container">
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <input name="username" placeholder="Name" required />
        <input name="email" placeholder="Email" required />
        <input name="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account?{" "}
        <span className="link" onClick={() => setPage("login")}>Login</span>
      </p>
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
                fetchDashboardData();
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
          <li key={p.id}>{p.name} - ${p.price} - Stock: {p.stock}</li>
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
            <button
              onClick={async () => {
                await StoreAPI.approveVendor(v.id);
                fetchDashboardData();
              }}
            >
              Approve
            </button>
            <button
              onClick={async () => {
                await StoreAPI.rejectVendor(v.id);
                fetchDashboardData();
              }}
            >
              Reject
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderApplyVendor = () => {
    const handleApply = async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = { name: form.name.value.trim(), whatsapp: form.whatsapp.value.trim() };
      try {
        await StoreAPI.applyVendor(data);
        alert("Vendor application submitted!");
        setPage("dashboard");
      } catch (err) {
        console.error(err);
        alert("Application failed");
      }
    };

    return (
      <div className="auth-container">
        <h3>Apply as Vendor</h3>
        <form onSubmit={handleApply}>
          <input name="name" placeholder="Vendor Name" required />
          <input
            name="whatsapp"
            placeholder="WhatsApp Number"
            required
            pattern="^\+?\d{10,15}$"
          />
          <button type="submit">Apply</button>
        </form>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="content">
        {page === "apply-vendor" && renderApplyVendor()}
        {role === "customer" && page !== "apply-vendor" && renderCustomer()}
        {role === "vendor" && renderVendor()}
        {role === "admin" && renderAdmin()}
      </div>
      <div className="bottom-nav">
        <button onClick={() => setPage("dashboard")}>
          <ShoppingCart size={20} /> Dashboard
        </button>
        <button onClick={handleLogout}>
          <User2 size={20} /> Logout
        </button>
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
