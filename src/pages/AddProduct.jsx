import React, { useState } from "react";
import * as StoreAPI from "../api/StoreAPI";

export default function AddProduct({ onProductAdded }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [file, setFile] = useState(null); // ✅ file state

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      if (file) formData.append("file", file); // append file only if selected

      await StoreAPI.addProduct(formData); // backend should accept multipart/form-data
      alert("Product added successfully!");

      // reset form
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setFile(null);

      if (onProductAdded) onProductAdded();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add product");
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
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])} // ✅ file input
        />
        <button type="submit">Add Product</button>
      </form>
    </div>
  );
}
