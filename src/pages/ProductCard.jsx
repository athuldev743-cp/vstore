import React from "react";
import { useNavigate } from "react-router-dom";
import "./Products.css";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const getImageUrl = (url) => {
    if (!url) return "/default-product.jpg";
    if (url.startsWith("http") || url.startsWith("/")) return url;
    return `/${url}`;
  };

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/products/${product.id}`)}
      onTouchStart={() => navigate(`/products/${product.id}`)}
    >
      <div className="product-thumb">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          onError={(e) => (e.target.src = "/default-product.jpg")}
        />
        <h3 className="product-name">{product.name}</h3>
        <p className="price">₹{product.price}/kg</p>
        <p className={`stock ${product.stock <= 0 ? "out-of-stock" : "in-stock"}`}>
          {product.stock > 0 ? "In stock" : "Out of stock"}
        </p>
      </div>
    </div>
  );
}
