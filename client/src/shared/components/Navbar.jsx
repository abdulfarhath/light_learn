import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
    const { user, logout } = useAuthStore();
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
        { path: '/courses', label: 'Courses', icon: '📚' },
        { path: '/classes', label: 'Classes', icon: '🏫' },
        { path: '/schedule', label: 'Schedule', icon: '📅' },
        { path: '/live-session', label: 'Live Session', icon: '🎥' },
        { path: '/profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <>
            {/* Mobile Menu Toggle */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-bg-panel rounded-lg border border-border text-text-main"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar Navigation */}
            <nav className={`
                fixed md:relative z-40 w-64 h-full bg-bg-panel border-r border-border flex flex-col transition-transform duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-text-main">
                        <span className="text-3xl">🎓</span>
                        <span>
                            Light<span className="text-primary">Learn</span>
                        </span>
                    </Link>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                                ${isActive(link.path)
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-main'}
                            `}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-border bg-bg-dark/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-main truncate">{user?.full_name}</p>
                            <p className="text-xs text-text-muted capitalize flex items-center gap-1">
                                {user?.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {user?.role}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-2 px-4 bg-bg-dark border border-border rounded-lg text-text-secondary hover:text-text-main hover:bg-bg-hover transition-colors text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </>
    );
};

export default Navbar;
