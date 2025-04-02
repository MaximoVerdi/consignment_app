import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = () => {
  const [isValid, setIsValid] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          localStorage.removeItem("token");
          setIsValid(false);
        } else {
          setIsValid(true);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token");
        setIsValid(false);
      }
    } else {
      setIsValid(false);
    }
  }, [token]);

  if (isValid === null) return null;

  return isValid ? <Outlet /> : <Navigate to="/login" />;
};

export { ProtectedRoute };
