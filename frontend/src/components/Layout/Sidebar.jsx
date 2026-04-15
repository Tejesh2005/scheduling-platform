// FILE: src/components/Layout/Sidebar.jsx

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LinkIcon,
  CalendarDays,
  Clock,
  Menu,
  X,
  ExternalLink,
  Copy,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/event-types', label: 'Event types', icon: LinkIcon },
  { path: '/bookings', label: 'Bookings', icon: CalendarDays },
  { path: '/availability', label: 'Availability', icon: Clock },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleViewPublicPage = () => {
    window.open('/johndoe', '_blank');
    setMobileOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/johndoe`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#111111] border-b border-[#222222] flex items-center justify-between px-4 z-50 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
            J
          </div>
          <span className="text-white text-sm font-semibold">John Doe</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 p-1"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[240px] bg-[#111111] border-r border-[#222222] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* User Profile Top */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              J
            </div>
            <span className="text-sm font-medium text-white truncate">John Doe</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Links */}
        <div className="px-3 py-2 border-t border-[#222222]">
          <button
            onClick={handleViewPublicPage}
            className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-colors w-full mb-0.5"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            View public page
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-colors w-full mb-0.5"
          >
            <Copy className="w-4 h-4 flex-shrink-0" />
            {copied ? 'Link copied!' : 'Copy public page link'}
          </button>

          <button
            className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-colors w-full mb-0.5"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </button>

          <p className="text-[10px] text-gray-600 px-2 py-2 mt-1">
            © 2026 Cal.com, Inc.
          </p>
        </div>
      </aside>
    </>
  );
}