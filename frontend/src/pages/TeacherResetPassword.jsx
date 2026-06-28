import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Button, Input, Alert, Card } from '../components/UI';

const TeacherResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsLoading(true);
      const response = await authAPI.resetTeacherPassword(formData);
      setSuccess(response.data.message || 'Password reset successful.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-700">Mentor Password Reset</h1>
        <p className="text-center text-gray-600 mb-8">Reset password for mentor/admin accounts</p>

        {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}
        {success && <div className="mb-6"><Alert type="success">{success}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            label="Mentor Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="mentor@email.com"
            required
          />
          <Input
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full justify-center">
            Reset Password
          </Button>
        </form>

        <p className="mt-6 text-center text-gray-600 leading-6">
          Remembered your password?{' '}
          <button onClick={() => navigate('/login/teacher')} className="text-blue-600 hover:underline font-medium">
            Back to Mentor Login
          </button>
        </p>
        <Button variant="secondary" className="mt-4 w-full justify-center" onClick={() => navigate('/')}>
          Home
        </Button>
      </Card>
    </div>
  );
};

export default TeacherResetPassword;
