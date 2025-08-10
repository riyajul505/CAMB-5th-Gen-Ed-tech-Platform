# Assignment System API Requirements

## Overview
Complete API specification for the Assignment Creation (Teachers) and Project Submission (Students) system with grading, versioning, and notification features.

## 📚 Core Features

### Teacher Features:
- Create assignments with due dates
- View all assignments they've created
- View all submissions for each assignment
- Grade submissions and provide feedback
- View assignment analytics and statistics

### Student Features:
- View available assignments
- Submit projects before deadline
- Submit multiple versions (revisions)
- View their submission history and grades
- View assignment details and requirements

### Parent Features:
- Receive notifications when child gets graded
- View child's assignment performance

## 🔗 API Endpoints

### 1. Assignment Management APIs (Teacher)

#### Create Assignment
```http
POST /api/assignments/create
```

**Request Format:**
```javascript
{
  "title": "Science Project: Solar System",
  "description": "Create a model or presentation about the solar system. Include at least 5 planets with their characteristics.",
  "subject": "Science",
  "level": 3,
  "dueDate": "2024-02-15T23:59:59Z", // ISO 8601 format
  "maxFileSize": 10485760, // 10MB in bytes
  "allowedFileTypes": ["pdf", "doc", "docx", "ppt", "pptx", "jpg", "png", "zip"],
  "instructions": "Submit your work as a PDF or PowerPoint presentation. Include references.",
  "rubric": [
    {
      "criteria": "Content Accuracy",
      "maxPoints": 25,
      "description": "Factual information about planets"
    },
    {
      "criteria": "Creativity",
      "maxPoints": 25,
      "description": "Original presentation and design"
    },
    {
      "criteria": "Organization",
      "maxPoints": 25,
      "description": "Clear structure and flow"
    },
    {
      "criteria": "References",
      "maxPoints": 25,
      "description": "Proper citations and sources"
    }
  ],
  "totalPoints": 100,
  "teacherId": "teacher_mongodb_id",
  "classIds": ["class_id_1", "class_id_2"], // Optional: specific classes
  "isVisible": true // Publish immediately or save as draft
}
```

**Success Response (201):**
```javascript
{
  "success": true,
  "message": "Assignment created successfully",
  "assignment": {
    "id": "assignment_mongodb_id",
    "title": "Science Project: Solar System",
    "subject": "Science",
    "level": 3,
    "dueDate": "2024-02-15T23:59:59Z",
    "totalPoints": 100,
    "isVisible": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "studentsNotified": 45
  }
}
```

#### Get Teacher's Assignments
```http
GET /api/assignments/teacher/:teacherId
```

**Query Parameters:**
- `status` (optional): "active", "past_due", "draft"
- `subject` (optional): Filter by subject
- `level` (optional): Filter by level
- `page` (optional): Pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

