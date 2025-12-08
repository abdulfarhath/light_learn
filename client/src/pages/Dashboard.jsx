import React from 'react';
import useAuthStore from '../stores/authStore';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const Dashboard = () => {
    const { user } = useAuthStore();

    if (!user) {
        return <div>Loading...</div>;
    }

    return user.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
};

export default Dashboard;
