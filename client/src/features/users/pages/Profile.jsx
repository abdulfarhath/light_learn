import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../stores/authStore';
import { authAPI } from '../../auth/services/authAPI';

const Profile = () => {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Fetch fresh data from the server (endpoint: /auth/me)
                const response = await authAPI.getProfile();

                // 2. Update local state
                setProfileData(response.user);

                // 3. Update the global store so the data persists
                if (updateUser) {
                    updateUser(response.user);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                // Fallback to existing store data if fetch fails
                if (user) setProfileData(user);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 p-6 overflow-y-auto w-full max-w-4xl mx-auto flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const displayUser = profileData || user;

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-4xl mx-auto">
            <div className="bg-bg-panel border border-border rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col items-center mb-8 pb-8 border-b border-border">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg">
                        {displayUser?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <h1 className="text-2xl font-bold text-text-main mb-2">{displayUser?.full_name}</h1>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${displayUser?.role === 'teacher'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-success/20 text-success border border-success/30'
                        }`}>
                        {displayUser?.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-text-main border-l-4 border-primary pl-3">Account Information</h2>

                        <div className="flex justify-between py-3 border-b border-border">
                            <span className="text-text-muted">Full Name</span>
                            <span className="font-medium text-text-main">{displayUser?.full_name}</span>
                        </div>

                        <div className="flex justify-between py-3 border-b border-border">
                            <span className="text-text-muted">Email</span>
                            <span className="font-medium text-text-main">{displayUser?.email}</span>
                        </div>

                        <div className="flex justify-between py-3 border-b border-border">
                            <span className="text-text-muted">Role</span>
                            <span className="font-medium text-text-main capitalize">
                                {displayUser?.role}
                            </span>
                        </div>

                        {/* --- ADDED ACADEMIC FIELDS --- */}
                        {displayUser?.college && (
                            <div className="flex justify-between py-3 border-b border-border">
                                <span className="text-text-muted">College</span>
                                <span className="font-medium text-text-main text-right">{displayUser.college}</span>
                            </div>
                        )}

                        {displayUser?.branch && (
                            <div className="flex justify-between py-3 border-b border-border">
                                <span className="text-text-muted">Branch</span>
                                <span className="font-medium text-text-main">{displayUser.branch}</span>
                            </div>
                        )}

                        {displayUser?.year && (
                            <div className="flex justify-between py-3 border-b border-border">
                                <span className="text-text-muted">Year</span>
                                <span className="font-medium text-text-main">{displayUser.year}</span>
                            </div>
                        )}

                        {displayUser?.semester && (
                            <div className="flex justify-between py-3 border-b border-border">
                                <span className="text-text-muted">Semester</span>
                                <span className="font-medium text-text-main">{displayUser.semester}</span>
                            </div>
                        )}
                        {/* ----------------------------- */}

                        <div className="flex justify-between py-3 border-b border-border">
                            <span className="text-text-muted">Account ID</span>
                            <span className="font-medium text-text-main">#{displayUser?.id}</span>
                        </div>

                        {displayUser?.created_at && (
                            <div className="flex justify-between py-3 border-b border-border">
                                <span className="text-text-muted">Member Since</span>
                                <span className="font-medium text-text-main">
                                    {new Date(displayUser.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {displayUser?.role === 'teacher' && (
                            <>
                                <h2 className="text-xl font-semibold text-text-main border-l-4 border-primary pl-3">Teacher Information</h2>
                                <div className="bg-bg-dark rounded-xl p-6 border border-border">
                                    <p className="mb-4 font-medium text-primary">✨ You have access to:</p>
                                    <ul className="space-y-2 text-text-secondary">
                                        <li className="flex items-center gap-2"><span>•</span> Create and manage live classes</li>
                                        <li className="flex items-center gap-2"><span>•</span> Upload slides and resources</li>
                                        <li className="flex items-center gap-2"><span>•</span> Launch quizzes and polls</li>
                                        <li className="flex items-center gap-2"><span>•</span> Control student board access</li>
                                        <li className="flex items-center gap-2"><span>•</span> View student analytics</li>
                                    </ul>
                                </div>
                            </>
                        )}

                        {displayUser?.role === 'student' && (
                            <>
                                <h2 className="text-xl font-semibold text-text-main border-l-4 border-success pl-3">Student Information</h2>
                                <div className="bg-bg-dark rounded-xl p-6 border border-border">
                                    <p className="mb-4 font-medium text-success">✨ You can:</p>
                                    <ul className="space-y-2 text-text-secondary">
                                        <li className="flex items-center gap-2"><span>•</span> Join live classes</li>
                                        <li className="flex items-center gap-2"><span>•</span> Participate in discussions</li>
                                        <li className="flex items-center gap-2"><span>•</span> Take quizzes and polls</li>
                                        <li className="flex items-center gap-2"><span>•</span> Download class materials</li>
                                        <li className="flex items-center gap-2"><span>•</span> Submit assignments</li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;