import { useAuthStore } from '../utils/store';
import { authAPI } from '../utils/api';
import { useEffect } from 'react';

export const useAuth = () => {
  const { user, token, isLoading, error, setUser, setToken, logout, setLoading, setError, clearError } = useAuthStore();

  const register = async (formData) => {
    try {
      setLoading(true);
      clearError();
      const response = await authAPI.register(formData);

      if (!formData?.registerAsTeacher) {
        setToken(response.data.token);
        setUser(response.data.user);
      }

      if (formData?.registerAsTeacher) {
        clearError();
      }

      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (formData) => {
    try {
      setLoading(true);
      clearError();
      const response = await authAPI.login(formData);
      setToken(response.data.token);
      setUser(response.data.user);
      clearError();
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = async (name) => {
    try {
      setLoading(true);
      clearError();
      const response = await authAPI.guestLogin({ name });
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Guest login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      clearError();
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      logout();
      setError('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser();
    }
  }, [token, user]);

  return {
    user,
    token,
    isLoading,
    error,
    clearError,
    register,
    login,
    guestLogin,
    logout,
    fetchCurrentUser,
  };
};
