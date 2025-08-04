import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layout/DashboardLayout';
import { teacherAPI } from '../../services/api';

/**
 * My Classes Page Component
 * Allows teachers to view and manage their classes
 */
function MyClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelStudents, setLevelStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load teacher's classes
  useEffect(() => {
    if (user?.id) {
      loadClasses();
    }
  }, [user?.id]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getTeacherClasses(user.id);
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Error loading classes:', error);
      // Fallback to mock data
      setClasses(mockClasses);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (classData) => {
    try {
      const response = await teacherAPI.createClass({
        ...classData,
        teacherId: user.id
      });
      
      // Add new class to the list
      setClasses(prev => [...prev, response.data.class]);
      setShowCreateModal(false);
      
      // Show success message
      alert(`Class created successfully! ${response.data.class.name} is now active.`);
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
    }
  };

  const viewStudentsByLevel = async (level) => {
    try {
      setLoadingStudents(true);
      setSelectedLevel(level);
      const response = await teacherAPI.getStudentsByLevel(level);
      setLevelStudents(response.data.students);
    } catch (error) {
      console.error('Error loading students:', error);
      setLevelStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Mock data for fallback
  const mockClasses = [
    {
      id: '1',
      name: 'Grade 5 - Mathematics',
      subject: 'Mathematics',
      level: 5,
      timing: {
        days: ['Monday', 'Wednesday', 'Friday'],
        startTime: '09:00',
        endTime: '10:30'
      },
      studentCount: 32,
      isActive: true,
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Grade 4 - Science',
      subject: 'Science',
      level: 4,
      timing: {
        days: ['Tuesday', 'Thursday'],
        startTime: '14:00',
        endTime: '15:30'
      },
      studentCount: 28,
      isActive: true,
      createdAt: '2024-01-10T08:00:00Z'
    }
  ];

  const getLevelInfo = (level) => {
    const levels = {
      1: { title: "Early Explorer", range: "Ages 3-4", color: "bg-green-100 text-green-800" },
      2: { title: "Young Learner", range: "Ages 4-5", color: "bg-blue-100 text-blue-800" },
      3: { title: "Foundation Builder", range: "Ages 5-6", color: "bg-purple-100 text-purple-800" },
      4: { title: "Knowledge Seeker", range: "Ages 6-7", color: "bg-orange-100 text-orange-800" },
      5: { title: "Advanced Explorer", range: "Ages 7-8+", color: "bg-red-100 text-red-800" }
    };
    return levels[level] || { title: "Unknown", range: "", color: "bg-gray-100 text-gray-800" };
  };

  const getSubjectIcon = (subject) => {
    const icons = {
      'Mathematics': '🔢',
      'Science': '🔬',
      'English': '📚',
      'Art': '🎨',
      'History': '📜',
      'Geography': '🌍'
    };
    return icons[subject] || '📖';
  };

  return (
    <DashboardLayout userRole="teacher">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h1>
            <p className="text-gray-600">Manage your classes and view student enrollments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create New Class
          </button>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getSubjectIcon(classItem.subject)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                      <p className="text-gray-600">{classItem.subject}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelInfo(classItem.level).color}`}>
                    Level {classItem.level}
                  </div>
                </div>

                {/* Class Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">👥</span>
                    <span>{classItem.studentCount} students enrolled</span>
                  </div>
                  
                  {classItem.timing && (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📅</span>
                        <span>{classItem.timing.days.join(', ')}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">⏰</span>
                        <span>{classItem.timing.startTime} - {classItem.timing.endTime}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => viewStudentsByLevel(classItem.level)}
                    className="btn btn-secondary text-sm"
                  >
                    View Students
                  </button>
                  <button className="btn btn-outline text-sm">
                    Create Assignment
                  </button>
                  <button className="btn btn-outline text-sm">
                    Schedule Lab
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {classes.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
            <p className="text-gray-600 mb-4">Create your first class to start teaching!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Your First Class
            </button>
          </div>
        )}

        {/* Create Class Modal */}
        {showCreateModal && (
          <CreateClassModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateClass}
          />
        )}

        {/* Students by Level Modal */}
        {selectedLevel && (
          <StudentsModal
            level={selectedLevel}
            students={levelStudents}
            loading={loadingStudents}
            onClose={() => setSelectedLevel(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Create Class Modal Component
 */
function CreateClassModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    level: '',
    timing: {
      days: [],
      startTime: '',
      endTime: ''
    }
  });
  const [loading, setLoading] = useState(false);

  const subjects = ['Mathematics', 'Science', 'English', 'Art', 'History', 'Geography'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.subject || !formData.level) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate timing
    if (!formData.timing.days.length || !formData.timing.startTime || !formData.timing.endTime) {
      alert('Please complete the class timing information');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      timing: {
        ...prev.timing,
        days: prev.timing.days.includes(day)
          ? prev.timing.days.filter(d => d !== day)
          : [...prev.timing.days, day]
      }
    }));
  };

  const getLevelInfo = (level) => {
    const levels = {
      1: { title: "Early Explorer", range: "Ages 3-4" },
      2: { title: "Young Learner", range: "Ages 4-5" },
      3: { title: "Foundation Builder", range: "Ages 5-6" },
      4: { title: "Knowledge Seeker", range: "Ages 6-7" },
      5: { title: "Advanced Explorer", range: "Ages 7-8+" }
    };
    return levels[level];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Class</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Grade 5 - Mathematics"
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Level *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5].map(level => {
                const levelInfo = getLevelInfo(level);
                return (
                  <label
                    key={level}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      formData.level === level ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={level}
                      checked={formData.level === level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Level {level}: {levelInfo.title}
                      </div>
                      <div className="text-xs text-gray-600">{levelInfo.range}</div>
                    </div>
                    {formData.level === level && (
                      <div className="text-primary-500">✓</div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Class Timing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Class Schedule *</h3>
            
            {/* Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-1 text-sm rounded-lg border ${
                      formData.timing.days.includes(day)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.timing.startTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timing: { ...prev.timing, startTime: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.timing.endTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timing: { ...prev.timing, endTime: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Students Modal Component
 */
function StudentsModal({ level, students, loading, onClose }) {
  const getLevelInfo = (level) => {
    const levels = {
      1: { title: "Early Explorer", range: "Ages 3-4", color: "bg-green-100 text-green-800" },
      2: { title: "Young Learner", range: "Ages 4-5", color: "bg-blue-100 text-blue-800" },
      3: { title: "Foundation Builder", range: "Ages 5-6", color: "bg-purple-100 text-purple-800" },
      4: { title: "Knowledge Seeker", range: "Ages 6-7", color: "bg-orange-100 text-orange-800" },
      5: { title: "Advanced Explorer", range: "Ages 7-8+", color: "bg-red-100 text-red-800" }
    };
    return levels[level] || { title: "Unknown", range: "", color: "bg-gray-100 text-gray-800" };
  };

  const levelInfo = getLevelInfo(level);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Level {level} Students</h2>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${levelInfo.color} mt-2`}>
              {levelInfo.title} ({levelInfo.range})
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : students.length > 0 ? (
          <div className="space-y-3">
            {students.map((student, index) => (
              <div key={student.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {student.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-600">{student.email}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${levelInfo.color}`}>
                  Level {student.level}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled yet</h3>
            <p className="text-gray-600">Students will appear here when they select Level {level}</p>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyClassesPage; 