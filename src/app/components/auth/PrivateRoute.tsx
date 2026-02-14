import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const isServerAuthEnabled = Boolean(API_BASE_URL);

export function PrivateRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    // 認証状態が未確定の間は描画しない（保護ページのチラ見え防止）。
    return null;
  }

  if (isServerAuthEnabled && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
