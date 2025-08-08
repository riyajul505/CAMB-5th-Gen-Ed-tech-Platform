# 🎮 Gamified Interactive Simulation - Backend API Requirements

This document outlines the required backend API endpoints and data structures for the interactive, gamified science simulation system.

## 📋 Overview

The gamified simulation system enhances the existing simulation framework with:
- Interactive drag-and-drop gameplay mechanics
- AI-powered game actions and responses via Gemini API
- Real-time scoring and achievement systems
- Enhanced state management for game elements
- Seamless integration with existing pause/resume functionality

---

## 🔗 Enhanced API Endpoints

### 1. **Simulation State Management (Enhanced)**

#### **PUT** `/api/simulation/:simulationId/state`
Enhanced to support game state management.

**Enhanced Request Body:**
```json
{
  "state": {
    "status": "string (not_started|in_progress|paused|completed)",
    "currentStep": "number",
    "progress": "number (0-100)",
    "userInputs": "object",
    "observations": "array",
    "lastActiveAt": "ISO date string",
    "gameState": {
      "currentAction": "string",
      "selectedEquipment": [
        {
          "id": "string",
          "name": "string",
          "usedAt": "ISO date string",
          "location": "string (beaker|burette|measuring|observation)"
        }
      ],
      "mixedSolutions": [
        {
          "id": "string|number",
          "components": ["chemical1", "chemical2"],
          "result": "object",
          "visualEffect": "string",
          "timestamp": "ISO date string"
        }
      ],
      "observations": [
        {
          "timestamp": "ISO date string",
          "action": "string",
          "result": "string",
          "scientificExplanation": "string",
          "visualEffect": "string (optional)"
        }
      ],
      "score": "number",
      "hints": [
        {
          "id": "string|number",
          "text": "string",
          "type": "string (tip|encouragement|direction|safety)",
          "timestamp": "ISO date string"
        }
      ],
      "achievements": [
        {
          "id": "string",
          "title": "string",
          "unlockedAt": "ISO date string"
        }
      ],
      "workspaceContents": {
        "beaker": ["array of items"],
        "burette": ["array of items"],
        "measuring": ["array of items"],
        "observation": ["array of items"]
      }
    }
  }
}
```

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "simulation": {
      "id": "string",
      "state": {
        // Complete updated state including gameState
      },
      "updatedAt": "ISO date string"
    }
  }
}
```

---

### 2. **Enhanced Simulation Generation**

#### **POST** `/api/simulation/generate`
Enhanced to include game-specific data structures.

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "simulation": {
      "id": "string",
      "title": "string",
      "description": "string",
      "subject": "string",
      "level": "number (1-5)",
      "estimatedDuration": "number",
      "difficulty": "string",
      "virtualLab": {
        "equipment": [
          {
            "id": "string",
            "name": "string",
            "description": "string",
            "icon": "string (emoji)",
            "category": "string (glassware|tools|chemicals)"
          }
        ],
        "chemicals": [
          {
            "id": "string",
            "name": "string",
            "concentration": "string",
            "hazard": "string (safe|caution|dangerous)",
            "color": "string",
            "icon": "string (emoji)"
          }
        ],
        "procedure": ["array of strings"],
        "safetyNotes": ["array of strings"]
      },
      "gameConfig": {
        "objectives": [
          "string objectives for the game"
        ],
        "scoringCriteria": {
          "correctAction": "number",
          "observation": "number",
          "completion": "number"
        },
        "maxScore": "number",
        "timeLimit": "number (optional, in minutes)"
      },
      "state": {
        "status": "not_started",
        "progress": 0,
        "gameState": {
          "score": 0,
          "selectedEquipment": [],
          "mixedSolutions": [],
          "observations": [],
          "hints": [],
          "achievements": [],
          "workspaceContents": {
            "beaker": [],
            "burette": [],
            "measuring": [],
            "observation": []
          }
        }
      },
      "createdAt": "ISO date string"
    }
  }
}
```

---

### 3. **Gemini Integration Endpoints**

#### **POST** `/api/simulation/:simulationId/ai/process-action`
Process game actions through AI analysis.

