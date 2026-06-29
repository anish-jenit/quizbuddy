import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Portal from './pages/Portal';
import Login from './pages/Login';
import TeacherLogin from './pages/TeacherLogin';
import TeacherRegister from './pages/TeacherRegister';
import TeacherResetPassword from './pages/TeacherResetPassword';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quizzes from './pages/Quizzes';
import QuizAttempt from './pages/QuizAttempt';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import CreateQuiz from './pages/CreateQuiz';
import AddQuizQuestions from './pages/AddQuizQuestions';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Challenge from './pages/Challenge';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Portal />} />
        <Route path="/login" element={<Navigate to="/login/student" replace />} />
        <Route path="/login/student" element={<Login />} />
        <Route path="/login/teacher" element={<TeacherLogin />} />
        <Route path="/login/teacher/reset-password" element={<TeacherResetPassword />} />
        <Route path="/register/teacher" element={<TeacherRegister />} />
        <Route path="/register" element={<Register />} />
        <Route path="/challenge/:code" element={<Challenge />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/quizzes"
          element={
            <PrivateRoute>
              <Quizzes />
            </PrivateRoute>
          }
        />
        <Route
          path="/quizzes/create"
          element={
            <PrivateRoute>
              <CreateQuiz />
            </PrivateRoute>
          }
        />
        <Route
          path="/quizzes/:id/questions"
          element={
            <PrivateRoute>
              <AddQuizQuestions />
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz/:id"
          element={
            <PrivateRoute>
              <QuizAttempt />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <Groups />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <PrivateRoute>
              <GroupDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PrivateRoute>
              <Leaderboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
