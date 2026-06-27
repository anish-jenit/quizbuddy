# Tamil Quiz Platform - Full Stack Application

A modern, minimal, and scalable Tamil Quiz platform designed as an MVP with support for individual and group-based learning.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)

## ✨ Features

### Core Features
- **User Management**: Email-based authentication with JWT
- **Quiz Management**: Create, publish, and manage quizzes (max 10 questions each)
- **Individual & Group Modes**: Take quizzes alone or with your group
- **Time-Based Questions**: Configurable time per question
- **Leaderboard**: Track top performers with ranking system
- **History Tracking**: Complete quiz history with scores and analytics
- **Question Reporting**: Report problematic questions with detailed feedback

### Admin Features
- User role management (Student → Mentor → Admin)
- Moderate reported questions
- Manage mentor access
- Dashboard with platform statistics

### Mentor Features
- Create and publish quizzes
- Add questions to quizzes
- Monitor group performance
- Manage student groups

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** for data persistence
- **JWT** for authentication
- **Bcryptjs** for password hashing

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Lucide React** for icons

## 📁 Project Structure

```
tamil-quiz/
├── backend/
│   ├── src/
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, error handling
│   │   ├── config/        # Database config
│   │   ├── utils/         # Helper functions
│   │   └── server.js      # Entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilities (API, store)
│   │   ├── styles/        # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .gitignore
└── docs/
    └── API_DOCUMENTATION.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/tamil-quiz
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## 🔐 User Roles

### Student
- Browse and take quizzes
- Join groups
- View personal leaderboard rankings
- Report questions
- Track quiz history

### Mentor
- Create and manage quizzes
- Add questions (max 10 per quiz)
- Publish quizzes
- Manage student groups
- Add/remove group members

### Admin
- Manage all users and roles
- View platform statistics
- Moderate reported questions (approve/delete)
- Review question reports with reasons
- System-wide oversight

## 📊 Database Models

### User
- Email (unique identifier)
- First Name, Last Name
- Password (hashed)
- Role (student, mentor, admin)
- Email Verification Status
- Groups Association

### Quiz
- Title, Description
- Category (Tamil, etc.)
- Difficulty Level
- Created By (Mentor)
- Questions Array
- Time Per Question
- Published Status

### Question
- Question Text
- Question Type (multiple-choice, true-false, short-answer)
- Options/Answers
- Correct Answer
- Explanation
- Reports (for moderation)
- Reported Status

### QuizResponse
- Student ID
- Quiz ID
- Answers Array
- Score & Percentage
- Duration
- Status (in-progress, completed, abandoned)
- Group ID (for group attempts)

### Group
- Name, Description
- Created By
- Members (Students + Mentors)
- Associated Quizzes
- Group Code
- Category

### Leaderboard
- Quiz ID
- Period (all-time, monthly, weekly)
- Rankings with scores
- Average performance

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Quizzes
- `POST /api/quizzes` - Create quiz (Mentor)
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz details
- `PUT /api/quizzes/:id` - Update quiz (Mentor)
- `DELETE /api/quizzes/:id` - Delete quiz (Mentor)
- `PUT /api/quizzes/:id/publish` - Publish quiz (Mentor)

### Questions
- `POST /api/questions/:quizId/questions` - Add question (Mentor)
- `GET /api/questions/:quizId/questions` - Get quiz questions
- `PUT /api/questions/:id` - Update question (Mentor)
- `DELETE /api/questions/:id` - Delete question (Mentor)
- `POST /api/questions/:id/report` - Report question

### Quiz Responses
- `POST /api/responses/start` - Start a quiz
- `POST /api/responses/submit-answer` - Submit answer
- `PUT /api/responses/:responseId/complete` - Complete quiz
- `GET /api/responses/history/:quizId` - Get quiz history
- `GET /api/responses/leaderboard` - Get leaderboard

### Groups
- `POST /api/groups` - Create group (Mentor)
- `GET /api/groups` - Get my groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/join` - Join group (using code)
- `POST /api/groups/mentor/add` - Add mentor (Group Creator)
- `POST /api/groups/mentor/remove` - Remove mentor (Group Creator)
- `POST /api/groups/leave` - Leave group

### Admin
- `GET /api/admin/users` - Get all users (Admin)
- `PUT /api/admin/users/role` - Update user role (Admin)
- `GET /api/admin/questions/reported` - Get reported questions (Admin)
- `PUT /api/admin/questions/report/resolve` - Resolve report (Admin)
- `GET /api/admin/stats` - Get dashboard stats (Admin)

## 🎯 MVP Scope

✅ **In Scope**
- Email-based authentication
- User role management (Student, Mentor, Admin)
- Quiz creation and management (10 questions max)
- Individual and group quiz attempts
- Leaderboard and history tracking
- Question reporting and moderation
- Admin dashboard

⏳ **Future Enhancements**
- Multiple languages (scalable after POC)
- Real-time notifications
- Advanced analytics
- Mobile app
- WebSocket for real-time group quizzes
- Payment integration
- Certificates

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tamil-quiz
JWT_SECRET=your_secret_jwt_key
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 🧪 Testing

### Create a Test Quiz
1. Register as a mentor
2. Create a group
3. Create a quiz
4. Add 5-10 questions
5. Publish the quiz
6. Take the quiz as a student

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

This is an MVP project. Please submit issues and pull requests to improve the platform.

---

**Ready to start learning Tamil? Let's build something great together!** 🚀
