import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layout/DashboardLayout';

/**
 * Student Dashboard Component
 * Main dashboard matching the CAMB design exactly
 */
function DashboardPage() {
  const { user, selectedLevel } = useAuth();
  const [currentDate] = useState(new Date());

  // Level information for display
  const levelInfo = {
    1: { title: "Early Explorer", range: "Ages 3-4", color: "bg-green-100 text-green-800" },
    2: { title: "Young Learner", range: "Ages 4-5", color: "bg-blue-100 text-blue-800" },
    3: { title: "Foundation Builder", range: "Ages 5-6", color: "bg-purple-100 text-purple-800" },
    4: { title: "Knowledge Seeker", range: "Ages 6-7", color: "bg-orange-100 text-orange-800" },
    5: { title: "Advanced Explorer", range: "Ages 7-8+", color: "bg-red-100 text-red-800" }
  };

  // Mock data - to be replaced with API calls
  const recentCourse = {
    name: 'Cambridge Level 1',
    progress: 14,
    total: 30,
    progressPercentage: 47
  };

  const resources = [
    { name: 'Math solve.pdf', size: '8.5 MB', type: 'pdf', status: 'Cancel' },
    { name: 'English_Grammar_Tips.png', size: '570 kB', type: 'image', status: 'Download' },
    { name: 'Solution.pdf', size: '2.5 MB', type: 'pdf', status: 'Download' }
  ];

  const quizAverage = 91;

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      default: return '📁';
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Previous month days
    for (let i = startDate - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate.getDate(), isCurrentMonth: false, isToday: false });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === currentDate.getDate() && 
                     month === new Date().getMonth() && 
                     year === new Date().getFullYear();
      days.push({ date: day, isCurrentMonth: true, isToday });
    }
    
    return { days, monthName: monthNames[month], year };
  };

  const { days, monthName, year } = generateCalendar();

  return (
    <DashboardLayout userRole="student">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hello {user?.profile?.firstName || 'Student'} 👋
              </h1>
              <p className="text-gray-600">Let's learn something new today!</p>
            </div>
            
            {/* Current Level Badge */}
            {selectedLevel && levelInfo[selectedLevel] && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Your Learning Level</p>
                  <p className="text-lg font-semibold text-gray-900">Level {selectedLevel}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${levelInfo[selectedLevel].color}`}>
                  🎯 {levelInfo[selectedLevel].title}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Enrolled Course */}
            <div className="card card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent enrolled course</h3>
                {selectedLevel && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Level {selectedLevel} Content
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✏️</span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">{recentCourse.name}</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${recentCourse.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {recentCourse.progress}/{recentCourse.total} class
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Average */}
            <div className="card card-padding">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Average</h3>
              
              <div className="flex items-center space-x-6">
                <div className="relative w-32 h-32">
                  {/* Circular Progress */}
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f97316"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - quizAverage / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{quizAverage}%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Quiz Submission Performance</span>
                  </div>
                  <p className="text-sm text-gray-500">Your Grade: <span className="font-semibold">{quizAverage}%</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            {/* Your Resources */}
            <div className="card card-padding">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Resources</h3>
                <button className="text-primary-500 text-sm hover:text-primary-600">see more</button>
              </div>
              
              <div className="space-y-3">
                {resources.map((resource, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <span className="text-lg">{getResourceIcon(resource.type)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{resource.name}</p>
                      <p className="text-xs text-gray-500">{resource.size}</p>
                    </div>
                    
                    <button className={`text-xs px-2 py-1 rounded ${
                      resource.status === 'Download' 
                        ? 'text-primary-600 hover:text-primary-700' 
                        : 'text-gray-400'
                    }`}>
                      {resource.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="card card-padding">
              <div className="flex items-center justify-between mb-4">
                <button className="text-gray-400 hover:text-gray-600">❮</button>
                <h3 className="font-semibold text-gray-900">{monthName} {year}</h3>
                <button className="text-gray-400 hover:text-gray-600">❯</button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
                
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`p-2 text-sm ${
                      day.isCurrentMonth 
                        ? day.isToday 
                          ? 'bg-primary-500 text-white rounded-lg font-medium'
                          : 'text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer'
                        : 'text-gray-300'
                    }`}
                  >
                    {day.date}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage; 