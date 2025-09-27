import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as StoreAPI from "../api/StoreAPI";
import "./AddProduct.css";

export default function UpdateProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: ""
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product details using vendor products list
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setFetchLoading(true);
        setError("");
        
        // Get all vendor products and find the specific one
        const products = await StoreAPI.getVendorProducts("me");
        console.log("Vendor products:", products);
        
        // Handle different response structures
        const productsArray = Array.isArray(products) 
          ? products 
          : products?.data || products?.products || [];
          
        // Try to find product by id or _id
        const product = productsArray.find((p) => {
          console.log(`Comparing: ${p.id} or ${p._id} with ${productId}`);
          return p.id === productId || p._id === productId || p.id?.toString() === productId;
        });
        
        if (!product) {
          setError(`Product not found. Available products: ${productsArray.length}`);
          console.log("Available products:", productsArray);
          return;
        }
        
        console.log("Found product:", product);
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price || "",
          stock: product.stock || ""
        });
        setPreview(product.image_url || product.image || null);
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Failed to load product details: " + err.message);
      } finally {
        setFetchLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setError("No product ID provided");
      setFetchLoading(false);
    }
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("stock", parseFloat(formData.stock));
      
      if (file) {
        formDataToSend.append("file", file);
      }

      await StoreAPI.updateProduct(productId, formDataToSend);
      alert("Product updated successfully!");
      navigate("/account");
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/account");
  };

  if (fetchLoading) {
    return (
      <div className="add-product-container">
        <div className="loading">Loading product details...</div>
      </div>
    );
  }

  return (
    <div className="add-product-container">
      <h2>Update Product</h2>
      
      {error && (
        <div className="error-message" style={{color: 'red', marginBottom: '20px', padding: '10px', background: '#fee' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label htmlFor="name">Product Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Price per kg (₹) *</label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Price per kg (₹)"
            value={formData.price}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock">Stock in kg *</label>
          <input
            id="stock"
            name="stock"
            type="number"
            step="0.01"
            min="0"
            placeholder="Stock in kg"
            value={formData.stock}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="file">Product Image (Leave empty to keep current)</label>
          <input 
            id="file"
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        {preview && (
          <div className="image-preview">
            <p>Image Preview:</p>
            <img
              src={preview}
              alt="Preview"
              style={{ 
                width: "150px", 
                height: "150px", 
                objectFit: "cover", 
                marginTop: "10px",
                borderRadius: "8px",
                border: "2px solid #ddd"
              }}
            />
          </div>
        )}

        <div className="form-buttons">
          <button 
            type="submit" 
            disabled={loading}
            className="submit-btn"
          >
            {loading ? "Updating..." : "Update Product"}
          </button>
          
          <button 
            type="button" 
            onClick={handleCancel}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}