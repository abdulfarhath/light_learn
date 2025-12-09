import React from 'react';
import useAuthStore from '../stores/authStore';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const Dashboard = () => {
    const { user } = useAuthStore();

    console.log('🔄 Dashboard rendering - User:', user?.email, 'Role:', user?.role);

    if (!user) {
        return <div className="p-6 text-center">Loading user...</div>;
    }

    return user.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
};

export default Dashboard;
