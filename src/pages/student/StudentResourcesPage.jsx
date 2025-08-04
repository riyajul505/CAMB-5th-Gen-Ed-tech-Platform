import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layout/DashboardLayout';
import { teacherAPI } from '../../services/api';

/**
 * Student Resources Page Component
 * Shows level-specific learning resources for students
 */
function StudentResourcesPage() {
  const { user, selectedLevel } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  // Load resources for student's level
  useEffect(() => {
    if (selectedLevel) {
      loadResources();
    }
  }, [selectedLevel]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getResourcesByLevel(selectedLevel);
      setResources(response.data.resources);
    } catch (error) {
      console.error('Error loading resources:', error);
      // Fallback to mock data
      setResources(getMockResourcesForLevel(selectedLevel));
    } finally {
      setLoading(false);
    }
  };

  // Mock data for different levels
  const getMockResourcesForLevel = (level) => {
    const mockResources = {
      1: [
        {
          id: '1',
          title: '🔤 Learning Letters A-Z',
          description: 'Fun way to learn the alphabet with colorful pictures and sounds!',
          type: 'worksheet',
          subject: 'English',
          tags: ['alphabet', 'letters'],
          url: '#',
          fileName: 'alphabet-learning.pdf',
          uploadedBy: 'Teacher Sarah',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          title: '🔢 Count to 10 Game',
          description: 'Interactive counting game with cute animals and numbers!',
          type: 'simulation',
          subject: 'Mathematics',
          tags: ['counting', 'numbers'],
          url: '#',
          fileName: 'counting-game.html',
          uploadedBy: 'Teacher Mike',
          createdAt: '2024-01-14T14:20:00Z'
        }
      ],
      2: [
        {
          id: '3',
          title: '📖 Simple Story Reading',
          description: 'Easy stories with pictures to help you read better!',
          type: 'document',
          subject: 'English',
          tags: ['reading', 'stories'],
          url: '#',
          fileName: 'simple-stories.pdf',
          uploadedBy: 'Teacher Anna',
          createdAt: '2024-01-13T09:15:00Z'
        }
      ],
      3: [
        {
          id: '4',
          title: '➕ Addition Practice',
          description: 'Fun addition problems with colorful worksheets!',
          type: 'worksheet',
          subject: 'Mathematics',
          tags: ['addition', 'math'],
          url: '#',
          fileName: 'addition-practice.pdf',
          uploadedBy: 'Teacher John',
          createdAt: '2024-01-12T11:45:00Z'
        }
      ],
      4: [
        {
          id: '5',
          title: '🌱 Plant Growth Video',
          description: 'Amazing video showing how plants grow from tiny seeds!',
          type: 'video',
          subject: 'Science',
          tags: ['plants', 'growth'],
          url: '#',
          fileName: 'plant-growth.mp4',
          uploadedBy: 'Teacher Lisa',
          createdAt: '2024-01-11T16:30:00Z'
        }
      ],
      5: [
        {
          id: '6',
          title: '🧪 Science Lab Simulation',
          description: 'Virtual science experiments you can do safely online!',
          type: 'simulation',
          subject: 'Science',
          tags: ['experiments', 'lab'],
          url: '#',
          fileName: 'virtual-lab.html',
          uploadedBy: 'Teacher David',
          createdAt: '2024-01-10T13:20:00Z'
        }
      ]
    };
    return mockResources[level] || [];
  };

  // Filter resources by type
  const filteredResources = resources.filter(resource => {
    return selectedType === 'all' || resource.type === selectedType;
  });

  const getLevelInfo = (level) => {
    const levels = {
      1: { title: "Early Explorer", range: "Ages 3-4", color: "bg-green-100 text-green-800", emoji: "🌱" },
      2: { title: "Young Learner", range: "Ages 4-5", color: "bg-blue-100 text-blue-800", emoji: "🌟" },
      3: { title: "Foundation Builder", range: "Ages 5-6", color: "bg-purple-100 text-purple-800", emoji: "🏗️" },
      4: { title: "Knowledge Seeker", range: "Ages 6-7", color: "bg-orange-100 text-orange-800", emoji: "🔍" },
      5: { title: "Advanced Explorer", range: "Ages 7-8+", color: "bg-red-100 text-red-800", emoji: "🚀" }
    };
    return levels[level] || { title: "Explorer", range: "", color: "bg-gray-100 text-gray-800", emoji: "📚" };
  };

  const getResourceIcon = (type) => {
    const icons = {
      'worksheet': '📄',
      'video': '🎥',
      'simulation': '🎮',
      'document': '📖',
      'image': '🖼️'
    };
    return icons[type] || '📁';
  };

  const getResourceTypeColor = (type) => {
    const colors = {
      'worksheet': 'bg-blue-100 text-blue-800 border-blue-200',
      'video': 'bg-purple-100 text-purple-800 border-purple-200',
      'simulation': 'bg-green-100 text-green-800 border-green-200',
      'document': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'image': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getResourceTypeLabel = (type) => {
    const labels = {
      'worksheet': 'Worksheet',
      'video': 'Video',
      'simulation': 'Game',
      'document': 'Story',
      'image': 'Picture'
    };
    return labels[type] || 'Resource';
  };

  const levelInfo = getLevelInfo(selectedLevel);

  if (!selectedLevel) {
    return (
      <DashboardLayout userRole="student">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Learning Level First!</h1>
            <p className="text-gray-600">Please complete your path selection to see your learning resources.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <div className="p-6">
        {/* Header with Level Badge */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📚 My Learning Resources
              </h1>
              <p className="text-gray-600">
                Fun activities and materials just for you!
              </p>
            </div>
            
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border-2 ${levelInfo.color.replace('bg-', 'border-').replace('text-', 'bg-').replace('-800', '-200')} ${levelInfo.color}`}>
              <div className="text-2xl">{levelInfo.emoji}</div>
              <div>
                <div className="font-semibold">Level {selectedLevel}</div>
                <div className="text-sm">{levelInfo.title}</div>
              </div>
            </div>
          </div>

          {/* Fun Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedType === 'all'
                  ? 'bg-primary-500 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🌈 All Resources
            </button>
            
            {['worksheet', 'video', 'simulation', 'document', 'image'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedType === type
                    ? 'bg-primary-500 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getResourceIcon(type)} {getResourceTypeLabel(type)}s
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your awesome resources... ✨</p>
            </div>
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="card hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1 border-2 border-transparent hover:border-primary-200"
              >
                {/* Resource Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl animate-bounce">{getResourceIcon(resource.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        {resource.title}
                      </h3>
                      {resource.subject && (
                        <p className="text-sm text-gray-600 font-medium">{resource.subject}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {resource.description && (
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                    {resource.description}
                  </p>
                )}

                {/* Resource Type Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getResourceTypeColor(resource.type)}`}>
                    {getResourceIcon(resource.type)} {getResourceTypeLabel(resource.type)}
                  </span>
                </div>

                {/* Resource Info */}
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <div className="flex items-center">
                    <span className="mr-2">👨‍🏫</span>
                    <span>By {resource.uploadedBy}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span>Added {new Date(resource.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => window.open(resource.url, '_blank')}
                  className="w-full btn btn-primary text-lg font-semibold py-3 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {resource.type === 'video' && '▶️ Watch Now!'}
                    {resource.type === 'simulation' && '🎮 Play Now!'}
                    {resource.type === 'worksheet' && '📝 Start Learning!'}
                    {resource.type === 'document' && '📖 Read Now!'}
                    {resource.type === 'image' && '👀 View Now!'}
                    {!['video', 'simulation', 'worksheet', 'document', 'image'].includes(resource.type) && '🚀 Open Now!'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🎒</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {resources.length === 0 ? 'No resources yet!' : 'No resources match your selection'}
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              {resources.length === 0 
                ? `Your teachers haven't uploaded resources for Level ${selectedLevel} yet. Check back soon for exciting new activities!`
                : 'Try selecting "All Resources" to see everything available for you!'
              }
            </p>
            {resources.length === 0 ? (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">
                  🌟 Coming Soon!
                </h4>
                <p className="text-blue-700">
                  Your teachers are preparing amazing learning materials just for you. 
                  When they upload new resources, you'll get a notification right here! 🔔
                </p>
              </div>
            ) : (
              <button
                onClick={() => setSelectedType('all')}
                className="btn btn-primary text-lg px-8 py-3"
              >
                🌈 Show All Resources
              </button>
            )}
          </div>
        )}

        {/* Fun Footer Message */}
        {filteredResources.length > 0 && (
          <div className="mt-12 text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-gray-700 font-medium">
              Great job exploring your resources! Keep learning and having fun! 
              <span className="ml-2">✨</span>
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentResourcesPage; 