# API Documentation - Tamil Quiz Platform

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Base URL
```
http://localhost:5000/api
```

---

## Auth Endpoints

### 1. Register User
**POST** `/auth/register`

Request Body:
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securepass123",
  "confirmPassword": "securepass123"
}
```

Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }
}
```

### 2. Login User
**POST** `/auth/login`

Request Body:
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

Response: Same as register

### 3. Get Current User
**GET** `/auth/me`

Headers: `Authorization: Bearer token`

Response:
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

### 4. Update Profile
**PUT** `/auth/profile`

Headers: `Authorization: Bearer token`

Request Body:
```json
{
  "firstName": "Jane",
  "lastName": "Doe"
}
```

---

## Quiz Endpoints

### 1. Create Quiz
**POST** `/quizzes`

Headers: `Authorization: Bearer token`

Request Body:
```json
{
  "title": "Tamil Basics",
  "description": "Learn basic Tamil words",
  "category": "Tamil",
  "difficulty": "easy",
  "groupId": "group_id_optional",
  "timePerQuestion": 30
}
```

Response:
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "quiz": { /* quiz object */ }
}
```

### 2. Get All Quizzes
**GET** `/quizzes`

Query Parameters:
- `groupId` (optional)
- `category` (optional) - Default: "Tamil"
- `isPublished` (optional) - true/false

Response:
```json
{
  "success": true,
  "quizzes": [ /* array of quiz objects */ ]
}
```

### 3. Get Quiz by ID
**GET** `/quizzes/:id`

Response:
```json
{
  "success": true,
  "quiz": { /* full quiz object with questions */ }
}
```

### 4. Update Quiz
**PUT** `/quizzes/:id`

Headers: `Authorization: Bearer token` (Mentor/Admin only)

Request Body: Same as create

### 5. Publish Quiz
**PUT** `/quizzes/:id/publish`

Headers: `Authorization: Bearer token` (Mentor/Admin only)

Validation:
- Quiz must have at least 1 question
- Quiz cannot have more than 10 questions

---

## Question Endpoints

### 1. Add Question to Quiz
**POST** `/questions/:quizId/questions`

Headers: `Authorization: Bearer token` (Mentor/Admin only)

Request Body:
```json
{
  "questionText": "What is Tamil?",
  "questionType": "multiple-choice",
  "options": [
    { "text": "A language", "isCorrect": true },
    { "text": "A country", "isCorrect": false },
    { "text": "A person", "isCorrect": false },
    { "text": "A city", "isCorrect": false }
  ],
  "correctAnswer": "A language",
  "explanation": "Tamil is a Dravidian language...",
  "difficulty": "easy"
}
```

### 2. Get Questions for Quiz
**GET** `/questions/:quizId/questions`

### 3. Report Question
**POST** `/questions/:id/report`

Headers: `Authorization: Bearer token`

Request Body:
```json
{
  "reason": "Incorrect answer",
  "description": "The correct answer should be..."
}
```

---

## Quiz Response Endpoints

### 1. Start Quiz
**POST** `/responses/start`

Headers: `Authorization: Bearer token`

Request Body:
```json
{
  "quizId": "quiz_id",
  "isGroupAttempt": false,
  "groupId": "group_id_optional"
}
```

Response:
```json
{
  "success": true,
  "quizResponse": {
    "id": "response_id",
    "quizId": "quiz_id",
    "totalQuestions": 10,
    "timePerQuestion": 30
  },
  "questions": [ /* array of question objects without answers */ ]
}
```

### 2. Submit Answer
**POST** `/responses/submit-answer`

Headers: `Authorization: Bearer token`

Request Body:
```json
{
  "responseId": "response_id",
  "questionId": "question_id",
  "selectedOption": "Option text",
  "selectedAnswer": "Answer text for short questions",
  "timeSpent": 25
}
```

Response:
```json
{
  "success": true,
  "message": "Answer submitted",
  "isCorrect": true
}
```

### 3. Complete Quiz
**PUT** `/responses/:responseId/complete`

Headers: `Authorization: Bearer token`

Response:
```json
{
  "success": true,
  "message": "Quiz completed",
  "result": {
    "totalScore": 90,
    "percentageScore": 90.5,
    "correctAnswers": 9,
    "totalQuestions": 10,
    "duration": 300
  }
}
```

### 4. Get Quiz History
**GET** `/responses/history/:quizId`

Headers: `Authorization: Bearer token`

Response:
```json
{
  "success": true,
  "history": [ /* array of completed quiz responses */ ]
}
```

### 5. Get Leaderboard
**GET** `/responses/leaderboard`

Headers: `Authorization: Bearer token`

Query Parameters:
- `quizId` (optional)
- `groupId` (optional)
- `period` (optional) - all-time, monthly, weekly

Response:
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "student": { "firstName": "John", "lastName": "Doe", "email": "john@example.com" },
      "averageScore": 95.5,
      "attemptCount": 5,
      "totalScore": 477.5
    }
  ]
}
```

