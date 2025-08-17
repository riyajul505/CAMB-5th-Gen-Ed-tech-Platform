# Q&A System API Requirements

## Feature Overview
The Q&A system enables level-based communication between students and teachers:
- **Students** can ask questions, reply to classmates, and receive teacher guidance
- **Teachers** can reply to students, send general announcements to levels, and manage conversations
- **Level-based filtering** - students only see their level, teachers can select levels
- **Threaded conversations** with replies and visual organization
- **Real-time messaging** with notifications

## Database Schema

### Q&A Messages Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId, // null for teacher messages
  teacherId: ObjectId, // null for student messages
  content: String, // max 1000 characters
  timestamp: Date,
  isTeacher: Boolean,
  level: Number, // 1-10
  replyToId: ObjectId, // null for new messages
  threadId: ObjectId, // original message ID for threading
  isGeneralMessage: Boolean, // true for teacher announcements
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Student APIs

### 1. Get Level Messages
**GET** `/api/qna/level/:level`
**Query:** `?page=1&limit=20`
**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_1",
        "studentId": "student_1",
        "studentName": "Alice Johnson",
        "studentAvatar": "👩‍🎓",
        "teacherId": null,
        "teacherName": null,
        "teacherAvatar": null,
        "content": "I need help with addition",
        "timestamp": "2024-12-09T10:30:00Z",
        "isTeacher": false,
        "level": 1,
        "replyToId": null,
        "threadId": "msg_1",
        "replies": [
          {
            "id": "reply_1",
            "teacherId": "teacher_1",
            "teacherName": "Mr. Smith",
            "teacherAvatar": "👨‍🏫",
            "content": "Great question! Addition is...",
            "timestamp": "2024-12-09T11:15:00Z",
            "isTeacher": true,
            "replyToId": "msg_1",
            "threadId": "msg_1"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
```

### 2. Send Student Message
**POST** `/api/qna/send`
**Body:**
```json
{
  "studentId": "student_1",
  "content": "I need help with math",
  "level": 1,
  "replyToId": "msg_1" // optional
}
```
**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "new_msg_id",
      "studentId": "student_1",
      "studentName": "Alice Johnson",
      "content": "I need help with math",
      "timestamp": "2024-12-09T15:30:00Z",
      "isTeacher": false,
      "level": 1,
      "replyToId": "msg_1",
      "threadId": "msg_1",
      "replies": []
    }
  }
}
```

### 3. Delete Student Message
**DELETE** `/api/qna/messages/:messageId`
**Body:**
```json
{
  "userId": "student_1"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

## Teacher APIs

### 1. Get Teacher Dashboard
**GET** `/api/qna/teacher/dashboard/:teacherId`
**Query:** `?level=1&page=1&limit=20`
**Response:**
```json
{
  "success": true,
  "data": {
    "levels": [
      {
        "level": 1,
        "messageCount": 15,
        "lastMessage": "2024-12-09T16:00:00Z"
      }
    ],
    "recentMessages": [
      {
        "id": "msg_1",
        "studentId": "student_1",
        "studentName": "Alice Johnson",
        "studentAvatar": "👩‍🎓",
        "content": "I need help with addition",
        "timestamp": "2024-12-09T10:30:00Z",
        "isTeacher": false,
        "level": 1,
        "replyCount": 2
      }
    ]
  }
}
```

### 2. Get Level Messages (Teacher)
**GET** `/api/qna/teacher/level/:level`
**Query:** `?page=1&limit=20`
**Response:** Same as Student Get Level Messages

### 3. Send Teacher Message
**POST** `/api/qna/teacher/send`
**Body:**
```json
{
  "teacherId": "teacher_1",
  "content": "Here's how to solve that...",
  "level": 1,
  "replyToId": "msg_1", // optional
  "isGeneralMessage": false // true for announcements
}
```
**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "new_msg_id",
      "teacherId": "teacher_1",
      "teacherName": "Mr. Smith",
      "content": "Here's how to solve that...",
      "timestamp": "2024-12-09T16:00:00Z",
      "isTeacher": true,
      "level": 1,
      "replyToId": "msg_1",
      "threadId": "msg_1",
      "replies": []
    }
  }
}
```

### 4. Delete Teacher Message
**DELETE** `/api/qna/messages/:messageId`
**Body:**
```json
{
  "userId": "teacher_1"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

## Error Responses
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Common Error Codes
- `400` - `MISSING_REQUIRED_FIELDS`, `INVALID_MESSAGE_CONTENT`, `INVALID_LEVEL`
- `401` - `UNAUTHORIZED`
- `403` - `ACCESS_DENIED`
- `404` - `MESSAGE_NOT_FOUND`
- `409` - `INVALID_REPLY`
- `500` - `INTERNAL_SERVER_ERROR`

## Security Requirements
- All endpoints require JWT token
- Students can only access their own level
- Teachers can access any level
- Only message sender can delete their own messages
- Teachers can delete any message in their levels

## Rate Limiting
- Students: 10 messages per minute
- Teachers: 20 messages per minute
