import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, quizAPI } from '../../services/api';
import DashboardLayout from '../../layout/DashboardLayout';

/**
 * Performance Reports Page for Parents
 * Shows detailed quiz results and achievements for all children
 */
function PerformanceReportsPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadChildren();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedChild) {
      loadChildDetails(selectedChild.id);
    }
  }, [selectedChild]);

  // Debug useEffect to track quizHistory changes
  useEffect(() => {
    console.log('quizHistory state changed:', quizHistory);
    console.log('quizHistory length:', quizHistory.length);
    if (quizHistory.length > 0) {
      console.log('Sample quiz data:', quizHistory[0]);
    }
  }, [quizHistory]);

  // Debug useEffect to track achievements changes  
  useEffect(() => {
    console.log('achievements state changed:', achievements);
    console.log('achievements length:', achievements.length);
  }, [achievements]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      console.log('Loading children for parent ID:', user.id);
      
      const response = await userAPI.getChildren(user.id);
      console.log('Children API response:', response.data);
      
      // Temporary debug function to inspect exact structure
      const debugResponse = (obj, path = 'response') => {
        console.log(`${path}:`, obj);
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            console.log(`${path}.${key}:`, obj[key]);
            if (key === 'children' && Array.isArray(obj[key])) {
              console.log(`${path}.${key}.length:`, obj[key].length);
              if (obj[key].length > 0) {
                console.log(`${path}.${key}[0]:`, obj[key][0]);
              }
            }
          });
        }
      };
      
      debugResponse(response.data, 'response.data');
      
      // Handle different possible response structures
      let childrenData = [];
      if (response.data.children) {
        childrenData = response.data.children;
        console.log('Using response.data.children');
      } else if (response.data.data && response.data.data.children) {
        childrenData = response.data.data.children;
        console.log('Using response.data.data.children');
      } else if (Array.isArray(response.data)) {
        childrenData = response.data;
        console.log('Using response.data as array');
      } else {
        console.warn('Could not find children data in response structure');
      }
      
      console.log('Processed children data:', childrenData);
      console.log('Children data length:', childrenData.length);
      console.log('First child data:', childrenData[0]);
      
      setChildren(childrenData);
      
      // Auto-select first child if available
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
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

  const loadChildDetails = async (childId) => {
    try {
      setLoadingDetails(true);
      console.log('Loading child details for childId:', childId);
      
      // Load quiz history and achievements in parallel
      console.log('Calling quiz history API...');
      const historyPromise = quizAPI.getStudentQuizHistory(childId);
      
      console.log('Calling achievements API...');
      const achievementsPromise = quizAPI.getStudentAchievements(childId);
      
      const [historyResponse, achievementsResponse] = await Promise.all([
        historyPromise,
        achievementsPromise
      ]);
      
      console.log('Quiz history API response:', historyResponse);
      console.log('Quiz history data:', historyResponse.data);
      console.log('Quiz history array:', historyResponse.data.history);
      
      console.log('Achievements API response:', achievementsResponse);
      console.log('Achievements data:', achievementsResponse.data);
      console.log('Achievements array:', achievementsResponse.data.achievements);
      
      // Handle different possible response structures for history
      let historyData = [];
      if (historyResponse.data.history) {
        historyData = historyResponse.data.history;
      } else if (historyResponse.data.data && historyResponse.data.data.history) {
        historyData = historyResponse.data.data.history;
      } else if (Array.isArray(historyResponse.data)) {
        historyData = historyResponse.data;
      } else {
        console.warn('Could not find quiz history in response structure');
      }
      
      // Handle different possible response structures for achievements
      let achievementsData = [];
      if (achievementsResponse.data.achievements) {
        achievementsData = achievementsResponse.data.achievements;
        console.log('Using achievementsResponse.data.achievements');
      } else if (achievementsResponse.data.data && achievementsResponse.data.data.achievements) {
        achievementsData = achievementsResponse.data.data.achievements;
        console.log('Using achievementsResponse.data.data.achievements');
      } else if (Array.isArray(achievementsResponse.data)) {
        achievementsData = achievementsResponse.data;
        console.log('Using achievementsResponse.data as array');
      } else {
        console.warn('Could not find achievements in response structure');
        console.log('Full achievements response structure:', achievementsResponse.data);
      }
      
      console.log('Final processed history data:', historyData);
      console.log('Final processed achievements data:', achievementsData);
      
      setQuizHistory(historyData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error loading child details:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        childId: childId
      });
      setQuizHistory([]);
      setAchievements([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const stats = useMemo(() => {
    console.log('📊 Parent Dashboard: Calculating stats for', quizHistory.length, 'quizzes');
    
    if (quizHistory.length === 0) {
      return { average: 0, total: 0, improvement: 0 };
    }
    
    const totalScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
    const average = Math.round(totalScore / quizHistory.length);
    
    // Calculate improvement (last 3 vs first 3 quizzes)
    let improvement = 0;
    if (quizHistory.length >= 6) {
      const recent = quizHistory.slice(0, 3).reduce((sum, quiz) => sum + quiz.score, 0) / 3;
      const older = quizHistory.slice(-3).reduce((sum, quiz) => sum + quiz.score, 0) / 3;
      improvement = Math.round(recent - older);
    }
    
    const result = { average, total: quizHistory.length, improvement };
    console.log('📊 Parent Dashboard: Stats calculated ->', result);
    return result;
  }, [quizHistory]);

  if (loading) {
    return (
      <DashboardLayout userRole="parent">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading children's performance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (children.length === 0) {
    return (
      <DashboardLayout userRole="parent">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Found</h3>
            <p className="text-gray-600">
              No children are associated with your account yet.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  console.log('🎨 Parent Dashboard: Rendering with stats ->', stats);

  return (
    <DashboardLayout userRole="parent">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Performance Reports</h1>
          <p className="text-gray-600">Track your children's quiz performance and achievements</p>
        </div>

        {/* Child Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
          <div className="flex flex-wrap gap-3">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedChild?.id === child.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium">{child.profile?.firstName} {child.profile?.lastName}</div>
                  <div className="text-sm text-gray-500">Level {child.selectedLevel || 'Not selected'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedChild && (
          <>
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.average}%</p>
                  </div>
                  <div className="stat-icon bg-blue-100 text-blue-600">
                    📊
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Quizzes Taken</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="stat-icon bg-green-100 text-green-600">
                    ✅
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Improvement</p>
                    <p className={`text-2xl font-bold ${stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.improvement >= 0 ? '+' : ''}{stats.improvement}%
                    </p>
                  </div>
                  <div className="stat-icon bg-purple-100 text-purple-600">
                    📈
                  </div>
                </div>
              </div>
            </div>

            {loadingDetails ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading detailed information...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Achievements */}
                <div className="card card-padding">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏅 Recent Achievements</h3>
                  
                  {achievements.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">🏆</span>
                      </div>
                      <p className="text-gray-500 text-sm">No achievements yet</p>
                      <p className="text-gray-400 text-xs mt-1">Complete quizzes to unlock achievements!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {achievements.slice(0, 5).map((achievement, index) => (
                        <div key={achievement.id || index} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center relative overflow-hidden">
                            {achievement.image ? (
                              <img 
                                src={achievement.image} 
                                alt={achievement.title}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  console.warn('🖼️ Parent Dashboard: Achievement image failed to load, showing fallback');
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            
                            {/* Fallback design when no image */}
                            <div 
                              className={`${achievement.image ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-white text-lg font-bold`}
                              style={{ display: achievement.image ? 'none' : 'flex' }}
                            >
                              {achievement.icon || '🏆'}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">
                                {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </p>
                              {achievement.score && (
                                <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                  {achievement.score}% - {achievement.level}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Quiz Results */}
                <div className="card card-padding">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Recent Quiz Results</h3>
                  
                  {quizHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">📝</span>
                      </div>
                      <p className="text-gray-500 text-sm">No quizzes taken yet</p>
                      <p className="text-gray-400 text-xs mt-1">Encourage them to start taking quizzes!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizHistory.slice(0, 6).map((quiz, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{quiz.resourceTitle}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(quiz.completedAt).toLocaleDateString()} • 
                              {quiz.correctAnswers}/{quiz.totalQuestions} correct
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(quiz.score)}`}>
                            {quiz.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Quiz History */}
            {quizHistory.length > 6 && (
              <div className="mt-6 card card-padding">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Complete Quiz History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Resource</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Correct/Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizHistory.map((quiz, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-900">{quiz.resourceTitle}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {new Date(quiz.completedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(quiz.score)}`}>
                              {quiz.score}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{quiz.correctAnswers}/{quiz.totalQuestions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PerformanceReportsPage; 