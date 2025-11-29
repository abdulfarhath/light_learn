import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="navbar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 30px',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #333',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div className="logo" style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white'
                }}>
                    🎓 Light<span style={{ color: '#667eea' }}>Learn</span>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <Link to="/dashboard" style={{
                        color: '#ddd',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        transition: 'color 0.3s'
                    }}
                        onMouseOver={(e) => e.target.style.color = '#667eea'}
                        onMouseOut={(e) => e.target.style.color = '#ddd'}>
                        Dashboard
                    </Link>
                    <Link to="/profile" style={{
                        color: '#ddd',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        transition: 'color 0.3s'
                    }}
                        onMouseOver={(e) => e.target.style.color = '#667eea'}
                        onMouseOut={(e) => e.target.style.color = '#ddd'}>
                        Profile
                    </Link>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    fontSize: '0.9rem'
                }}>
                    <span style={{ color: 'white', fontWeight: '600' }}>{user?.full_name}</span>
                    <span style={{
                        color: user?.role === 'teacher' ? '#ffc107' : '#0d6efd',
                        fontSize: '0.8rem',
                        textTransform: 'capitalize'
                    }}>
                        {user?.role}
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#c82333'}
                    onMouseOut={(e) => e.target.style.background = '#dc3545'}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Navbar;
