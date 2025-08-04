import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { teacherAPI, quizAPI } from '../../services/api';
import DashboardLayout from '../../layout/DashboardLayout';

/**
 * Student Progress Page for Teachers
 * Shows quiz performance and achievements for all students across different levels
 */
function StudentProgressPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [selectedLevel]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('Loading students for level:', selectedLevel);
      
      if (selectedLevel === 'all') {
        // Load all students using the correct API endpoint
        const response = await teacherAPI.getAllStudents();
        console.log('All students API response:', response.data);
        
        // Debug the response structure
        console.log('Response keys:', Object.keys(response.data));
        if (response.data.students) {
          console.log('Found students in response.data.students, length:', response.data.students.length);
        }
        if (response.data.data && response.data.data.students) {
          console.log('Found students in response.data.data.students, length:', response.data.data.students.length);
        }
        
        // Handle different possible response structures
        let studentsData = [];
        if (response.data.students) {
          studentsData = response.data.students;
          console.log('Using response.data.students');
        } else if (response.data.data && response.data.data.students) {
          studentsData = response.data.data.students;
          console.log('Using response.data.data.students');
        } else if (Array.isArray(response.data)) {
          studentsData = response.data;
          console.log('Using response.data as array');
        }
        
        console.log('Processed students data length:', studentsData.length);
        setStudents(studentsData);
      } else {
        // Load students by specific level
        const response = await teacherAPI.getStudentsByLevel(parseInt(selectedLevel));
        console.log(`Level ${selectedLevel} students API response:`, response.data);
        
        // Handle different possible response structures
        let studentsData = [];
        if (response.data.students) {
          studentsData = response.data.students;
        } else if (response.data.data && response.data.data.students) {
          studentsData = response.data.data.students;
        } else if (Array.isArray(response.data)) {
          studentsData = response.data;
        }
        
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (studentId) => {
    try {
      setLoadingDetails(true);
      console.log('Loading details for student ID:', studentId);
      
      console.log('Calling quiz history API for teacher dashboard...');
      const historyPromise = quizAPI.getStudentQuizHistory(studentId);
      
      console.log('Calling achievements API for teacher dashboard...');
      const achievementsPromise = quizAPI.getStudentAchievements(studentId);
      
      const [historyResponse, achievementsResponse] = await Promise.all([
        historyPromise,
        achievementsPromise
      ]);
      
      console.log('Teacher - Quiz history API response:', historyResponse);
      console.log('Teacher - Quiz history data:', historyResponse.data);
      console.log('Teacher - Quiz history array:', historyResponse.data.history);
      
      console.log('Teacher - Achievements API response:', achievementsResponse);
      console.log('Teacher - Achievements data:', achievementsResponse.data);
      console.log('Teacher - Achievements array:', achievementsResponse.data.achievements);
      
      // Handle different possible response structures for history
      let historyData = [];
      if (historyResponse.data.history) {
        historyData = historyResponse.data.history;
      } else if (historyResponse.data.data && historyResponse.data.data.history) {
        historyData = historyResponse.data.data.history;
      } else if (Array.isArray(historyResponse.data)) {
        historyData = historyResponse.data;
      } else {
        console.warn('Teacher - Could not find quiz history in response structure');
      }
      
      // Handle different possible response structures for achievements
      let achievementsData = [];
      if (achievementsResponse.data.achievements) {
        achievementsData = achievementsResponse.data.achievements;
        console.log('Teacher - Using achievementsResponse.data.achievements');
      } else if (achievementsResponse.data.data && achievementsResponse.data.data.achievements) {
        achievementsData = achievementsResponse.data.data.achievements;
        console.log('Teacher - Using achievementsResponse.data.data.achievements');
      } else if (Array.isArray(achievementsResponse.data)) {
        achievementsData = achievementsResponse.data;
        console.log('Teacher - Using achievementsResponse.data as array');
      } else {
        console.warn('Teacher - Could not find achievements in response structure');
        console.log('Teacher - Full achievements response structure:', achievementsResponse.data);
      }
      
      console.log('Teacher - Final processed history data:', historyData);
      console.log('Teacher - Final processed achievements data:', achievementsData);
      
      setStudentDetails({
        history: historyData,
        achievements: achievementsData
      });
    } catch (error) {
      console.error('Error loading student details:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        studentId: studentId
      });
      setStudentDetails({ history: [], achievements: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    loadStudentDetails(student.id);
  };

  const studentStats = useMemo(() => {
    console.log('📊 Teacher Dashboard: Calculating stats for selected student');
    
    if (!studentDetails?.history || studentDetails.history.length === 0) {
      return { average: 0, total: 0, recent: 0 };
    }
    
    const history = studentDetails.history;
    const totalScore = history.reduce((sum, quiz) => sum + quiz.score, 0);
    const average = Math.round(totalScore / history.length);
    const recent = history.length > 0 ? history[0].score : 0; // Most recent quiz
    
    const result = { average, total: history.length, recent };
    console.log('📊 Teacher Dashboard: Stats calculated ->', result);
    return result;
  }, [studentDetails]);

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '⭐';
    if (score >= 70) return '👍';
    return '📚';
  };

  return (
    <DashboardLayout userRole="teacher">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Student Progress</h1>
          <p className="text-gray-600">Monitor your students' quiz performance and achievements</p>
        </div>

        {/* Level Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="form-input max-w-xs"
          >
            <option value="all">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students List */}
          <div className="lg:col-span-1">
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                👥 Students {selectedLevel !== 'all' && `(Level ${selectedLevel})`}
              </h3>
              
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">👥</span>
                  </div>
                  <p className="text-gray-500 text-sm">No students found</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {selectedLevel === 'all' ? 'No students enrolled yet' : `No students in Level ${selectedLevel}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentSelect(student)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStudent?.id === student.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {student.profile?.firstName} {student.profile?.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Level {student.selectedLevel || student.level || 'Not set'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Click to view</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Details */}
          <div className="lg:col-span-2">
            {!selectedStudent ? (
              <div className="card card-padding">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Student</h3>
                  <p className="text-gray-600">Choose a student from the list to view their progress details</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Student Header */}
                <div className="card card-padding">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {selectedStudent.profile?.firstName?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedStudent.profile?.firstName} {selectedStudent.profile?.lastName}
                      </h2>
                      <p className="text-gray-600">
                        Level {selectedStudent.selectedLevel || selectedStudent.level || 'Not set'} Student
                      </p>
                      <p className="text-sm text-gray-500">
                        Email: {selectedStudent.email}
                      </p>
                    </div>
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading student details...</p>
                  </div>
                ) : (
                  <>
                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        const stats = studentStats;
                        return (
                          <>
                            <div className="stat-card">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Average Score</p>
                                  <p className="text-2xl font-bold text-gray-900">{stats.average}%</p>
                                </div>
                                <div className="text-2xl">{getPerformanceIcon(stats.average)}</div>
                              </div>
                            </div>

                            <div className="stat-card">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Quizzes Taken</p>
                                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="text-2xl">📝</div>
                              </div>
                            </div>

                            <div className="stat-card">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Recent Score</p>
                                  <p className="text-2xl font-bold text-gray-900">{stats.recent}%</p>
                                </div>
                                <div className="text-2xl">📊</div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Achievements and Quiz History */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Recent Achievements */}
                      <div className="card card-padding">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏅 Recent Achievements</h3>
                        
                        {studentDetails?.achievements?.length === 0 ? (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-xl">🏆</span>
                            </div>
                            <p className="text-gray-500 text-sm">No achievements yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {studentDetails?.achievements?.slice(0, 3).map((achievement, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                                  {achievement.image ? (
                                    <img 
                                      src={achievement.image} 
                                      alt={achievement.title}
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    <span className="text-white text-sm">{achievement.icon || '🏆'}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{achievement.title}</h4>
                                  <p className="text-xs text-gray-500">
                                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recent Quiz Results */}
                      <div className="card card-padding">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Recent Quiz Results</h3>
                        
                        {studentDetails?.history?.length === 0 ? (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-xl">📝</span>
                            </div>
                            <p className="text-gray-500 text-sm">No quizzes taken yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {studentDetails?.history?.slice(0, 5).map((quiz, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{quiz.resourceTitle}</h4>
                                  <p className="text-xs text-gray-500">
                                    {new Date(quiz.completedAt).toLocaleDateString()} • 
                                    {quiz.correctAnswers}/{quiz.totalQuestions} correct
                                  </p>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(quiz.score)}`}>
                                  {quiz.score}%
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full Quiz History Table */}
                    {studentDetails?.history?.length > 5 && (
                      <div className="card card-padding">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Complete Quiz History</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Resource</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Score</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Performance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentDetails.history.map((quiz, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                  <td className="py-3 px-4 text-gray-900">{quiz.resourceTitle}</td>
                                  <td className="py-3 px-4 text-gray-600 text-sm">
                                    {new Date(quiz.completedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPerformanceColor(quiz.score)}`}>
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
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentProgressPage; 