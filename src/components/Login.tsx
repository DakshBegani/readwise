import React, { useState, useEffect } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for existing user on component mount
  useEffect(() => {
    const checkUser = () => {
      const saved = localStorage.getItem("user");
      if (saved) {
        console.log("User found in localStorage, redirecting to dashboard");
        navigate("/dashboard");
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleLogin = async (response: CredentialResponse) => {
    console.log("Google login response received:", response);
    setLoading(true);
    setError(null);
    
    try {
      // 1. Decode & store user locally
      const token = response.credential;
      if (!token) {
        throw new Error("No credential received from Google");
      }
      
      const decoded: any = jwtDecode(token);
      console.log("Decoded token:", decoded);
      
      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(decoded));
      
      // 2. Navigate to dashboard immediately
      console.log("Navigating to dashboard...");
      navigate("/dashboard");
      
      // 3. Send token to backend (non-blocking)
      fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).then(res => {
        console.log("Backend response status:", res.status);
        if (!res.ok) {
          console.error("Server error:", res.status);
        } else {
          console.log("Backend login successful");
        }
      }).catch(err => {
        console.error("Backend communication error:", err);
      });
      
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
      localStorage.removeItem("user");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Log in</h2>
        <p className="subtext">Sign in to your Reading Assistant account</p>

        {!loading ? (
          <GoogleLogin
            onSuccess={handleLogin}
            onError={() => {
              console.log("Login Failed");
              setError("Google login failed. Please try again.");
              setLoading(false);
            }}
          />
        ) : (
          <p className="loading-text">Logging in...</p>
        )}

        {error && <p className="error-text">{error}</p>}

        <p className="terms-text">
          By signing in, you agree to our <a href="#">Terms</a> and{" "}
          <a href="#">Privacy</a>.
        </p>
      </div>
    </div>
  );
};

export default Login;