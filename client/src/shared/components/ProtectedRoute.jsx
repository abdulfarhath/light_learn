import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';


const ProtectedRoute = ({ children }) => {
    const { token, user, loading } = useAuthStore();
    console.log('ProtectedRoute - Token:', token ? 'Present' : 'Missing', 'User:', user ? 'Present' : 'Missing', 'Loading:', loading);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg-dark text-white text-xl">
                Loading...
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
