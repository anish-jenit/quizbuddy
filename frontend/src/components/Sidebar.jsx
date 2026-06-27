import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Users, Settings, BarChart3, Home } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['student', 'mentor', 'admin'] },
    { path: '/quizzes', label: 'Quizzes', icon: BookOpen, roles: ['student', 'mentor', 'admin'] },
    { path: '/groups', label: 'Groups', icon: Users, roles: ['student', 'mentor', 'admin'] },
    { path: '/leaderboard', label: 'Leaderboard', icon: BarChart3, roles: ['student', 'mentor', 'admin'] },
    { path: '/admin', label: 'Admin Panel', icon: Settings, roles: ['admin'] },
  ];

  if (!user) return null;

  return (
    <aside className="w-full border-b border-gray-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="p-4 sm:p-6">
        <div className="flex gap-2 overflow-x-auto md:block md:space-y-2">
          {menuItems.map((item) => {
            if (!item.roles.includes(user.role)) return null;

            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex min-w-fit items-center gap-3 rounded-lg px-4 py-3 transition-colors md:flex ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
