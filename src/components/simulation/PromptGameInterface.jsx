import React, { useState, useEffect } from 'react';
import { geminiGameAPI } from '../../services/geminiGameAPI';
import PropTypes from 'prop-types';

const PromptGameInterface = ({ simulation, onBack, user }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGeneratedGame, setShowGeneratedGame] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);

  const handleGenerateGame = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for your game');
      return;
    }

    if (prompt.length < 10) {
      setError('Please provide a more detailed prompt (at least 10 characters)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🎮 Generating game from prompt:', prompt);
      
      const gameData = await geminiGameAPI.generateInteractiveGame({
        prompt: prompt.trim(),
        studentLevel: user?.selectedLevel || 1,
        subject: simulation?.subject || 'Science'
      });

      console.log('✅ Game generated successfully:', gameData.gameTitle);
      
      setGeneratedGame(gameData);
      setShowGeneratedGame(true);
      
    } catch (error) {
      console.error('❌ Failed to generate game:', error);
      setError('Failed to generate your game. Please try again with a different prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPrompt = () => {
    setShowGeneratedGame(false);
    setGeneratedGame(null);
    setPrompt('');
    setError(null);
  };

  const handleBackToSimulation = () => {
    onBack();
  };

  // Examples of good prompts to inspire students
  const promptExamples = [
    "Create a chemistry game about mixing acids and bases safely",
    "Make a biology game where I can explore different parts of a plant cell",
    "Design a physics game about forces and motion with moving objects",
    "Create a space exploration game where I learn about planets",
    "Make an environmental science game about the water cycle",
    "Design a math and science game about measuring and calculating areas"
  ];

  if (showGeneratedGame && generatedGame) {
    return (
      <DynamicGameRenderer 
        gameData={generatedGame}
        onBackToPrompt={handleBackToPrompt}
        onBackToSimulation={handleBackToSimulation}
        simulation={simulation}
        user={user}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="btn-outline flex items-center space-x-2"
            disabled={loading}
          >
            <span>←</span>
            <span>Back to Simulation</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              🎮 Create Your Own Science Game
            </h1>
            <p className="text-gray-600 text-sm">
              Describe the game you want to play, and AI will create it for you!
            </p>
          </div>
          
          <div className="w-32"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 How it works:</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Describe the science game you want to play in the text box below</li>
            <li>AI will generate a complete interactive game based on your description</li>
            <li>Play your custom game and learn while having fun!</li>
            <li>Your game score will be tracked just like other activities</li>
          </ol>
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What kind of science game would you like to play?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create a chemistry game where I can mix different elements and see what compounds they make..."
            rows={4}
            className="form-input resize-none"
            disabled={loading}
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {prompt.length}/500 characters
          </div>
        </div>

        {/* Prompt Examples */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">💡 Need inspiration? Try these ideas:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promptExamples.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-sm"
                disabled={loading}
              >
                <span className="text-gray-600">💭</span> {example}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 text-lg mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={handleGenerateGame}
            disabled={loading || !prompt.trim()}
            className={`btn-primary px-8 py-3 text-lg ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating your game...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>✨</span>
                <span>Generate My Game</span>
              </div>
            )}
          </button>
        </div>

        {/* Loading Status */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-sm">AI is creating your custom science game...</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-yellow-600 text-lg mr-2">💡</span>
          <div className="text-yellow-800 text-sm">
            <strong>Pro tip:</strong> Be specific about what you want to learn! 
            Mention the science topic, type of activity (quiz, matching, simulation), 
            and what you want to discover or practice.
          </div>
        </div>
      </div>
    </div>
  );
};

// Dynamic Game Renderer Component
const DynamicGameRenderer = ({ gameData, onBackToPrompt, onBackToSimulation, simulation, user }) => {
  const [gameScore, setGameScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Create a safe iframe-like environment for the generated game
  const createGameHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${gameData.gameTitle}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f7fafc;
          }
          ${gameData.css}
        </style>
      </head>
      <body>
        ${gameData.html}
        
        <script>
          // Initialize global score variable
          window.gameScore = window.gameScore || 0;
          
          // Monitor score changes
          let lastScore = 0;
          const scoreMonitor = setInterval(() => {
            if (window.gameScore !== lastScore) {
              lastScore = window.gameScore;
              window.parent.postMessage({
                type: 'SCORE_UPDATE',
                score: window.gameScore
              }, '*');
            }
          }, 1000);
          
          // Game completion detection
          const originalAlert = window.alert;
          window.alert = function(message) {
            if (message && (message.toLowerCase().includes('complete') || 
                message.toLowerCase().includes('finished') || 
                message.toLowerCase().includes('congratulations') ||
                message.toLowerCase().includes('win') ||
                message.toLowerCase().includes('success'))) {
              window.parent.postMessage({
                type: 'GAME_COMPLETED',
                score: window.gameScore || 0,
                message: message
              }, '*');
            }
            return originalAlert.call(this, message);
          };
          
          // Enhanced completion detection for common game patterns
          window.completeGame = function(finalScore) {
            window.gameScore = finalScore || window.gameScore;
            window.parent.postMessage({
              type: 'GAME_COMPLETED',
              score: window.gameScore,
              message: 'Game completed successfully!'
            }, '*');
          };
          
          ${gameData.javascript}
        </script>
      </body>
      </html>
    `;
  };

  // Handle messages from the iframe
  const handleMessage = (event) => {
    if (event.data.type === 'SCORE_UPDATE') {
      setGameScore(event.data.score);
    } else if (event.data.type === 'GAME_COMPLETED') {
      setGameScore(event.data.score);
      setGameCompleted(true);
      // TODO: Save score to database (will be implemented later as requested)
      console.log('🎉 Game completed with score:', event.data.score);
    }
  };

  // Set up message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Game Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToPrompt}
            className="btn-outline flex items-center space-x-2"
          >
            <span>←</span>
            <span>Create New Game</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              🎮 {gameData.gameTitle}
            </h1>
            <p className="text-gray-600 text-sm">
              {gameData.gameDescription}
            </p>
          </div>
          
          <button
            onClick={onBackToSimulation}
            className="btn-outline flex items-center space-x-2"
          >
            <span>🔬</span>
            <span>Back to Lab</span>
          </button>
        </div>

        {/* Game Info */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>⏱️ {gameData.estimatedTime}</span>
              <span>🎯 Current Score: <strong className="text-primary-600">{gameScore}</strong></span>
              <span>📊 Level {user?.selectedLevel || 1}</span>
              {gameCompleted && <span className="text-green-600 font-semibold">✅ Completed!</span>}
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500">Learning Objectives:</div>
              <div className="text-sm text-gray-700">
                {gameData.learningObjectives?.slice(0, 2).join(' • ') || 'Interactive Learning'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg">
        <iframe
          srcDoc={createGameHTML()}
          className="w-full h-[600px] border-0"
          title={gameData.gameTitle}
          sandbox="allow-scripts"
        />
      </div>

      {/* Game Instructions & Educational Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 How to Play</h3>
          <p className="text-blue-800 text-sm">{gameData.instructions}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">🧠 What You'll Learn</h3>
          <p className="text-green-800 text-sm">{gameData.educationalNote}</p>
        </div>
      </div>

      {/* Completion Message */}
      {gameCompleted && (
        <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <h3 className="text-xl font-bold text-yellow-900 mb-2">🎉 Game Completed!</h3>
          <p className="text-yellow-800 mb-4">
            Awesome work! You scored <strong>{gameScore}</strong> points and learned about {simulation?.subject || 'science'}.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onBackToPrompt}
              className="btn-primary"
            >
              Create Another Game
            </button>
            <button
              onClick={onBackToSimulation}
              className="btn-outline"
            >
              Return to Lab
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add React import for useEffect in DynamicGameRenderer
DynamicGameRenderer.propTypes = {
  gameData: PropTypes.object.isRequired,
  onBackToPrompt: PropTypes.func.isRequired,
  onBackToSimulation: PropTypes.func.isRequired,
  simulation: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired
};

PromptGameInterface.propTypes = {
  simulation: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

export default PromptGameInterface;
