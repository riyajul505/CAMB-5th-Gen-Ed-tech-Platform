import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI } from '../../services/api';
import DashboardLayout from '../../layout/DashboardLayout';

/**
 * Submit Project Page for Students
 * Allows students to view assignments and submit their projects
 */
function SubmitProjectPage() {
  const { user, selectedLevel } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('available'); // available, submitted, graded, overdue
  const [linkSubmission, setLinkSubmission] = useState({
    submissionLink: '',
    submissionNotes: ''
  });

  // Load student's assignments
  useEffect(() => {
    if (user?.id) {
      loadAssignments();
    }
  }, [user?.id, filter]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading assignments for student:', user.id, 'with filter:', filter);
      
      const response = await assignmentAPI.getStudentAssignments(user.id, { status: filter });
      console.log('📥 Raw API response:', response);
      console.log('📥 Response data:', response.data);
      
      // Handle different possible response structures
      let assignmentsData = [];
      
      if (response.data) {
        // If response.data exists, check its structure
        if (response.data.assignments && Array.isArray(response.data.assignments)) {
          assignmentsData = response.data.assignments;
        } else if (Array.isArray(response.data)) {
          assignmentsData = response.data;
        } else if (response.data.success && response.data.assignments) {
          assignmentsData = response.data.assignments;
        } else {
          // If data exists but not in expected format, log it
          console.log('🔍 Unexpected response.data structure:', response.data);
          assignmentsData = [];
        }
      } else if (response.assignments && Array.isArray(response.assignments)) {
        assignmentsData = response.assignments;
      } else if (Array.isArray(response)) {
        assignmentsData = response;
      }
      
      console.log('✅ Processed assignments data:', assignmentsData);
      console.log('✅ Number of assignments found:', assignmentsData.length);
      setAssignments(assignmentsData);
      
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
      console.log('🔄 Falling back to mock data');
      setAssignments(getMockAssignments());
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentDetails = async (assignmentId) => {
    try {
      console.log('🔍 Loading assignment details for:', assignmentId);
      
      // First try to find the assignment in our current list
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        console.log('✅ Found assignment in current list:', assignment);
        
        // Transform the assignment data to match expected structure
        const transformedData = {
          assignment: {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            instructions: assignment.instructions || assignment.description,
            subject: assignment.subject,
            level: assignment.level,
            dueDate: assignment.dueDate,
            totalPoints: assignment.totalPoints,
            allowedFileTypes: assignment.allowedFileTypes || ['pdf', 'doc', 'docx'],
            maxFileSize: assignment.maxFileSize || 10485760,
            isOverdue: assignment.isOverdue || false,
            timeRemaining: assignment.timeRemaining,
            rubric: assignment.rubric || [],
            teacher: assignment.teacher
          },
          mySubmissions: assignment.mySubmissions || []
        };
        
        setSelectedAssignment(transformedData);
        return;
      }
      
      // If not found in current list, try API call
      const response = await assignmentAPI.getAssignmentForStudent(assignmentId, user.id);
      console.log('✅ Assignment details loaded from API:', response.data);
      setSelectedAssignment(response.data);
      
    } catch (error) {
      console.error('❌ Error loading assignment details:', error);
      
      // Fallback: use the assignment data we have
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        console.log('🔄 Using fallback assignment data');
        const fallbackData = {
          assignment: {
            ...assignment,
            instructions: assignment.instructions || assignment.description,
            allowedFileTypes: assignment.allowedFileTypes || ['pdf', 'doc', 'docx'],
            maxFileSize: assignment.maxFileSize || 10485760,
            rubric: assignment.rubric || []
          },
          mySubmissions: []
        };
        setSelectedAssignment(fallbackData);
      } else {
        alert('Failed to load assignment details');
      }
    }
  };

  const handleLinkChange = (event) => {
    const { name, value } = event.target;
    setLinkSubmission(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAssignment = async () => {
    if (!linkSubmission.submissionLink) {
      alert('Please provide a link to your submission');
      return;
    }

    if (!selectedAssignment?.assignment?.id) {
      alert('No assignment selected');
      return;
    }

    console.log('📤 Starting assignment link submission...');
    console.log('🔗 Submission Link:', linkSubmission.submissionLink);
    console.log('📋 Assignment ID:', selectedAssignment.assignment.id);
    console.log('👤 Student ID:', user.id);

    setSubmitting(true);

    try {
      // Check if this is a revision (multiple versions support)
      const hasExistingSubmission = selectedAssignment.mySubmissions?.length > 0;
      console.log('🔄 Has existing submissions:', hasExistingSubmission);
      console.log('📝 Current submissions count:', selectedAssignment.mySubmissions?.length || 0);
      
      const submissionData = {
        assignmentId: selectedAssignment.assignment.id,
        studentId: user.id,
        submissionLink: linkSubmission.submissionLink,
        submissionNotes: linkSubmission.submissionNotes || '',
        isRevision: hasExistingSubmission,
        previousSubmissionId: hasExistingSubmission ? selectedAssignment.mySubmissions[selectedAssignment.mySubmissions.length - 1].id : null
      };

      if (hasExistingSubmission) {
        const latestSubmission = selectedAssignment.mySubmissions[selectedAssignment.mySubmissions.length - 1];
        console.log('🔗 Previous submission ID:', latestSubmission.id);
        console.log('📊 Next version will be:', (latestSubmission.versionNumber || 1) + 1);
      } else {
        console.log('🆕 This is the first submission (version 1)');
      }

      console.log('📋 Submission data:', submissionData);

      const response = await assignmentAPI.submitAssignment(submissionData);

      console.log('✅ Submission response:', response);

      if (response.success) {
        const newVersion = response.submission?.versionNumber || (hasExistingSubmission ? 'updated' : '1');
        alert(`Assignment submitted successfully! ${hasExistingSubmission ? `New version ${newVersion} created.` : 'First submission completed.'}`);
        
        // Refresh assignment details to show new submission
        console.log('🔄 Refreshing assignment details...');
        await loadAssignmentDetails(selectedAssignment.assignment.id);
        
        // Reset submission form
        setLinkSubmission({
          submissionLink: '',
          submissionNotes: ''
        });
        
        console.log('✅ Assignment submission completed successfully');
      }
    } catch (error) {
      console.error('❌ Error submitting assignment:', error);
      
      // Show specific error message if available
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to submit assignment: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isAssignmentOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const formatTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (assignment) => {
    const isOverdue = isAssignmentOverdue(assignment.dueDate);
    const hasSubmission = assignment.mySubmissions && assignment.mySubmissions.length > 0;
    const latestSubmission = hasSubmission ? assignment.mySubmissions[assignment.mySubmissions.length - 1] : null;

    if (hasSubmission && latestSubmission?.status === 'graded') {
      return <span className="badge bg-success-100 text-success-800">Graded</span>;
    } else if (hasSubmission && latestSubmission?.status === 'submitted') {
      return <span className="badge bg-blue-100 text-blue-800">Submitted</span>;
    } else if (isOverdue) {
      return <span className="badge bg-error-100 text-error-800">Overdue</span>;
    } else {
      return <span className="badge bg-warning-100 text-warning-800">Available</span>;
    }
  };

  const getGradeDisplay = (grade) => {
    if (!grade) return null;
    
    // Safely calculate percentage
    const totalScore = grade.totalScore || 0;
    const maxScore = grade.maxScore || 100;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    // Determine letter grade
    let letterGrade = 'F';
    if (percentage >= 90) letterGrade = 'A';
    else if (percentage >= 80) letterGrade = 'B';
    else if (percentage >= 70) letterGrade = 'C';
    else if (percentage >= 60) letterGrade = 'D';
    
    // Determine color class
    let colorClass = 'text-gray-600';
    if (percentage >= 90) colorClass = 'text-success-600';
    else if (percentage >= 80) colorClass = 'text-primary-600';
    else if (percentage >= 70) colorClass = 'text-warning-600';
    else colorClass = 'text-error-600';

    return (
      <div className={`text-lg font-semibold ${colorClass}`}>
        {totalScore}/{maxScore} ({percentage}%) - {letterGrade}
      </div>
    );
  };

  // Filter assignments based on current filter
  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      const hasSubmission = assignment.mySubmissions && assignment.mySubmissions.length > 0;
      const latestSubmission = hasSubmission ? assignment.mySubmissions[assignment.mySubmissions.length - 1] : null;
      const isOverdue = new Date(assignment.dueDate) < new Date();
      
      switch (filter) {
        case 'available':
          // Show assignments that are not submitted and not overdue
          return !hasSubmission && !isOverdue;
        case 'submitted':
          // Show assignments that are submitted but NOT graded AND due date has NOT passed
          return hasSubmission && latestSubmission?.status === 'submitted' && !isOverdue;
        case 'graded':
          // Show assignments that have been graded (regardless of due date)
          return hasSubmission && latestSubmission?.status === 'graded';
        case 'overdue':
          // Show assignments that are overdue and not submitted
          return isOverdue && !hasSubmission;
        default:
          return true;
      }
    });
  };

  // Mock data for development
  const getMockAssignments = () => [
    {
      id: 'mock1',
      title: 'HUM MID ASSAY',
      description: 'ASDFASDF',
      subject: 'History',
      level: 2,
      dueDate: '2025-08-12T23:59:59Z',
      totalPoints: 100,
      status: 'graded',
      timeRemaining: '2 days, 18 hours',
      isOverdue: false,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      mySubmissions: [
        {
          id: 'sub1',
          submissionLink: 'https://www.facebook.com/',
          submissionNotes: 'vvvaa rl',
          versionNumber: 3,
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
            overallFeedback: 'Great work overall! Very comprehensive project.'
          },
          isLate: false
        }
      ],
      teacher: { name: 'Test Teacher', email: 'test@school.com' }
    },
    {
      id: 'mock2',
      title: 'Compiler Design',
      description: 'Complete the compiler design',
      subject: 'Computer Science',
      level: 2,
      dueDate: '2025-08-13T23:59:59Z',
      totalPoints: 100,
      status: 'graded',
      timeRemaining: '3 days, 18 hours',
      isOverdue: false,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      mySubmissions: [
        {
          id: 'sub2',
          submissionLink: 'https://github.com/student/compiler-project',
          submissionNotes: 'Final compiler implementation',
          versionNumber: 1,
          submittedAt: '2024-01-21T15:30:00Z',
          status: 'graded',
          grade: {
            totalScore: 92,
            maxScore: 100,
            percentage: 92,
            rubricScores: [
              { criteria: 'Implementation', score: 23, maxPoints: 25, feedback: 'Excellent code structure' },
              { criteria: 'Documentation', score: 22, maxPoints: 25, feedback: 'Good documentation' },
              { criteria: 'Testing', score: 24, maxPoints: 25, feedback: 'Comprehensive tests' },
              { criteria: 'Performance', score: 23, maxPoints: 25, feedback: 'Good performance' }
            ],
            overallFeedback: 'Excellent compiler implementation with great attention to detail.'
          },
          isLate: false
        }
      ],
      teacher: { name: 'Test Teacher', email: 'test@school.com' }
    },
    {
      id: 'mock3',
      title: 'Available Assignment',
      description: 'This assignment is available to submit',
      subject: 'Mathematics',
      level: 2,
      dueDate: '2025-09-15T23:59:59Z',
      totalPoints: 100,
      status: 'available',
      timeRemaining: '25 days',
      isOverdue: false,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      mySubmissions: [],
      teacher: { name: 'Test Teacher', email: 'test@school.com' }
    },
    {
      id: 'mock5',
      title: 'Submitted Assignment',
      description: 'This assignment has been submitted but not graded yet',
      subject: 'Physics',
      level: 2,
      dueDate: '2025-08-20T23:59:59Z',
      totalPoints: 100,
      status: 'submitted',
      timeRemaining: '7 days',
      isOverdue: false,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      mySubmissions: [
        {
          id: 'sub3',
          submissionLink: 'https://github.com/student/physics-experiment',
          submissionNotes: 'Completed all experiments and documented results',
          versionNumber: 1,
          submittedAt: '2024-01-19T15:30:00Z',
          status: 'submitted', // Not graded yet
          isLate: false
        }
      ],
      teacher: { name: 'Test Teacher', email: 'test@school.com' }
    },
    {
      id: 'mock6',
      title: 'Submitted Overdue Assignment',
      description: 'This assignment was submitted but due date has passed, should not appear in submitted tab',
      subject: 'Chemistry',
      level: 2,
      dueDate: '2024-07-01T23:59:59Z', // Past due date
      totalPoints: 100,
      status: 'submitted',
      timeRemaining: 'Overdue',
      isOverdue: true,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      mySubmissions: [
        {
          id: 'sub4',
          submissionLink: 'https://github.com/student/chemistry-lab',
          submissionNotes: 'Late submission but completed',
          versionNumber: 1,
          submittedAt: '2024-07-05T15:30:00Z',
          status: 'submitted', // Submitted but overdue
          isLate: true
        }
      ],
      teacher: { name: 'Test Teacher', email: 'test@school.com' }
    },
    {
      id: 'mock4',
      title: 'Overdue Assignment',
      description: 'This assignment is overdue',
      subject: 'Science',
      level: 2,
      dueDate: '2024-01-01T23:59:59Z',
      totalPoints: 100,
      status: 'overdue',
      timeRemaining: 'Overdue',
      isOverdue: true,
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      mySubmissions: [],
      teacher: { name: 'Test Teacher', email: 'test@school.com' }
    }
  ];

  if (!selectedLevel) {
    return (
      <DashboardLayout userRole="student">
        <div className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Learning Path Selected</h2>
            <p className="text-gray-600 mb-4">
              You need to select a learning path before accessing assignments.
            </p>
            <button
              onClick={() => window.location.href = '/select-path'}
              className="btn btn-primary"
            >
              Select Learning Path
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📝 Submit Projects</h1>
          <p className="text-gray-600">
            View your assignments and submit your projects before the deadline
          </p>
        </div>

        {!selectedAssignment ? (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'available', label: 'Available', icon: '📋' },
                { key: 'submitted', label: 'Submitted', icon: '✅' },
                { key: 'graded', label: 'Graded', icon: '📊' },
                { key: 'overdue', label: 'Overdue', icon: '⏰' }
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
                <p className="text-gray-600">
                  {filter === 'available' && 'No assignments are currently available.'}
                  {filter === 'submitted' && 'You haven\'t submitted any assignments yet.'}
                  {filter === 'graded' && 'No graded assignments to display.'}
                  {filter === 'overdue' && 'No overdue assignments.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredAssignments().map(assignment => (
                  <div key={assignment.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">{assignment.subject} • Level {assignment.level}</p>
                      </div>
                      {getStatusBadge(assignment)}
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{assignment.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2">📅</span>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2">⏱️</span>
                        {formatTimeRemaining(assignment.dueDate)}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2">🎯</span>
                        {assignment.totalPoints} points
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-4 h-4 mr-2">👨‍🏫</span>
                        {assignment.teacher?.name}
                      </div>
                    </div>

                    {(() => {
                      const hasSubmission = assignment.mySubmissions && assignment.mySubmissions.length > 0;
                      const latestSubmission = hasSubmission ? assignment.mySubmissions[assignment.mySubmissions.length - 1] : null;
                      const hasGrade = latestSubmission?.grade;
                      
                      return hasGrade && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Your Grade:</div>
                          {getGradeDisplay(latestSubmission.grade)}
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => loadAssignmentDetails(assignment.id)}
                      className="w-full btn btn-primary"
                    >
                      {(() => {
                        const hasSubmission = assignment.mySubmissions && assignment.mySubmissions.length > 0;
                        const latestSubmission = hasSubmission ? assignment.mySubmissions[assignment.mySubmissions.length - 1] : null;
                        const isGraded = latestSubmission?.status === 'graded';
                        const isOverdue = isAssignmentOverdue(assignment.dueDate);
                        
                        if (isGraded) {
                          return 'View Grade Details';
                        } else if (hasSubmission && !isOverdue) {
                          return 'View Details';
                        } else if (isOverdue) {
                          return 'View Details';
                        } else {
                          return 'Submit Project';
                        }
                      })()}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Assignment Details & Submission */
          <div className="max-w-4xl mx-auto">
            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-yellow-100 text-xs">
                <strong>Debug:</strong> selectedAssignment exists: {selectedAssignment ? 'Yes' : 'No'}
                {selectedAssignment && (
                  <div>Assignment ID: {selectedAssignment.assignment?.id}</div>
                )}
              </div>
            )}

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

            {!selectedAssignment ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Assignment Details...</h3>
                <p className="text-gray-600">Please wait while we load the assignment information.</p>
              </div>
            ) : (
              <>

            {/* Assignment Details */}
            <div className="card mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedAssignment.assignment?.title}
                  </h1>
                  <p className="text-gray-600">
                    {selectedAssignment.assignment?.subject} • Level {selectedAssignment.assignment?.level} • {selectedAssignment.assignment?.totalPoints} points
                  </p>
                </div>
                {getStatusBadge(selectedAssignment.assignment)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <span className="w-4 h-4 mr-2">📅</span>
                    <span className="font-medium mr-2">Due:</span>
                    {new Date(selectedAssignment.assignment?.dueDate).toLocaleDateString()} at {new Date(selectedAssignment.assignment?.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="w-4 h-4 mr-2">⏱️</span>
                    <span className="font-medium mr-2">Time Remaining:</span>
                    {formatTimeRemaining(selectedAssignment.assignment?.dueDate)}
                  </div>

                  <div className="flex items-center text-sm">
                    <span className="w-4 h-4 mr-2">👨‍🏫</span>
                    <span className="font-medium mr-2">Teacher:</span>
                    {selectedAssignment.assignment?.teacher?.name}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <span className="w-4 h-4 mr-2">📎</span>
                    <span className="font-medium mr-2">Allowed File Types:</span>
                    {selectedAssignment.assignment?.allowedFileTypes?.join(', ')}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="w-4 h-4 mr-2">💾</span>
                    <span className="font-medium mr-2">Max File Size:</span>
                    {formatFileSize(selectedAssignment.assignment?.maxFileSize || 0)}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedAssignment.assignment?.description}</p>
              </div>

              {selectedAssignment.assignment?.instructions && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedAssignment.assignment?.instructions}</p>
                  </div>
                </div>
              )}

              {/* Rubric */}
              {selectedAssignment.assignment?.rubric && selectedAssignment.assignment.rubric.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Grading Rubric</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Criteria</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Points</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedAssignment.assignment.rubric.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 font-medium text-gray-900">{item.criteria}</td>
                            <td className="px-4 py-2 text-gray-700">{item.maxPoints}</td>
                            <td className="px-4 py-2 text-gray-700">{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Submission History */}
            {selectedAssignment.mySubmissions && selectedAssignment.mySubmissions.length > 0 && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Submissions</h3>
                
                <div className="space-y-4">
                  {selectedAssignment.mySubmissions.map((submission, index) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Version {submission.versionNumber}
                            {submission.fileName && ` - ${submission.fileName}`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                            {submission.isLate && <span className="text-red-600 ml-2">(Late)</span>}
                          </p>
                        </div>
                        <span className={`badge ${
                          submission.status === 'graded' ? 'bg-success-100 text-success-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                        </span>
                      </div>

                      {/* Enhanced Grade Display for Graded Submissions */}
                      {submission.grade && submission.status === 'graded' && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-green-900 text-lg">📊 Grade Results</h5>
                            <div className="text-right">
                              {getGradeDisplay(submission.grade)}
                            </div>
                          </div>
                          
                          {/* Score Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-white rounded-lg border">
                              <div className="text-2xl font-bold text-green-600">
                                {submission.grade.totalScore || 0}
                              </div>
                              <div className="text-sm text-gray-600">Total Score</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border">
                              <div className="text-2xl font-bold text-blue-600">
                                {submission.grade.maxScore || 100}
                              </div>
                              <div className="text-sm text-gray-600">Maximum Score</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border">
                              <div className="text-2xl font-bold text-purple-600">
                                {submission.grade.percentage || 0}%
                              </div>
                              <div className="text-sm text-gray-600">Percentage</div>
                            </div>
                          </div>
                          
                          {/* Detailed Rubric Scores */}
                          {submission.grade.rubricScores && submission.grade.rubricScores.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-semibold text-gray-900 mb-3">📋 Detailed Rubric Scores</h6>
                              <div className="space-y-2">
                                {submission.grade.rubricScores.map((score, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{score.criteria}</div>
                                      {score.feedback && (
                                        <div className="text-sm text-gray-600 mt-1">{score.feedback}</div>
                                      )}
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="text-lg font-bold text-gray-900">
                                        {score.score}/{score.maxPoints}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {Math.round((score.score / score.maxPoints) * 100)}%
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Overall Feedback */}
                          {submission.grade.overallFeedback && (
                            <div className="mb-3">
                              <h6 className="font-semibold text-gray-900 mb-2">💬 Teacher Feedback</h6>
                              <div className="p-3 bg-white rounded-lg border">
                                <p className="text-gray-700">{submission.grade.overallFeedback}</p>
                              </div>
                            </div>
                          )}

                          {/* Grading Information */}
                          <div className="text-xs text-gray-500 border-t pt-3">
                            <div className="flex items-center justify-between">
                              <span>Graded by: {submission.grade.gradedBy || 'Teacher'}</span>
                              <span>Graded on: {submission.grade.gradedAt ? new Date(submission.grade.gradedAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Simple Grade Display for Non-Graded Submissions */}
                      {submission.grade && submission.status !== 'graded' && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Grade:</span>
                            {getGradeDisplay(submission.grade)}
                          </div>
                          
                          {submission.grade.rubricScores && submission.grade.rubricScores.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">Detailed Scores:</div>
                              <div className="space-y-1">
                                {submission.grade.rubricScores.map((score, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span>{score.criteria}:</span>
                                    <span>{score.score}/{score.maxPoints}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {submission.grade.feedback && (
                            <div className="mt-3">
                              <div className="text-sm font-medium text-gray-700 mb-1">Teacher Feedback:</div>
                              <p className="text-sm text-gray-600">{submission.grade.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submission Details */}
                      <div className="text-sm text-gray-600">
                        <div className="break-all">
                          <span className="font-medium">Link:</span> 
                          <a 
                            href={submission.submissionLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-1"
                          >
                            {submission.submissionLink}
                          </a>
                        </div>
                        {submission.submissionNotes && (
                          <div className="mt-2">
                            <span className="font-medium">Notes:</span> {submission.submissionNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link Submission Form */}
            {!isAssignmentOverdue(selectedAssignment.assignment?.dueDate) && 
             !(selectedAssignment.mySubmissions?.length > 0 && 
               selectedAssignment.mySubmissions[selectedAssignment.mySubmissions.length - 1]?.status === 'graded') && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedAssignment.mySubmissions?.length > 0 ? 'Submit New Version' : 'Submit Project'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Link *
                    </label>
                    <input
                      type="url"
                      name="submissionLink"
                      value={linkSubmission.submissionLink}
                      onChange={handleLinkChange}
                      placeholder="https://example.com/your-project or https://github.com/your-repo"
                      className="form-input w-full"
                      required
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Provide a link to your project (GitHub, Google Drive, Dropbox, etc.)
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Notes (Optional)
                    </label>
                    <textarea
                      name="submissionNotes"
                      value={linkSubmission.submissionNotes}
                      onChange={handleLinkChange}
                      rows={3}
                      className="form-input w-full"
                      placeholder="Add any notes about your submission, special instructions, or version changes..."
                    />
                  </div>

                  <button
                    onClick={handleSubmitAssignment}
                    disabled={!linkSubmission.submissionLink || submitting}
                    className={`w-full btn ${!linkSubmission.submissionLink || submitting ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      selectedAssignment.mySubmissions?.length > 0 ? 'Submit New Version' : 'Submit Project'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Graded Assignment Notice */}
            {selectedAssignment.mySubmissions?.length > 0 && 
             selectedAssignment.mySubmissions[selectedAssignment.mySubmissions.length - 1]?.status === 'graded' && (
              <div className="card bg-green-50 border-green-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-900">Assignment Graded</h3>
                    <p className="text-green-700">
                      This assignment has been graded. You can view your grade and feedback above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overdue Notice */}
            {isAssignmentOverdue(selectedAssignment.assignment?.dueDate) && (
              <div className="card bg-red-50 border-red-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <h3 className="font-semibold text-red-900">Assignment Overdue</h3>
                    <p className="text-red-700">
                      The deadline for this assignment has passed. No new submissions are allowed.
                    </p>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SubmitProjectPage;
