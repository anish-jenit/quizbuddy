# Setup & Deployment Guide

## Local Development Setup

## No-DB Demo Mode (Recommended for Quick MVP Demos)

Run backend with in-memory data and no MongoDB dependency:

```bash
cd backend
DEMO_MODE=true PORT=5050 npm run dev
```

Demo credentials:
- Mentor: `mock-mentor@example.com` / `MockPass@123`
- Student: `student1@example.com` / `student1`
- Admin: `admin@example.com` / `Admin@123`

Students can also choose guest mode from Student Login and enter an anonymous
leaderboard name. Guests can attempt published quizzes belonging to public
groups. Their scores and session exist only until the demo server restarts.

For hosting without MongoDB, set `DEMO_MODE=true`. If `MONGODB_URI` is not
configured, the backend automatically starts in demo mode. Demo data is held in
memory and resets whenever the hosted service restarts.

The frontend uses the same hosted origin at `/api` by default. Only set
`VITE_API_URL` when the frontend and backend are deployed on different hosts.

Run smoke test against demo mode:

```bash
cd backend
SMOKE_API_BASE=http://localhost:5050/api \
SMOKE_MENTOR_EMAIL=mock-mentor@example.com \
SMOKE_MENTOR_PASSWORD=MockPass@123 \
npm run smoke:test
```

### 1. Prerequisites Installation

#### macOS
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and MongoDB
brew install node mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

#### Windows
```bash
# Install Node.js from https://nodejs.org/
# Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your configuration
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Sample .env Configuration:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tamil-quiz
JWT_SECRET=your_super_secret_jwt_key_12345
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Database Setup

### MongoDB Local Setup

1. **Verify MongoDB is running**
   ```bash
   mongo
   ```

2. **Create database** (automatic on first connection)
   The database will be created automatically when the backend connects.

3. **Verify connection**
   ```bash
   mongosh
   > use tamil-quiz
   > db.users.find()
   ```

### MongoDB Atlas (Cloud)

1. **Create account** at https://www.mongodb.com/cloud/atlas

2. **Create cluster** and get connection string

3. **Update .env**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tamil-quiz
   ```

## Testing the Setup

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "Test@123",
    "confirmPassword": "Test@123"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

### 4. Run MVP Smoke Test

This verifies the critical flow: mentor login -> create quiz -> add questions -> publish -> student attempt -> leaderboard.

Prerequisites:
- Backend server is running
- MongoDB is running
- A mentor user already exists

```bash
cd backend
SEED_MENTOR_EMAIL=mentor@example.com \
SEED_MENTOR_PASSWORD=mentor_password \
npm run seed:mentor

SMOKE_MENTOR_EMAIL=mentor@example.com \
SMOKE_MENTOR_PASSWORD=mentor_password \
npm run smoke:test
```

If the backend is running on a non-default port, set `SMOKE_API_BASE`:

```bash
SMOKE_API_BASE=http://localhost:5050/api \
SMOKE_MENTOR_EMAIL=mentor@example.com \
SMOKE_MENTOR_PASSWORD=mentor_password \
npm run smoke:test
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "Cannot connect to MongoDB"**
```bash
# Verify MongoDB is running
# macOS:
brew services list

# Check logs
mongod --version

# Start MongoDB manually
mongod
```

### Port Already in Use

```bash
# Kill process on port 5000 (macOS/Linux)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (macOS/Linux)
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Module Not Found

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### JWT Token Issues

```bash
# Verify JWT_SECRET is set in .env
# Token should be in Authorization header as:
Authorization: Bearer <token>
```

## Production Deployment

### Backend Deployment (Heroku)

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your_production_secret
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set FRONTEND_URL=your_frontend_url

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Environment Variables for Production

**.env.production**
```
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/tamil-quiz
JWT_SECRET=very_secure_random_string_here
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

### Scaling Considerations

1. **Database**: Use MongoDB Atlas for managed database
2. **Caching**: Implement Redis for leaderboard caching
3. **CDN**: Use Cloudflare for static content
4. **Load Balancing**: Use Nginx for multiple backend instances
5. **Monitoring**: Implement Sentry for error tracking

## Docker Setup (Optional)

### Docker Compose

**docker-compose.yml**
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://mongodb:27017/tamil-quiz
      JWT_SECRET: your_secret

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongo_data:
```

```bash
# Run with Docker Compose
docker-compose up
```

## Performance Optimization

### Backend
- Enable CORS caching
- Implement request compression
- Add database indexing
- Use pagination for large datasets

### Frontend
- Code splitting with React lazy loading
- Image optimization
- Bundle size analysis
- Service worker for offline support

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use HTTPS in production
- [ ] Enable CORS only for your domain
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Regular security audits

## Support & Resources

- MongoDB: https://docs.mongodb.com
- Express: https://expressjs.com
- React: https://react.dev
- Vite: https://vitejs.dev
- Node.js: https://nodejs.org

---

For additional help, check the main README.md or API_DOCUMENTATION.md
