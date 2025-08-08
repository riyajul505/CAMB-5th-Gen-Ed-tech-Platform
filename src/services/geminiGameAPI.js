// Gemini Game API for Interactive Simulation Features
// This service handles all AI-powered game interactions for the simulation

import { GoogleGenAI } from '@google/genai';

class GeminiGameAPI {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.model = 'gemini-2.5-flash';
    this.isConfigured = !!this.apiKey;
    
    if (this.isConfigured) {
      this.client = new GoogleGenAI({
        apiKey: this.apiKey
      });
      console.log('✅ Gemini API configured successfully with new SDK');
    } else {
      console.warn('⚠️ VITE_GEMINI_API_KEY not found in environment variables. Using fallback responses.');
    }
  }

  async makeGeminiRequest(prompt, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Gemini API key not configured');
    }

    try {
      console.log('🤖 Making Gemini API request with new SDK...');
      
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          thinkingConfig: {
            thinkingBudget: 0 // Disable thinking for faster responses
          },
          ...options
        }
      });

      if (!response.text) {
        throw new Error('No text content in Gemini API response');
      }

      console.log('✅ Gemini API request successful');
      return response.text;
    } catch (error) {
      console.error('🔥 Gemini API request failed:', error);
      throw error;
    }
  }

  // Generate game instructions for the experiment
  async generateGameInstructions({ experimentTitle, experimentType, level, description }) {
    // Use fallback if API not configured
    if (!this.isConfigured) {
      console.log('🎮 Using fallback game instructions (Gemini API not configured)');
      return `🎮 Welcome to your interactive ${experimentTitle} lab! Drag equipment from the left panel to the workspace zones, mix chemicals safely, and follow the experimental steps. Score points by making correct observations and completing each step successfully! 🧪✨`;
    }

    const prompt = `
    Create engaging, game-like instructions for an interactive science experiment.
    
    Experiment: ${experimentTitle}
    Type: ${experimentType}
    Level: ${level} (1=beginner, 5=advanced)
    Description: ${description}
    
    Write fun, clear instructions (2-3 sentences) that explain:
    - How to drag and drop equipment
    - What the goal is
    - How to score points
    
    Make it sound like a game tutorial for kids. Use emojis and exciting language.
    `;

    try {
      const instructions = await this.makeGeminiRequest(prompt);
      return instructions.trim();
    } catch (error) {
      console.error('❌ Failed to generate game instructions:', error);
      return `🎮 Welcome to your interactive ${experimentTitle} lab! Drag equipment to the workspace zones, mix chemicals, and follow the steps to complete your experiment. Score points by making correct observations! 🧪✨`;
    }
  }

  // Initialize game experiment with equipment and setup
  async initializeExperiment({ title, description, subject, level }) {
    // Use fallback if API not configured
    if (!this.isConfigured) {
      console.log('🔬 Using fallback game setup (Gemini API not configured)');
      return this.getFallbackGameSetup(subject, title);
    }

    const prompt = `
    Create an interactive game setup for this science experiment:
    
    Title: ${title}
    Subject: ${subject}
    Level: ${level}
    Description: ${description}
    
    Return a JSON object with:
    {
      "availableEquipment": [
        {
          "id": "unique_id",
          "name": "Equipment Name",
          "description": "What it does",
          "icon": "emoji",
          "category": "glassware|tools|chemicals"
        }
      ],
      "availableChemicals": [
        {
          "id": "unique_id", 
          "name": "Chemical Name",
          "concentration": "if applicable",
          "hazard": "safe|caution|dangerous",
          "color": "visual color",
          "icon": "emoji"
        }
      ],
      "gameObjectives": [
        "Objective 1",
        "Objective 2"
      ],
      "scoringCriteria": {
        "correctAction": 10,
        "observation": 5,
        "completion": 50
      }
    }
    
    Make it appropriate for level ${level} students. Include 6-8 equipment items and 3-5 chemicals.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if JSON parsing fails
      return this.getFallbackGameSetup(subject, title);
    } catch (error) {
      console.error('❌ Failed to initialize game experiment:', error);
      return this.getFallbackGameSetup(subject, title);
    }
  }

  // Process game actions (drag and drop, equipment use)
  async processGameAction({ action, equipment, target, currentGameState, experimentContext }) {
    // Use fallback if API not configured
    if (!this.isConfigured) {
      console.log('🎯 Using fallback action processing (Gemini API not configured)');
      return this.getFallbackActionResult(action, equipment, target, experimentContext);
    }

    const prompt = `
    A student performed this action in an interactive science experiment:
    
    Action: ${action}
    Equipment Used: ${equipment?.name || 'Unknown'}
    Target Location: ${target}
    
    Experiment Context:
    - Title: ${experimentContext.title}
    - Subject: ${experimentContext.subject}
    - Level: ${experimentContext.level}
    
    Current Game State:
    - Score: ${currentGameState.score || 0}
    - Previous Actions: ${currentGameState.selectedEquipment?.length || 0}
    
    Respond with a JSON object:
    {
      "actionDescription": "What the student just did",
      "result": "What happened as a result",
      "explanation": "Scientific explanation (age-appropriate)",
      "scoreGain": number (0-20 points),
      "hints": ["helpful hint if needed"],
      "visualEffect": "description of visual changes",
      "experimentComplete": boolean,
      "nextSuggestion": "what to do next"
    }
    
    Make it educational, encouraging, and fun for level ${experimentContext.level} students.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.getFallbackActionResult(action, equipment, target, experimentContext);
    } catch (error) {
      console.error('❌ Failed to process game action:', error);
      return this.getFallbackActionResult(action, equipment, target, experimentContext);
    }
  }

  // Process chemical mixing interactions
  async processChemicalMixing({ chemical1, chemical2, currentGameState, experimentContext }) {
    // Use fallback if API not configured
    if (!this.isConfigured) {
      console.log('🧪 Using fallback chemical mixing (Gemini API not configured)');
      return this.getFallbackMixingResult(chemical1, chemical2, experimentContext);
    }

    const prompt = `
    A student is mixing two chemicals in an interactive science experiment:
    
    Chemical 1: ${chemical1?.name || 'Unknown'}
    Chemical 2: ${chemical2?.name || 'Unknown'}
    
    Experiment: ${experimentContext.title} (${experimentContext.subject}, Level ${experimentContext.level})
    
    Provide a realistic, safe reaction result as JSON:
    {
      "result": "What happens when mixed",
      "explanation": "Scientific explanation (age-appropriate)",
      "visualEffect": "Color changes, bubbles, etc.",
      "resultSolution": {
        "name": "New solution name",
        "color": "color",
        "properties": "description"
      },
      "scoreGain": number (0-25 points),
      "safety": "Any safety observations",
      "nextSteps": ["what to do with this mixture"]
    }
    
    Ensure the reaction is realistic and educational for level ${experimentContext.level}.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.getFallbackMixingResult(chemical1, chemical2, experimentContext);
    } catch (error) {
      console.error('❌ Failed to process chemical mixing:', error);
      return this.getFallbackMixingResult(chemical1, chemical2, experimentContext);
    }
  }

  // Generate contextual hints
  async generateHint({ currentGameState, experimentContext }) {
    // Use fallback if API not configured
    if (!this.isConfigured) {
      console.log('💡 Using fallback hints (Gemini API not configured)');
      return this.getFallbackHint(currentGameState, experimentContext);
    }

    const prompt = `
    A student needs help with their interactive science experiment:
    
    Experiment: ${experimentContext.title} (${experimentContext.subject})
    Level: ${experimentContext.level}
    
    Current Progress:
    - Score: ${currentGameState.score || 0}
    - Actions Taken: ${currentGameState.selectedEquipment?.length || 0}
    - Observations Made: ${currentGameState.observations?.length || 0}
    
    Recent Actions: ${currentGameState.observations?.slice(-2).map(obs => obs.action).join(', ') || 'None yet'}
    
    Provide a helpful hint as JSON:
    {
      "text": "Encouraging hint text",
      "type": "tip|encouragement|direction|safety",
      "specificity": "general|specific"
    }
    
    Make it encouraging and age-appropriate for level ${experimentContext.level} students.
    `;

    try {
      const response = await this.makeGeminiRequest(prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.getFallbackHint(currentGameState, experimentContext);
    } catch (error) {
      console.error('❌ Failed to generate hint:', error);
      return this.getFallbackHint(currentGameState, experimentContext);
    }
  }

  // Enhanced fallback methods for when AI fails

  getFallbackGameSetup(subject, title = 'Science Experiment') {
    const baseSetup = {
      availableEquipment: [
        { id: 'beaker_100ml', name: '100ml Beaker', description: 'For holding small volumes of liquids', icon: '🥃', category: 'glassware' },
        { id: 'beaker_250ml', name: '250ml Beaker', description: 'For holding larger volumes of liquids', icon: '🍺', category: 'glassware' },
        { id: 'pipette', name: 'Pipette', description: 'For measuring and transferring small volumes', icon: '💉', category: 'tools' },
        { id: 'thermometer', name: 'Digital Thermometer', description: 'For measuring temperature accurately', icon: '🌡️', category: 'tools' },
        { id: 'stirrer', name: 'Glass Stirring Rod', description: 'For mixing solutions safely', icon: '🥄', category: 'tools' },
        { id: 'dropper', name: 'Eye Dropper', description: 'For adding liquids drop by drop', icon: '💧', category: 'tools' },
        { id: 'measuring_cylinder', name: 'Measuring Cylinder', description: 'For precise volume measurements', icon: '📏', category: 'glassware' },
        { id: 'safety_goggles', name: 'Safety Goggles', description: 'Essential eye protection', icon: '🥽', category: 'safety' }
      ],
      availableChemicals: [
        { id: 'water', name: 'Distilled Water', concentration: 'Pure H₂O', hazard: 'safe', color: 'clear', icon: '💧' },
        { id: 'indicator', name: 'Universal pH Indicator', concentration: '0.1%', hazard: 'safe', color: 'purple', icon: '🟣' },
        { id: 'salt_solution', name: 'Sodium Chloride Solution', concentration: '1M', hazard: 'safe', color: 'clear', icon: '🧂' }
      ],
      gameObjectives: [
        `Complete the ${title} experiment safely and accurately`,
        'Set up laboratory equipment in the correct order',
        'Follow proper safety procedures throughout',
        'Make detailed scientific observations',
        'Achieve accurate experimental results'
      ],
      scoringCriteria: {
        correctAction: 10,
        observation: 5,
        completion: 50,
        safety: 15
      }
    };

    // Add subject-specific equipment and chemicals
    if (subject?.toLowerCase().includes('chemistry') || subject?.toLowerCase().includes('titration') || subject?.toLowerCase().includes('acid')) {
      baseSetup.availableEquipment.push(
        { id: 'burette', name: 'Burette', description: 'For precise volume delivery in titrations', icon: '🧪', category: 'glassware' },
        { id: 'conical_flask', name: 'Conical Flask', description: 'For mixing and reactions', icon: '⚗️', category: 'glassware' },
        { id: 'burette_stand', name: 'Burette Stand', description: 'To hold the burette securely', icon: '🔧', category: 'tools' },
        { id: 'white_tile', name: 'White Tile', description: 'To observe color changes clearly', icon: '⬜', category: 'tools' }
      );
      baseSetup.availableChemicals.push(
        { id: 'hcl_solution', name: 'Hydrochloric Acid', concentration: 'Unknown', hazard: 'caution', color: 'clear', icon: '🔴' },
        { id: 'naoh_solution', name: 'Sodium Hydroxide', concentration: '0.1M', hazard: 'caution', color: 'clear', icon: '🔵' },
        { id: 'phenolphthalein', name: 'Phenolphthalein', concentration: '0.5%', hazard: 'safe', color: 'clear', icon: '🌸' }
      );
    }

    if (subject?.toLowerCase().includes('biology') || subject?.toLowerCase().includes('microscope')) {
      baseSetup.availableEquipment.push(
        { id: 'microscope', name: 'Light Microscope', description: 'For observing small specimens', icon: '🔬', category: 'tools' },
        { id: 'slide', name: 'Glass Slide', description: 'For mounting specimens', icon: '📱', category: 'glassware' },
        { id: 'cover_slip', name: 'Cover Slip', description: 'To cover specimens on slides', icon: '📄', category: 'glassware' }
      );
      baseSetup.availableChemicals.push(
        { id: 'iodine', name: 'Iodine Solution', concentration: '1%', hazard: 'caution', color: 'brown', icon: '🟤' },
        { id: 'methylene_blue', name: 'Methylene Blue', concentration: '0.5%', hazard: 'safe', color: 'blue', icon: '🔵' }
      );
    }

    return baseSetup;
  }

  getFallbackActionResult(action, equipment, target, experimentContext) {
    const actions = {
      'use_equipment': {
        beaker: 'The beaker is now ready to hold liquids safely',
        burette: 'The burette is set up for precise volume measurements',
        thermometer: 'Temperature monitoring is now active',
        default: 'Equipment positioned correctly for the experiment'
      },
      'measure': {
        default: 'Accurate measurement taken and recorded'
      },
      'observe': {
        default: 'Important observation made and documented'
      }
    };

    const equipmentType = equipment?.id?.split('_')[0] || equipment?.name?.toLowerCase() || 'default';
    const actionType = action || 'use_equipment';
    
    const result = actions[actionType]?.[equipmentType] || actions[actionType]?.default || actions.use_equipment.default;

    return {
      actionDescription: `${action === 'use_equipment' ? 'Placed' : 'Used'} ${equipment?.name || 'equipment'} in the ${target} area`,
      result: result,
      explanation: `This action helps you progress through the ${experimentContext?.title || 'experiment'} by ensuring proper setup and measurement.`,
      scoreGain: 10,
      hints: ['Excellent work! You\'re following good laboratory practice.'],
      visualEffect: `${equipment?.name || 'Equipment'} is now visible in the ${target} workspace`,
      experimentComplete: false,
      nextSuggestion: target === 'observation' ? 'Record what you observe' : 'Continue with the next experimental step'
    };
  }

  getFallbackMixingResult(chemical1, chemical2, experimentContext) {
    const mixingEffects = {
      'acid_base': {
        visualEffect: 'The solution bubbles slightly and may change color',
        result: 'Neutralization reaction occurs between acid and base',
        color: 'light pink'
      },
      'indicator': {
        visualEffect: 'Color change indicates pH level',
        result: 'pH indicator reveals the solution\'s acidity or alkalinity',
        color: 'varies by pH'
      },
      'default': {
        visualEffect: 'The chemicals mix thoroughly creating a uniform solution',
        result: 'The two substances combine to form a new mixture',
        color: 'light blue'
      }
    };

    const type = (chemical1?.name?.toLowerCase().includes('acid') && chemical2?.name?.toLowerCase().includes('base')) ? 'acid_base' :
                 (chemical1?.name?.toLowerCase().includes('indicator') || chemical2?.name?.toLowerCase().includes('indicator')) ? 'indicator' : 'default';
    
    const effect = mixingEffects[type];

    return {
      result: `${chemical1?.name || 'Chemical A'} mixed with ${chemical2?.name || 'Chemical B'}: ${effect.result}`,
      explanation: type === 'acid_base' ? 'When acids and bases react, they neutralize each other, often producing water and a salt.' :
                   type === 'indicator' ? 'Indicators help us determine the pH of solutions by changing color.' :
                   'When chemicals are mixed, they can react to form new substances with different properties.',
      visualEffect: effect.visualEffect,
      resultSolution: {
        name: type === 'acid_base' ? 'Neutralized Solution' : type === 'indicator' ? 'pH Test Solution' : 'Mixed Solution',
        color: effect.color,
        properties: type === 'acid_base' ? 'More neutral pH, may form salt and water' : 'Shows pH through color change'
      },
      scoreGain: 15,
      safety: 'Always wear safety goggles and handle chemicals with care',
      nextSteps: [
        'Observe and record the color change',
        'Note any other physical changes',
        'Record the temperature if it changed',
        'Continue with the next step of your experiment'
      ]
    };
  }

  getFallbackHint(currentGameState, experimentContext) {
    const hints = [
      {
        text: `Great progress on your ${experimentContext?.title || 'experiment'}! Try exploring different equipment combinations to see what happens next. 🧪✨`,
        type: "encouragement",
        specificity: "general"
      },
      {
        text: "Remember to always use safety equipment like goggles when working with chemicals! Safety first! 🥽",
        type: "safety", 
        specificity: "specific"
      },
      {
        text: "Try dragging equipment to different workspace zones to see how they interact with each other! 🔬",
        type: "tip",
        specificity: "specific"
      },
      {
        text: "Don't forget to record your observations - they're important for understanding what's happening! 📝",
        type: "direction",
        specificity: "specific"
      },
      {
        text: "You're doing fantastic! Science is all about curiosity and discovery. Keep experimenting! 🌟",
        type: "encouragement",
        specificity: "general"
      }
    ];

    // Choose hint based on game state
    const actionsCount = currentGameState?.selectedEquipment?.length || 0;
    const observationsCount = currentGameState?.observations?.length || 0;
    
    if (actionsCount === 0) {
      return hints[2]; // tip about dragging equipment
    } else if (observationsCount < actionsCount) {
      return hints[3]; // direction about observations
    } else if (actionsCount > 0 && observationsCount > 0) {
      return hints[0]; // encouragement about progress
    }
    
    // Random fallback
    return hints[Math.floor(Math.random() * hints.length)];
  }

  // 🎮 NEW: Generate complete interactive game from prompt
  async generateInteractiveGame({ prompt, studentLevel = 1, subject = 'Science' }) {
    // Use fallback if API not configured
    if (!this.isConfigured) {
      console.log('🎮 Using fallback game generation (Gemini API not configured)');
      return this.getFallbackInteractiveGame(prompt, studentLevel, subject);
    }

    // Use a much simpler approach - ask for structured components separately
    const gamePrompt = `You are creating an educational game for students. 

STUDENT REQUEST: "${prompt}"
LEVEL: ${studentLevel} (1=beginner, 5=advanced)  
SUBJECT: ${subject}

Create an INTERACTIVE game (NOT a quiz) with drag-and-drop, clicking, or building mechanics.

Respond with EXACTLY this format (replace content but keep structure):

GAME_TITLE: Space Explorer Adventure
GAME_DESCRIPTION: Learn about planets by exploring the solar system
ESTIMATED_TIME: 8-10 minutes
LEARNING_OBJECTIVES: Learn planetary facts|Understand space distances|Practice data collection
HTML_CODE: <div class="game">Simple HTML with single quotes only</div>
CSS_CODE: .game { background: blue; color: white; } 
JAVASCRIPT_CODE: window.gameScore = 0; function startGame() { console.log('Game started'); }
INSTRUCTIONS: Click planets to explore them and collect data
EDUCATIONAL_NOTE: This game teaches astronomy and scientific observation

CRITICAL RULES:
- Use only single quotes in HTML/CSS/JavaScript 
- No double quotes in code sections
- No line breaks in code sections
- Keep code simple and functional
- Make it interactive with clicking or dragging`;

    try {
      console.log('🎮 Generating interactive game for prompt:', prompt);
      const response = await this.makeGeminiRequest(gamePrompt, {
        temperature: 0.7, // Lower temperature for more consistent formatting
        maxOutputTokens: 1500 // Shorter responses are easier to parse
      });
      
      // Parse structured text response instead of JSON
      console.log('🔍 Parsing structured text response...');
      
      try {
        // Check if response follows the expected format
        if (!response.includes('GAME_TITLE:') || !response.includes('HTML_CODE:')) {
          console.warn('⚠️ Response does not follow expected format, using template approach');
          return this.generateTemplateGame(prompt, studentLevel, subject);
        }
        
        // Extract each field using simple text parsing
        const extractField = (fieldName) => {
          const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's');
          const match = response.match(regex);
          return match ? match[1].trim() : '';
        };
        
        const gameData = {
          gameTitle: extractField('GAME_TITLE') || 'Interactive Science Game',
          gameDescription: extractField('GAME_DESCRIPTION') || 'Learn through interactive gameplay',
          estimatedTime: extractField('ESTIMATED_TIME') || '5-10 minutes',
          learningObjectives: (extractField('LEARNING_OBJECTIVES') || 'Learn science concepts').split('|'),
          html: extractField('HTML_CODE') || '<div class="game"><h2>Loading Game...</h2></div>',
          css: extractField('CSS_CODE') || '.game { padding: 20px; background: #f0f0f0; }',
          javascript: extractField('JAVASCRIPT_CODE') || 'window.gameScore = 0; console.log("Game loaded");',
          instructions: extractField('INSTRUCTIONS') || 'Interact with the game to learn!',
          educationalNote: extractField('EDUCATIONAL_NOTE') || 'This game teaches scientific concepts through interaction.'
        };
        
        // Validate we got the essential fields
        if (gameData.html && gameData.css && gameData.javascript) {
          console.log('✅ Interactive game parsed successfully from structured text');
          console.log('🎮 Game Title:', gameData.gameTitle);
          return gameData;
        } else {
          console.warn('⚠️ Missing essential game fields, using fallback');
        }
      } catch (parseError) {
        console.warn('⚠️ Text parsing failed:', parseError.message);
        console.log('🔍 Raw response sample:', response.substring(0, 300) + '...');
      }
      
      // Fallback if parsing fails
      console.warn('⚠️ Failed to parse game data, using fallback');
      return this.getFallbackInteractiveGame(prompt, studentLevel, subject);
    } catch (error) {
      console.error('❌ Failed to generate interactive game:', error);
      return this.getFallbackInteractiveGame(prompt, studentLevel, subject);
    }
  }

  // Template-based game generator (more reliable than AI parsing)
  generateTemplateGame(prompt, studentLevel, subject) {
    console.log('🎯 Generating template-based game for:', prompt);
    
    const promptLower = prompt.toLowerCase();
    
    // Detect game type from prompt
    if (promptLower.includes('space') || promptLower.includes('planet') || promptLower.includes('astronaut') || promptLower.includes('solar')) {
      return this.getSpaceExplorationGame(promptLower, studentLevel);
    } else if (promptLower.includes('chemistry') || promptLower.includes('chemical') || promptLower.includes('lab')) {
      return this.getChemistryFallbackGame(prompt, studentLevel);
    } else if (promptLower.includes('biology') || promptLower.includes('cell') || promptLower.includes('organism')) {
      return this.getBiologyFallbackGame(prompt, studentLevel);
    } else if (promptLower.includes('physics') || promptLower.includes('force') || promptLower.includes('motion')) {
      return this.getPhysicsFallbackGame(prompt, studentLevel);
    } else {
      // Default to virtual lab
      return this.getGeneralScienceFallbackGame(prompt, studentLevel, subject);
    }
  }

  // Fallback interactive game generator
  getFallbackInteractiveGame(prompt, studentLevel, subject) {
    const gameTitle = `${subject} Interactive Game`;
    const isChemistry = subject.toLowerCase().includes('chemistry') || prompt.toLowerCase().includes('chemistry') || prompt.toLowerCase().includes('element');
    const isBiology = subject.toLowerCase().includes('biology') || prompt.toLowerCase().includes('biology') || prompt.toLowerCase().includes('cell');
    const isPhysics = subject.toLowerCase().includes('physics') || prompt.toLowerCase().includes('physics') || prompt.toLowerCase().includes('force');

    // Generate subject-specific game
    if (isChemistry) {
      return this.getChemistryFallbackGame(prompt, studentLevel);
    } else if (isBiology) {
      return this.getBiologyFallbackGame(prompt, studentLevel);
    } else if (isPhysics) {
      return this.getPhysicsFallbackGame(prompt, studentLevel);
    } else {
      return this.getGeneralScienceFallbackGame(prompt, studentLevel, subject);
    }
  }

  getChemistryFallbackGame(prompt, studentLevel) {
    return {
      gameTitle: "Element Matching Challenge",
      gameDescription: "Match chemical elements with their symbols and properties",
      estimatedTime: "8-10 minutes",
      learningObjectives: [
        "Learn chemical element symbols",
        "Understand periodic table organization",
        "Identify element properties"
      ],
      html: `
        <div class="game-container">
          <div class="game-header">
            <h2>🧪 Element Matching Challenge</h2>
            <div class="score-display">Score: <span id="score">0</span></div>
            <div class="timer">Time: <span id="timer">300</span>s</div>
          </div>
          
          <div class="game-instructions">
            <p>Match each element name with its correct symbol! Click on an element, then click on its symbol.</p>
          </div>
          
          <div class="game-board">
            <div class="elements-section">
              <h3>Elements</h3>
              <div class="element-cards" id="elements">
                <div class="element-card" data-element="hydrogen">Hydrogen</div>
                <div class="element-card" data-element="oxygen">Oxygen</div>
                <div class="element-card" data-element="carbon">Carbon</div>
                <div class="element-card" data-element="nitrogen">Nitrogen</div>
                <div class="element-card" data-element="helium">Helium</div>
                <div class="element-card" data-element="sodium">Sodium</div>
              </div>
            </div>
            
            <div class="symbols-section">
              <h3>Symbols</h3>
              <div class="symbol-cards" id="symbols">
                <div class="symbol-card" data-symbol="hydrogen">H</div>
                <div class="symbol-card" data-symbol="oxygen">O</div>
                <div class="symbol-card" data-symbol="carbon">C</div>
                <div class="symbol-card" data-symbol="nitrogen">N</div>
                <div class="symbol-card" data-symbol="helium">He</div>
                <div class="symbol-card" data-symbol="sodium">Na</div>
              </div>
            </div>
          </div>
          
          <div class="feedback" id="feedback"></div>
          <div class="completion-message" id="completion" style="display: none;">
            <h3>🎉 Congratulations!</h3>
            <p>You've mastered chemical elements! Your final score: <span id="final-score"></span></p>
          </div>
        </div>
      `,
      css: `
        .game-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          color: white;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
        }
        
        .game-header h2 {
          margin: 0;
          font-size: 24px;
        }
        
        .score-display, .timer {
          font-size: 18px;
          font-weight: bold;
          background: rgba(255,255,255,0.2);
          padding: 8px 15px;
          border-radius: 20px;
        }
        
        .game-instructions {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .game-board {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .elements-section, .symbols-section {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
        }
        
        .elements-section h3, .symbols-section h3 {
          text-align: center;
          margin-bottom: 15px;
          color: #fff;
        }
        
        .element-cards, .symbol-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .element-card, .symbol-card {
          background: #4CAF50;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: bold;
        }
        
        .element-card:hover, .symbol-card:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .element-card.selected, .symbol-card.selected {
          background: #FF9800;
          transform: scale(1.05);
        }
        
        .element-card.matched, .symbol-card.matched {
          background: #2196F3;
          cursor: default;
          opacity: 0.7;
        }
        
        .feedback {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          height: 30px;
          margin: 20px 0;
        }
        
        .completion-message {
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          text-align: center;
        }
        
        .completion-message h3 {
          color: #FFD700;
          font-size: 28px;
          margin-bottom: 15px;
        }
      `,
      javascript: `
        let gameScore = 0;
        let selectedElement = null;
        let selectedSymbol = null;
        let matchedPairs = 0;
        let timeLeft = 300;
        let gameTimer;
        
        const elements = document.querySelectorAll('.element-card');
        const symbols = document.querySelectorAll('.symbol-card');
        const scoreDisplay = document.getElementById('score');
        const timerDisplay = document.getElementById('timer');
        const feedback = document.getElementById('feedback');
        const completion = document.getElementById('completion');
        
        // Initialize game
        function initGame() {
          startTimer();
          
          elements.forEach(element => {
            element.addEventListener('click', () => selectElement(element));
          });
          
          symbols.forEach(symbol => {
            symbol.addEventListener('click', () => selectSymbol(symbol));
          });
        }
        
        function startTimer() {
          gameTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
              endGame();
            }
          }, 1000);
        }
        
        function selectElement(element) {
          if (element.classList.contains('matched')) return;
          
          // Clear previous selections
          elements.forEach(el => el.classList.remove('selected'));
          selectedElement = element;
          element.classList.add('selected');
          
          checkMatch();
        }
        
        function selectSymbol(symbol) {
          if (symbol.classList.contains('matched')) return;
          
          // Clear previous selections
          symbols.forEach(sym => sym.classList.remove('selected'));
          selectedSymbol = symbol;
          symbol.classList.add('selected');
          
          checkMatch();
        }
        
        function checkMatch() {
          if (selectedElement && selectedSymbol) {
            const elementType = selectedElement.getAttribute('data-element');
            const symbolType = selectedSymbol.getAttribute('data-symbol');
            
            if (elementType === symbolType) {
              // Correct match
              selectedElement.classList.add('matched');
              selectedSymbol.classList.add('matched');
              selectedElement.classList.remove('selected');
              selectedSymbol.classList.remove('selected');
              
              gameScore += 100;
              matchedPairs++;
              
              feedback.textContent = '✅ Correct! +100 points';
              feedback.style.color = '#4CAF50';
              
              if (matchedPairs === 6) {
                endGame(true);
              }
            } else {
              // Incorrect match
              feedback.textContent = '❌ Try again!';
              feedback.style.color = '#f44336';
              
              setTimeout(() => {
                selectedElement.classList.remove('selected');
                selectedSymbol.classList.remove('selected');
              }, 1000);
            }
            
            selectedElement = null;
            selectedSymbol = null;
            scoreDisplay.textContent = gameScore;
            
            setTimeout(() => {
              feedback.textContent = '';
            }, 2000);
          }
        }
        
        function endGame(completed = false) {
          clearInterval(gameTimer);
          
          if (completed) {
            const timeBonus = timeLeft * 2;
            gameScore += timeBonus;
            feedback.textContent = \`🎉 All matched! Time bonus: +\${timeBonus} points!\`;
          }
          
          document.getElementById('final-score').textContent = gameScore;
          completion.style.display = 'block';
          
          // Disable all cards
          elements.forEach(el => el.style.pointerEvents = 'none');
          symbols.forEach(sym => sym.style.pointerEvents = 'none');
        }
        
        // Start the game
        initGame();
      `,
      instructions: "Click on an element name, then click on its matching chemical symbol. Score points for correct matches and get bonus points for quick completion!",
      educationalNote: "This game helps students learn chemical element symbols and their names, which is fundamental to understanding chemistry and the periodic table."
    };
  }

  getBiologyFallbackGame(prompt, studentLevel) {
    return {
      gameTitle: "Cell Parts Explorer",
      gameDescription: "Identify and learn about different parts of a cell",
      estimatedTime: "7-10 minutes",
      learningObjectives: [
        "Identify cell organelles",
        "Understand cell structure",
        "Learn organelle functions"
      ],
      html: `
        <div class="game-container">
          <div class="game-header">
            <h2>🔬 Cell Parts Explorer</h2>
            <div class="score-display">Score: <span id="score">0</span></div>
            <div class="lives">Lives: <span id="lives">3</span> ❤️</div>
          </div>
          
          <div class="game-instructions">
            <p>Click on the cell parts to identify them! Each correct answer gives you points.</p>
          </div>
          
          <div class="cell-diagram">
            <div class="cell-wall">
              <div class="organelle nucleus" data-organelle="nucleus" title="Click me!">
                <span class="organelle-label">?</span>
              </div>
              <div class="organelle mitochondria" data-organelle="mitochondria" title="Click me!">
                <span class="organelle-label">?</span>
              </div>
              <div class="organelle ribosome" data-organelle="ribosome" title="Click me!">
                <span class="organelle-label">?</span>
              </div>
              <div class="organelle endoplasmic-reticulum" data-organelle="endoplasmic-reticulum" title="Click me!">
                <span class="organelle-label">?</span>
              </div>
              <div class="organelle golgi" data-organelle="golgi" title="Click me!">
                <span class="organelle-label">?</span>
              </div>
            </div>
          </div>
          
          <div class="question-section" id="question-section">
            <h3 id="question">Click on the highlighted organelle!</h3>
            <div class="current-target" id="current-target">Click on: <strong id="target-name">Nucleus</strong></div>
          </div>
          
          <div class="feedback" id="feedback"></div>
          <div class="completion-message" id="completion" style="display: none;">
            <h3>🎉 Cell Master!</h3>
            <p>You've identified all cell parts! Final score: <span id="final-score"></span></p>
            <p>You're now a cell biology expert! 🧬</p>
          </div>
        </div>
      `,
      css: `
        .game-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
          border-radius: 15px;
          color: white;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
        }
        
        .score-display, .lives {
          font-size: 18px;
          font-weight: bold;
          background: rgba(255,255,255,0.2);
          padding: 8px 15px;
          border-radius: 20px;
        }
        
        .cell-diagram {
          display: flex;
          justify-content: center;
          margin: 30px 0;
        }
        
        .cell-wall {
          position: relative;
          width: 400px;
          height: 300px;
          background: rgba(144, 238, 144, 0.3);
          border: 3px solid #90EE90;
          border-radius: 50px;
          overflow: hidden;
        }
        
        .organelle {
          position: absolute;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          border: 2px solid rgba(255,255,255,0.3);
        }
        
        .organelle:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(255,255,255,0.6);
        }
        
        .organelle.target {
          animation: pulse 1s infinite;
          border: 3px solid #FFD700;
          box-shadow: 0 0 25px #FFD700;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .nucleus {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: #8B4513;
        }
        
        .mitochondria {
          top: 20%;
          right: 15%;
          width: 60px;
          height: 40px;
          background: #FF6347;
          border-radius: 30px;
        }
        
        .ribosome {
          bottom: 20%;
          left: 20%;
          width: 30px;
          height: 30px;
          background: #4169E1;
        }
        
        .endoplasmic-reticulum {
          top: 30%;
          left: 10%;
          width: 70px;
          height: 50px;
          background: #9932CC;
          border-radius: 20px;
        }
        
        .golgi {
          bottom: 30%;
          right: 20%;
          width: 50px;
          height: 35px;
          background: #FF1493;
          border-radius: 15px;
        }
        
        .question-section {
          text-align: center;
          margin: 20px 0;
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
        }
        
        .current-target {
          font-size: 20px;
          margin-top: 10px;
          color: #FFD700;
        }
        
        .feedback {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          height: 30px;
          margin: 20px 0;
        }
        
        .completion-message {
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          text-align: center;
        }
      `,
      javascript: `
        let gameScore = 0;
        let lives = 3;
        let currentTargetIndex = 0;
        
        const organelles = [
          { name: 'Nucleus', element: 'nucleus', description: 'Controls cell activities' },
          { name: 'Mitochondria', element: 'mitochondria', description: 'Powerhouse of the cell' },
          { name: 'Ribosome', element: 'ribosome', description: 'Makes proteins' },
          { name: 'Endoplasmic Reticulum', element: 'endoplasmic-reticulum', description: 'Transport system' },
          { name: 'Golgi Apparatus', element: 'golgi', description: 'Packages materials' }
        ];
        
        const scoreDisplay = document.getElementById('score');
        const livesDisplay = document.getElementById('lives');
        const targetName = document.getElementById('target-name');
        const feedback = document.getElementById('feedback');
        const completion = document.getElementById('completion');
        
        function initGame() {
          setCurrentTarget();
          
          document.querySelectorAll('.organelle').forEach(org => {
            org.addEventListener('click', (e) => handleOrganelleClick(e.target.closest('.organelle')));
          });
        }
        
        function setCurrentTarget() {
          if (currentTargetIndex >= organelles.length) {
            endGame(true);
            return;
          }
          
          const currentTarget = organelles[currentTargetIndex];
          targetName.textContent = currentTarget.name;
          
          // Remove previous target highlighting
          document.querySelectorAll('.organelle').forEach(org => {
            org.classList.remove('target');
          });
          
          // Highlight current target
          const targetElement = document.querySelector(\`[data-organelle="\${currentTarget.element}"]\`);
          targetElement.classList.add('target');
        }
        
        function handleOrganelleClick(organelle) {
          const clickedType = organelle.getAttribute('data-organelle');
          const currentTarget = organelles[currentTargetIndex];
          
          if (clickedType === currentTarget.element) {
            // Correct answer
            gameScore += 200;
            organelle.querySelector('.organelle-label').textContent = '✓';
            organelle.style.backgroundColor = '#4CAF50';
            organelle.classList.remove('target');
            
            feedback.textContent = \`✅ Correct! \${currentTarget.description}\`;
            feedback.style.color = '#4CAF50';
            
            currentTargetIndex++;
            
            setTimeout(() => {
              setCurrentTarget();
              feedback.textContent = '';
            }, 2000);
            
          } else {
            // Wrong answer
            lives--;
            feedback.textContent = '❌ Wrong organelle! Try again!';
            feedback.style.color = '#f44336';
            
            if (lives <= 0) {
              endGame(false);
            }
            
            setTimeout(() => {
              feedback.textContent = '';
            }, 2000);
          }
          
          scoreDisplay.textContent = gameScore;
          livesDisplay.textContent = lives;
        }
        
        function endGame(completed) {
          if (completed) {
            const lifeBonus = lives * 100;
            gameScore += lifeBonus;
            feedback.textContent = \`🎉 Perfect! Life bonus: +\${lifeBonus}\`;
          }
          
          document.getElementById('final-score').textContent = gameScore;
          completion.style.display = 'block';
          
          // Disable all organelles
          document.querySelectorAll('.organelle').forEach(org => {
            org.style.pointerEvents = 'none';
          });
        }
        
        initGame();
      `,
      instructions: "Click on the organelles in the cell when they are highlighted. Learn about each cell part's function as you identify them correctly!",
      educationalNote: "This game teaches students about cell biology, helping them identify key organelles and understand their functions within living cells."
    };
  }

  getPhysicsFallbackGame(prompt, studentLevel) {
    return {
      gameTitle: "Force and Motion Lab",
      gameDescription: "Experiment with forces and observe motion effects",
      estimatedTime: "6-8 minutes",
      learningObjectives: [
        "Understand force and motion relationship",
        "Learn about acceleration",
        "Observe Newton's laws in action"
      ],
      html: `
        <div class="game-container">
          <div class="game-header">
            <h2>⚡ Force and Motion Lab</h2>
            <div class="score-display">Score: <span id="score">0</span></div>
            <div class="experiments">Experiments: <span id="experiments">0</span>/5</div>
          </div>
          
          <div class="physics-lab">
            <div class="experiment-area">
              <div class="object" id="object">📦</div>
              <div class="ground"></div>
            </div>
            
            <div class="controls">
              <h3>Apply Force</h3>
              <div class="force-controls">
                <label>Force Strength:</label>
                <input type="range" id="force-slider" min="0" max="100" value="0">
                <span id="force-value">0</span> N
              </div>
              
              <div class="direction-controls">
                <button class="direction-btn" data-direction="left">← Left</button>
                <button class="direction-btn" data-direction="right">Right →</button>
              </div>
              
              <button id="apply-force" class="apply-btn">Apply Force</button>
              <button id="reset" class="reset-btn">Reset Object</button>
            </div>
          </div>
          
          <div class="physics-info">
            <div class="measurement">
              <strong>Velocity:</strong> <span id="velocity">0</span> m/s
            </div>
            <div class="measurement">
              <strong>Distance:</strong> <span id="distance">0</span> m
            </div>
          </div>
          
          <div class="feedback" id="feedback"></div>
          <div class="completion-message" id="completion" style="display: none;">
            <h3>🎉 Physics Master!</h3>
            <p>You've completed all experiments! Final score: <span id="final-score"></span></p>
          </div>
        </div>
      `,
      css: `
        .game-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
          border-radius: 15px;
          color: white;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
        }
        
        .physics-lab {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .experiment-area {
          position: relative;
          height: 200px;
          background: #87CEEB;
          border-radius: 10px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        
        .object {
          position: absolute;
          bottom: 50px;
          left: 50px;
          font-size: 40px;
          transition: all 0.5s ease;
          cursor: pointer;
        }
        
        .ground {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 50px;
          background: #8B4513;
        }
        
        .controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          align-items: center;
        }
        
        .force-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .force-controls input {
          width: 100%;
        }
        
        .direction-controls {
          display: flex;
          gap: 10px;
        }
        
        .direction-btn {
          flex: 1;
          padding: 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .direction-btn:hover {
          background: #45a049;
        }
        
        .direction-btn.selected {
          background: #FF9800;
        }
        
        .apply-btn, .reset-btn {
          grid-column: span 2;
          padding: 15px;
          font-size: 18px;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .apply-btn {
          background: #2196F3;
          color: white;
        }
        
        .reset-btn {
          background: #f44336;
          color: white;
        }
        
        .physics-info {
          display: flex;
          justify-content: space-around;
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .measurement {
          font-size: 18px;
          text-align: center;
        }
        
        .feedback {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          height: 30px;
          margin: 20px 0;
        }
      `,
      javascript: `
        let gameScore = 0;
        let experiments = 0;
        let selectedDirection = 'right';
        let objectPosition = 50;
        let velocity = 0;
        let distance = 0;
        
        const object = document.getElementById('object');
        const forceSlider = document.getElementById('force-slider');
        const forceValue = document.getElementById('force-value');
        const applyBtn = document.getElementById('apply-force');
        const resetBtn = document.getElementById('reset');
        const velocityDisplay = document.getElementById('velocity');
        const distanceDisplay = document.getElementById('distance');
        const scoreDisplay = document.getElementById('score');
        const experimentsDisplay = document.getElementById('experiments');
        const feedback = document.getElementById('feedback');
        const completion = document.getElementById('completion');
        
        function initGame() {
          forceSlider.addEventListener('input', (e) => {
            forceValue.textContent = e.target.value;
          });
          
          document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('selected'));
              e.target.classList.add('selected');
              selectedDirection = e.target.getAttribute('data-direction');
            });
          });
          
          applyBtn.addEventListener('click', applyForce);
          resetBtn.addEventListener('click', resetObject);
          
          // Select default direction
          document.querySelector('[data-direction="right"]').classList.add('selected');
        }
        
        function applyForce() {
          const force = parseInt(forceSlider.value);
          
          if (force === 0) {
            feedback.textContent = 'Set a force value first!';
            feedback.style.color = '#FFD700';
            return;
          }
          
          // Calculate motion based on force
          const acceleration = force / 10; // Simplified physics
          velocity = acceleration;
          
          const direction = selectedDirection === 'right' ? 1 : -1;
          const movement = velocity * direction * 3; // Scale for visual effect
          
          objectPosition += movement;
          distance = Math.abs(objectPosition - 50);
          
          // Constrain object to experiment area
          objectPosition = Math.max(10, Math.min(objectPosition, 700));
          
          // Update object position
          object.style.left = objectPosition + 'px';
          
          // Update displays
          velocityDisplay.textContent = velocity.toFixed(1);
          distanceDisplay.textContent = distance.toFixed(1);
          
          // Score based on force application
          let points = 0;
          if (force >= 10 && force <= 30) points = 50; // Optimal force
          else if (force > 30 && force <= 60) points = 30; // Medium force
          else if (force > 60) points = 10; // Too much force
          
          gameScore += points;
          experiments++;
          
          // Feedback
          if (points === 50) {
            feedback.textContent = '🎯 Perfect force application! +50 points';
            feedback.style.color = '#4CAF50';
          } else if (points === 30) {
            feedback.textContent = '👍 Good force! +30 points';
            feedback.style.color = '#FF9800';
          } else {
            feedback.textContent = '⚡ Too much force! +10 points';
            feedback.style.color = '#f44336';
          }
          
          scoreDisplay.textContent = gameScore;
          experimentsDisplay.textContent = experiments;
          
          if (experiments >= 5) {
            setTimeout(() => endGame(), 2000);
          }
          
          setTimeout(() => {
            feedback.textContent = '';
          }, 3000);
        }
        
        function resetObject() {
          objectPosition = 50;
          velocity = 0;
          distance = 0;
          
          object.style.left = '50px';
          velocityDisplay.textContent = '0';
          distanceDisplay.textContent = '0';
          forceSlider.value = 0;
          forceValue.textContent = '0';
          
          feedback.textContent = 'Object reset to starting position';
          feedback.style.color = '#2196F3';
          
          setTimeout(() => {
            feedback.textContent = '';
          }, 2000);
        }
        
        function endGame() {
          const perfectExperiments = experiments === 5 ? 100 : 0;
          gameScore += perfectExperiments;
          
          document.getElementById('final-score').textContent = gameScore;
          completion.style.display = 'block';
          
          applyBtn.disabled = true;
          resetBtn.disabled = true;
        }
        
        initGame();
      `,
      instructions: "Apply different forces to the object and observe how it moves. Try different force strengths and directions to understand Newton's laws of motion!",
      educationalNote: "This game demonstrates the relationship between force, acceleration, and motion, helping students understand fundamental physics concepts."
    };
  }

  getGeneralScienceFallbackGame(prompt, studentLevel, subject) {
    // Check if prompt suggests a specific type of interactive game
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('space') || promptLower.includes('planet') || promptLower.includes('solar')) {
      return this.getSpaceExplorationGame(promptLower, studentLevel);
    }
    
    return {
      gameTitle: "Virtual Science Laboratory",
      gameDescription: "Mix chemicals, conduct experiments, and discover scientific principles",
      estimatedTime: "8-12 minutes",
      learningObjectives: [
        "Practice safe laboratory procedures",
        "Understand chemical reactions",
        "Develop scientific observation skills"
      ],
      html: `
        <div class="game-container">
          <div class="game-header">
            <h2>🧪 Virtual Science Laboratory</h2>
            <div class="score-display">Score: <span id="score">0</span></div>
            <div class="experiments">Experiments: <span id="experiments">0</span>/5</div>
          </div>
          
          <div class="lab-area">
            <div class="chemicals-shelf">
              <h3>Chemical Shelf</h3>
              <div class="chemicals" id="chemicals">
                <div class="chemical" data-chemical="water" draggable="true">💧 Water</div>
                <div class="chemical" data-chemical="acid" draggable="true">🔴 Acid</div>
                <div class="chemical" data-chemical="base" draggable="true">🔵 Base</div>
                <div class="chemical" data-chemical="salt" draggable="true">⚪ Salt</div>
                <div class="chemical" data-chemical="indicator" draggable="true">🟣 Indicator</div>
              </div>
            </div>
            
            <div class="lab-bench">
              <div class="beakers">
                <div class="beaker" id="beaker1" data-beaker="1">
                  <div class="beaker-content" id="content1"></div>
                  <div class="beaker-label">Beaker 1</div>
                </div>
                <div class="beaker" id="beaker2" data-beaker="2">
                  <div class="beaker-content" id="content2"></div>
                  <div class="beaker-label">Beaker 2</div>
                </div>
                <div class="beaker" id="mixing-beaker" data-beaker="mixing">
                  <div class="beaker-content" id="mixing-content"></div>
                  <div class="beaker-label">Mixing Beaker</div>
                </div>
              </div>
              
              <div class="controls">
                <button id="mix-button" class="action-btn" disabled>🌀 Mix Contents</button>
                <button id="heat-button" class="action-btn" disabled>🔥 Apply Heat</button>
                <button id="observe-button" class="action-btn">👁️ Record Observation</button>
                <button id="reset-button" class="action-btn">🔄 Clean Lab</button>
              </div>
            </div>
          </div>
          
          <div class="observations-log">
            <h3>Lab Notebook</h3>
            <div id="observations"></div>
          </div>
          
          <div class="feedback" id="feedback"></div>
          <div class="completion-message" id="completion" style="display: none;">
            <h3>🎉 Lab Complete!</h3>
            <p>You conducted <span id="final-experiments"></span> experiments! Final score: <span id="final-score"></span></p>
            <p>Great scientific work! 🧪</p>
          </div>
        </div>
      `,
      css: `
        .game-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
          border-radius: 15px;
          color: white;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 10px;
        }
        
        .lab-area {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .chemicals-shelf {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
        }
        
        .chemicals {
          display: grid;
          gap: 10px;
          margin-top: 15px;
        }
        
        .chemical {
          background: #4CAF50;
          padding: 15px;
          border-radius: 8px;
          cursor: grab;
          text-align: center;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .chemical:hover {
          background: #45a049;
          transform: scale(1.05);
        }
        
        .chemical:active {
          cursor: grabbing;
        }
        
        .lab-bench {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
        }
        
        .beakers {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .beaker {
          background: rgba(255,255,255,0.2);
          border: 3px dashed #fff;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s ease;
        }
        
        .beaker.dragover {
          background: rgba(255,255,255,0.4);
          border-color: #FFD700;
        }
        
        .beaker-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 14px;
        }
        
        .beaker-label {
          font-weight: bold;
          margin-top: 10px;
        }
        
        .controls {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .action-btn {
          padding: 12px;
          background: #FF9800;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .action-btn:hover:not(:disabled) {
          background: #F57C00;
          transform: translateY(-2px);
        }
        
        .action-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .observations-log {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .observation-entry {
          background: rgba(255,255,255,0.1);
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          font-size: 14px;
        }
        
        .feedback {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          height: 30px;
          margin: 20px 0;
        }
        
        .completion-message {
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          text-align: center;
        }
      `,
      javascript: `
        window.gameScore = 0;
        let experimentsCount = 0;
        let beakerContents = { 1: [], 2: [], mixing: [] };
        let draggedChemical = null;
        
        function initGame() {
          setupDragAndDrop();
          setupControls();
          updateDisplay();
        }
        
        function setupDragAndDrop() {
          const chemicals = document.querySelectorAll('.chemical');
          const beakers = document.querySelectorAll('.beaker');
          
          chemicals.forEach(chemical => {
            chemical.addEventListener('dragstart', handleDragStart);
          });
          
          beakers.forEach(beaker => {
            beaker.addEventListener('dragover', handleDragOver);
            beaker.addEventListener('drop', handleDrop);
            beaker.addEventListener('dragenter', handleDragEnter);
            beaker.addEventListener('dragleave', handleDragLeave);
          });
        }
        
        function handleDragStart(e) {
          draggedChemical = e.target.dataset.chemical;
          e.target.style.opacity = '0.5';
        }
        
        function handleDragOver(e) {
          e.preventDefault();
        }
        
        function handleDragEnter(e) {
          e.target.classList.add('dragover');
        }
        
        function handleDragLeave(e) {
          e.target.classList.remove('dragover');
        }
        
        function handleDrop(e) {
          e.preventDefault();
          e.target.classList.remove('dragover');
          
          const beakerId = e.currentTarget.dataset.beaker;
          if (draggedChemical && beakerId) {
            addChemicalToBeaker(draggedChemical, beakerId);
            window.gameScore += 10;
            updateDisplay();
            
            const feedback = document.getElementById('feedback');
            feedback.textContent = \`Added \${getChemicalName(draggedChemical)} to \${getBeakerName(beakerId)}! +10 points\`;
            feedback.style.color = '#4CAF50';
            
            setTimeout(() => {
              feedback.textContent = '';
            }, 2000);
          }
          
          // Reset chemical opacity
          document.querySelectorAll('.chemical').forEach(chem => {
            chem.style.opacity = '1';
          });
          draggedChemical = null;
        }
        
        function addChemicalToBeaker(chemical, beakerId) {
          if (!beakerContents[beakerId]) beakerContents[beakerId] = [];
          beakerContents[beakerId].push(chemical);
          
          const contentDiv = document.getElementById(\`\${beakerId === 'mixing' ? 'mixing-' : ''}content\${beakerId === 'mixing' ? '' : beakerId}\`);
          const chemicalDiv = document.createElement('div');
          chemicalDiv.textContent = getChemicalIcon(chemical);
          chemicalDiv.style.fontSize = '20px';
          contentDiv.appendChild(chemicalDiv);
          
          updateControlButtons();
        }
        
        function getChemicalName(chemical) {
          const names = {
            water: 'Water',
            acid: 'Acid',
            base: 'Base', 
            salt: 'Salt',
            indicator: 'pH Indicator'
          };
          return names[chemical] || chemical;
        }
        
        function getChemicalIcon(chemical) {
          const icons = {
            water: '💧',
            acid: '🔴',
            base: '🔵',
            salt: '⚪',
            indicator: '🟣'
          };
          return icons[chemical] || '⚪';
        }
        
        function getBeakerName(beakerId) {
          if (beakerId === 'mixing') return 'Mixing Beaker';
          return \`Beaker \${beakerId}\`;
        }
        
        function updateControlButtons() {
          const mixButton = document.getElementById('mix-button');
          const heatButton = document.getElementById('heat-button');
          
          const hasChemicals = Object.values(beakerContents).some(contents => contents.length > 0);
          const hasMixingChemicals = beakerContents.mixing && beakerContents.mixing.length > 1;
          
          mixButton.disabled = !hasMixingChemicals;
          heatButton.disabled = !hasChemicals;
        }
        
        function setupControls() {
          document.getElementById('mix-button').addEventListener('click', mixChemicals);
          document.getElementById('heat-button').addEventListener('click', applyHeat);
          document.getElementById('observe-button').addEventListener('click', recordObservation);
          document.getElementById('reset-button').addEventListener('click', resetLab);
        }
        
        function mixChemicals() {
          const mixingContents = beakerContents.mixing;
          if (mixingContents.length < 2) return;
          
          experimentsCount++;
          window.gameScore += 50;
          
          const reaction = getReaction(mixingContents);
          const feedback = document.getElementById('feedback');
          feedback.textContent = \`Mixing successful! \${reaction} +50 points\`;
          feedback.style.color = '#FFD700';
          
          // Change mixing beaker color
          const mixingContent = document.getElementById('mixing-content');
          mixingContent.style.background = reaction.includes('neutral') ? '#90EE90' : 
                                          reaction.includes('acidic') ? '#FFB6C1' : 
                                          reaction.includes('basic') ? '#ADD8E6' : '#DDA0DD';
          
          updateDisplay();
          setTimeout(() => { feedback.textContent = ''; }, 3000);
          
          if (experimentsCount >= 5) {
            setTimeout(completeGame, 2000);
          }
        }
        
        function getReaction(chemicals) {
          if (chemicals.includes('acid') && chemicals.includes('base')) {
            return 'Neutralization reaction - solution becomes neutral!';
          } else if (chemicals.includes('salt') && chemicals.includes('water')) {
            return 'Salt dissolves in water - clear solution formed!';
          } else if (chemicals.includes('indicator') && chemicals.includes('acid')) {
            return 'Indicator turns red - acidic solution detected!';
          } else if (chemicals.includes('indicator') && chemicals.includes('base')) {
            return 'Indicator turns blue - basic solution detected!';
          } else {
            return 'Chemical mixture created - observe the changes!';
          }
        }
        
        function applyHeat() {
          experimentsCount++;
          window.gameScore += 30;
          
          const feedback = document.getElementById('feedback');
          feedback.textContent = 'Heat applied! Chemical reactions accelerated! +30 points';
          feedback.style.color = '#FF6347';
          
          updateDisplay();
          setTimeout(() => { feedback.textContent = ''; }, 3000);
          
          if (experimentsCount >= 5) {
            setTimeout(completeGame, 2000);
          }
        }
        
        function recordObservation() {
          const observationsDiv = document.getElementById('observations');
          const observation = document.createElement('div');
          observation.className = 'observation-entry';
          
          const timestamp = new Date().toLocaleTimeString();
          const beakerStates = Object.entries(beakerContents)
            .filter(([id, contents]) => contents.length > 0)
            .map(([id, contents]) => \`\${getBeakerName(id)}: \${contents.map(getChemicalName).join(', ')}\`)
            .join('; ');
          
          observation.textContent = \`[\${timestamp}] Lab state: \${beakerStates || 'All beakers empty'}\`;
          observationsDiv.appendChild(observation);
          
          window.gameScore += 15;
          updateDisplay();
          
          const feedback = document.getElementById('feedback');
          feedback.textContent = 'Observation recorded! +15 points';
          feedback.style.color = '#20B2AA';
          setTimeout(() => { feedback.textContent = ''; }, 2000);
        }
        
        function resetLab() {
          beakerContents = { 1: [], 2: [], mixing: [] };
          
          document.querySelectorAll('.beaker-content').forEach(content => {
            content.innerHTML = '';
            content.style.background = '';
          });
          
          document.getElementById('observations').innerHTML = '';
          
          updateControlButtons();
          updateDisplay();
          
          const feedback = document.getElementById('feedback');
          feedback.textContent = 'Lab cleaned and reset!';
          feedback.style.color = '#2196F3';
          setTimeout(() => { feedback.textContent = ''; }, 2000);
        }
        
        function updateDisplay() {
          document.getElementById('score').textContent = window.gameScore;
          document.getElementById('experiments').textContent = experimentsCount;
        }
        
        function completeGame() {
          document.getElementById('final-experiments').textContent = experimentsCount;
          document.getElementById('final-score').textContent = window.gameScore;
          document.getElementById('completion').style.display = 'block';
          
          window.completeGame(window.gameScore);
        }
        
        initGame();
      `,
      instructions: "Drag chemicals from the shelf to beakers, mix them to see reactions, apply heat, and record observations. Complete 5 experiments to finish the lab!",
      educationalNote: "This interactive lab teaches students about chemical reactions, laboratory procedures, and scientific observation skills through hands-on experimentation."
    };
  }

  getSpaceExplorationGame(promptLower, studentLevel) {
    return {
      gameTitle: "Solar System Explorer",
      gameDescription: "Navigate through space and learn about planets, stars, and cosmic phenomena",
      estimatedTime: "10-15 minutes",
      learningObjectives: [
        "Learn about planets and their characteristics",
        "Understand space distances and scale",
        "Explore cosmic phenomena and space science"
      ],
      html: `
        <div class="game-container">
          <div class="game-header">
            <h2>🚀 Solar System Explorer</h2>
            <div class="score-display">Score: <span id="score">0</span></div>
            <div class="distance">Distance: <span id="distance">0</span> AU</div>
          </div>
          
          <div class="space-view">
            <div class="solar-system" id="solar-system">
              <div class="sun" id="sun">☀️</div>
              <div class="planet mercury" id="mercury" data-planet="mercury">☿️</div>
              <div class="planet venus" id="venus" data-planet="venus">♀️</div>
              <div class="planet earth" id="earth" data-planet="earth">🌍</div>
              <div class="planet mars" id="mars" data-planet="mars">♂️</div>
              <div class="planet jupiter" id="jupiter" data-planet="jupiter">🪐</div>
              <div class="spacecraft" id="spacecraft">🚀</div>
            </div>
          </div>
          
          <div class="mission-control">
            <div class="controls">
              <button id="explore-btn" class="control-btn">🔍 Explore Current Location</button>
              <button id="collect-btn" class="control-btn" disabled>📡 Collect Data</button>
              <button id="next-planet" class="control-btn">➡️ Next Planet</button>
            </div>
            
            <div class="planet-info" id="planet-info">
              <h3>Mission Briefing</h3>
              <p>Welcome to the Solar System Explorer! Click planets to visit them and learn about space!</p>
            </div>
          </div>
          
          <div class="discoveries" id="discoveries">
            <h3>Scientific Discoveries</h3>
            <div id="discovery-log"></div>
          </div>
          
          <div class="completion-message" id="completion" style="display: none;">
            <h3>🎉 Mission Complete!</h3>
            <p>You've explored the solar system! Final score: <span id="final-score"></span></p>
          </div>
        </div>
      `,
      css: `
        .game-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%);
          border-radius: 15px;
          color: white;
          min-height: 600px;
        }
        
        .space-view {
          position: relative;
          height: 400px;
          background: radial-gradient(circle, #001122 0%, #000000 100%);
          border-radius: 10px;
          margin: 20px 0;
          overflow: hidden;
        }
        
        .solar-system {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .sun {
          position: absolute;
          top: 50%;
          left: 10%;
          transform: translate(-50%, -50%);
          font-size: 40px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .planet {
          position: absolute;
          font-size: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .mercury { left: 20%; }
        .venus { left: 30%; }
        .earth { left: 40%; }
        .mars { left: 50%; }
        .jupiter { left: 65%; }
        
        .planet:hover, .sun:hover {
          transform: translateY(-50%) scale(1.2);
          filter: brightness(1.5);
        }
        
        .spacecraft {
          position: absolute;
          top: 45%;
          left: 15%;
          font-size: 30px;
          animation: float 2s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .planet.visited {
          animation: glow 1s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
          from { filter: brightness(1); }
          to { filter: brightness(1.5) drop-shadow(0 0 10px #fff); }
        }
        
        .mission-control {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .control-btn {
          padding: 15px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        
        .control-btn:hover:not(:disabled) {
          background: #45a049;
        }
        
        .control-btn:disabled {
          background: #666;
          cursor: not-allowed;
        }
        
        .planet-info {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
        }
        
        .discoveries {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .discovery-entry {
          background: rgba(255,255,255,0.1);
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          font-size: 14px;
        }
      `,
      javascript: `
        window.gameScore = 0;
        let currentPlanet = 'earth';
        let planetsVisited = [];
        let distance = 1;
        
        const planetData = {
          sun: { name: 'The Sun', distance: 0, fact: 'The Sun is a massive ball of hot gas that provides energy for our solar system!' },
          mercury: { name: 'Mercury', distance: 0.39, fact: 'Mercury is the closest planet to the Sun and has extreme temperature changes!' },
          venus: { name: 'Venus', distance: 0.72, fact: 'Venus is the hottest planet due to its thick atmosphere of carbon dioxide!' },
          earth: { name: 'Earth', distance: 1, fact: 'Earth is the only known planet with life and liquid water!' },
          mars: { name: 'Mars', distance: 1.52, fact: 'Mars is called the Red Planet due to iron oxide on its surface!' },
          jupiter: { name: 'Jupiter', distance: 5.2, fact: 'Jupiter is the largest planet and has a giant storm called the Great Red Spot!' }
        };
        
        function initGame() {
          setupPlanetClicks();
          updateDisplay();
          updatePlanetInfo('earth');
        }
        
        function setupPlanetClicks() {
          document.querySelectorAll('.planet, .sun').forEach(celestial => {
            celestial.addEventListener('click', (e) => {
              visitPlanet(e.target.id);
            });
          });
          
          document.getElementById('explore-btn').addEventListener('click', explorePlanet);
          document.getElementById('collect-btn').addEventListener('click', collectData);
          document.getElementById('next-planet').addEventListener('click', goToNextPlanet);
        }
        
        function visitPlanet(planetId) {
          currentPlanet = planetId;
          distance = planetData[planetId].distance;
          
          // Move spacecraft
          const spacecraft = document.getElementById('spacecraft');
          const planet = document.getElementById(planetId);
          const planetRect = planet.getBoundingClientRect();
          const containerRect = document.getElementById('solar-system').getBoundingClientRect();
          
          const leftPercent = ((planetRect.left - containerRect.left) / containerRect.width) * 100;
          spacecraft.style.left = (leftPercent - 2) + '%';
          
          updatePlanetInfo(planetId);
          updateDisplay();
          
          window.gameScore += 20;
          document.getElementById('collect-btn').disabled = false;
        }
        
        function updatePlanetInfo(planetId) {
          const info = planetData[planetId];
          const infoDiv = document.getElementById('planet-info');
          infoDiv.innerHTML = \`
            <h3>\${info.name}</h3>
            <p><strong>Distance from Sun:</strong> \${info.distance} AU</p>
            <p>\${info.fact}</p>
          \`;
        }
        
        function explorePlanet() {
          const info = planetData[currentPlanet];
          window.gameScore += 30;
          
          addDiscovery(\`Explored \${info.name} - discovered fascinating features!\`);
          document.getElementById('collect-btn').disabled = false;
          updateDisplay();
        }
        
        function collectData() {
          const info = planetData[currentPlanet];
          window.gameScore += 50;
          
          if (!planetsVisited.includes(currentPlanet)) {
            planetsVisited.push(currentPlanet);
            document.getElementById(currentPlanet).classList.add('visited');
          }
          
          addDiscovery(\`Scientific data collected from \${info.name}!\`);
          document.getElementById('collect-btn').disabled = true;
          updateDisplay();
          
          if (planetsVisited.length >= 5) {
            setTimeout(completeGame, 2000);
          }
        }
        
        function goToNextPlanet() {
          const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter'];
          const currentIndex = planets.indexOf(currentPlanet);
          const nextIndex = (currentIndex + 1) % planets.length;
          visitPlanet(planets[nextIndex]);
        }
        
        function addDiscovery(text) {
          const discoveryLog = document.getElementById('discovery-log');
          const entry = document.createElement('div');
          entry.className = 'discovery-entry';
          entry.textContent = \`🔬 \${text}\`;
          discoveryLog.appendChild(entry);
        }
        
        function updateDisplay() {
          document.getElementById('score').textContent = window.gameScore;
          document.getElementById('distance').textContent = distance;
        }
        
        function completeGame() {
          document.getElementById('final-score').textContent = window.gameScore;
          document.getElementById('completion').style.display = 'block';
          window.completeGame(window.gameScore);
        }
        
        initGame();
      `,
      instructions: "Click on planets to visit them with your spacecraft. Explore each location and collect scientific data to earn points. Visit all planets to complete your space mission!",
      educationalNote: "This game teaches students about the solar system, planetary characteristics, space distances, and the scientific method of exploration and data collection."
    };
  }
}

// Create and export singleton instance
export const geminiGameAPI = new GeminiGameAPI();

export default geminiGameAPI;
