import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">QuizBuddy</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <span className="text-sm text-gray-600 leading-5">
              {user.firstName} {user.lastName}
            </span>
            {user.role === 'admin' && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Admin</span>
            )}
            {user.role === 'mentor' && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Mentor</span>
            )}
            <button
              onClick={handleLogout}
              className="btn-secondary inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
