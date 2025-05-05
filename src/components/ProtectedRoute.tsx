import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  // Check if user exists in localStorage
  const userJson = localStorage.getItem("user");
  
  // Log for debugging
  console.log("ProtectedRoute - User in localStorage:", !!userJson);
  
  // If user exists, render the protected component, otherwise redirect to login
  return userJson ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;