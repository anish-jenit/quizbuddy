# Tamil Quiz Platform - Quick Reference Guide

## 🚀 5-Minute Quick Start

### Prerequisites
- Node.js v16+
- MongoDB running locally or MongoDB Atlas account

### Step 1: Backend (2 minutes)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set MONGODB_URI
npm run dev
```
Backend runs at: `http://localhost:5000`

### Step 2: Frontend (2 minutes)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Step 3: Test (1 minute)
1. Go to http://localhost:5173
2. Register with your email
3. Create a quiz if mentor, or browse available quizzes

---

## 📁 File Structure Quick Reference

### Backend Structure
```
backend/src/
├── models/          # Database schemas (User, Quiz, Question, etc.)
├── routes/          # API endpoints (auth, quiz, admin, etc.)
├── controllers/     # Business logic (create, update, delete)
├── middleware/      # Authentication & error handling
├── config/          # Database connection
├── utils/           # Helpers (JWT, hashing, etc.)
└── server.js        # Express app entry point
```

### Frontend Structure
```
frontend/src/
├── pages/           # Full page components (Dashboard, Quizzes, etc.)
├── components/      # Reusable UI components (Button, Card, etc.)
├── hooks/           # Custom hooks (useAuth, etc.)
├── utils/           # API client & Zustand store
├── styles/          # Tailwind CSS globals
├── App.jsx          # Router configuration
└── main.jsx         # React entry point
```

---

## 🔑 Key Concepts

### Authentication Flow
1. User registers → JWT token generated → Token stored in localStorage
2. User makes API request → Token sent in Authorization header
3. Backend verifies token → User authorized to access resource

### Quiz Flow
1. Mentor creates quiz → Adds questions (max 10) → Publishes
2. Student joins group (optional) → Takes quiz
3. Quiz scored → Results stored → Leaderboard updated

### Admin Flow
1. Admin views reported questions
2. Reviews report details
3. Approves (clears report) or Deletes question

---

## 🎯 Common Tasks

### Add New Quiz Feature
1. Create model in `backend/src/models/`
2. Create controller in `backend/src/controllers/`
3. Create routes in `backend/src/routes/`
4. Create page component in `frontend/src/pages/`
5. Add navigation link in `frontend/src/components/Sidebar.jsx`

### Add New API Endpoint
1. Add logic in controller
2. Add route in corresponding route file
3. Add API call in `frontend/src/utils/api.js`
4. Use in component with try-catch and loading state

### Add New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link in `Sidebar.jsx`
4. Import components and use API calls

---

## 📊 API Quick Reference

### Start Quiz
```javascript
POST /api/responses/start
Body: { quizId, isGroupAttempt, groupId }
Returns: { quizResponse, questions }
```

### Submit Answer
```javascript
POST /api/responses/submit-answer
Body: { responseId, questionId, selectedOption, timeSpent }
Returns: { isCorrect }
```

### Get Leaderboard
```javascript
GET /api/responses/leaderboard?quizId=xxx&period=all-time
Returns: { leaderboard: [{ rank, student, averageScore }] }
```

### Create Group
```javascript
POST /api/groups
Body: { name, description, category }
Returns: { group: { id, code, name } }
```

---

## 🔐 User Roles Cheat Sheet

| Ability | Student | Mentor | Admin |
|---------|---------|--------|-------|
| Browse Quizzes | ✅ | ✅ | ✅ |
| Take Quizzes | ✅ | ✅ | ✅ |
| Create Quizzes | ❌ | ✅ | ✅ |
| Create Groups | ❌ | ✅ | ✅ |
| Add Mentors | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Moderate Questions | ❌ | ❌ | ✅ |
| View All Stats | ❌ | ❌ | ✅ |

---

## 🛠 Development Tips

### Frontend Development
- Use React DevTools browser extension
- Check state with Zustand in console: `useAuthStore.getState()`
- Network tab shows API calls
- Check localStorage for tokens

### Backend Development
- Use Postman to test API endpoints
- Check MongoDB Compass for database
- Logs appear in terminal where `npm run dev` runs
- Use `mongosh` to query database directly

### Debugging
```javascript
// Backend: Add console.logs or use debugger
console.log('Debug:', variable);

// Frontend: Use React DevTools or console
console.log('State:', useAuthStore.getState());

// Check network requests in DevTools Network tab
```

---

## 📦 Important npm Commands

