# Quiz System - Backend API Requirements

This document outlines the required backend API endpoints and data structures for the complete quiz system implementation.

## 📋 Overview

The quiz system requires the following core functionalities:
- Quiz result storage and retrieval
- Student quiz history tracking
- Achievement system with notifications
- Parent access to children's quiz data
- Teacher access to student progress data

---

## 🔗 API Endpoints

### 1. Quiz Results API

#### **POST** `/api/quiz/save-result`
Save quiz results for a student.

**Request Body:**
```json
{
  "studentId": "string (required)",
  "resourceId": "string (required)",
  "score": "number (0-100, required)",
  "answers": "array of numbers (required)",
  "correctAnswers": "number (required)",
  "totalQuestions": "number (required)",
  "quizData": {
    "title": "string",
    "questions": "array of question objects"
  },
  "completedAt": "ISO date string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quizResultId": "string",
    "achievementUnlocked": "boolean",
    "achievement": {
      "id": "string",
      "title": "string",
      "description": "string",
      "level": "string (gold/silver/bronze/participation)"
    }
  }
}
```

#### **GET** `/api/quiz/history/:studentId`
Get quiz history for a specific student.

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "string",
        "resourceId": "string",
        "resourceTitle": "string",
        "score": "number",
        "correctAnswers": "number",
        "totalQuestions": "number",
        "completedAt": "ISO date string"
      }
    ]
  }
}
```

#### **GET** `/api/quiz/achievements/:studentId`
Get achievements for a specific student.

**Response:**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "level": "string",
        "icon": "string",
        "image": "string (URL or base64)",
        "unlockedAt": "ISO date string"
      }
    ]
  }
}
```

---

### 2. User API Extensions

#### **GET** `/api/user/children/:parentId`
Get children data for parent dashboard (extend existing endpoint).

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "id": "string",
        "email": "string",
        "profile": {
          "firstName": "string",
          "lastName": "string"
        },
        "selectedLevel": "number",
        "pathSelected": "boolean",
        "quizStats": {
          "totalQuizzes": "number",
          "averageScore": "number",
          "lastQuizDate": "ISO date string",
          "recentAchievements": "array of achievement objects"
        }
      }
    ]
  }
}
```

---

### 3. Notifications API Extensions

When quiz results are saved, the system should automatically create notifications:

#### **Auto-generated Notifications:**

1. **For Students** (when they complete a quiz):
```json
{
  "userId": "studentId",
  "type": "quiz_completed",
  "message": "Great job! You scored {score}% on the {resourceTitle} quiz.",
  "link": "/take-quiz",
  "read": false,
  "createdAt": "ISO date string"
}
```

2. **For Parents** (when their child completes a quiz):
```json
{
  "userId": "parentId",
  "type": "child_quiz_completed",
  "message": "{childName} completed a quiz and scored {score}% on {resourceTitle}.",
  "link": "/performance-reports",
  "read": false,
  "createdAt": "ISO date string"
}
```

3. **For Parents** (when their child unlocks an achievement):
```json
{
  "userId": "parentId",
  "type": "child_achievement_unlocked",
  "message": "🏆 {childName} unlocked a new achievement: {achievementTitle}!",
  "link": "/performance-reports",
  "read": false,
  "createdAt": "ISO date string"
}
```

4. **For Teachers** (when students in their classes unlock achievements):
```json
{
  "userId": "teacherId",
  "type": "student_achievement_unlocked",
  "message": "🌟 {studentName} (Level {level}) unlocked the '{achievementTitle}' achievement!",
  "link": "/student-progress",
  "read": false,
  "createdAt": "ISO date string"
}
```

---

### 4. Teacher API Extensions

#### **GET** `/api/teacher/students/all`
Get all students across all levels for teacher progress monitoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "string",
        "email": "string",
        "profile": {
          "firstName": "string",
          "lastName": "string"
        },
        "selectedLevel": "number",
        "quizStats": {
          "totalQuizzes": "number",
          "averageScore": "number",
          "lastQuizDate": "ISO date string"
        }
      }
    ]
  }
}
```

---

## 🗃️ Database Schema

