import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css"; // You can remove this if using only Bootstrap

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
      className="card h-100 shadow-sm product-card"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        const productId = product.id ?? product._id?.toString();
        if (productId) navigate(`/products/${productId}`);
      }}
      style={{ cursor: "pointer", transition: "transform 0.2s" }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div className="product-thumb position-relative" style={{ height: "200px", overflow: "hidden" }}>
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          className="card-img-top h-100"
          style={{ objectFit: "cover" }}
          onError={(e) => (e.target.src = "/default-product.jpg")}
        />
      </div>
      
      <div className="card-body d-flex flex-column">
        <h5 className="card-title product-name mb-2" style={{ minHeight: "48px" }}>
          {product.name}
        </h5>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="h6 text-primary mb-0">₹{product.price}/kg</span>
            <span className={`badge ${product.stock > 0 ? "bg-success" : "bg-danger"}`}>
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </span>
          </div>
          
          {product.stock > 0 && (
            <small className="text-muted">
              {product.stock} kg available
            </small>
          )}
        </div>
      </div>
    </div>
  );
}