### Backend
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
npm test         # Run tests (when added)
```

### Frontend
```bash
npm run dev      # Start dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Check code quality
```

---

## 🐛 Common Issues & Fixes

### Backend won't start
- Check MongoDB is running: `mongosh`
- Verify .env file exists
- Clear node_modules: `rm -rf node_modules && npm install`

### Frontend won't start
- Port 5173 in use: Change in `vite.config.js`
- CORS error: Verify backend URL in `.env`
- Module not found: Run `npm install`

### API calls failing
- Check bearer token in request headers
- Verify backend is running on port 5000
- Check MongoDB connection string in .env
- Look at browser console for error messages

### Login not working
- Verify user email in database: `db.users.findOne({ email: "your@email.com" })`
- Check password hashing is working
- Verify JWT_SECRET in .env

---

## 🎨 Styling Guide

All styles use Tailwind CSS. Common classes:

```jsx
// Colors
className="text-blue-600"          // Text color
className="bg-blue-50"             // Background
className="border-gray-200"        // Border

// Spacing
className="px-4 py-2"              // Padding
className="mb-8"                   // Margin bottom
className="gap-4"                  // Gap between flex items

// Sizing
className="w-full"                 // Full width
className="h-64"                   // Height
className="text-lg"                // Font size

// Components
className="btn-primary"            // Blue button
className="btn-secondary"          // Gray button
className="card"                   // White box with shadow
className="input-field"            // Styled input
```

---

## 📱 Responsive Design Breakpoints

```css
/* Tailwind breakpoints */
xs: 0px       /* Default: mobile */
sm: 640px     /* Tablet */
md: 768px     /* Small laptop */
lg: 1024px    /* Desktop */
xl: 1280px    /* Large desktop */
```

Usage: `md:grid-cols-3` means 3 columns on medium screens

---

## 🔗 Environment Variables Reference

### Backend (.env)
```
PORT                 # Server port (default: 5000)
MONGODB_URI          # Database connection string
JWT_SECRET           # Secret key for JWT
JWT_EXPIRE           # Token expiration (7d, 24h, etc.)
NODE_ENV             # development or production
FRONTEND_URL         # Frontend domain for CORS
```

### Frontend (.env, optional)
```
REACT_APP_API_URL    # Backend API URL (default: http://localhost:5000/api)
```

---

## 🧪 Testing Workflow

1. **Register**: Create account with valid email
2. **Login**: Use registered email
3. **Create Quiz** (if Mentor):
   - Fill quiz details
   - Add 3-5 questions
   - Publish quiz
4. **Take Quiz** (if Student):
   - Select quiz
   - Answer all questions
   - Submit
5. **Check Results**:
   - View score
   - Check history
   - See leaderboard

---

## 📚 Code Patterns

### API Call Pattern
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await someAPI.getEndpoint();
      setData(response.data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Protected Route Pattern
```jsx
<Route
  path="/admin"
  element={
    <PrivateRoute requiredRole="admin">
      <AdminDashboard />
    </PrivateRoute>
  }
/>
```

### Form Handler Pattern
```jsx
const [formData, setFormData] = useState({ field: '' });

const handleChange = (e) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await api.create(formData);
  } catch (err) {
    // Handle error
  }
};
```

---

## 🚀 Deployment Checklist

- [ ] Update .env with production values
- [ ] Set NODE_ENV=production
- [ ] Build frontend: `npm run build`
- [ ] Test production build locally
- [ ] Set up MongoDB Atlas
- [ ] Configure environment variables on hosting
- [ ] Deploy backend (Heroku/Railway)
- [ ] Deploy frontend (Vercel)
- [ ] Test all features in production
- [ ] Set up error tracking (Sentry)
- [ ] Monitor performance
- [ ] Set up backups

---

## 💾 Useful Database Queries (mongosh)

```javascript
// Switch database
use tamil-quiz

// View all users
db.users.find()

// Find specific user
db.users.findOne({ email: "user@example.com" })

// View quizzes
db.quizzes.find()

// Count documents
db.users.countDocuments()

// Delete test data
db.quizzes.deleteMany({ title: "test" })
```

---

## 🎯 Next Steps After Setup

1. **Test all user flows** (student, mentor, admin)
2. **Create sample data** (quizzes, questions)
3. **Test APIs** with Postman
4. **Review code** and add comments
5. **Set up git** and version control
6. **Plan deployment** strategy
7. **Get user feedback** on UI/UX
8. **Optimize** based on feedback
9. **Deploy to production**
10. **Monitor and scale**

---

## 📞 Getting Help

1. Check **README.md** for overview
2. Check **SETUP_GUIDE.md** for installation help
3. Check **API_DOCUMENTATION.md** for API details
4. Check **PROJECT_SUMMARY.md** for feature details
5. Review code comments
6. Search error message in console

---

**Happy coding! 🎉**

Questions? Check the comprehensive documentation included in the project.
