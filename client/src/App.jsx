import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from './shared';
import Layout from './shared/components/Layout';
import { Login, Register } from './features/auth';
import { Profile } from './features/users';
import { Classes } from './features/classes';
import DoubtsPage from './features/doubts/pages/DoubtsPage';
import Dashboard from './pages/Dashboard';
import Courses from './features/courses/pages/Courses';
import SubjectDetails from './features/courses/pages/SubjectDetails';
import CreateCourse from './features/teacher-courses/pages/CreateCourse';
import LiveSession from './pages/LiveSession';

import Schedule from './pages/Schedule';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes with Sidebar Layout */}
                <Route element={<Layout />}>
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/courses"
                        element={
                            <ProtectedRoute>
                                <Courses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/doubts"
                        element={
                            <ProtectedRoute>
                                <DoubtsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/classes"
                        element={
                            <ProtectedRoute>
                                <Classes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/subjects/:id"
                        element={
                            <ProtectedRoute>
                                <SubjectDetails />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/schedule"
                        element={
                            <ProtectedRoute>
                                <Schedule />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/live-session"
                        element={
                            <ProtectedRoute>
                                <LiveSession />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/create-course"
                        element={
                            <ProtectedRoute>
                                <CreateCourse />
                            </ProtectedRoute>
                        }
                    />
                </Route>

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
