// FILE: src/components/Layout/Layout.jsx

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="pt-14 md:pt-0 md:ml-[240px]">
        <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}