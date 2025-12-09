import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
    console.log('📐 Layout rendering');
    return (
        <div className="flex h-screen bg-bg-dark text-text-main overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto flex flex-col relative bg-bg-dark">
                <div className="flex-1 w-full h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
