import React, { useState } from "react";
import * as StoreAPI from "../api/StoreAPI";
import "./Auth.css";

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  // Password validation rules
  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/\d/.test(pwd)) errors.push("At least one number");
    if (!/[A-Z]/.test(pwd)) errors.push("At least one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("At least one lowercase letter");
    return errors;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    if (!isLogin) {
      // Only show password requirements during signup
      setPasswordErrors(validatePassword(newPassword));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password for signup
    if (!isLogin) {
      const errors = validatePassword(password);
      if (errors.length > 0) {
        setError("Please fix password requirements");
        return;
      }
    }

    try {
      let result;
      if (isLogin) {
        result = await StoreAPI.login({ email, password });
      } else {
        result = await StoreAPI.signup({ username, email, password, mobile, address });
      }

      if (result?.access_token) {
        localStorage.setItem("token", result.access_token);
        onLoginSuccess();
      }
    } catch (err) {
      console.error(err);
      setError(err.detail || err.message || "Operation failed");
    }
  };

  const isPasswordValid = passwordErrors.length === 0;

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isLogin ? "Login" : "Create Account"}</h2>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username *
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password *
          </label>
          <input
            id="password"
            type="password"
            placeholder={isLogin ? "Enter your password" : "Create a strong password"}
            value={password}
            onChange={handlePasswordChange}
            required
            className="form-input"
          />
          
          {/* Password Requirements - Only show during signup */}
          {!isLogin && (
            <div className="password-requirements">
              <p className="requirements-title">Password must contain:</p>
              <ul className="requirements-list">
                <li className={password.length >= 8 ? "valid" : "invalid"}>
                  ✓ At least 8 characters
                </li>
                <li className={/\d/.test(password) ? "valid" : "invalid"}>
                  ✓ At least one number
                </li>
                <li className={/[A-Z]/.test(password) ? "valid" : "invalid"}>
                  ✓ At least one uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? "valid" : "invalid"}>
                  ✓ At least one lowercase letter
                </li>
              </ul>
            </div>
          )}
        </div>

        {!isLogin && (
          <>
            <div className="form-group">
              <label htmlFor="mobile" className="form-label">
                Mobile Number *
              </label>
              <input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">
                Address *
              </label>
              <textarea
                id="address"
                placeholder="Enter your complete address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="form-input textarea"
                rows="3"
              />
            </div>
          </>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className={`submit-button ${!isLogin && !isPasswordValid ? 'disabled' : ''}`}
          disabled={!isLogin && !isPasswordValid}
        >
          {isLogin ? "Login" : "Create Account"}
        </button>
      </form>

      <p className="auth-toggle">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <span 
          className="toggle-link" 
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setPasswordErrors([]);
          }}
        >
          {isLogin ? "Sign Up" : "Login"}
        </span>
      </p>
    </div>
  );
}