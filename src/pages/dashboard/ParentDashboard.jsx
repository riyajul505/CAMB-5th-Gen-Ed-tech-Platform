import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layout/DashboardLayout';
import { userAPI } from '../../services/api';
import { Link } from 'react-router-dom';

/**
 * Parent Dashboard Component
 * Shows children overview and parent-specific features
 */
function ParentDashboard() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load children data
  useEffect(() => {
    if (user?.id) {
      loadChildren();
    }
  }, [user?.id]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      console.log('Loading children for parent dashboard, parent ID:', user.id);
      
      const response = await userAPI.getChildren(user.id);
      console.log('Parent dashboard children API response:', response.data);
      
      // Handle different possible response structures
      let childrenData = [];
      if (response.data.children) {
        childrenData = response.data.children;
      } else if (response.data.data && response.data.data.children) {
        childrenData = response.data.data.children;
      } else if (Array.isArray(response.data)) {
        childrenData = response.data;
      }
      
      console.log('Parent dashboard processed children data:', childrenData);
      console.log('Parent dashboard children data length:', childrenData.length);
      console.log('Parent dashboard first child data:', childrenData[0]);
      
      setChildren(childrenData);
      
      // Select first child by default if not already selected
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (error) {
      console.error('Error loading children for parent dashboard:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  // Get the currently selected child
  const selectedChild = children.find(child => child.id === selectedChildId) || children[0];

  // Fallback mock data
  const mockChildren = [
    {
      id: '1',
      profile: { firstName: 'Alice', lastName: 'Smith', grade: 5 },
      selectedLevel: 4,
      pathSelected: true,
      stats: { completed: 18, average: 87, studyTime: '24h' }
    },
    {
      id: '2', 
      profile: { firstName: 'Bob', lastName: 'Smith', grade: 3 },
      selectedLevel: 2,
      pathSelected: true,
      stats: { completed: 12, average: 92, studyTime: '18h' }
    }
  ];

  const levelInfo = {
    1: { title: "Early Explorer", range: "Ages 3-4", color: "bg-green-100 text-green-800", emoji: "🏠" },
    2: { title: "Young Learner", range: "Ages 4-5", color: "bg-blue-100 text-blue-800", emoji: "📚" },
    3: { title: "Foundation Builder", range: "Ages 5-6", color: "bg-purple-100 text-purple-800", emoji: "🌳" },
    4: { title: "Knowledge Seeker", range: "Ages 6-7", color: "bg-orange-100 text-orange-800", emoji: "🔬" },
    5: { title: "Advanced Explorer", range: "Ages 7-8+", color: "bg-red-100 text-red-800", emoji: "🚀" }
  };

  const mockNotifications = [
    { type: 'milestone', message: 'Alice completed Level 2 Mathematics!', time: '2 hours ago' },
    { type: 'alert', message: 'Bob needs help with Science homework', time: '1 day ago' },
    { type: 'achievement', message: 'Alice earned "Problem Solver" badge', time: '3 days ago' }
  ];

  if (loading) {
    return (
      <DashboardLayout userRole="parent">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="parent">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hello {user?.profile?.firstName || 'Parent'} 👋
          </h1>
          <p className="text-gray-600">Monitor your children's learning progress</p>
        </div>

        {/* Children Tabs */}
        {children.length > 0 && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      selectedChild?.id === child.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {child.profile?.firstName} {child.profile?.lastName}
                    {child.quizStats?.totalQuizzes > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {child.quizStats.totalQuizzes} quizzes
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Child Overview */}
          <div className="lg:col-span-2 space-y-6">
            {selectedChild && (
              <>
                {/* Child Info Header */}
                <div className="card card-padding">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedChild.profile?.firstName}'s Progress
                      </h3>
                      <p className="text-gray-600">Grade {selectedChild.profile?.grade}</p>
                    </div>
                    
                    {/* Current Level Badge */}
                    {selectedChild.selectedLevel && levelInfo[selectedChild.selectedLevel] && (
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Learning Level</p>
                          <p className="text-lg font-semibold text-gray-900">Level {selectedChild.selectedLevel}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${levelInfo[selectedChild.selectedLevel].color}`}>
                          <span className="text-lg">{levelInfo[selectedChild.selectedLevel].emoji}</span>
                          <span>{levelInfo[selectedChild.selectedLevel].title}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Child Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="stat-card">
                    <div className="flex items-center">
                      <div className="stat-icon bg-primary-100 text-primary-600">
                        <span>🎓</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Current Grade</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {selectedChild.profile?.grade || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center">
                      <div className="stat-icon bg-success-100 text-success-600">
                        <span>✅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {selectedChild.stats?.completed || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-center">
                      <div className="stat-icon bg-secondary-100 text-secondary-600">
                        <span>📊</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Average Score</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {selectedChild.stats?.average || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Pathway */}
                <div className="card card-padding">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedChild.profile?.firstName}'s Learning Pathway
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        ✓
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">Mathematics - Level 2</p>
                        <p className="text-xs text-gray-500">Completed with 95% score</p>
                      </div>
                      <span className="badge-success">Completed</span>
                    </div>
                    
                    <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        📚
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">Science - Photosynthesis</p>
                        <p className="text-xs text-gray-500">Currently studying</p>
                      </div>
                      <span className="badge bg-blue-50 text-blue-600">In Progress</span>
                    </div>
                    
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                        ⏳
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">English - Creative Writing</p>
                        <p className="text-xs text-gray-500">Starts next week</p>
                      </div>
                      <span className="badge bg-gray-100 text-gray-600">Upcoming</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Section - Parent Tools */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Portal</h3>
              <div className="space-y-3">
                <button className="btn-primary w-full text-sm">
                  📈 Performance Reports
                </button>
                <button className="btn-secondary w-full text-sm">
                  📊 View Quiz Scores
                </button>
                <button className="btn-secondary w-full text-sm">
                  💬 Teacher Comments
                </button>
                <button className="btn-secondary w-full text-sm">
                  📚 Learning Resources
                </button>
                <button className="btn-secondary w-full text-sm">
                  💬 In-App Chat
                </button>
              </div>
            </div>

            {/* Real-time Notifications */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-3">
                {mockNotifications.map((notification, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    notification.type === 'milestone' ? 'bg-green-50 border border-green-200' :
                    notification.type === 'alert' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Achievements */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Achievements</h3>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Latest Achievement</p>
                <p className="text-xs text-gray-600 mb-3">Problem Solver Badge</p>
                <button className="btn-outline text-xs px-4 py-2">
                  Download & Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ParentDashboard; 