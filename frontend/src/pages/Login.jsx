import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Alert, Card } from '../components/UI';

const Login = () => {
  const navigate = useNavigate();
  const { login, guestLogin, logout, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [guestName, setGuestName] = useState('');
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      await guestLogin(guestName);
      navigate('/quizzes');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    try {
      const data = await login(formData);
      const role = data?.user?.role;

      if (role && role !== 'student') {
        logout();
        setLocalError('Mentor/Admin accounts should use Mentor Login.');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-600">Student Login</h1>
        <p className="text-center text-gray-600 mb-8">Take quizzes and track progress</p>
        
        {(localError || error) && (
          <div className="mb-6">
          <Alert type="error" onClose={() => setLocalError('')}>
            {localError || error}
          </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <Button 
            type="submit" 
            variant="primary" 
            size="lg"
            isLoading={isLoading}
            className="w-full justify-center"
          >
            Login
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-sm text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          or continue as guest
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleGuestLogin} className="space-y-3">
          <Input
            label="Anonymous leaderboard name"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Tamil Learner"
            minLength={2}
            maxLength={40}
            required
          />
          <Button type="submit" variant="secondary" isLoading={isLoading} className="w-full justify-center">
            Browse Public Quizzes as Guest
          </Button>
          <p className="text-center text-xs text-gray-500">
            Your guest scores appear on the leaderboard until the demo server restarts.
          </p>
        </form>

        <p className="mt-6 text-center text-gray-600 leading-6">
          Don't have an account?{' '}
          <button 
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:underline font-medium"
          >
            Register here
          </button>
        </p>

        <p className="mt-2 text-center text-gray-600 leading-6">
          Mentor account?{' '}
          <button
            onClick={() => navigate('/login/teacher')}
            className="text-blue-600 hover:underline font-medium"
          >
            Go to Mentor Login
          </button>
        </p>

        <Button variant="secondary" className="mt-4 w-full justify-center" onClick={() => navigate('/')}>
          Home
        </Button>
      </Card>
    </div>
  );
};

export default Login;
