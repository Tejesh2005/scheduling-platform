import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Sidebar />
      {/* Add top padding on mobile for the top bar, left margin on desktop for sidebar */}
      <main className="pt-14 md:pt-0 md:ml-[240px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}