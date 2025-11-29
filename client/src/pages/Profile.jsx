import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { authAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authAPI.getProfile();
                setProfileData(response.user);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="profile-container">
                    <div className="profile-loading">Loading profile...</div>
                </div>
            </>
        );
    }

    const displayUser = profileData || user;

    return (
        <>
            <Navbar />
            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {displayUser?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <h1>{displayUser?.full_name}</h1>
                        <div className={`profile-role ${displayUser?.role}`}>
                            {displayUser?.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="detail-section">
                            <h2>Account Information</h2>

                            <div className="detail-item">
                                <span className="detail-label">Full Name</span>
                                <span className="detail-value">{displayUser?.full_name}</span>
                            </div>

                            <div className="detail-item">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{displayUser?.email}</span>
                            </div>

                            <div className="detail-item">
                                <span className="detail-label">Role</span>
                                <span className="detail-value">
                                    <span className={`role-badge ${displayUser?.role}`}>
                                        {displayUser?.role?.charAt(0).toUpperCase() + displayUser?.role?.slice(1)}
                                    </span>
                                </span>
                            </div>

                            <div className="detail-item">
                                <span className="detail-label">Account ID</span>
                                <span className="detail-value">#{displayUser?.id}</span>
                            </div>

                            {displayUser?.created_at && (
                                <div className="detail-item">
                                    <span className="detail-label">Member Since</span>
                                    <span className="detail-value">
                                        {new Date(displayUser.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {displayUser?.role === 'teacher' && (
                            <div className="detail-section">
                                <h2>Teacher Information</h2>
                                <div className="info-card">
                                    <p>✨ You have access to:</p>
                                    <ul>
                                        <li>Create and manage live classes</li>
                                        <li>Upload slides and resources</li>
                                        <li>Launch quizzes and polls</li>
                                        <li>Control student board access</li>
                                        <li>View student analytics</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {displayUser?.role === 'student' && (
                            <div className="detail-section">
                                <h2>Student Information</h2>
                                <div className="info-card">
                                    <p>✨ You can:</p>
                                    <ul>
                                        <li>Join live classes</li>
                                        <li>Participate in discussions</li>
                                        <li>Take quizzes and polls</li>
                                        <li>Download class materials</li>
                                        <li>Submit assignments</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
