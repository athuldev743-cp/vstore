import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./AddProduct.css"; // reuse styling

export default function UpdateProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const products = await StoreAPI.getVendorProducts("me"); // use "me" to get logged-in vendor products
        const product = products.find((p) => p.id === productId);
        if (!product) {
          alert("Product not found");
          navigate("/account"); // redirect back
          return;
        }
        setName(product.name);
        setDescription(product.description || "");
        setPrice(product.price);
        setStock(product.stock);
        setPreview(product.image_url || null);
      } catch (err) {
        console.error(err);
        alert("Failed to load product");
        navigate("/account");
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      if (file) formData.append("file", file);

      await StoreAPI.updateProduct(productId, formData);
      alert("Product updated successfully!");
      navigate("/account"); // go back to vendor products
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <h3>Update Product</h3>
      <form onSubmit={handleUpdate}>
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price per kg (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Stock in kg"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && (
          <div className="image-preview">
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100px", height: "100px", objectFit: "cover", marginTop: "10px" }}
            />
          </div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
