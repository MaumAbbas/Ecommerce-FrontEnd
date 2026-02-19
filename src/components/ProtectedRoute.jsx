import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredRole } from "../utils/auth";

const ProtectedRoute = ({ allowedRoles, children, authReady = true }) => {
  if (!authReady) {
    return null;
  }

  const role = getStoredRole();

  // If no role is stored, user must login again.
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Prevent access to pages outside the user's role.
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
