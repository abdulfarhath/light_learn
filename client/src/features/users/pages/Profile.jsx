import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../stores/authStore';
import { userAPI } from '../services/userAPI';

const Profile = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Assuming userAPI.getProfile() exists and works similarly to authAPI.getProfile()
                // If not, we might need to adjust this. For now, using userAPI as imported.
                // However, the original code used authAPI which wasn't imported. 
                // I'll stick to using the store user for now if API fetch fails or isn't ready.
                // If we need to fetch fresh data:
                // const response = await userAPI.getProfile(user.id); 
                // setProfileData(response.user);

                // For now, since we have user in store, we can just use that or simulate fetch
                if (user) {
                    setProfileData(user);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg-dark text-text-main">
                <div className="spinner"></div>
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
