import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './AuthContext';

export function PrivateRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    // 認証状態が未確定の間は描画しない（保護ページのチラ見え防止）。
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
