import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Use proxy path instead of full URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Add security headers
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

// Utility function to sanitize input (basic XSS protection)
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .trim();
  }
  if (Array.isArray(input)) {
    // Preserve arrays - don't convert to objects
    return input.map(item => sanitizeInput(item));
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

// Request interceptor to add auth tokens and sanitize data
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token format (basic check)
      if (token.split('.').length === 3) { // JWT has 3 parts
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.error('Invalid token format detected');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(new Error('Invalid token'));
      }
    }

    // Sanitize request data for security
    if (config.data) {
      config.data = sanitizeInput(config.data);
    }

    // Log API calls in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`API ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and security
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    // Enhanced error handling for security
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth data and redirect
          console.warn('Authentication failed - clearing session');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/login';
          break;
          
        case 403:
          // Forbidden - user doesn't have permission
          console.warn('Access forbidden - insufficient permissions');
          break;
          
        case 429:
          // Too many requests - rate limiting
          console.warn('Rate limit exceeded - please wait before retrying');
          break;
          
        case 500:
          // Server error - don't expose details to client
          console.error('Server error occurred');
          break;
          
        default:
          console.error(`API Error ${status}:`, data?.message || error.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - server may be unavailable');
    } else {
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Enhanced authentication API with input validation
export const authAPI = {
  login: async (credentials) => {
    // Validate required fields
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format');
    }
    
    return api.post('/auth/login', credentials);
  },
  
  register: async (userData) => {
    // Validate required fields
    if (!userData.email || !userData.password || !userData.role) {
      throw new Error('Email, password, and role are required');
    }
    
    // Validate role
    const validRoles = ['student', 'parent', 'teacher', 'admin'];
    if (!validRoles.includes(userData.role)) {
      throw new Error('Invalid user role');
    }
    
    return api.post('/auth/register', userData);
  },
  
  refreshToken: async () => {
    return api.post('/auth/refresh');
  },
  
  logout: async () => {
    return api.post('/auth/logout');
  }
};

// User API with validation
export const userAPI = {
  getProfile: (userId) => {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }
    return api.get(`/user/profile/${userId}`);
  },

  updateProfile: (userId, profileData) => {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }
    const sanitizedData = sanitizeInput(profileData);
    return api.put(`/user/profile/${userId}`, sanitizedData);
  },

  addChild: (parentId, childData) => {
    if (!parentId || typeof parentId !== 'string') {
      throw new Error('Valid parent ID is required');
    }
    const sanitizedData = sanitizeInput(childData);
    return api.post(`/user/parent/${parentId}/child`, sanitizedData);
  },

  getChildren: (parentId) => {
    if (!parentId || typeof parentId !== 'string') {
      throw new Error('Valid parent ID is required');
    }
    return api.get(`/user/parent/${parentId}/children`);
  },

  selectPath: (pathData) => {
    if (!pathData.studentId || !pathData.level) {
      throw new Error('Student ID and level are required');
    }
    const sanitizedData = sanitizeInput(pathData);
    return api.post('/user/select-path', sanitizedData);
  },

  getPathStatus: (studentId) => {
    if (!studentId || typeof studentId !== 'string') {
      throw new Error('Valid student ID is required');
    }
    return api.get(`/user/path-status/${studentId}`);
  }
};

// Notification API with validation
export const notificationAPI = {
  getNotifications: (userId) => {
    if (!userId) throw new Error('User ID is required');
    return api.get(`/notifications/${userId}`);
  },
  
  markAsRead: (notificationId) => {
    if (!notificationId) throw new Error('Notification ID is required');
    return api.put(`/notifications/${notificationId}/read`);
  },
  
  getUnreadCount: (userId) => {
    if (!userId) throw new Error('User ID is required');
    return api.get(`/notifications/${userId}/unread-count`);
  }
};

