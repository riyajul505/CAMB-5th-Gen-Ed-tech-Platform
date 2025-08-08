# 🔬 Interactive Virtual Science Lab Simulation API Requirements

## Overview
This document outlines the API endpoints required for the Interactive Virtual Science Lab Simulation feature. Students can generate experiments based on prompts, interact with virtual lab environments, and save/resume their progress.

---

## 🧪 Core Simulation APIs

### 1. **Generate New Simulation**
**POST** `/api/simulation/generate`

Generate a new virtual science lab simulation based on student prompt.

**Request Format:**
```json
{
  "studentId": "string (required)",
  "prompt": "string (required, max 500 chars)",
  "subject": "string (optional)", // e.g., "chemistry", "physics", "biology"
  "level": "number (1-5, optional)" // Student's current level
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "simulation": {
      "id": "simulation_mongodb_id",
      "title": "Generated title based on prompt",
      "description": "Detailed description of the experiment",
      "subject": "chemistry",
      "level": 3,
      "prompt": "Original student prompt",
      "experimentType": "titration", // Generated type
      "virtualLab": {
        "equipment": ["beaker", "burette", "indicator"],
        "chemicals": ["HCl", "NaOH", "phenolphthalein"],
        "procedure": ["Step 1: Fill burette with NaOH", "Step 2: Add indicator to HCl"],
        "safetyNotes": ["Wear safety goggles", "Handle chemicals carefully"]
      },
      "objectives": ["Determine concentration of HCl", "Understand acid-base reactions"],
      "expectedOutcome": "Color change from colorless to pink",
      "estimatedDuration": 30, // minutes
      "difficulty": "intermediate",
      "state": {
        "status": "not_started", // not_started, in_progress, paused, completed
        "currentStep": 0,
        "progress": 0, // percentage
        "userInputs": {},
        "observations": [],
        "results": {},
        "startedAt": null,
        "lastActiveAt": null,
        "completedAt": null
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

### 2. **Get Student's Simulations**
**GET** `/api/simulation/student/:studentId`

Get all simulations for a specific student with pagination.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `status` (optional): filter by status (not_started, in_progress, paused, completed)
- `subject` (optional): filter by subject

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "simulations": [
      {
        "id": "simulation_id",
        "title": "Acid-Base Titration Experiment",
        "description": "Virtual titration lab...",
        "subject": "chemistry",
        "level": 3,
        "experimentType": "titration",
        "state": {
          "status": "in_progress",
          "progress": 65,
          "currentStep": 3,
          "startedAt": "2024-01-15T10:30:00Z",
          "lastActiveAt": "2024-01-15T11:15:00Z"
        },
        "estimatedDuration": 30,
        "difficulty": "intermediate",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T11:15:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "total": 25,
      "notStarted": 5,
      "inProgress": 8,
      "paused": 7,
      "completed": 5
    }
  }
}
```

---

### 3. **Get Simulation Details**
**GET** `/api/simulation/:simulationId`

Get full details of a specific simulation including current state.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "simulation": {
      // Full simulation object as in generate response
      "id": "simulation_id",
      "title": "Acid-Base Titration Experiment",
      // ... all fields including virtualLab, state, etc.
    }
  }
}
```

---

### 4. **Update Simulation State**
**PUT** `/api/simulation/:simulationId/state`

Update the current state of a simulation (real-time state saving).

**Request Format:**
```json
{
  "state": {
    "status": "in_progress", // not_started, in_progress, paused, completed
    "currentStep": 3,
    "progress": 65, // percentage (0-100)
    "userInputs": {
      "step1_volume": "25.0",
      "step2_indicator": "phenolphthalein",
      "step3_observations": "Solution turned pink"
    },
    "observations": [
      {
        "step": 1,
        "timestamp": "2024-01-15T10:35:00Z",
        "observation": "Added 25ml of HCl to beaker"
      },
      {
        "step": 2,
        "timestamp": "2024-01-15T10:40:00Z",
        "observation": "Added 3 drops of phenolphthalein indicator"
      }
    ],
    "results": {
      "finalVolume": "24.8ml",
      "concentration": "0.1M",
      "accuracy": "95%"
    },
    "lastActiveAt": "2024-01-15T11:15:00Z"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Simulation state updated successfully",
  "data": {
    "simulation": {
      "id": "simulation_id",
      "state": {
        // Updated state object
      },
      "updatedAt": "2024-01-15T11:15:00Z"
    }
  }
}
```

---

### 5. **Start Simulation**
**POST** `/api/simulation/:simulationId/start`

Start a simulation (change status from not_started to in_progress).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Simulation started successfully",
  "data": {
    "simulation": {
      "id": "simulation_id",
      "state": {
        "status": "in_progress",
        "startedAt": "2024-01-15T10:30:00Z",
        "lastActiveAt": "2024-01-15T10:30:00Z"
      }
    }
  }
}
```

---

### 6. **Pause Simulation**
**POST** `/api/simulation/:simulationId/pause`

Pause a simulation (change status to paused).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Simulation paused successfully",
  "data": {
    "simulation": {
      "id": "simulation_id",
      "state": {
        "status": "paused",
        "lastActiveAt": "2024-01-15T11:15:00Z"
      }
    }
  }
}
```

---

### 7. **Resume Simulation**
**POST** `/api/simulation/:simulationId/resume`

Resume a paused simulation.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Simulation resumed successfully",
  "data": {
    "simulation": {
      "id": "simulation_id",
      "state": {
        "status": "in_progress",
        "lastActiveAt": "2024-01-15T11:20:00Z"
      }
    }
  }
}
```

---

### 8. **Complete Simulation**
**POST** `/api/simulation/:simulationId/complete`

