import { NavLink } from 'react-router-dom';
import {
  LinkIcon,
  CalendarDays,
  Clock,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { path: '/event-types', label: 'Event Types', icon: LinkIcon },
  { path: '/bookings', label: 'Bookings', icon: CalendarDays },
  { path: '/availability', label: 'Availability', icon: Clock },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#111827] text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2">
        <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path
              d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
              stroke="#111827"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.695 13.7H15.704M15.695 16.7H15.704M11.995 13.7H12.005M11.995 16.7H12.005M8.295 13.7H8.305M8.295 16.7H8.305"
              stroke="#111827"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight">Cal.com</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-white/10">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            J
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-400">john@example.com</p>
          </div>
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </aside>
  );
}