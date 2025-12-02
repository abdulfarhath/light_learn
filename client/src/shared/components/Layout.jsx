import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-bg-dark text-text-main overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-hidden flex flex-col relative">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
