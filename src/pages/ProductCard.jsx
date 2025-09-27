import React, { useState } from "react";
import ProductDetails from "./ProductDetails";
import "./Products.css";

export default function ProductCard({ product, user }) {
  const [showDetails, setShowDetails] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return "/default-product.jpg";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return url;
    return `/${url}`;
  };

  return (
    <div className="product-card">
      {/* Thumbnail */}
      <div
        className="product-thumb"
        onClick={() => setShowDetails(true)}
      >
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          onError={(e) => (e.target.src = "/default-product.jpg")}
        />
        <h3>{product.name}</h3>
        <p className="price">₹{product.price}/kg</p>
        <p
          className={`stock ${
            product.stock <= 0 ? "out-of-stock" : "in-stock"
          }`}
        >
          {product.stock > 0 ? "In stock" : "Out of stock"}
        </p>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <ProductDetails
          product={product}
          user={user}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
