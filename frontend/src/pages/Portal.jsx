import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Input, Alert } from '../components/UI';

const Portal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { guestLogin, isLoading, error, clearError } = useAuth();
  const [guestName, setGuestName] = useState('');

  const handleGuestLogin = async (event) => {
    event.preventDefault();
    clearError();
    try {
      await guestLogin(guestName);
      navigate('/quizzes');
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-3 text-blue-700">QuizBuddy</h1>
        <p className="text-center text-gray-600 mb-10">Your multi-subject quiz platform — choose your portal to continue</p>

        {searchParams.get('session') === 'expired' && (
          <div className="mb-6"><Alert type="warning">Your demo session expired after the server restarted. Please log in or continue as a guest again.</Alert></div>
        )}
        {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="flex h-full flex-col">
            <h2 className="text-2xl font-semibold mb-2">Player Portal</h2>
            <p className="text-gray-600 mb-6">
              Take quizzes, join groups, and view leaderboard performance.
            </p>
            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" className="w-full justify-center sm:flex-1" onClick={() => navigate('/login/student')}>
                Player Login
              </Button>
              <Button variant="secondary" className="w-full justify-center sm:flex-1" onClick={() => navigate('/register')}>
                Player Register
              </Button>
            </div>
          </Card>

          <Card className="flex h-full flex-col">
            <h2 className="text-2xl font-semibold mb-2">Mentor Portal</h2>
            <p className="text-gray-600 mb-6">
              Manage quizzes, groups, and player participation.
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

        <Card className="mt-6">
          <div className="grid gap-5 md:grid-cols-2 md:items-end">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Play as Guest</h2>
              <p className="text-gray-600">Choose a public nickname and jump straight into public quizzes—no registration needed.</p>
            </div>
            <form onSubmit={handleGuestLogin} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                label="Leaderboard nickname"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="CuriousMind"
                minLength={2}
                maxLength={40}
                required
              />
              <Button type="submit" variant="success" isLoading={isLoading} className="shrink-0 justify-center">
                Continue as Guest
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Portal;
