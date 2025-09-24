import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./Products.css";

export default function Products() {
  const { vendorId } = useParams();
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [user, setUser] = useState(null);
  const [popupProduct, setPopupProduct] = useState(null);
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    file: null,
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await StoreAPI.getVendorProducts(vendorId);
        setProducts(res);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    }

    async function fetchUser() {
      try {
        const res = await StoreAPI.getCurrentUser();
        setUser(res);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }

    fetchProducts();
    fetchUser();
  }, [vendorId]);

  const handleOrder = async (product, quantity, form) => {
    try {
      if (quantity < 0.1) return;

      const res = await StoreAPI.placeOrder({
        product_id: product.id,
        quantity,
        mobile: form.mobile,
        address: form.address,
      });

      alert(`Order placed! Remaining stock: ${res.remaining_stock} kg`);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: res.remaining_stock } : p
        )
      );

      setPopupProduct(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to place order");
    }
  };

  const handleNewProductChange = (e) => {
    const { name, value, files } = e.target;
    setNewProductForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newProductForm.name);
      formData.append("description", newProductForm.description);
      formData.append("price", newProductForm.price);
      formData.append("stock", newProductForm.stock);
      if (newProductForm.file) formData.append("file", newProductForm.file);

      const addedProduct = await StoreAPI.addProduct(formData);

      setProducts((prev) => [addedProduct, ...prev]); // Add to top of list
      setNewProductForm({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        file: null,
      });
      alert("Product added successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add product");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Products</h1>

      {/* Vendor Add Product Form */}
      {user?.role === "vendor" && (
        <form
          onSubmit={handleAddProduct}
          className="bg-gray-100 p-4 mb-4 rounded shadow space-y-2"
        >
          <h2 className="font-bold text-lg">Add New Product</h2>
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={newProductForm.name}
            onChange={handleNewProductChange}
            required
            className="w-full p-2 border rounded"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={newProductForm.description}
            onChange={handleNewProductChange}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            name="price"
            placeholder="Price per kg"
            value={newProductForm.price}
            onChange={handleNewProductChange}
            className="w-full p-2 border rounded"
            min="0"
            step="0.01"
            required
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock in kg"
            value={newProductForm.stock}
            onChange={handleNewProductChange}
            className="w-full p-2 border rounded"
            min="0"
            step="0.1"
            required
          />
          <input
            type="file"
            name="file"
            onChange={handleNewProductChange}
            className="w-full"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Add Product
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.id} className="bg-white shadow rounded-lg">
              <div
                className="product-collapsed cursor-pointer"
                onClick={() =>
                  setExpanded(expanded === product.id ? null : product.id)
                }
              >
                {product.image_url && (
                  <img
                    src={`${product.image_url}?t=${Date.now()}`}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded"
                  />
                )}
                <h2 className="product-title">{product.name}</h2>
              </div>

              {expanded === product.id && (
                <ProductDetails
                  product={product}
                  onOpenPopup={() => setPopupProduct(product)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {popupProduct && user && (
        <OrderPopup
          product={popupProduct}
          user={user}
          onClose={() => setPopupProduct(null)}
          onConfirm={handleOrder}
        />
      )}
    </div>
  );
}

function ProductDetails({ product, onOpenPopup }) {
  const [quantity, setQuantity] = useState(0.1);
  const maxQuantity = product.stock > 0 ? Math.min(product.stock, 20) : 0;

  return (
    <div className="p-4 border-t border-gray-200 space-y-2">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-40 object-cover rounded"
        />
      )}
      <p className="text-gray-600">{product.description}</p>
      <p className="text-gray-500">Price per kg: ₹{product.price}</p>
      <p className="text-gray-500">Stock: {product.stock} kg</p>

      <div>
        <label className="block text-gray-700">
          Quantity (kg): {quantity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max={maxQuantity}
          step="0.1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full"
          disabled={product.stock <= 0}
        />
      </div>

      <p className="text-gray-700">
        Total: ₹{(product.price * quantity).toFixed(2)}
      </p>

      <button
        onClick={onOpenPopup}
        disabled={product.stock <= 0}
        className={`mt-2 px-4 py-2 w-full text-white rounded ${
          product.stock > 0
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        🛒 {product.stock > 0 ? "Place Order" : "Out of Stock"}
      </button>
    </div>
  );
}

function OrderPopup({ product, user, onClose, onConfirm }) {
  const [form, setForm] = useState({
    mobile: user.whatsapp || "",
    address: user.address || "",
    quantity: 0.1,
  });

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2>Order: {product.name}</h2>
        <p>Price: ₹{product.price} / kg</p>

        <label>
          Quantity (kg):
          <input
            type="number"
            min="0.1"
            max={Math.min(product.stock, 20)}
            step="0.1"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
            }
          />
        </label>

        <label>
          Mobile:
          <input
            type="text"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
        </label>

        <label>
          Address:
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>

        <div className="popup-actions">
          <button onClick={() => onConfirm(product, form.quantity, form)}>
            Confirm Order
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
