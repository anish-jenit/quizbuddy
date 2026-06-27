import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from './UI';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { user, isLoading, token } = useAuth();

  if (isLoading) return <Loading />;

  if (!token || !user) {
    return <Navigate to="/login/student" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;
