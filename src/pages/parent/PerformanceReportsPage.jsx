import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, quizAPI, assignmentAPI } from '../../services/api';
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
  const [gradedAssignments, setGradedAssignments] = useState([]);
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

  // Debug useEffect to track graded assignments changes
  useEffect(() => {
    console.log('gradedAssignments state changed:', gradedAssignments);
    console.log('gradedAssignments length:', gradedAssignments.length);
    if (gradedAssignments.length > 0) {
      console.log('Sample graded assignment data:', gradedAssignments[0]);
    }
  }, [gradedAssignments]);

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

      console.log('Calling graded assignments API...');
      const gradedAssignmentsPromise = assignmentAPI.getGradedAssignments(childId);
      
      const [historyResponse, achievementsResponse, gradedAssignmentsResponse] = await Promise.all([
        historyPromise,
        achievementsPromise,
        gradedAssignmentsPromise
      ]);
      
      console.log('Quiz history API response:', historyResponse);
      console.log('Quiz history data:', historyResponse.data);
      console.log('Quiz history array:', historyResponse.data.history);
      
      console.log('Achievements API response:', achievementsResponse);
      console.log('Achievements data:', achievementsResponse.data);
      console.log('Achievements array:', achievementsResponse.data.achievements);

      console.log('Graded Assignments API response:', gradedAssignmentsResponse);
      console.log('Graded Assignments data:', gradedAssignmentsResponse.data);
      console.log('Graded Assignments array:', gradedAssignmentsResponse.data.assignments);
      
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

      // Handle different possible response structures for graded assignments
      let gradedAssignmentsData = [];
      if (gradedAssignmentsResponse.data.assignments) {
        gradedAssignmentsData = gradedAssignmentsResponse.data.assignments;
        console.log('Using gradedAssignmentsResponse.data.assignments');
      } else if (gradedAssignmentsResponse.data.data && gradedAssignmentsResponse.data.data.assignments) {
        gradedAssignmentsData = gradedAssignmentsResponse.data.data.assignments;
        console.log('Using gradedAssignmentsResponse.data.data.assignments');
      } else if (Array.isArray(gradedAssignmentsResponse.data)) {
        gradedAssignmentsData = gradedAssignmentsResponse.data;
        console.log('Using gradedAssignmentsResponse.data as array');
      } else {
        console.warn('Could not find graded assignments in response structure');
        console.log('Full graded assignments response structure:', gradedAssignmentsResponse.data);
      }
      
      console.log('Final processed history data:', historyData);
      console.log('Final processed achievements data:', achievementsData);
      console.log('Final processed graded assignments data:', gradedAssignmentsData);
      
      setQuizHistory(historyData);
      setAchievements(achievementsData);
      setGradedAssignments(gradedAssignmentsData);
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
      setGradedAssignments([]);
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
    console.log('📊 Parent Dashboard: Calculating stats for', quizHistory.length, 'quizzes and', gradedAssignments.length, 'assignments');
    
    if (quizHistory.length === 0 && gradedAssignments.length === 0) {
      return { 
        quizAverage: 0, 
        quizTotal: 0, 
        quizImprovement: 0,
        assignmentAverage: 0,
        assignmentTotal: 0,
        overallAverage: 0
      };
    }
    
    // Quiz statistics
    let quizAverage = 0;
    let quizImprovement = 0;
    if (quizHistory.length > 0) {
      const totalQuizScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
      quizAverage = Math.round(totalQuizScore / quizHistory.length);
      
      // Calculate improvement (last 3 vs first 3 quizzes)
      if (quizHistory.length >= 6) {
        const recent = quizHistory.slice(0, 3).reduce((sum, quiz) => sum + quiz.score, 0) / 3;
        const older = quizHistory.slice(-3).reduce((sum, quiz) => sum + quiz.score, 0) / 3;
        quizImprovement = Math.round(recent - older);
      }
    }
    
    // Assignment statistics
    let assignmentAverage = 0;
    if (gradedAssignments.length > 0) {
      const totalAssignmentScore = gradedAssignments.reduce((sum, assignment) => {
        const latestSubmission = assignment.mySubmissions?.[assignment.mySubmissions.length - 1];
        const grade = latestSubmission?.grade;
        if (grade && grade.totalScore !== undefined && grade.maxScore !== undefined) {
          return sum + (grade.totalScore / grade.maxScore * 100);
        }
        return sum;
      }, 0);
      assignmentAverage = Math.round(totalAssignmentScore / gradedAssignments.length);
    }
    
    // Overall average (combining quizzes and assignments)
    const totalItems = quizHistory.length + gradedAssignments.length;
    const overallAverage = totalItems > 0 ? Math.round((quizAverage * quizHistory.length + assignmentAverage * gradedAssignments.length) / totalItems) : 0;
    
    const result = { 
      quizAverage, 
      quizTotal: quizHistory.length, 
      quizImprovement,
      assignmentAverage,
      assignmentTotal: gradedAssignments.length,
      overallAverage
    };
    console.log('📊 Parent Dashboard: Stats calculated ->', result);
    return result;
  }, [quizHistory, gradedAssignments]);

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Average</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overallAverage}%</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.quizTotal}</p>
                  </div>
                  <div className="stat-icon bg-green-100 text-green-600">
                    ✅
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Assignments Graded</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.assignmentTotal}</p>
                  </div>
                  <div className="stat-icon bg-purple-100 text-purple-600">
                    📝
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Quiz Improvement</p>
                    <p className={`text-2xl font-bold ${stats.quizImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.quizImprovement >= 0 ? '+' : ''}{stats.quizImprovement}%
                    </p>
                  </div>
                  <div className="stat-icon bg-orange-100 text-orange-600">
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

            {/* Graded Assignments */}
            {gradedAssignments.length > 0 && (
              <div className="mt-6 card card-padding">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Graded Assignments</h3>
                <div className="space-y-4">
                  {gradedAssignments.map((assignment, index) => {
                    const latestSubmission = assignment.mySubmissions?.[assignment.mySubmissions.length - 1];
                    const grade = latestSubmission?.grade;
                    
                    return (
                      <div key={assignment.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{assignment.title}</h4>
                            <p className="text-sm text-gray-600 mb-1">{assignment.subject} • Level {assignment.level}</p>
                            <p className="text-sm text-gray-500">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()} • 
                              Submitted: {latestSubmission ? new Date(latestSubmission.submittedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          {grade && (
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-green-600">
                                {grade.totalScore}/{grade.maxScore}
                              </div>
                              <div className="text-sm text-gray-600">
                                {grade.percentage || Math.round((grade.totalScore / grade.maxScore) * 100)}%
                              </div>
                            </div>
                          )}
                        </div>

                        {grade && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{grade.totalScore}</div>
                                <div className="text-xs text-gray-600">Total Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{grade.maxScore}</div>
                                <div className="text-xs text-gray-600">Maximum Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">
                                  {grade.percentage || Math.round((grade.totalScore / grade.maxScore) * 100)}%
                                </div>
                                <div className="text-xs text-gray-600">Percentage</div>
                              </div>
                            </div>

                            {/* Rubric Scores */}
                            {grade.rubricScores && grade.rubricScores.length > 0 && (
                              <div className="mb-3">
                                <h6 className="font-semibold text-gray-900 mb-2">📋 Detailed Scores</h6>
                                <div className="space-y-2">
                                  {grade.rubricScores.map((score, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm">{score.criteria}</div>
                                        {score.feedback && (
                                          <div className="text-xs text-gray-600 mt-1">{score.feedback}</div>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="font-bold text-gray-900">
                                          {score.score}/{score.maxPoints}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {Math.round((score.score / score.maxPoints) * 100)}%
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Overall Feedback */}
                            {grade.overallFeedback && (
                              <div className="mb-3">
                                <h6 className="font-semibold text-gray-900 mb-2">💬 Teacher Feedback</h6>
                                <div className="p-3 bg-white rounded border">
                                  <p className="text-gray-700 text-sm">{grade.overallFeedback}</p>
                                </div>
                              </div>
                            )}

                            {/* Grading Information */}
                            <div className="text-xs text-gray-500 border-t pt-3">
                              <div className="flex items-center justify-between">
                                <span>Graded by: {grade.gradedBy || 'Teacher'}</span>
                                <span>Graded on: {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submission Details */}
                        {latestSubmission && (
                          <div className="text-sm text-gray-600">
                            <div className="break-all">
                              <span className="font-medium">Submission Link:</span> 
                              <a 
                                href={latestSubmission.submissionLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 ml-1"
                              >
                                {latestSubmission.submissionLink}
                              </a>
                            </div>
                            {latestSubmission.submissionNotes && (
                              <div className="mt-2">
                                <span className="font-medium">Student Notes:</span> {latestSubmission.submissionNotes}
                              </div>
                            )}
                            <div className="mt-2">
                              <span className="font-medium">Version:</span> {latestSubmission.versionNumber}
                              {latestSubmission.isLate && <span className="text-red-600 ml-2">(Late)</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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