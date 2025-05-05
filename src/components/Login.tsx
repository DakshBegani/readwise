// src/components/Login.tsx
import React, { useState, useEffect } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If there’s already a user in localStorage, go straight to dashboard
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (response: CredentialResponse) => {
    setLoading(true);
    try {
      // 1. Decode & store user locally
      const token = response.credential!;
      const decoded: any = jwtDecode(token);
      localStorage.setItem("user", JSON.stringify(decoded));

      // 2. Send token to backend
      const res = await fetch("http://localhost:8000/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      // 3. On success, navigate
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      // Optionally show a toast or error message here
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Log in</h2>
        <p className="subtext">Sign in to your Reading Assistant account</p>

        <GoogleLogin
          onSuccess={handleLogin}
          onError={() => {
            console.log("Login Failed");
          }}
        />

        {loading && <p className="loading-text">Logging in…</p>}

        <p className="terms-text">
          By signing in, you agree to our <a href="#">Terms</a> and{" "}
          <a href="#">Privacy</a>.
        </p>
      </div>
    </div>
  );
};

export default Login;
