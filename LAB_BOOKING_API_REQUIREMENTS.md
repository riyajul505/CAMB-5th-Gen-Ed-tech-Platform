# Lab Booking API Requirements

## Overview
This document outlines the API requirements for the lab booking system, which allows teachers to schedule lab sessions and students to book them. The system follows a Calendly-style approach with real-time availability tracking.

## Database Schema

### Lab Slots Collection
```javascript
{
  _id: ObjectId,
  teacherId: ObjectId,           // Reference to teacher
  teacherName: String,           // Teacher's name
  teacherAvatar: String,         // Teacher's avatar emoji
  level: Number,                 // Academic level (1-10)
  date: String,                  // Date in YYYY-MM-DD format
  startTime: String,             // Time in HH:MM format
  endTime: String,               // Time in HH:MM format
  duration: Number,              // Duration in minutes (calculated)
  maxStudents: Number,           // Maximum students allowed
  currentBookings: Number,       // Current number of bookings
  topic: String,                 // Lab session topic
  description: String,           // Session description
  location: String,              // Lab location
  isActive: Boolean,             // Whether slot is available for booking
  isAvailable: Boolean,          // Whether slot is visible to students
  createdAt: Date,
  updatedAt: Date
}
```

### Lab Bookings Collection
```javascript
{
  _id: ObjectId,
  slotId: ObjectId,              // Reference to lab slot
  studentId: ObjectId,           // Reference to student
  studentName: String,           // Student's name
  teacherId: ObjectId,           // Reference to teacher (from slot)
  teacherName: String,           // Teacher's name (from slot)
  date: String,                  // Date from slot
  startTime: String,             // Start time from slot
  endTime: String,               // End time from slot
  topic: String,                 // Topic from slot
  location: String,              // Location from slot
  status: String,                // 'confirmed', 'cancelled', 'completed'
  bookingNotes: String,          // Student's notes
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Student Endpoints

#### 1. Get Available Lab Slots
**GET** `/api/lab-slots/available/:level`

**Description:** Get all available lab slots for a specific academic level.

**Parameters:**
- `level` (path): Academic level (1-10)

**Response:**
```javascript
{
  success: true,
  data: {
    slots: [
      {
        id: "slot_1",
        teacherId: "teacher_001",
        teacherName: "Dr. Sarah Johnson",
        teacherAvatar: "👩‍🔬",
        level: 2,
        date: "2024-12-20",
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        maxStudents: 8,
        currentBookings: 3,
        topic: "Chemistry Lab - Acid Base Reactions",
        description: "Learn about pH levels and acid-base indicators through hands-on experiments.",
        location: "Lab Room 101",
        isAvailable: true
      }
    ]
  }
}
```

#### 2. Get Student's Bookings
**GET** `/api/lab-bookings/student/:studentId`

**Description:** Get all lab bookings for a specific student.

**Parameters:**
- `studentId` (path): Student's ID

**Response:**
```javascript
{
  success: true,
  data: {
    bookings: [
      {
        id: "booking_1",
        slotId: "slot_1",
        studentId: "student_001",
        studentName: "Alice Johnson",
        teacherId: "teacher_001",
        teacherName: "Dr. Sarah Johnson",
        date: "2024-12-20",
        startTime: "10:00",
        endTime: "11:00",
        topic: "Chemistry Lab - Acid Base Reactions",
        location: "Lab Room 101",
        status: "confirmed",
        bookingNotes: "Excited to learn about pH levels!",
        createdAt: "2024-12-15T10:30:00Z"
      }
    ]
  }
}
```

#### 3. Create Lab Booking
**POST** `/api/lab-bookings`

**Description:** Create a new lab booking for a student.

**Request Body:**
```javascript
{
  slotId: "slot_1",
  studentId: "student_001",
  bookingNotes: "Excited to learn about pH levels!"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    booking: {
      id: "booking_1",
      slotId: "slot_1",
      studentId: "student_001",
      studentName: "Alice Johnson",
      teacherId: "teacher_001",
      teacherName: "Dr. Sarah Johnson",
      date: "2024-12-20",
      startTime: "10:00",
      endTime: "11:00",
      topic: "Chemistry Lab - Acid Base Reactions",
      location: "Lab Room 101",
      status: "confirmed",
      bookingNotes: "Excited to learn about pH levels!",
      createdAt: "2024-12-15T10:30:00Z"
    }
  }
}
```

#### 4. Cancel Lab Booking
**DELETE** `/api/lab-bookings/:bookingId`

**Description:** Cancel a lab booking.

**Parameters:**
- `bookingId` (path): Booking ID to cancel

**Response:**
```javascript
{
  success: true,
  message: "Booking cancelled successfully"
}
```

### Teacher Endpoints

#### 1. Get Teacher's Lab Slots
**GET** `/api/lab-slots/teacher/:teacherId`

**Description:** Get all lab slots created by a specific teacher.

**Parameters:**
- `teacherId` (path): Teacher's ID

**Response:**
```javascript
{
  success: true,
  data: {
    slots: [
      {
        id: "slot_1",
        teacherId: "teacher_001",
        teacherName: "Dr. Sarah Johnson",
        level: 2,
        date: "2024-12-20",
        startTime: "10:00",
        endTime: "11:00",
        duration: 60,
        maxStudents: 8,
        currentBookings: 3,
        topic: "Chemistry Lab - Acid Base Reactions",
        description: "Learn about pH levels and acid-base indicators through hands-on experiments.",
        location: "Lab Room 101",
        isActive: true,
        createdAt: "2024-12-10T10:30:00Z",
        bookings: [
          {
            id: "booking_1",
            studentId: "student_001",
            studentName: "Alice Johnson",
            bookingNotes: "Excited to learn about pH levels!",
            status: "confirmed",
            createdAt: "2024-12-15T10:30:00Z"
          }
        ]
      }
    ]
  }
}
```

#### 2. Create Lab Slot
**POST** `/api/lab-slots`

**Description:** Create a new lab slot.

**Request Body:**
```javascript
{
  teacherId: "teacher_001",
  level: 2,
  date: "2024-12-20",
  startTime: "10:00",
  endTime: "11:00",
  topic: "Chemistry Lab - Acid Base Reactions",
  description: "Learn about pH levels and acid-base indicators through hands-on experiments.",
  location: "Lab Room 101",
  maxStudents: 8
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    slot: {
      id: "slot_1",
      teacherId: "teacher_001",
      teacherName: "Dr. Sarah Johnson",
      level: 2,
      date: "2024-12-20",
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      maxStudents: 8,
      currentBookings: 0,
      topic: "Chemistry Lab - Acid Base Reactions",
      description: "Learn about pH levels and acid-base indicators through hands-on experiments.",
      location: "Lab Room 101",
      isActive: true,
      isAvailable: true,
      createdAt: "2024-12-10T10:30:00Z",
      bookings: []
    }
  }
}
```

#### 3. Update Lab Slot
**PUT** `/api/lab-slots/:slotId`

**Description:** Update an existing lab slot.

**Parameters:**
- `slotId` (path): Slot ID to update

**Request Body:**
```javascript
{
  slotId: "slot_1",
  level: 2,
  date: "2024-12-20",
  startTime: "10:00",
  endTime: "11:00",
  topic: "Chemistry Lab - Acid Base Reactions",
  description: "Learn about pH levels and acid-base indicators through hands-on experiments.",
  location: "Lab Room 101",
  maxStudents: 8
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    slot: {
      id: "slot_1",
      teacherId: "teacher_001",
      teacherName: "Dr. Sarah Johnson",
      level: 2,
      date: "2024-12-20",
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      maxStudents: 8,
      currentBookings: 3,
      topic: "Chemistry Lab - Acid Base Reactions",
      description: "Learn about pH levels and acid-base indicators through hands-on experiments.",
      location: "Lab Room 101",
      isActive: true,
      isAvailable: true,
      createdAt: "2024-12-10T10:30:00Z",
      updatedAt: "2024-12-15T14:20:00Z"
    }
  }
}
```

#### 4. Delete Lab Slot
**DELETE** `/api/lab-slots/:slotId`

**Description:** Delete a lab slot (only if no bookings exist).

**Parameters:**
- `slotId` (path): Slot ID to delete

**Response:**
```javascript
{
  success: true,
  message: "Lab slot deleted successfully"
}
```

#### 5. Toggle Slot Status
**PATCH** `/api/lab-slots/:slotId/status`

**Description:** Toggle a slot's active status.

**Parameters:**
- `slotId` (path): Slot ID to toggle

**Request Body:**
```javascript
{
  isActive: true
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    slot: {
      id: "slot_1",
      isActive: true,
      isAvailable: true,
      updatedAt: "2024-12-15T14:20:00Z"
    }
  }
}
```

#### 6. Get Slot Bookings
**GET** `/api/lab-slots/:slotId/bookings`

**Description:** Get all bookings for a specific slot.

**Parameters:**
- `slotId` (path): Slot ID

**Response:**
```javascript
{
  success: true,
  data: {
    bookings: [
      {
        id: "booking_1",
        studentId: "student_001",
        studentName: "Alice Johnson",
        bookingNotes: "Excited to learn about pH levels!",
        status: "confirmed",
        createdAt: "2024-12-15T10:30:00Z"
      }
    ]
  }
}
```

### Admin Endpoints

#### 1. Get All Lab Slots
**GET** `/api/lab-slots`

**Description:** Get all lab slots (admin only).

**Response:**
```javascript
{
  success: true,
  data: {
    slots: [
      // Array of all lab slots
    ]
  }
}
```

#### 2. Get All Bookings
**GET** `/api/lab-bookings`

**Description:** Get all lab bookings (admin only).

**Response:**
```javascript
{
  success: true,
  data: {
    bookings: [
      // Array of all bookings
    ]
  }
}
```

## Error Responses

### Validation Error
```javascript
{
  success: false,
  error: "Validation failed",
  details: {
    field: "Error message"
  }
}
```

### Not Found Error
```javascript
{
  success: false,
  error: "Resource not found",
  message: "Lab slot not found"
}
```

### Conflict Error
```javascript
{
  success: false,
  error: "Conflict",
  message: "Slot is already full"
}
```

### Unauthorized Error
```javascript
{
  success: false,
  error: "Unauthorized",
  message: "You don't have permission to perform this action"
}
```

## Business Logic Rules

1. **Slot Creation:**
   - Teachers can only create slots for future dates
   - Start time must be before end time
   - Duration is automatically calculated
   - New slots are active by default

2. **Booking Rules:**
   - Students can only book slots for their level
   - Students cannot book the same slot twice
   - Students cannot book full slots
   - Students cannot book inactive slots

3. **Cancellation Rules:**
   - Students can cancel their bookings up to 24 hours before the session
   - Teachers can cancel slots if no bookings exist
   - Cancelled bookings free up slot capacity

4. **Status Management:**
   - Teachers can activate/deactivate slots
   - Inactive slots are not visible to students
   - Completed sessions are automatically marked as inactive

## Frontend Integration Notes

1. **Real-time Updates:** Consider implementing WebSocket connections for real-time booking updates
2. **Caching:** Cache available slots to reduce API calls
3. **Validation:** Implement client-side validation for all forms
4. **Error Handling:** Display user-friendly error messages
5. **Loading States:** Show appropriate loading indicators during API calls

## Security Considerations

1. **Authentication:** All endpoints require valid JWT tokens
2. **Authorization:** Teachers can only manage their own slots
3. **Rate Limiting:** Implement rate limiting for booking endpoints
4. **Input Validation:** Sanitize all user inputs
5. **Data Privacy:** Ensure student data is properly protected
