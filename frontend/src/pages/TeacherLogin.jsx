import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Alert, Card } from '../components/UI';

const TeacherLogin = () => {
  const navigate = useNavigate();
  const { login, logout, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    if (error) clearError();
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    try {
      const data = await login(formData);
      const role = data?.user?.role;

      if (!['mentor', 'admin'].includes(role)) {
        logout();
        setLocalError('This portal is for mentors and admins only.');
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
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-700">Mentor Login</h1>
        <p className="text-center text-gray-600 mb-8">Quiz and group management access</p>

        {(localError || error) && (
          <div className="mb-6">
          <Alert type="error" onClose={() => setLocalError('')}>
            {localError || error}
          </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="mentor@email.com"
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
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full justify-center">
            Login as Mentor
          </Button>
        </form>

        <p className="mt-3 text-center text-gray-600 leading-6">
          Forgot password?{' '}
          <button
            onClick={() => navigate('/login/teacher/reset-password')}
            className="text-blue-600 hover:underline font-medium"
          >
            Reset Password
          </button>
        </p>

        <p className="mt-6 text-center text-gray-600 leading-6">
          Student account?{' '}
          <button onClick={() => navigate('/login/student')} className="text-blue-600 hover:underline font-medium">
            Go to Student Login
          </button>
        </p>

        <p className="mt-2 text-center text-gray-600 leading-6">
          New mentor?{' '}
          <button onClick={() => navigate('/register/teacher')} className="text-blue-600 hover:underline font-medium">
            Request Mentor Access
          </button>
        </p>

        <Button variant="secondary" className="mt-4 w-full justify-center" onClick={() => navigate('/')}>
          Home
        </Button>
      </Card>
    </div>
  );
};

export default TeacherLogin;
