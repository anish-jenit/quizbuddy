import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Alert, Card } from '../components/UI';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-blue-600">QuizBuddy Registration</h1>
        <p className="text-center text-gray-600 mb-8">Create your student account to start taking quizzes</p>
        
        {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
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
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
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
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-gray-600 leading-6">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login/student')}
            className="text-blue-600 hover:underline font-medium"
          >
            Login here
          </button>
        </p>
        <Button variant="secondary" className="mt-4 w-full justify-center" onClick={() => navigate('/')}>
          Home
        </Button>
      </Card>
    </div>
  );
};

export default Register;