---

## Group Endpoints

### 1. Create Group
**POST** `/groups`

Headers: `Authorization: Bearer token`

Request Body:
```json
{
  "name": "Tamil Learners",
  "description": "Group for Tamil enthusiasts",
  "category": "Tamil"
}
```

Response:
```json
{
  "success": true,
  "message": "Group created successfully",
  "group": {
    "id": "group_id",
    "name": "Tamil Learners",
    "code": "ABC123XYZ",
    "description": "Group for Tamil enthusiasts"
  }
}
```

### 2. Join Group
**POST** `/groups/join`

Headers: `Authorization: Bearer token`

Request Body:
```json
{
  "code": "ABC123XYZ"
}
```

### 3. Get My Groups
**GET** `/groups`

Headers: `Authorization: Bearer token`

### 4. Get Group Details
**GET** `/groups/:id`

Headers: `Authorization: Bearer token`

Response:
```json
{
  "success": true,
  "group": {
    "id": "group_id",
    "name": "Tamil Learners",
    "mentors": [ /* array of mentor objects */ ],
    "students": [ /* array of student objects */ ],
    "quizzes": [ /* array of quiz objects */ ]
  }
}
```

### 5. Add Mentor to Group
**POST** `/groups/mentor/add`

Headers: `Authorization: Bearer token` (Group creator only)

Request Body:
```json
{
  "groupId": "group_id",
  "mentorEmail": "mentor@example.com"
}
```

### 6. Remove Mentor from Group
**POST** `/groups/mentor/remove`

Headers: `Authorization: Bearer token` (Group creator only)

Request Body:
```json
{
  "groupId": "group_id",
  "mentorId": "mentor_id"
}
```

---

## Admin Endpoints

### 1. Get All Users
**GET** `/admin/users`

Headers: `Authorization: Bearer token` (Admin only)

Query Parameters:
- `role` (optional) - student, mentor, admin

### 2. Update User Role
**PUT** `/admin/users/role`

Headers: `Authorization: Bearer token` (Admin only)

Request Body:
```json
{
  "userId": "user_id",
  "newRole": "mentor"
}
```

### 3. Get Reported Questions
**GET** `/admin/questions/reported`

Headers: `Authorization: Bearer token` (Admin only)

### 4. Resolve Question Report
**PUT** `/admin/questions/report/resolve`

Headers: `Authorization: Bearer token` (Admin only)

Request Body:
```json
{
  "questionId": "question_id",
  "action": "approve" // or "delete"
}
```

### 5. Get Dashboard Stats
**GET** `/admin/stats`

Headers: `Authorization: Bearer token` (Admin only)

Response:
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalMentors": 10,
    "totalQuizzes": 25,
    "reportedQuestions": 3
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

No rate limiting implemented for MVP. To be added in production.

---

## Versioning

Current API Version: v1 (implied, no version prefix)

Future versions will use `/api/v2/` prefix.
