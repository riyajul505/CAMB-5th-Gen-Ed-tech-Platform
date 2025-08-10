# Missing Backend Endpoint: Student Assignments

## 🚨 Issue Identified

The frontend is trying to call `/api/assignments/student/{studentId}` but this endpoint doesn't exist in your backend implementation.

## 📋 Required Backend Endpoint

You need to implement this endpoint for students to see their assignments:

### **GET /api/assignments/student/{studentId}**

**Purpose**: Get all assignments available to a specific student based on their level

**Request Format:**
```http
GET /api/assignments/student/687fe1cefe4be27951b894d7?status=available&subject=Math&level=2
```

**Query Parameters:**
- `status` (optional): "available", "submitted", "graded", "overdue"
- `subject` (optional): Filter by subject
- `level` (optional): Override student's level (admin feature)

**Response Format:**
```json
{
  "success": true,
  "assignments": [
    {
      "id": "6897bae27ba522be36b86e78",
      "title": "Math Assignment: Quadratic Equations", 
      "description": "Solve various quadratic equations using different methods",
      "subject": "Math",
      "level": 3,
      "dueDate": "2025-01-30T23:59:59.000Z",
      "totalPoints": 100,
      "status": "available",
      "timeRemaining": "2 days, 5 hours",
      "isOverdue": false,
      "allowedFileTypes": ["pdf", "doc", "docx", "ppt", "pptx"],
      "maxFileSize": 10485760,
      "mySubmission": null,
      "teacher": {
        "name": "Mr. Smith",
        "email": "smith@school.com"
      },
      "createdAt": "2024-12-09T21:17:22.820Z"
    }
  ],
  "studentInfo": {
    "id": "687fe1cefe4be27951b894d7",
    "name": "Child Test",
    "level": 2,
    "pathSelected": true
  }
}
```

## 🔧 Backend Implementation Logic

```javascript
// Pseudo-code for your backend
app.get('/api/assignments/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, subject, level } = req.query;
    
    // 1. Get student info to determine their level
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    const targetLevel = level || student.selectedLevel || student.profile.grade;
    
    // 2. Find assignments for student's level that are visible
    let query = {
      level: targetLevel,
      isVisible: true
    };
    
    if (subject) query.subject = subject;
    
    const assignments = await Assignment.find(query)
      .populate('teacherId', 'profile.firstName profile.lastName email')
      .sort({ dueDate: 1 });
    
    // 3. For each assignment, check student's submission status
    const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
      const submission = await Submission.findOne({
        assignmentId: assignment._id,
        studentId: studentId
      }).sort({ versionNumber: -1 }); // Get latest version
      
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const isOverdue = now > dueDate;
      
      let assignmentStatus = 'available';
      if (submission) {
        if (submission.grade) {
          assignmentStatus = 'graded';
        } else {
          assignmentStatus = 'submitted';
        }
      } else if (isOverdue) {
        assignmentStatus = 'overdue';
      }
      
      // Filter by status if requested
      if (status && assignmentStatus !== status) {
        return null;
      }
      
      return {
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        level: assignment.level,
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        status: assignmentStatus,
        timeRemaining: calculateTimeRemaining(dueDate),
        isOverdue: isOverdue,
        allowedFileTypes: assignment.allowedFileTypes,
        maxFileSize: assignment.maxFileSize,
        mySubmission: submission ? {
          id: submission._id,
          versionNumber: submission.versionNumber,
          submittedAt: submission.submittedAt,
          status: submission.grade ? 'graded' : 'submitted',
          grade: submission.grade
        } : null,
        teacher: {
          name: `${assignment.teacherId.profile.firstName} ${assignment.teacherId.profile.lastName}`,
          email: assignment.teacherId.email
        },
        createdAt: assignment.createdAt
      };
    }));
    
    // Remove null entries (filtered out by status)
    const filteredAssignments = enrichedAssignments.filter(a => a !== null);
    
    res.json({
      success: true,
      assignments: filteredAssignments,
      studentInfo: {
        id: student._id,
        name: `${student.profile.firstName} ${student.profile.lastName}`,
        level: targetLevel,
        pathSelected: student.pathSelected
      }
    });
    
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch assignments' 
    });
  }
});

function calculateTimeRemaining(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  
  if (diff < 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  }
}
```

## 🎯 Key Features This Endpoint Should Provide

1. **Level-Based Filtering**: Only show assignments for student's level
2. **Status Detection**: Determine if assignment is available, submitted, graded, or overdue
3. **Submission Integration**: Include student's submission info if exists
4. **Time Calculations**: Calculate time remaining until due date
5. **Teacher Information**: Include teacher name and contact
6. **File Requirements**: Include file type and size restrictions

## 🔍 Database Queries Needed

```sql
-- Get student level
SELECT selectedLevel, pathSelected FROM students WHERE _id = ?

-- Get assignments for level
SELECT * FROM assignments WHERE level = ? AND isVisible = true

-- Get student submissions for each assignment
SELECT * FROM submissions WHERE assignmentId = ? AND studentId = ? ORDER BY versionNumber DESC LIMIT 1

-- Get teacher info
SELECT firstName, lastName, email FROM users WHERE _id = ? AND role = 'teacher'
```

## ✅ Once You Implement This Endpoint

The frontend will automatically work and display real assignments instead of mock data. The current frontend code already handles the response format correctly.

**This is the missing piece that will make the assignment system fully functional!** 🚀
