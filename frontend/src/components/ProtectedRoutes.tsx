import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

const ProtectedRoutes: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Access denied");

      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoutes;
