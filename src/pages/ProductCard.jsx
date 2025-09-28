import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState(0);

  const getImageUrl = (url) => {
    if (!url) return "/default-product.jpg";
    if (url.startsWith("http") || url.startsWith("/")) return url;
    return `/${url}`;
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientY;
    if (Math.abs(touchEnd - touchStart) < 5) {
      const productId = product.id ?? product._id?.toString();
      if (productId) navigate(`/products/${productId}`);
    }
  };

  return (
    <div
      className="product-card"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        const productId = product.id ?? product._id?.toString();
        if (productId) navigate(`/products/${productId}`);
      }}
    >
      <div className="product-thumb">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          onError={(e) => (e.target.src = "/default-product.jpg")}
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="price">₹{product.price}/kg</p>
        <p className={`stock ${product.stock <= 0 ? "out-of-stock" : "in-stock"}`}>
          {product.stock > 0 ? "In stock" : "Out of stock"}
        </p>
      </div>
    </div>
  );
}
