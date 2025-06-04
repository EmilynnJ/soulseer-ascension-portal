// This page is no longer used as the main route now goes to Home.tsx
// Keeping for legacy compatibility

import { Navigate } from 'react-router-dom';

const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