**Success Response (200):**
```javascript
{
  "success": true,
  "assignments": [
    {
      "id": "assignment_id",
      "title": "Science Project: Solar System",
      "subject": "Science",
      "level": 3,
      "dueDate": "2024-02-15T23:59:59Z",
      "totalPoints": 100,
      "status": "active", // active, past_due, draft
      "submissionStats": {
        "totalStudents": 45,
        "submitted": 32,
        "pending": 13,
        "graded": 20,
        "avgScore": 78.5
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

#### Get Assignment Details with Submissions
```http
GET /api/assignments/:assignmentId/submissions
```

**Success Response (200):**
```javascript
{
  "success": true,
  "assignment": {
    "id": "assignment_id",
    "title": "Science Project: Solar System",
    "description": "Create a model...",
    "dueDate": "2024-02-15T23:59:59Z",
    "totalPoints": 100,
    "rubric": [...],
    "submissionStats": {
      "totalStudents": 45,
      "submitted": 32,
      "pending": 13,
      "graded": 20
    }
  },
  "submissions": [
    {
      "id": "submission_id",
      "student": {
        "id": "student_id",
        "name": "Alice Smith",
        "email": "alice@example.com",
        "level": 3
      },
      "versionNumber": 2, // Latest version
      "totalVersions": 2,
      "fileName": "solar_system_project_v2.pdf",
      "fileUrl": "https://storage.example.com/submissions/file.pdf",
      "fileSize": 2048576,
      "submittedAt": "2024-02-14T15:30:00Z",
      "status": "submitted", // submitted, graded, late
      "grade": null, // null if not graded yet
      "feedback": null,
      "isLate": false
    }
  ]
}
```

### 2. Grading APIs (Teacher)

#### Grade Submission
```http
POST /api/assignments/grade
```

**Request Format:**
```javascript
{
  "submissionId": "submission_mongodb_id",
  "assignmentId": "assignment_mongodb_id",
  "studentId": "student_mongodb_id",
  "totalScore": 85,
  "maxScore": 100,
  "rubricScores": [
    {
      "criteria": "Content Accuracy",
      "score": 22,
      "maxPoints": 25,
      "feedback": "Good factual information, but missing details about Jupiter's moons"
    },
    {
      "criteria": "Creativity", 
      "score": 23,
      "maxPoints": 25,
      "feedback": "Excellent creative presentation with interactive elements"
    },
    {
      "criteria": "Organization",
      "score": 20,
      "maxPoints": 25,
      "feedback": "Well structured but could improve transitions"
    },
    {
      "criteria": "References",
      "score": 20,
      "maxPoints": 25,
      "feedback": "Good sources but needs proper citation format"
    }
  ],
  "overallFeedback": "Great work! Your creative approach to the solar system project was impressive. Focus on adding more scientific details and improving citation format for next time.",
  "teacherId": "teacher_mongodb_id",
  "gradedAt": "2024-02-16T14:30:00Z"
}
```

**Success Response (200):**
```javascript
{
  "success": true,
  "message": "Grade submitted successfully",
  "grade": {
    "id": "grade_mongodb_id",
    "submissionId": "submission_id",
    "totalScore": 85,
    "maxScore": 100,
    "percentage": 85,
    "letterGrade": "B+",
    "gradedAt": "2024-02-16T14:30:00Z"
  },
  "notificationsSent": {
    "student": true,
    "parent": true
  }
}
```

### 3. Student Assignment APIs

#### Get Available Assignments for Student
```http
GET /api/assignments/student/:studentId
```

**Query Parameters:**
- `status` (optional): "available", "submitted", "graded", "overdue"
- `subject` (optional): Filter by subject

**Success Response (200):**
```javascript
{
  "success": true,
  "assignments": [
    {
      "id": "assignment_id",
      "title": "Science Project: Solar System",
      "description": "Create a model or presentation...",
      "subject": "Science",
      "level": 3,
      "dueDate": "2024-02-15T23:59:59Z",
      "totalPoints": 100,
      "status": "available", // available, submitted, graded, overdue
      "timeRemaining": "2 days, 5 hours", // Human readable
      "isOverdue": false,
      "allowedFileTypes": ["pdf", "doc", "docx", "ppt", "pptx"],
      "maxFileSize": 10485760,
      "mySubmission": null, // null if not submitted yet
      "teacher": {
        "name": "Mr. Johnson",
        "email": "johnson@school.com"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Assignment Details for Student
```http
GET /api/assignments/:assignmentId/student/:studentId
```

**Success Response (200):**
```javascript
{
  "success": true,
  "assignment": {
    "id": "assignment_id",
    "title": "Science Project: Solar System",
    "description": "Create a model or presentation about the solar system...",
    "instructions": "Submit your work as a PDF or PowerPoint presentation...",
    "subject": "Science",
    "level": 3,
    "dueDate": "2024-02-15T23:59:59Z",
    "totalPoints": 100,
    "allowedFileTypes": ["pdf", "doc", "docx", "ppt", "pptx", "jpg", "png", "zip"],
    "maxFileSize": 10485760,
    "isOverdue": false,
    "timeRemaining": "2 days, 5 hours",
    "rubric": [
      {
        "criteria": "Content Accuracy",
        "maxPoints": 25,
        "description": "Factual information about planets"
      }
    ],
    "teacher": {
      "name": "Mr. Johnson",
      "email": "johnson@school.com"
    }
  },
  "mySubmissions": [
    {
      "id": "submission_id",
      "versionNumber": 1,
      "fileName": "solar_system_v1.pdf",
      "fileSize": 1048576,
      "submittedAt": "2024-02-10T14:30:00Z",
      "status": "graded",
      "grade": {
        "totalScore": 78,
        "maxScore": 100,
        "percentage": 78,
        "letterGrade": "C+",
        "feedback": "Good start, but needs more detail",
        "gradedAt": "2024-02-12T10:00:00Z"
      }
    },
    {
      "id": "submission_id_2", 
      "versionNumber": 2,
      "fileName": "solar_system_v2.pdf",
      "fileSize": 2048576,
      "submittedAt": "2024-02-14T15:30:00Z",
      "status": "submitted", // Waiting for grade
      "grade": null
    }
  ]
}
```

### 4. Submission APIs

#### Submit Assignment
```http
POST /api/assignments/submit
```

**Request Format (Multipart/Form-Data):**
```javascript
{
  "assignmentId": "assignment_mongodb_id",
  "studentId": "student_mongodb_id", 
  "file": File, // The actual file upload
  "submissionNotes": "This is my revised version with better explanations about Jupiter and Saturn.",
  "isRevision": true, // true if this is a revision of previous submission
  "previousSubmissionId": "previous_submission_id" // if isRevision is true
}
```

**Success Response (201):**
```javascript
{
  "success": true,
  "message": "Assignment submitted successfully",
  "submission": {
    "id": "submission_mongodb_id",
    "assignmentId": "assignment_id",
    "studentId": "student_id",
    "versionNumber": 2,
    "fileName": "solar_system_project_v2.pdf",
    "fileUrl": "https://storage.example.com/submissions/file.pdf",
    "fileSize": 2048576,
    "submittedAt": "2024-02-14T15:30:00Z",
    "status": "submitted",
    "isLate": false,
    "submissionNotes": "This is my revised version..."
  },
  "assignment": {
    "title": "Science Project: Solar System",
    "dueDate": "2024-02-15T23:59:59Z"
  }
}
```

#### Get Student's Submission History
```http
GET /api/assignments/student/:studentId/submissions
```

**Query Parameters:**
- `assignmentId` (optional): Filter by specific assignment
- `status` (optional): "submitted", "graded", "late"

**Success Response (200):**
```javascript
{
  "success": true,
  "submissions": [
    {
      "id": "submission_id",
      "assignment": {
        "id": "assignment_id",
        "title": "Science Project: Solar System",
        "subject": "Science",
        "totalPoints": 100
      },
      "versionNumber": 2,
      "totalVersions": 2,
      "fileName": "solar_system_v2.pdf",
      "submittedAt": "2024-02-14T15:30:00Z",
      "status": "graded",
      "isLate": false,
      "grade": {
        "totalScore": 85,
        "maxScore": 100,
        "percentage": 85,
        "letterGrade": "B+",
        "feedback": "Great improvement!",
        "gradedAt": "2024-02-16T14:30:00Z"
      }
    }
  ]
}
```

### 5. Notification APIs

#### Parent Notification for Assignment Grade
```http
POST /api/notifications/assignment-graded
```

**Triggered automatically when teacher grades submission**

**Notification Format:**
```javascript
{
  "id": "notification_id",
  "type": "assignment_graded",
  "parentId": "parent_mongodb_id",
  "studentId": "student_mongodb_id", 
  "message": "Alice Smith received a grade of 85/100 (B+) for 'Science Project: Solar System'",
  "data": {
    "assignmentTitle": "Science Project: Solar System",
    "studentName": "Alice Smith",
    "score": 85,
    "maxScore": 100,
    "percentage": 85,
    "letterGrade": "B+",
    "subject": "Science",
    "gradedAt": "2024-02-16T14:30:00Z"
  },
  "link": "/child/student_id/assignments",
  "read": false,
  "createdAt": "2024-02-16T14:30:00Z"
}
```

### 6. File Upload & Management

#### Upload Assignment File
```http
POST /api/assignments/upload
```

**Request Format (Multipart):**
- File validation on server
- Virus scanning
- File type validation
- Size limits
- Secure storage with unique names

**File Storage Structure:**
```
/assignments/
  /{assignmentId}/
    /{studentId}/
      /v1_original_filename.pdf
      /v2_revised_filename.pdf
      /metadata.json
```

## 📊 Data Models

### Assignment Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  instructions: String,
  subject: String,
  level: Number, // 1-5
  dueDate: Date,
  totalPoints: Number,
  allowedFileTypes: [String],
  maxFileSize: Number,
  rubric: [
    {
      criteria: String,
      maxPoints: Number,
      description: String
    }
  ],
  teacherId: ObjectId,
  classIds: [ObjectId], // Optional
  isVisible: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Submission Model
```javascript
{
  _id: ObjectId,
  assignmentId: ObjectId,
  studentId: ObjectId,
  versionNumber: Number,
  fileName: String,
  originalFileName: String,
  fileUrl: String,
  fileSize: Number,
  fileMimeType: String,
  submittedAt: Date,
  submissionNotes: String,
  status: String, // submitted, graded, late
  isLate: Boolean,
  previousSubmissionId: ObjectId, // For version tracking
  createdAt: Date
}
```

### Grade Model
```javascript
{
  _id: ObjectId,
  submissionId: ObjectId,
  assignmentId: ObjectId,
  studentId: ObjectId,
  teacherId: ObjectId,
  totalScore: Number,
  maxScore: Number,
  percentage: Number,
  letterGrade: String,
  rubricScores: [
    {
      criteria: String,
      score: Number,
      maxPoints: Number,
      feedback: String
    }
  ],
  overallFeedback: String,
  gradedAt: Date,
  createdAt: Date
}
```

## 🔒 Security & Validation

### File Upload Security:
- File type validation (whitelist approach)
- File size limits (configurable per assignment)
- Virus scanning
- Secure file storage with unique names
- Access control (students can only access their own files)

### API Security:
- JWT token validation
- Role-based access control
- Rate limiting on file uploads
- Input sanitization
- SQL injection prevention

### Data Validation:
- Assignment due date must be in future
- File types must match allowed types
- File size must not exceed limits
- Grade scores must be within valid range
- Required fields validation

## 📈 Performance Considerations

### File Storage:
- Use cloud storage (AWS S3, Google Cloud Storage)
- CDN for file delivery
- Thumbnail generation for images
- File compression for large uploads

### Database Optimization:
- Indexes on frequently queried fields
- Pagination for large result sets
- Aggregation pipelines for statistics
- Efficient queries for submission counts

### Caching:
- Cache assignment lists
- Cache submission statistics
- Cache grade calculations
- Redis for session management

## 🚨 Error Handling

### Common Error Codes:
- `400` - Bad Request (invalid data, file too large)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (assignment/submission not found)
- `409` - Conflict (assignment already submitted)
- `413` - Payload Too Large (file size exceeded)
- `415` - Unsupported Media Type (invalid file type)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format:
```javascript
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds the maximum allowed limit of 10MB",
    "details": {
      "maxSize": 10485760,
      "receivedSize": 15728640
    }
  }
}
```

## 📱 Frontend Integration Requirements

### Required Frontend Features:
1. **Assignment Creation Form** (Teachers)
2. **Assignment List View** (Teachers & Students)  
3. **File Upload Component** with progress
4. **Grading Interface** with rubric
5. **Submission History View** (Students)
6. **Notification Display** (Parents)
7. **Assignment Dashboard** (All roles)

### State Management:
- Assignment list state
- Submission status tracking
- File upload progress
- Grade notifications
- Real-time updates

This comprehensive API specification ensures robust assignment management with proper security, versioning, and notification systems.