### Quiz Results Collection
```javascript
{
  _id: ObjectId,
  studentId: String (required),
  resourceId: String (required),
  resourceTitle: String (required),
  score: Number (required, 0-100),
  answers: [Number] (required),
  correctAnswers: Number (required),
  totalQuestions: Number (required),
  quizData: {
    title: String,
    questions: [Object]
  },
  completedAt: Date (required),
  createdAt: Date (default: now)
}
```

### Achievements Collection
```javascript
{
  _id: ObjectId,
  studentId: String (required),
  title: String (required),
  description: String (required),
  level: String (required), // gold, silver, bronze, participation
  icon: String,
  image: String, // URL or base64
  score: Number, // Score that triggered this achievement
  resourceId: String, // Resource that triggered this achievement
  unlockedAt: Date (required),
  createdAt: Date (default: now)
}
```

---

## 🔄 Business Logic

### Achievement Logic
When a quiz result is saved:

1. **Calculate Achievement Level:**
   - Score ≥ 90% → Gold (Quiz Master)
   - Score ≥ 80% → Silver (Knowledge Star)
   - Score ≥ 70% → Bronze (Learning Champion)
   - Score < 70% → Participation (Keep Learning)

2. **Save Achievement** (if score ≥ 70%):
   - Create achievement record
   - Store achievement image (if generated)
   - Link to specific quiz/resource

3. **Create Notifications:**
   - Notify student of quiz completion
   - Notify parent(s) of child's performance
   - If achievement unlocked (≥70%), notify parents and teachers

### Notification Triggers
- **Quiz Completion**: Always notify student and parents
- **Achievement Unlock**: Notify parents and teachers when score ≥ 70%
- **High Performance**: Additional congratulatory notification for score ≥ 90%

---

## 🔐 Security & Validation

### Input Validation
- Validate `studentId` exists and is accessible by requesting user
- Validate `resourceId` exists
- Validate `score` is between 0-100
- Validate `answers` array length matches `totalQuestions`
- Sanitize all string inputs

### Authorization
- Students can only save/view their own quiz results
- Parents can only view their children's quiz results
- Teachers can view quiz results for students in their classes
- Admin can view all quiz results

### Rate Limiting
- Limit quiz result submissions to prevent spam
- Consider implementing cooldown periods between quiz attempts

---

## 📊 Analytics Endpoints (Optional)

#### **GET** `/api/analytics/student-performance/:studentId`
Get detailed analytics for a student.

#### **GET** `/api/analytics/class-performance/:classId`
Get class-wide performance analytics.

#### **GET** `/api/analytics/resource-difficulty/:resourceId`
Get difficulty analytics for a specific resource.

---

## 🚀 Implementation Priority

1. **High Priority:**
   - Quiz result saving (`POST /api/quiz/save-result`)
   - Quiz history retrieval (`GET /api/quiz/history/:studentId`)
   - Basic notifications for quiz completion

2. **Medium Priority:**
   - Achievement system
   - Parent dashboard data enhancements
   - Teacher progress monitoring

3. **Low Priority:**
   - Advanced analytics
   - Performance optimization
   - Detailed reporting features

---

## 🧪 Testing Requirements

### Test Cases
1. **Quiz Result Saving:**
   - Valid quiz submission
   - Invalid data handling
   - Duplicate submission prevention
   - Achievement unlock triggers

2. **Data Retrieval:**
   - Student quiz history
   - Parent access to children's data
   - Teacher access to student data
   - Privacy boundary enforcement

3. **Notifications:**
   - Quiz completion notifications
   - Achievement unlock notifications
   - Parent and teacher notifications

---

## 📝 Example Integration

```javascript
// Frontend quiz completion handler
const handleQuizComplete = async (results) => {
  try {
    // Save quiz results
    const response = await quizAPI.saveQuizResult({
      studentId: user.id,
      resourceId: selectedResource.id,
      score: results.score,
      answers: results.answers,
      correctAnswers: results.correctAnswers,
      totalQuestions: results.totalQuestions,
      quizData: results.quiz,
      completedAt: new Date().toISOString()
    });

    // Handle achievement unlock
    if (response.data.achievementUnlocked) {
      showAchievementModal(response.data.achievement);
    }

    // Redirect to results page
    setCurrentStep('results');
  } catch (error) {
    console.error('Failed to save quiz results:', error);
  }
};
```

This API structure provides a complete foundation for the quiz system with proper data flow, security, and scalability considerations. 