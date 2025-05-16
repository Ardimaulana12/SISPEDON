import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL;

  
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      axios.get(`${apiUrl}/validate-token`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.valid) {
          setIsAuthenticated(true);
          setRole(res.data.role);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setRole(null);
      })
      .finally(() => setLoading(false)); // Pastikan loading dihentikan
    } else {
      setLoading(false); // Tidak ada token juga harus dihentikan
    }
  }, []);
  

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    setRole(null);
    setUserId(null);
  };
  const login = (token, userRole) => {
    setIsAuthenticated(true);
    setRole(userRole);
    setLoading(false); // tidak loading lagi
  };
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      role,
      userId,
      handleLogout,
      login,
      loading,  // tambahan
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