**Request Body:**
```json
{
  "action": "string (use_equipment|mix_chemicals|observe|measure)",
  "equipment": {
    "id": "string",
    "name": "string"
  },
  "target": "string (beaker|burette|measuring|observation)",
  "currentGameState": "object (current game state)",
  "context": "string (additional context)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "actionDescription": "string",
      "scientificResult": "string",
      "explanation": "string (age-appropriate)",
      "scoreGain": "number",
      "visualEffect": "string",
      "hints": ["array of strings"],
      "nextSuggestion": "string",
      "experimentComplete": "boolean",
      "achievements": [
        {
          "id": "string",
          "title": "string",
          "description": "string"
        }
      ]
    }
  }
}
```

#### **POST** `/api/simulation/:simulationId/ai/mix-chemicals`
Process chemical mixing through AI.

**Request Body:**
```json
{
  "chemical1": {
    "id": "string",
    "name": "string",
    "concentration": "string"
  },
  "chemical2": {
    "id": "string", 
    "name": "string",
    "concentration": "string"
  },
  "currentGameState": "object"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reaction": {
      "result": "string",
      "explanation": "string",
      "visualEffect": "string (color changes, bubbles, etc.)",
      "resultSolution": {
        "name": "string",
        "color": "string",
        "properties": "string"
      },
      "scoreGain": "number",
      "safety": "string",
      "nextSteps": ["array of suggestions"]
    }
  }
}
```

#### **POST** `/api/simulation/:simulationId/ai/get-hint`
Get AI-generated contextual hints.

**Request Body:**
```json
{
  "currentGameState": "object",
  "strugglingArea": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hint": {
      "text": "string",
      "type": "string (tip|encouragement|direction|safety)",
      "specificity": "string (general|specific)"
    }
  }
}
```

---

### 4. **Game Analytics & Achievements**

#### **POST** `/api/simulation/:simulationId/complete`
Enhanced completion with game results.

**Enhanced Request Body:**
```json
{
  "finalResults": {
    "accuracy": "number",
    "finalObservations": "string",
    "gameScore": "number",
    "actionsCompleted": "number",
    "observationsMade": "number", 
    "hintsUsed": "number",
    "timeSpent": "number (minutes)"
  }
}
```

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "simulation": {
      "id": "string",
      "state": {
        "status": "completed",
        "progress": 100,
        "completedAt": "ISO date string"
      }
    },
    "gameResults": {
      "finalScore": "number",
      "maxPossibleScore": "number",
      "performance": "string (excellent|good|fair|needs_improvement)",
      "achievements": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "icon": "string"
        }
      ]
    },
    "notificationsCreated": "number"
  }
}
```

#### **GET** `/api/simulation/leaderboard/:level`
Get game leaderboard for competitive elements.

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "studentId": "string",
        "studentName": "string (anonymized if needed)",
        "score": "number",
        "experimentsCompleted": "number",
        "rank": "number"
      }
    ],
    "currentUser": {
      "rank": "number",
      "score": "number",
      "experimentsCompleted": "number"
    }
  }
}
```

---

## 🗃️ Enhanced Database Schema

