import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredRole } from "../utils/auth";

const DashboardRedirect = () => {
  const role = getStoredRole();

  // If role is unknown, ask user to login.
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role === "seller") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/customer/dashboard" replace />;
};

export default DashboardRedirect;

