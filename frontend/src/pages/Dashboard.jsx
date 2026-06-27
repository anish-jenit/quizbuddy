import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Loading } from '../components/UI';
import { useQuizStore } from '../utils/store';
import { quizAPI } from '../utils/api';
import { BookOpen, Users, BarChart3, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch quizzes
        const quizzesRes = await quizAPI.getQuizzes({ isPublished: 'true' });
        setStats(prev => ({
          ...prev,
          totalQuizzes: quizzesRes.data.quizzes.length
        }));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (isLoading) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Quizzes</p>
                  <p className="text-3xl font-bold">{stats.totalQuizzes || 0}</p>
                </div>
                <BookOpen size={40} className="text-blue-500 opacity-20" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">My Groups</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <Users size={40} className="text-purple-500 opacity-20" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed Quizzes</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <BarChart3 size={40} className="text-green-500 opacity-20" />
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {user?.role === 'mentor' && (
                <Button
                  variant="primary"
                  className="w-full justify-center gap-2"
                  onClick={() => navigate('/quizzes/create')}
                >
                  <Plus size={20} />
                  Create New Quiz
                </Button>
              )}
              <Button variant="secondary" className="w-full justify-center" onClick={() => navigate('/quizzes')}>
                Browse Quizzes
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
