import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI } from '../../services/api';
import DashboardLayout from '../../layout/DashboardLayout';

/**
 * Grade Projects Page for Teachers
 * Allows teachers to view assignments, submissions, and grade student work
 */
function GradeProjectsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [filter, setFilter] = useState('active'); // active, past_due, draft
  const [gradeForm, setGradeForm] = useState({
    totalScore: '',
    rubricScores: [],
    overallFeedback: ''
  });

  // Load teacher's assignments
  useEffect(() => {
    if (user?.id) {
      loadAssignments();
    }
  }, [user?.id, filter]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getTeacherAssignments(user.id, { status: filter });
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments(getMockAssignments());
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentSubmissions = async (assignmentId) => {
    try {
      const response = await assignmentAPI.getAssignmentSubmissions(assignmentId);
      setSelectedAssignment(response.assignment);
      setSubmissions(response.submissions || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      // Fallback to mock data
      setSelectedAssignment(getMockAssignmentDetails());
      setSubmissions(getMockSubmissions());
    }
  };

  const initializeGradeForm = (submission) => {
    const rubricScores = selectedAssignment?.rubric?.map(item => ({
      criteria: item.criteria,
      score: '',
      maxPoints: item.maxPoints,
      feedback: ''
    })) || [];

    setGradeForm({
      totalScore: '',
      rubricScores,
      overallFeedback: ''
    });
    setSelectedSubmission(submission);
  };

  const updateRubricScore = (index, field, value) => {
    setGradeForm(prev => ({
      ...prev,
      rubricScores: prev.rubricScores.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotalFromRubric = () => {
    return gradeForm.rubricScores.reduce((total, item) => 
      total + (parseInt(item.score) || 0), 0
    );
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;

    const calculatedTotal = calculateTotalFromRubric();
    const maxScore = selectedAssignment?.totalPoints || 100;

    // Validate scores
    const invalidScores = gradeForm.rubricScores.some(item => 
      parseInt(item.score) > item.maxPoints
    );

    if (invalidScores) {
      alert('Some scores exceed the maximum points for their criteria');
      return;
    }

    if (calculatedTotal > maxScore) {
      alert(`Total score (${calculatedTotal}) cannot exceed maximum points (${maxScore})`);
      return;
    }

    setGrading(true);

    try {
      const gradeData = {
        submissionId: selectedSubmission.id,
        assignmentId: selectedAssignment.id,
        studentId: selectedSubmission.student.id,
        totalScore: calculatedTotal,
        maxScore: maxScore,
        rubricScores: gradeForm.rubricScores.map(item => ({
          criteria: item.criteria,
          score: parseInt(item.score) || 0,
          maxPoints: item.maxPoints,
          feedback: item.feedback.trim()
        })),
        overallFeedback: gradeForm.overallFeedback.trim(),
        teacherId: user.id,
        gradedAt: new Date().toISOString()
      };

      const response = await assignmentAPI.gradeSubmission(gradeData);

      if (response.success) {
        alert('Grade submitted successfully! Student and parent have been notified.');
        
        // Refresh submissions
        await loadAssignmentSubmissions(selectedAssignment.id);
        
        // Clear form
        setSelectedSubmission(null);
        setGradeForm({
          totalScore: '',
          rubricScores: [],
          overallFeedback: ''
        });
      }
    } catch (error) {
      console.error('Error submitting grade:', error);
      alert('Failed to submit grade. Please try again.');
    } finally {
      setGrading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getSubmissionStatusBadge = (submission) => {
    if (submission.grade) {
      const percentage = Math.round(submission.grade.percentage);
      let colorClass = 'bg-success-100 text-success-800';
      
      if (percentage < 60) colorClass = 'bg-error-100 text-error-800';
      else if (percentage < 80) colorClass = 'bg-warning-100 text-warning-800';
      
      return <span className={`badge ${colorClass}`}>Graded ({percentage}%)</span>;
    } else if (submission.isLate) {
      return <span className="badge bg-error-100 text-error-800">Late Submission</span>;
    } else {
      return <span className="badge bg-blue-100 text-blue-800">Needs Grading</span>;
    }
  };

  const openSubmissionLink = (submissionLink) => {
    try {
      // Ensure the link has a protocol
      const url = submissionLink.startsWith('http') ? submissionLink : `https://${submissionLink}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening submission link:', error);
      alert('Failed to open submission link. Please check the URL format.');
    }
  };

  // Calculate submission statistics for an assignment
  const calculateSubmissionStats = (assignment) => {
    // This would typically be calculated from backend data
    // For mock data, we'll calculate based on the assignment structure
    if (assignment.submissionStats) {
      return assignment.submissionStats;
    }

    // Fallback calculation if no stats provided
    const totalStudents = 25; // Default for mock data
    const submitted = 1; // Default for mock data 
    const graded = assignment.id === 'mock1' ? 1 : 0; // Only first assignment has grades
    const pending = totalStudents - submitted;
    const avgScore = graded > 0 ? 85.0 : 0;

    return {
      totalStudents,
      submitted,
      pending,
      graded,
      avgScore
    };
  };

  // Filter assignments based on current filter
  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      
      switch (filter) {
        case 'active':
          return dueDate > now && assignment.status !== 'draft';
        case 'past_due':
          return dueDate <= now;
        case 'draft':
          return assignment.status === 'draft';
        default:
          return true;
      }
    }).map(assignment => ({
      ...assignment,
      submissionStats: calculateSubmissionStats(assignment)
    }));
  };

  // Mock data for development
  const getMockAssignments = () => [
    {
      id: 'mock1',
      title: 'HUM MID ASSAY',
      subject: 'History',
      level: 2,
      dueDate: '2025-08-12T23:59:59Z',
      totalPoints: 100,
      status: 'active',
      submissionStats: {
        totalStudents: 25,
        submitted: 1,
        pending: 24,
        graded: 1,
        avgScore: 85.0
      },
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'mock2',
      title: 'Compiler Design',
      subject: 'Computer Science',
      level: 2,
      dueDate: '2025-08-13T23:59:59Z',
      totalPoints: 100,
      status: 'active',
      submissionStats: {
        totalStudents: 30,
        submitted: 2, // One submitted, one graded
        pending: 28,
        graded: 0, // None graded yet
        avgScore: 0
      },
      createdAt: '2024-01-16T10:30:00Z'
    },
    {
      id: 'mock3',
      title: 'Past Assignment',
      subject: 'Math',
      level: 2,
      dueDate: '2024-01-01T23:59:59Z',
      totalPoints: 100,
      status: 'active',
      submissionStats: {
        totalStudents: 20,
        submitted: 15,
        pending: 5,
        graded: 15,
        avgScore: 78.5
      },
      createdAt: '2023-12-15T10:30:00Z'
    },
    {
      id: 'mock4',
      title: 'Draft Assignment',
      subject: 'Science',
      level: 2,
      dueDate: '2025-09-15T23:59:59Z',
      totalPoints: 100,
      status: 'draft',
      submissionStats: {
        totalStudents: 0,
        submitted: 0,
        pending: 0,
        graded: 0,
        avgScore: 0
      },
      createdAt: '2024-01-20T10:30:00Z'
    }
  ];

  const getMockAssignmentDetails = () => ({
    id: 'mock1',
    title: 'Science Project: Solar System',
    description: 'Create a model or presentation about the solar system',
    totalPoints: 100,
    rubric: [
      { criteria: 'Content Quality', maxPoints: 25, description: 'Accuracy and completeness' },
      { criteria: 'Organization', maxPoints: 25, description: 'Structure and flow' },
      { criteria: 'Creativity', maxPoints: 25, description: 'Original ideas' },
      { criteria: 'Presentation', maxPoints: 25, description: 'Overall presentation' }
    ]
  });

  const getMockSubmissions = () => [
    {
      id: 'sub1',
      student: { id: 'st1', name: 'Child Test Child', email: 'testchild@gmail.com', level: 2 },
      versionNumber: 3,
      totalVersions: 3,
      submissionLink: 'https://www.facebook.com/',
      submissionNotes: 'vvvaa rl',
      submittedAt: '2024-01-20T15:30:00Z',
      status: 'graded',
      grade: {
        totalScore: 85,
        maxScore: 100,
        percentage: 85,
        rubricScores: [
          { criteria: 'Content Quality', score: 22, maxPoints: 25, feedback: 'Excellent research' },
          { criteria: 'Organization', score: 20, maxPoints: 25, feedback: 'Well structured' },
          { criteria: 'Creativity', score: 23, maxPoints: 25, feedback: 'Very creative' },
          { criteria: 'Presentation', score: 20, maxPoints: 25, feedback: 'Good presentation' }
        ],
        overallFeedback: 'Great work overall! Very comprehensive project.',
        gradedBy: 'teacher_id',
        gradedAt: '2024-01-21T10:30:00Z'
      },
      isLate: false
    },
    {
      id: 'sub2',
      student: { id: 'st2', name: 'Bob Johnson', email: 'bob@example.com', level: 2 },
      versionNumber: 1,
      totalVersions: 1,
      submissionLink: 'https://github.com/bob/compiler-project',
      submissionNotes: 'First submission',
      submittedAt: '2024-01-21T15:30:00Z',
      status: 'submitted',
      grade: null,
      isLate: false
    }
  ];

  return (
    <DashboardLayout userRole="teacher">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Grade Projects</h1>
          <p className="text-gray-600">
            Review student submissions and provide grades and feedback
          </p>
        </div>

        {!selectedAssignment ? (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'active', label: 'Active Assignments', icon: '📋' },
                { key: 'past_due', label: 'Past Due', icon: '⏰' },
                { key: 'draft', label: 'Drafts', icon: '📝' }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.icon} {filterOption.label}
                </button>
              ))}
            </div>

            {/* Assignments List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : getFilteredAssignments().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h3>
                <p className="text-gray-600">Create your first assignment to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredAssignments().map(assignment => (
                  <div key={assignment.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">{assignment.subject} • Level {assignment.level}</p>
                      </div>
                      <span className={`badge ${
                        assignment.status === 'active' ? 'bg-success-100 text-success-800' :
                        assignment.status === 'past_due' ? 'bg-error-100 text-error-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{assignment.submissionStats?.submitted || 0}</div>
                        <div className="text-sm text-blue-700">Submitted</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{assignment.submissionStats?.graded || 0}</div>
                        <div className="text-sm text-green-700">Graded</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2">👥</span>
                        {assignment.submissionStats?.totalStudents || 0} students
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2">📅</span>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2">🎯</span>
                        {assignment.totalPoints} points total
                      </div>

                      {assignment.submissionStats?.avgScore && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="w-4 h-4 mr-2">📊</span>
                          Average: {assignment.submissionStats.avgScore.toFixed(1)}%
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => loadAssignmentSubmissions(assignment.id)}
                      className="w-full btn btn-primary"
                    >
                      View Submissions ({assignment.submissionStats?.submitted || 0})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : !selectedSubmission ? (
          /* Submissions List */
          <div>
            {/* Back Button */}
            <button
              onClick={() => setSelectedAssignment(null)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Assignments
            </button>

            {/* Assignment Info */}
            <div className="card mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                  <p className="text-gray-600">{selectedAssignment.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Points</div>
                  <div className="text-2xl font-bold text-primary-600">{selectedAssignment.totalPoints}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{submissions.length}</div>
                  <div className="text-sm text-blue-700">Total Submissions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {submissions.filter(s => s.grade).length}
                  </div>
                  <div className="text-sm text-green-700">Graded</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">
                    {submissions.filter(s => !s.grade).length}
                  </div>
                  <div className="text-sm text-orange-700">Pending</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {submissions.filter(s => s.isLate).length}
                  </div>
                  <div className="text-sm text-red-700">Late</div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                <p className="text-gray-600">Students haven't submitted their work yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map(submission => (
                  <div key={submission.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{submission.student.name}</h3>
                          {getSubmissionStatusBadge(submission)}
                          {submission.versionNumber > 1 && (
                            <span className="badge bg-purple-100 text-purple-800">
                              v{submission.versionNumber}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Submission Link:</span>
                            <a 
                              href={submission.submissionLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1 break-all"
                            >
                              {submission.submissionLink.length > 50 
                                ? submission.submissionLink.substring(0, 50) + '...' 
                                : submission.submissionLink}
                            </a>
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {formatTimeAgo(submission.submittedAt)}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {submission.student.email}
                          </div>
                        </div>

                        {submission.submissionNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 mb-1">Submission Notes:</div>
                            <p className="text-sm text-gray-600">{submission.submissionNotes}</p>
                          </div>
                        )}

                        {submission.grade && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">Grade:</span>
                              <span className="text-lg font-bold text-green-600">
                                {submission.grade.totalScore}/{submission.grade.maxScore} ({submission.grade.percentage}%)
                              </span>
                            </div>
                            {submission.grade.feedback && (
                              <p className="mt-2 text-sm text-gray-600">{submission.grade.feedback}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => openSubmissionLink(submission.submissionLink)}
                          className="px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          🔗 View Submission
                        </button>
                        
                        <button
                          onClick={() => initializeGradeForm(submission)}
                          className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          {submission.grade ? '📝 Re-grade' : '📝 Grade'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Grading Interface */
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setSelectedSubmission(null)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Submissions
            </button>

            {/* Student & Submission Info */}
            <div className="card mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSubmission.student.name}</h2>
                  <p className="text-gray-600">{selectedSubmission.student.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Submission</div>
                  <div className="font-semibold">Version {selectedSubmission.versionNumber}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Submission Link:</span>
                  <a 
                    href={selectedSubmission.submissionLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all block"
                  >
                    {selectedSubmission.submissionLink}
                  </a>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <div className="text-gray-600">{new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <div className={selectedSubmission.isLate ? 'text-red-600' : 'text-green-600'}>
                    {selectedSubmission.isLate ? 'Late' : 'On Time'}
                  </div>
                </div>
              </div>

              {selectedSubmission.submissionNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Submission Notes:</div>
                  <p className="text-sm text-gray-600">{selectedSubmission.submissionNotes}</p>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => openSubmissionLink(selectedSubmission.submissionLink)}
                  className="btn btn-secondary"
                >
                  🔗 View Submission
                </button>
              </div>
            </div>

            {/* Grading Form */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Grade Submission</h3>

              {/* Rubric Grading */}
              <div className="space-y-6 mb-6">
                {gradeForm.rubricScores.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{item.criteria}</h4>
                      <span className="text-sm text-gray-600">Max: {item.maxPoints} points</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Score *
                        </label>
                        <input
                          type="number"
                          value={item.score}
                          onChange={(e) => updateRubricScore(index, 'score', e.target.value)}
                          className="form-input"
                          min="0"
                          max={item.maxPoints}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Feedback (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.feedback}
                          onChange={(e) => updateRubricScore(index, 'feedback', e.target.value)}
                          className="form-input"
                          placeholder="Specific feedback for this criteria..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Score Display */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <span className="font-semibold text-gray-900">Total Score:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {calculateTotalFromRubric()} / {selectedAssignment?.totalPoints || 100}
                </span>
              </div>

              {/* Overall Feedback */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Feedback
                </label>
                <textarea
                  value={gradeForm.overallFeedback}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, overallFeedback: e.target.value }))}
                  className="form-input"
                  rows="4"
                  placeholder="Provide overall feedback about the student's work..."
                />
              </div>

              {/* Submit Grade */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGrade}
                  disabled={grading || !gradeForm.rubricScores.every(item => item.score !== '')}
                  className="btn btn-primary px-8"
                >
                  {grading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Grade'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default GradeProjectsPage;
