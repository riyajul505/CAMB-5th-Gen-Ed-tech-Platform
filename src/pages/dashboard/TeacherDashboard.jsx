import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layout/DashboardLayout';

/**
 * Teacher Dashboard Component
 * Dashboard for teachers to manage classes and track student progress
 */
function TeacherDashboard() {
  const { user } = useAuth();
  const [selectedView, setSelectedView] = useState('overview');

  // Mock data - to be replaced with API calls
  const mockClasses = [
    { id: 1, name: 'Grade 5 - Mathematics', students: 32, room: 'Room 201', status: 'active' },
    { id: 2, name: 'Grade 4 - Science', students: 28, room: 'Room 105', status: 'active' },
    { id: 3, name: 'Grade 6 - Advanced Math', students: 24, room: 'Room 203', status: 'active' }
  ];

  const mockSubmissions = [
    { student: 'John Smith', assignment: 'Fractions Quiz', subject: 'Mathematics', grade: 5, status: 'pending', time: '2 hours ago' },
    { student: 'Alice Doe', assignment: 'Plant Life Cycle', subject: 'Science', grade: 4, status: 'completed', time: '3 hours ago' },
    { student: 'Bob Wilson', assignment: 'Algebra Problems', subject: 'Mathematics', grade: 6, status: 'pending', time: '1 day ago' }
  ];

  const mockNotifications = [
    { type: 'submission', message: '3 new project submissions to review', priority: 'high' },
    { type: 'message', message: 'Parent inquiry about homework policy', priority: 'medium' },
    { type: 'schedule', message: 'Lab session scheduled for tomorrow 2 PM', priority: 'low' }
  ];

  return (
    <DashboardLayout userRole="teacher">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hello {user?.profile?.firstName || 'Teacher'} 👋
          </h1>
          <p className="text-gray-600">Manage your classes and track student progress</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <div className="stat-icon bg-primary-100 text-primary-600">
                <span>👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">84</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="stat-icon bg-secondary-100 text-secondary-600">
                <span>🏫</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="stat-icon bg-warning-100 text-warning-600">
                <span>📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="stat-icon bg-success-100 text-success-600">
                <span>✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Graded Today</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Classes */}
            <div className="card card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Classes</h3>
                <button className="btn-primary text-sm">
                  ➕ Create New Class
                </button>
              </div>
              
              <div className="space-y-4">
                {mockClasses.map((classItem) => (
                  <div key={classItem.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{classItem.name}</h4>
                        <p className="text-sm text-gray-500">{classItem.students} students • {classItem.room}</p>
                      </div>
                      <span className="badge-success">Active</span>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <button className="text-primary-600 hover:text-primary-700">View Students</button>
                      <button className="text-primary-600 hover:text-primary-700">Create Assignment</button>
                      <button className="text-primary-600 hover:text-primary-700">Schedule Lab</button>
                      <button className="text-primary-600 hover:text-primary-700">View Pathways</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Student Activity</h3>
              <div className="space-y-4">
                {mockSubmissions.map((submission, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {submission.student.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {submission.student} - {submission.assignment}
                      </p>
                      <p className="text-xs text-gray-500">
                        Grade {submission.grade} {submission.subject} • {submission.time}
                      </p>
                    </div>
                    <button className={`btn text-xs px-3 py-1 ${
                      submission.status === 'pending' ? 'btn-primary' : 'btn-secondary'
                    }`}>
                      {submission.status === 'pending' ? 'Review' : 'View'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section - Tools & Actions */}
          <div className="space-y-6">
            {/* Teacher Tools */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Dashboard</h3>
              <div className="space-y-3">
                <button className="btn-primary w-full text-sm">
                  🗓️ Schedule Lab Hours
                </button>
                <button className="btn-secondary w-full text-sm">
                  📈 Student Pathways
                </button>
                <button className="btn-secondary w-full text-sm">
                  🤖 Review AI Tutor Logs
                </button>
                <button className="btn-secondary w-full text-sm">
                  ✅ Grade Projects
                </button>
                <button className="btn-secondary w-full text-sm">
                  📚 Upload Resources
                </button>
                <button className="btn-secondary w-full text-sm">
                  💬 Respond in Chat
                </button>
              </div>
            </div>

            {/* Real-time Notifications */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-3">
                {mockNotifications.map((notification, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    notification.priority === 'high' ? 'bg-red-50 border-red-200' :
                    notification.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`badge ${
                        notification.priority === 'high' ? 'badge-error' :
                        notification.priority === 'medium' ? 'badge-warning' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {notification.priority} priority
                      </span>
                      <button className="text-xs text-gray-600 hover:text-gray-800">
                        Mark as read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Grade 5 Math</p>
                    <p className="text-xs text-gray-500">9:00 AM - 10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Science Lab</p>
                    <p className="text-xs text-gray-500">2:00 PM - 3:30 PM</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Parent Meeting</p>
                    <p className="text-xs text-gray-500">4:00 PM - 4:30 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TeacherDashboard; 