// Image Generation API with validation and security
export const imageGenerationAPI = {
  generateImage: async (prompt, retries = 2) => {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Valid prompt is required');
    }

    // Sanitize and limit prompt length for security
    const sanitizedPrompt = sanitizeInput(prompt).substring(0, 500);

    // Check for ClipDrop API key
    const apiKey = import.meta.env.VITE_CLIP_DROP;
    if (!apiKey) {
      throw new Error('ClipDrop API key not configured');
    }

    console.log('🖼️ ClipDrop: Attempting image generation with prompt:', sanitizedPrompt);
    console.log('🖼️ ClipDrop: Retries remaining:', retries);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🖼️ ClipDrop: Attempt ${attempt + 1}/${retries + 1}`);
        
        const formData = new FormData();
        formData.append('prompt', sanitizedPrompt);
        
        // Note: ClipDrop text-to-image API only accepts 'prompt' parameter
        // Additional parameters like width/height are not supported
        
        const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
          method: 'POST',
          headers: { 
            'x-api-key': apiKey 
          },
          body: formData,
        });

        console.log('🖼️ ClipDrop: Response status:', response.status);
        console.log('🖼️ ClipDrop: Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🖼️ ClipDrop: API error response:', errorText);
          
          // Handle specific error cases
          if (response.status === 429) {
            if (attempt < retries) {
              console.log('🖼️ ClipDrop: Rate limited, waiting before retry...');
              await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
              continue;
            } else {
              throw new Error('ClipDrop API rate limit exceeded');
            }
          } else if (response.status === 400) {
            throw new Error('ClipDrop API: Invalid prompt or parameters');
          } else if (response.status === 401) {
            throw new Error('ClipDrop API: Invalid API key');
          } else {
            throw new Error(`ClipDrop API error: ${response.status} - ${errorText}`);
          }
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`ClipDrop API returned non-image content: ${contentType}`);
        }

        const imageBlob = await response.blob();
        
        if (imageBlob.size === 0) {
          throw new Error('ClipDrop API returned empty image');
        }

        console.log('✅ ClipDrop: Image generated successfully, size:', imageBlob.size, 'bytes');
        
        const imageUrl = URL.createObjectURL(imageBlob);
        return imageUrl;

      } catch (error) {
        console.error(`🖼️ ClipDrop: Attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === retries) {
          console.error('🖼️ ClipDrop: All retry attempts exhausted');
          throw new Error(`Failed to generate image after ${retries + 1} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const waitTime = 1000 * Math.pow(2, attempt);
          console.log(`🖼️ ClipDrop: Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  },

  // Method to validate ClipDrop API key
  validateApiKey: async () => {
    const apiKey = import.meta.env.VITE_CLIP_DROP;
    if (!apiKey) {
      return { valid: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: new FormData() // Empty form to test auth
      });

      // Even if the request fails due to missing prompt, a 400 means the key is valid
      // A 401 means the key is invalid
      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
};

// Rate limiting utility
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

// Create rate limiter instance
export const rateLimiter = new RateLimiter();

// Security utility functions
export const securityUtils = {
  // Validate JWT token format (client-side check only)
  isValidTokenFormat: (token) => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3;
  },
  
  // Check if token is expired (client-side estimation)
  isTokenExpired: (token) => {
    try {
      if (!securityUtils.isValidTokenFormat(token)) return true;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
  
  // Sanitize user input
  sanitizeInput,
  
  // Generate secure random string for CSRF tokens
  generateSecureId: () => {
    return crypto.randomUUID ? crypto.randomUUID() : 
           Math.random().toString(36).substring(2) + Date.now().toString(36);
  },
  
  // Convert blob URL to base64 string
  blobUrlToBase64: async (blobUrl) => {
    try {
      if (!blobUrl || !blobUrl.startsWith('blob:')) {
        return null;
      }

      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting blob URL to base64:', error);
      return null;
    }
  }
};

// Teacher API with validation
export const teacherAPI = {
  createClass: async (classData) => {
    if (!classData.name || !classData.level) {
      throw new Error('Class name and level are required');
    }
    
    if (classData.level < 1 || classData.level > 5) {
      throw new Error('Invalid learning level (1-5)');
    }
    
    const sanitizedData = sanitizeInput(classData);
    return api.post('/teacher/classes', sanitizedData);
  },

  getTeacherClasses: async (teacherId) => {
    if (!teacherId || typeof teacherId !== 'string') {
      throw new Error('Valid teacher ID is required');
    }
    return api.get(`/teacher/classes/${teacherId}`);
  },

  getStudentsByLevel: async (level) => {
    if (!level || level < 1 || level > 5) {
      throw new Error('Valid learning level (1-5) is required');
    }
    return api.get(`/teacher/students/level/${level}`);
  },

  getAllStudents: async () => {
    return api.get('/teacher/students/all');
  },

  uploadResource: async (resourceData) => {
    if (!resourceData.title || !resourceData.type || !resourceData.level) {
      throw new Error('Title, type, and level are required');
    }
    
    if (resourceData.level < 1 || resourceData.level > 5) {
      throw new Error('Invalid learning level (1-5)');
    }
    
    const validTypes = ['worksheet', 'video', 'simulation', 'document', 'image'];
    if (!validTypes.includes(resourceData.type)) {
      throw new Error('Invalid resource type');
    }
    
    // Validate URL if provided
    if (resourceData.url) {
      try {
        new URL(resourceData.url);
      } catch {
        throw new Error('Invalid URL format');
      }
    }
    
    const sanitizedData = sanitizeInput(resourceData);
    return api.post('/teacher/resources', sanitizedData);
  },

  getTeacherResources: async (teacherId) => {
    if (!teacherId || typeof teacherId !== 'string') {
      throw new Error('Valid teacher ID is required');
    }
    return api.get(`/teacher/resources/${teacherId}`);
  },

  getResourcesByLevel: async (level) => {
    if (!level || level < 1 || level > 5) {
      throw new Error('Valid learning level (1-5) is required');
    }
    return api.get(`/teacher/resources/level/${level}`);
  }
};

// Quiz API with Gemini integration
export const quizAPI = {
  generateQuiz: async (resourceData) => {
    if (!resourceData || !resourceData.title) {
      throw new Error('Resource data is required for quiz generation');
    }

    // Validate Gemini API key
    const geminiApiKey = import.meta.env.VITE_GEMINI_API;
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Prepare content for Gemini
      const content = `${resourceData.title}\n\n${resourceData.description || ''}\n\n${resourceData.content || ''}`;
      const sanitizedContent = sanitizeInput(content).substring(0, 8000); // Limit content length

      const prompt = `Generate a quiz with 5-8 multiple choice questions based on the following educational content. 
      
Content: ${sanitizedContent}

Please respond with a JSON object in exactly this format:
{
  "quiz": {
    "title": "Quiz Title",
    "questions": [
      {
        "id": 1,
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Explanation of why this is correct"
      }
    ]
  }
}

Requirements:
- Generate 5-8 questions of appropriate difficulty
- Each question should have 4 options
- correctAnswer should be the index (0-3) of the correct option
- Include clear explanations for each answer
- Make questions engaging and educational
- Focus on key concepts from the content`;

      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parse the JSON response
      let quizData;
      try {
        // Extract JSON from response (remove any markdown formatting)
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        
        quizData = JSON.parse(jsonMatch[0]);
        
        // Validate quiz structure
        if (!quizData.quiz || !quizData.quiz.questions || !Array.isArray(quizData.quiz.questions)) {
          throw new Error('Invalid quiz structure');
        }

        // Validate each question
        quizData.quiz.questions.forEach((q, index) => {
          if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
              typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
            throw new Error(`Invalid question structure at index ${index}`);
          }
        });

      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        throw new Error('Failed to parse quiz data from AI response');
      }

      return {
        data: {
          quiz: quizData.quiz,
          resourceId: resourceData.id,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Quiz generation error:', error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  },

  saveQuizResult: async (quizResultData) => {
    // Validate input
    if (!quizResultData.studentId || !quizResultData.resourceId || 
        typeof quizResultData.score !== 'number' || !Array.isArray(quizResultData.answers)) {
      throw new Error('Invalid quiz result data - answers must be an array');
    }

    // Validate answers array length matches totalQuestions
    if (quizResultData.answers.length !== quizResultData.totalQuestions) {
      throw new Error(`Answers array length (${quizResultData.answers.length}) must match total questions (${quizResultData.totalQuestions})`);
    }

    console.log('Quiz data before sanitization:', {
      answers: quizResultData.answers,
      answersType: Array.isArray(quizResultData.answers) ? 'array' : typeof quizResultData.answers,
      answersLength: quizResultData.answers.length
    });

    const sanitizedData = sanitizeInput(quizResultData);
    
    console.log('Quiz data after sanitization:', {
      answers: sanitizedData.answers,
      answersType: Array.isArray(sanitizedData.answers) ? 'array' : typeof sanitizedData.answers,
      answersLength: sanitizedData.answers.length
    });

    // Final validation after sanitization
    if (!Array.isArray(sanitizedData.answers)) {
      throw new Error('Sanitization corrupted answers array');
    }

    return api.post('/quiz/save-result', sanitizedData);
  },

  getStudentQuizHistory: async (studentId) => {
    if (!studentId || typeof studentId !== 'string') {
      throw new Error('Valid student ID is required');
    }
    return api.get(`/quiz/history/${studentId}`);
  },

  getStudentAchievements: async (studentId) => {
    if (!studentId || typeof studentId !== 'string') {
      throw new Error('Valid student ID is required');
    }
    return api.get(`/quiz/achievements/${studentId}`);
  },

  generateConceptExplanation: async (question, userAnswer, correctAnswer) => {
    // Validate Gemini API key
    const geminiApiKey = import.meta.env.VITE_GEMINI_API;
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = `A student answered a quiz question incorrectly. Please provide a clear, encouraging explanation to help them understand the concept.

Question: ${question}
Student's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Please provide a friendly, educational explanation that:
1. Explains why the correct answer is right
2. Helps the student understand their mistake without being discouraging
3. Provides additional context or examples if helpful
4. Uses simple, age-appropriate language
5. Keeps the explanation under 200 words

Respond in a warm, supportive tone as if you're a helpful teacher.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const explanation = data.candidates[0].content.parts[0].text;
      
      return {
        data: {
          explanation: explanation.trim()
        }
      };

    } catch (error) {
      console.error('Concept explanation error:', error);
      return {
        data: {
          explanation: "I'm sorry, I couldn't generate an explanation right now. The correct answer helps you understand this concept better. Keep practicing!"
        }
      };
    }
  },

  saveAchievement: async (achievementData, options = { convertToBase64: true }) => {
    // Validate input
    if (!achievementData.studentId || !achievementData.title || !achievementData.level) {
      throw new Error('Student ID, title, and level are required for achievement');
    }

    if (typeof achievementData.score !== 'number' || achievementData.score < 0 || achievementData.score > 100) {
      throw new Error('Valid score (0-100) is required for achievement');
    }

    const validLevels = ['gold', 'silver', 'bronze', 'participation'];
    if (!validLevels.includes(achievementData.level)) {
      throw new Error('Invalid achievement level');
    }

    console.log('🏆 API: Saving achievement data:', achievementData);
    console.log('🏆 API: Save options:', options);

    // Handle image conversion based on options
    let processedData = { ...achievementData };
    
    if (achievementData.image && achievementData.image.startsWith('blob:')) {
      if (options.convertToBase64) {
        console.log('🖼️ API: Converting blob URL to base64...');
        try {
          const base64Image = await securityUtils.blobUrlToBase64(achievementData.image);
          if (base64Image) {
            processedData.image = base64Image;
            console.log('✅ API: Image converted to base64 successfully');
          } else {
            console.warn('⚠️ API: Failed to convert image, setting to null');
            processedData.image = null;
          }
        } catch (error) {
          console.error('❌ API: Error converting image to base64:', error);
          processedData.image = null;
        }
      } else {
        console.log('🖼️ API: Keeping blob URL as-is (no conversion)');
        // Keep the blob URL as-is - useful for development/testing
        // Note: Blob URLs are temporary and won't persist across sessions
      }
    }

    const sanitizedData = sanitizeInput(processedData);
    
    // Log final data structure (without image content for cleaner logs)
    const logData = { ...sanitizedData };
    if (logData.image) {
      if (logData.image.startsWith('data:')) {
        logData.image = `[base64 image: ${logData.image.substring(0, 50)}...]`;
      } else if (logData.image.startsWith('blob:')) {
        logData.image = `[blob URL: ${logData.image}]`;
      }
    }
    console.log('🏆 API: Final achievement data:', logData);

    return api.post('/quiz/save-achievement', sanitizedData);
  },

  // Test function to validate API integration
  testApiIntegration: async (studentId) => {
    console.log('🧪 Testing Quiz API Integration...');
    
    try {
      // Test 1: Get quiz history
      console.log('📚 Test 1: Getting quiz history...');
      const historyResponse = await quizAPI.getStudentQuizHistory(studentId);
      console.log('✅ Quiz history response:', historyResponse.data);
      
      // Test 2: Get achievements
      console.log('🏆 Test 2: Getting achievements...');
      const achievementsResponse = await quizAPI.getStudentAchievements(studentId);
      console.log('✅ Achievements response:', achievementsResponse.data);
      
      // Test 3: Test achievement save (mock data)
      console.log('💾 Test 3: Testing achievement save...');
      const mockAchievement = {
        studentId: studentId,
        resourceId: 'test_resource',
        resourceTitle: 'Test Resource',
        title: 'Test Achievement',
        description: 'This is a test achievement',
        level: 'bronze',
        icon: '🧪',
        score: 75,
        image: null,
        unlockedAt: new Date().toISOString()
      };
      
      const saveResponse = await quizAPI.saveAchievement(mockAchievement);
      console.log('✅ Achievement save response:', saveResponse.data);
      
      console.log('🎉 All API tests passed!');
      return { success: true, message: 'All tests passed' };
      
    } catch (error) {
      console.error('❌ API Integration test failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// 🔬 Simulation API - Interactive Virtual Science Lab
export const simulationAPI = {
  // Generate new simulation based on student prompt
  generateSimulation: async (simulationData) => {
    console.log('🔬 API: Generating new simulation:', simulationData);
    
    if (!simulationData.studentId || !simulationData.prompt) {
      throw new Error('Student ID and prompt are required');
    }

    if (simulationData.prompt.length > 500) {
      throw new Error('Prompt must be 500 characters or less');
    }

    const sanitizedData = sanitizeInput(simulationData);
    const response = await api.post('/simulation/generate', sanitizedData);
    
    console.log('✅ API: Simulation generated successfully:', response.data);
    return response;
  },

  // Get all simulations for a student
  getStudentSimulations: async (studentId, options = {}) => {
    console.log('📋 API: Fetching simulations for student:', studentId, options);
    
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.status) params.append('status', options.status);
    if (options.subject) params.append('subject', options.subject);

    const queryString = params.toString();
    const url = `/simulation/student/${studentId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    console.log('✅ API: Student simulations fetched:', response.data);
    return response;
  },

  // Get detailed simulation by ID
  getSimulation: async (simulationId) => {
    console.log('🔍 API: Fetching simulation details:', simulationId);
    
    if (!simulationId) {
      throw new Error('Simulation ID is required');
    }

    const response = await api.get(`/simulation/${simulationId}`);
    console.log('✅ API: Simulation details fetched:', response.data);
    return response;
  },

  // Update simulation state (real-time saving)
  updateSimulationState: async (simulationId, stateData) => {
    console.log('💾 API: Updating simulation state:', simulationId, stateData);
    
    if (!simulationId || !stateData) {
      throw new Error('Simulation ID and state data are required');
    }

    // Validate state data
    if (stateData.state) {
      const validStatuses = ['not_started', 'in_progress', 'paused', 'completed'];
      if (stateData.state.status && !validStatuses.includes(stateData.state.status)) {
        throw new Error('Invalid simulation status');
      }

      if (stateData.state.progress !== undefined) {
        const progress = Number(stateData.state.progress);
        if (isNaN(progress) || progress < 0 || progress > 100) {
          throw new Error('Progress must be a number between 0 and 100');
        }
      }
    }

    const sanitizedData = sanitizeInput(stateData);
    const response = await api.put(`/simulation/${simulationId}/state`, sanitizedData);
    
    console.log('✅ API: Simulation state updated:', response.data);
    return response;
  },

  // Start simulation
  startSimulation: async (simulationId) => {
    console.log('▶️ API: Starting simulation:', simulationId);
    
    if (!simulationId) {
      throw new Error('Simulation ID is required');
    }

    const response = await api.post(`/simulation/${simulationId}/start`);
    console.log('✅ API: Simulation started:', response.data);
    return response;
  },

  // Pause simulation
  pauseSimulation: async (simulationId) => {
    console.log('⏸️ API: Pausing simulation:', simulationId);
    
    if (!simulationId) {
      throw new Error('Simulation ID is required');
    }

    const response = await api.post(`/simulation/${simulationId}/pause`);
    console.log('✅ API: Simulation paused:', response.data);
    return response;
  },

  // Resume simulation
  resumeSimulation: async (simulationId) => {
    console.log('▶️ API: Resuming simulation:', simulationId);
    
    if (!simulationId) {
      throw new Error('Simulation ID is required');
    }

    const response = await api.post(`/simulation/${simulationId}/resume`);
    console.log('✅ API: Simulation resumed:', response.data);
    return response;
  },

  // Complete simulation
  completeSimulation: async (simulationId, finalResults) => {
    console.log('🏁 API: Completing simulation:', simulationId, finalResults);
    
    if (!simulationId) {
      throw new Error('Simulation ID is required');
    }

    const requestData = finalResults ? { finalResults } : {};
    const sanitizedData = sanitizeInput(requestData);
    
    const response = await api.post(`/simulation/${simulationId}/complete`, sanitizedData);
    console.log('✅ API: Simulation completed:', response.data);
    return response;
  },

  // Get children's simulation progress for parents
  getChildrenSimulationProgress: async (parentId) => {
    console.log('👨‍👩‍👧‍👦 API: Fetching children simulation progress for parent:', parentId);
    
    if (!parentId) {
      throw new Error('Parent ID is required');
    }

    const response = await api.get(`/simulation/parent/${parentId}/children`);
    console.log('✅ API: Children simulation progress fetched:', response.data);
    return response;
  },

  // Delete simulation (optional - for cleanup)
  deleteSimulation: async (simulationId) => {
    console.log('🗑️ API: Deleting simulation:', simulationId);
    
    if (!simulationId) {
      throw new Error('Simulation ID is required');
    }

    const response = await api.delete(`/simulation/${simulationId}`);
    console.log('✅ API: Simulation deleted:', response.data);
    return response;
  }
};

export default api; 