### Simulations Collection (Enhanced)
```javascript
{
  _id: ObjectId,
  studentId: String (required),
  title: String (required),
  description: String,
  prompt: String,
  subject: String,
  level: Number (1-5),
  estimatedDuration: Number,
  difficulty: String,
  virtualLab: {
    equipment: [{
      id: String,
      name: String,
      description: String,
      icon: String,
      category: String
    }],
    chemicals: [{
      id: String,
      name: String,
      concentration: String,
      hazard: String,
      color: String,
      icon: String
    }],
    procedure: [String],
    safetyNotes: [String]
  },
  gameConfig: {
    objectives: [String],
    scoringCriteria: {
      correctAction: Number,
      observation: Number,
      completion: Number
    },
    maxScore: Number,
    timeLimit: Number
  },
  state: {
    status: String,
    currentStep: Number,
    progress: Number,
    userInputs: Object,
    observations: [Object],
    startedAt: Date,
    lastActiveAt: Date,
    completedAt: Date,
    gameState: {
      currentAction: String,
      selectedEquipment: [Object],
      mixedSolutions: [Object],
      observations: [Object],
      score: Number,
      hints: [Object],
      achievements: [Object],
      workspaceContents: Object
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Game Actions Log Collection (New)
```javascript
{
  _id: ObjectId,
  simulationId: String (required),
  studentId: String (required),
  action: String (required),
  equipment: Object,
  target: String,
  result: Object,
  scoreGained: Number,
  timestamp: Date,
  aiProcessed: Boolean,
  createdAt: Date (default: now)
}
```

### Student Game Statistics Collection (New)
```javascript
{
  _id: ObjectId,
  studentId: String (required),
  totalGamesPlayed: Number,
  totalScore: Number,
  averageScore: Number,
  experimentsCompleted: Number,
  achievementsUnlocked: [String],
  lastPlayedAt: Date,
  favoriteSubject: String,
  skillProgression: {
    chemistry: Number,
    physics: Number,
    biology: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🤖 AI Integration Requirements

### Backend Gemini API Integration

The backend needs to integrate with Google's Gemini API for:

1. **Dynamic Action Processing**
2. **Chemical Reaction Simulation**
3. **Contextual Hint Generation**
4. **Educational Content Adaptation**

#### Required Environment Variables:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
```

#### Sample Backend Gemini Integration:
```javascript
// backend/services/geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async processGameAction(actionData) {
    const prompt = `
    Process this student action in a virtual chemistry lab:
    Action: ${actionData.action}
    Equipment: ${actionData.equipment?.name}
    Target: ${actionData.target}
    
    Return JSON with scientific result and educational explanation.
    `;
    
    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

---

## 🔔 Enhanced Notification System

### New Notification Types:

#### Game Achievement Notifications:
```json
{
  "userId": "studentId",
  "type": "game_achievement_unlocked",
  "message": "🏆 Amazing! You unlocked the 'Chemistry Master' achievement with a score of {score}!",
  "link": "/simulation",
  "data": {
    "achievementId": "string",
    "score": "number"
  },
  "read": false
}
```

#### High Score Notifications:
```json
{
  "userId": "parentId",
  "type": "child_high_score",
  "message": "🎉 {childName} achieved a new high score of {score} in their chemistry experiment!",
  "link": "/performance-reports",
  "data": {
    "childId": "string",
    "score": "number",
    "experimentTitle": "string"
  },
  "read": false
}
```

---

## 🔐 Security & Performance

### Rate Limiting:
- **AI API Calls**: Maximum 10 requests per minute per student
- **State Updates**: Maximum 1 update per 5 seconds
- **Hint Requests**: Maximum 5 hints per simulation

### Data Validation:
- Validate all game state transitions
- Sanitize AI-generated content before storing
- Verify equipment and chemical combinations are safe/realistic
- Limit score gains to prevent manipulation

### Performance Optimization:
- Cache AI responses for common actions
- Batch state updates when possible
- Use database indexing for game statistics queries

---

## 🚀 Implementation Priority

### Phase 1 (High Priority):
1. Enhanced simulation state management
2. Basic AI action processing
3. Game scoring system
4. Equipment drag-and-drop functionality

### Phase 2 (Medium Priority):
1. Chemical mixing AI interactions
2. Hint system
3. Achievement unlocking
4. Leaderboard functionality

### Phase 3 (Low Priority):
1. Advanced analytics
2. Performance optimizations
3. Additional game mechanics
4. Social features

---

## 🧪 Testing Requirements

### Game Mechanics Testing:
1. **Drag-and-Drop**: Test equipment placement in different zones
2. **Chemical Mixing**: Verify safe and realistic reactions
3. **Scoring**: Ensure consistent point allocation
4. **AI Responses**: Test various action combinations

### State Management Testing:
1. **Pause/Resume**: Game state persistence across sessions
2. **Auto-save**: Real-time state updates
3. **Completion**: Final state calculation and storage

### Performance Testing:
1. **AI Response Time**: Target < 2 seconds for action processing
2. **Concurrent Users**: Test multiple students playing simultaneously
3. **Database Load**: Monitor state update frequency impact

---

## 📈 Analytics & Insights

### Student Engagement Metrics:
- Time spent in game mode vs classic mode
- Actions per minute (engagement rate)
- Hint usage patterns
- Completion rates by difficulty

### Educational Effectiveness:
- Learning objective achievement rates
- Concept understanding improvement
- Retention rates for gamified content

### Technical Performance:
- AI API response times
- Database query performance
- Frontend rendering optimization

---

This enhanced API framework provides a comprehensive foundation for the interactive, gamified simulation system while maintaining full compatibility with existing simulation features and state management.