Mark a simulation as completed (final accepting state).

**Request Format:**
```json
{
  "finalResults": {
    "accuracy": 95,
    "timeSpent": 28, // minutes
    "stepsCompleted": 5,
    "totalSteps": 5,
    "finalObservations": "Successfully completed titration with accurate results",
    "learningObjectivesMet": ["Understanding acid-base reactions", "Proper use of indicators"]
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Simulation completed successfully",
  "data": {
    "simulation": {
      "id": "simulation_id",
      "state": {
        "status": "completed",
        "progress": 100,
        "completedAt": "2024-01-15T11:30:00Z"
      }
    },
    "achievement": {
      "title": "Lab Master",
      "description": "Completed your first virtual lab simulation!",
      "points": 50
    },
    "notificationsCreated": 2 // For parent and teacher
  }
}
```

---

## 👨‍👩‍👧‍👦 Parent Dashboard Integration

### 9. **Get Child's Simulation Progress**
**GET** `/api/simulation/parent/:parentId/children`

Get simulation progress for all children of a parent.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "childId": "child_id",
        "childName": "Alice Smith",
        "level": 3,
        "simulationStats": {
          "totalSimulations": 8,
          "completedSimulations": 5,
          "inProgressSimulations": 2,
          "pausedSimulations": 1,
          "averageAccuracy": 87,
          "totalTimeSpent": 240, // minutes
          "lastActivity": "2024-01-15T11:30:00Z",
          "recentSimulations": [
            {
              "id": "sim_id",
              "title": "Acid-Base Titration",
              "status": "completed",
              "accuracy": 95,
              "completedAt": "2024-01-15T11:30:00Z"
            }
          ]
        }
      }
    ]
  }
}
```

---

## 🔔 Notification System Integration

When simulations reach certain milestones, notifications are automatically created:

### Auto-generated Notifications:

1. **Simulation Started** (for parents):
```json
{
  "userId": "parentId",
  "type": "simulation_started",
  "message": "Alice started a new virtual lab simulation: 'Acid-Base Titration Experiment'",
  "link": "/simulation-progress",
  "read": false
}
```

2. **Simulation Completed** (for parents and teachers):
```json
{
  "userId": "parentId",
  "type": "simulation_completed",
  "message": "🎉 Alice completed the 'Acid-Base Titration' simulation with 95% accuracy!",
  "link": "/simulation-progress",
  "read": false
}
```

3. **Achievement Unlocked** (for parents):
```json
{
  "userId": "parentId",
  "type": "simulation_achievement",
  "message": "🏆 Alice unlocked the 'Lab Master' achievement for completing their first simulation!",
  "link": "/simulation-progress",
  "read": false
}
```

---

## 🗄️ Database Schema

### Simulations Collection:
```javascript
{
  _id: ObjectId,
  studentId: String (required),
  title: String (required),
  description: String,
  prompt: String (required), // Original student prompt
  subject: String, // chemistry, physics, biology
  level: Number, // 1-5
  experimentType: String, // titration, microscopy, etc.
  virtualLab: {
    equipment: [String],
    chemicals: [String],
    procedure: [String],
    safetyNotes: [String]
  },
  objectives: [String],
  expectedOutcome: String,
  estimatedDuration: Number, // minutes
  difficulty: String, // beginner, intermediate, advanced
  state: {
    status: String, // not_started, in_progress, paused, completed
    currentStep: Number,
    progress: Number, // 0-100
    userInputs: Object, // Dynamic key-value pairs
    observations: [{
      step: Number,
      timestamp: Date,
      observation: String
    }],
    results: Object, // Final results when completed
    startedAt: Date,
    lastActiveAt: Date,
    completedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security & Authorization

### Access Control:
- **Students**: Can only access their own simulations
- **Parents**: Can view their children's simulation progress (read-only)
- **Teachers**: Can view simulations of students in their classes
- **Admin**: Can view all simulations

### Input Validation:
- Validate `studentId` exists and is accessible by requesting user
- Validate `prompt` length (max 500 characters)
- Sanitize all string inputs to prevent XSS
- Validate simulation state transitions (e.g., can't complete a not_started simulation)

### Rate Limiting:
- Limit simulation generation to prevent abuse (e.g., 5 new simulations per hour per student)
- Limit state updates to prevent spam (e.g., 1 update per second per simulation)

---

## 🚀 Implementation Priority

1. **High Priority:**
   - Simulation generation (`POST /api/simulation/generate`)
   - State management (`PUT /api/simulation/:id/state`)
   - Student simulation list (`GET /api/simulation/student/:id`)

2. **Medium Priority:**
   - Simulation controls (start, pause, resume, complete)
   - Parent dashboard integration
   - Notification system

3. **Low Priority:**
   - Advanced analytics
   - Performance optimization
   - Detailed reporting

---

## 🧪 AI Integration Notes

For simulation generation, the backend should use AI (like GPT-4) to:
1. **Parse the student prompt** and determine appropriate experiment type
2. **Generate realistic lab equipment** and procedures
3. **Create step-by-step instructions** appropriate for the student's level
4. **Define learning objectives** and expected outcomes
5. **Generate safety notes** and best practices

**Example AI Prompt Template:**
```
Create a virtual science lab simulation for a Level 3 student based on this prompt: "{student_prompt}"

Generate:
1. Experiment title and description
2. Required equipment and materials
3. Step-by-step procedure (5-8 steps)
4. Safety notes
5. Learning objectives
6. Expected outcome
7. Subject classification (chemistry/physics/biology)

Make it age-appropriate, educational, and interactive.
```

---

This API design provides a comprehensive foundation for the Interactive Virtual Science Lab Simulation feature with real-time state management, parent visibility, and proper security controls.
