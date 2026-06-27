import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/UI';

const Portal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-3 text-blue-700">QuizBuddy</h1>
        <p className="text-center text-gray-600 mb-10">Your multi-subject quiz platform — choose your portal to continue</p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="flex h-full flex-col">
            <h2 className="text-2xl font-semibold mb-2">Student Portal</h2>
            <p className="text-gray-600 mb-6">
              Take quizzes, join groups, and view leaderboard performance.
            </p>
            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" className="w-full justify-center sm:flex-1" onClick={() => navigate('/login/student')}>
                Student Login
              </Button>
              <Button variant="secondary" className="w-full justify-center sm:flex-1" onClick={() => navigate('/register')}>
                Student Register
              </Button>
            </div>
          </Card>

          <Card className="flex h-full flex-col">
            <h2 className="text-2xl font-semibold mb-2">Mentor Portal</h2>
            <p className="text-gray-600 mb-6">
              Manage quizzes, groups, and student participation.
            </p>
            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" className="w-full justify-center sm:flex-1" onClick={() => navigate('/login/teacher')}>
                Mentor Login
              </Button>
              <Button variant="secondary" className="w-full justify-center sm:flex-1" onClick={() => navigate('/register/teacher')}>
                Mentor Register
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Portal;
