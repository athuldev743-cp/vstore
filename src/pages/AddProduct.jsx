import React, { useState } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./AddProduct.css";

export default function AddProduct({ onProductAdded }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [file, setFile] = useState(null); // product image
  const [preview, setPreview] = useState(null); // image preview

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price); // price per kg
      formData.append("stock", stock); // stock in kg
      if (file) formData.append("file", file);

      await StoreAPI.addProduct(formData); // API handles multipart/form-data
      alert("Product added successfully!");

      // reset form
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setFile(null);
      setPreview(null);

      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add product");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="add-product-container">
      <h3>Add New Product</h3>
      <form onSubmit={handleSubmit}>
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
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {preview && (
          <div className="image-preview">
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100px", height: "100px", objectFit: "cover", marginTop: "10px" }}
            />
          </div>
        )}
        <small>Price in ₹ per kg, Stock in kg (decimals allowed)</small>
        <button type="submit">Add Product</button>
      </form>
    </div>
  );
}
