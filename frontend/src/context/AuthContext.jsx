import React, { createContext, useState, useEffect } from 'react';
import api from '../api';
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // التحقق من وجود مستخدم مسجل مسبقاً عند تحديث الصفحة
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const userData = response.data;
      
      // حفظ التوكن والبيانات في LocalStorage
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Invalid username or password' 
      };
    }
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
