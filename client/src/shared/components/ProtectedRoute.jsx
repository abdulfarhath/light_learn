import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';


const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuthStore();
    console.log('ProtectedRoute - Token:', token ? 'Present' : 'Missing', 'Loading:', loading);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg-dark text-white text-xl">
                <div className="spinner"></div>
            </div>
        );
    }

    return token ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
