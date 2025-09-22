import React, { useEffect, useState } from "react";
import { ShoppingCart, Store, Shield, User2, } from "lucide-react";
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
  // Auth Handlers
  // -------------------------
const handleSignup = async (e) => {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value;
  const email = form.email.value;
  const password = form.password.value;

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
      setRole(payload.role);
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
      setRole(payload.role); // could be "customer", "vendor", or "admin"
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
  // Fetchers with return
  // -------------------------
  const fetchProducts = async () => {
    try {
      const data = await StoreAPI.listProducts();
      setProducts(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch products:", err.message);
      return [];
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await StoreAPI.getOrders();
      setOrders(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch orders:", err.message);
      return [];
    }
  };

  const fetchPendingVendors = async () => {
    try {
      const data = await StoreAPI.listPendingVendors();
      setPendingVendors(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch pending vendors:", err.message);
      return [];
    }
  };

  const fetchVendorProducts = async () => {
    if (role !== "vendor" || !user) return [];
    try {
      const allProducts = await StoreAPI.listProducts();
      const myProducts = allProducts.filter((p) => p.vendor_id === user.id);
      setVendorProducts(myProducts);
      return myProducts;
    } catch (err) {
      console.error("Failed to fetch vendor products:", err.message);
      return [];
    }
  };

  // -------------------------
  // Load dashboard data
  // -------------------------
  useEffect(() => {
    if (page === "dashboard") {
      const tasks = [fetchProducts(), fetchOrders()];
      if (role === "vendor") tasks.push(fetchVendorProducts());
      if (role === "admin") tasks.push(fetchPendingVendors());

      Promise.allSettled(tasks).then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") console.error(`Task ${i} failed:`, r.reason);
        });
      });
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
        <span className="link" onClick={() => setPage("signup")}>Sign up</span>
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
        <span className="link" onClick={() => setPage("login")}>Login</span>
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

  // -------------------------
  // Dashboard render logic (customer/vendor/admin)
  // -------------------------
  const renderCustomer = () => (
    <div>
      <h3>Products</h3>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} - ${p.price}{" "}
            <button onClick={async () => { await StoreAPI.placeOrder(p.id, 1); fetchOrders(); }}>Order</button>
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

  const renderVendor = () => {
    const handleUpload = async (e) => {
      e.preventDefault();
      const form = e.target;
      const file = form.file.files[0];
      const data = {
        name: form.name.value,
        description: form.description.value,
        price: parseFloat(form.price.value),
        stock: parseInt(form.stock.value),
        file,
      };
      await StoreAPI.createProduct(data);
      fetchVendorProducts();
    };

    const handleDelete = async (productId) => {
      await StoreAPI.deleteProduct(productId);
      fetchVendorProducts();
    };

    const handleUpdate = async (e, productId) => {
      e.preventDefault();
      const form = e.target;
      const file = form.file?.files[0];
      const data = {
        name: form.name.value,
        description: form.description.value,
        price: parseFloat(form.price.value),
        stock: parseInt(form.stock.value),
        file,
      };
      await StoreAPI.updateProduct(productId, data);
      fetchVendorProducts();
    };

    return (
      <div>
        <h3>Upload Product</h3>
        <form onSubmit={handleUpload}>
          <input name="name" placeholder="Product Name" required />
          <input name="description" placeholder="Description" required />
          <input name="price" type="number" placeholder="Price" required />
          <input name="stock" type="number" placeholder="Stock" required />
          <input type="file" name="file" required />
          <button type="submit">Upload</button>
        </form>

        <h3>My Products</h3>
        <ul>
          {vendorProducts.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> - ${p.price} - Stock: {p.stock}
              <button onClick={() => handleDelete(p.id)}>Delete</button>
              <form onSubmit={(e) => handleUpdate(e, p.id)}>
                <input name="name" defaultValue={p.name} placeholder="Product Name" required />
                <input name="description" defaultValue={p.description} placeholder="Description" required />
                <input name="price" type="number" defaultValue={p.price} placeholder="Price" required />
                <input name="stock" type="number" defaultValue={p.stock} placeholder="Stock" required />
                <input type="file" name="file" />
                <button type="submit">Update</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    );
  };

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

      <h3>All Orders</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>{o.product_id} - {o.status}</li>
        ))}
      </ul>
    </div>
  );

  const renderApplyVendor = () => {
    const handleApply = async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = { name: form.name.value, whatsapp: form.whatsapp.value };
      await StoreAPI.applyVendor(data);
      alert("Applied! Wait for admin approval.");
      setPage("dashboard");
    };
    return (
      <div>
        <h3>Apply as Vendor</h3>
        <form onSubmit={handleApply}>
          <input name="name" placeholder="Vendor Name" required />
          <input name="whatsapp" placeholder="WhatsApp Number" required />
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
        <button onClick={() => setPage("dashboard")}> <ShoppingCart size={20} /> Customer </button>
        <button onClick={() => setPage("dashboard")}> <Store size={20} /> Vendor </button>
        <button onClick={() => setPage("dashboard")}> <Shield size={20} /> Admin </button>
        <button onClick={() => setPage("account")}> <User2 size={20} /> Account </button>
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
