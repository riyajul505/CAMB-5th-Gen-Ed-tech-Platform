import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { imageGenerationAPI } from '../../services/api';

/**
 * Path Selection Screen Component
 * Allows students to choose their learning level with AI-generated images
 */
function PathSelectionScreen() {
  const navigate = useNavigate();
  const { user, selectPath } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [levelImages, setLevelImages] = useState({});
  const [generatingImages, setGeneratingImages] = useState({});

  const levels = [
    {
      id: 1,
      range: "Ages 3-4",
      title: "Early Explorer",
      description: "Basic shapes, colors, and simple counting",
      prompt: "colorful cartoon playground with basic shapes, numbers 1-5, bright orange and blue colors, friendly characters, kindergarten learning environment, child-friendly illustration"
    },
    {
      id: 2, 
      range: "Ages 4-5",
      title: "Young Learner", 
      description: "Letters, simple words, and basic math",
      prompt: "vibrant cartoon school classroom with alphabet blocks, simple addition, orange and blue theme, happy children learning, educational toys, colorful books"
    },
    {
      id: 3,
      range: "Ages 5-6", 
      title: "Foundation Builder",
      description: "Reading, writing, and number operations",
      prompt: "animated learning treehouse with books, pencils, math problems, orange and blue academic theme, cartoon style, children studying happily"
    },
    {
      id: 4,
      range: "Ages 6-7",
      title: "Knowledge Seeker",
      description: "Science basics, advanced math, reading comprehension", 
      prompt: "cartoon science lab with colorful experiments, microscopes, math equations, orange and blue color scheme, young scientists, educational adventure"
    },
    {
      id: 5,
      range: "Ages 7-8+",
      title: "Advanced Explorer",
      description: "Complex problems, research skills, creative projects",
      prompt: "futuristic cartoon learning space with advanced computers, robots, complex puzzles, orange and blue technology theme, innovative learning environment"
    }
  ];

  // Generate images for levels
  const generateLevelImage = async (level) => {
    if (levelImages[level.id] || generatingImages[level.id]) return;

    setGeneratingImages(prev => ({ ...prev, [level.id]: true }));
    
    try {
      const result = await imageGenerationAPI.generateImage(level.prompt);
      
      if (result.success) {
        setLevelImages(prev => ({ 
          ...prev, 
          [level.id]: result.imageUrl 
        }));
      } else {
        console.error('Failed to generate image for level', level.id, result.error);
        // Use fallback emoji as image
        setLevelImages(prev => ({ 
          ...prev, 
          [level.id]: 'fallback'
        }));
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setLevelImages(prev => ({ 
        ...prev, 
        [level.id]: 'fallback'
      }));
    }
    
    setGeneratingImages(prev => ({ ...prev, [level.id]: false }));
  };

  // Generate images for all levels on component mount
  useEffect(() => {
    levels.forEach(level => {
      setTimeout(() => generateLevelImage(level), level.id * 500); // Stagger requests
    });
  }, []);

  const handleLevelSelect = async (levelId) => {
    setSelectedLevel(levelId);
    setLoading(true);

    const result = await selectPath(levelId);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(`Failed to select path: ${result.error}`);
      setLoading(false);
      setSelectedLevel(null);
    }
  };

  const getLevelEmoji = (levelId) => {
    const emojis = ['🏠', '📚', '🌳', '🔬', '🚀'];
    return emojis[levelId - 1] || '📖';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">CAMB</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Welcome, {user?.profile?.firstName}!
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              My Learning Path
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mt-8 mb-4">
            Choose Your Learning Adventure! 🎯
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the level that feels right for you. Don't worry, you can always progress as you learn!
          </p>
        </div>

        {/* Age Groups Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-48">
            <div className="bg-white rounded-xl shadow-card p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Age Groups</h3>
              <div className="space-y-2">
                {levels.map((level) => (
                  <div 
                    key={level.id}
                    className={`p-2 rounded-lg text-center text-sm font-medium transition-colors ${
                      selectedLevel === level.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.range}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Level Cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level) => (
                <div
                  key={level.id}
                  className={`bg-white rounded-xl shadow-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${
                    selectedLevel === level.id ? 'ring-2 ring-primary-500' : ''
                  } ${loading && selectedLevel === level.id ? 'opacity-50' : ''}`}
                  onClick={() => !loading && handleLevelSelect(level.id)}
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100">
                    {generatingImages[level.id] ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <span className="ml-2 text-primary-600 text-sm">Generating...</span>
                      </div>
                    ) : levelImages[level.id] && levelImages[level.id] !== 'fallback' ? (
                      <img 
                        src={levelImages[level.id]} 
                        alt={level.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl">{getLevelEmoji(level.id)}</span>
                      </div>
                    )}
                    
                    {/* Level Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="font-bold text-primary-600">Level {level.id}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {level.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {level.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary-600">
                        {level.range}
                      </span>
                      
                      {loading && selectedLevel === level.id ? (
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            💡 Not sure which level to choose? Start with the level that matches your age - you can always progress!
          </p>
        </div>
      </div>
    </div>
  );
}

export default PathSelectionScreen; 