import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/classes', label: 'Classes', icon: '🏫' },
        { path: '/live-session', label: 'Live Session', icon: '🎥' },
        { path: '/profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <nav className="navbar glass">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/dashboard" className="navbar-logo">
                    <span className="logo-icon">🎓</span>
                    <span className="logo-text">
                        Light<span className="gradient-text">Learn</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Right Section */}
                <div className="navbar-right">
                    {/* User Info */}
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.full_name}</span>
                            <span className={`user-role role-${user?.role}`}>
                                {user?.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {user?.role}
                            </span>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button onClick={handleLogout} className="btn btn-danger btn-small">
                        Logout
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="mobile-menu animate-slide-down">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="mobile-logout-btn"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
