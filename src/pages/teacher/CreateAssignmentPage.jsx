import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { teacherAPI, assignmentAPI } from '../../services/api';
import DashboardLayout from '../../layout/DashboardLayout';

/**
 * Create Assignment Page for Teachers
 * Allows teachers to create assignments with due dates, rubrics, and file requirements
 */
function CreateAssignmentPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    level: '',
    dueDate: '',
    dueTime: '23:59',
    instructions: '',
    totalPoints: 100,
    maxFileSize: 10, // MB
    allowedFileTypes: ['pdf', 'doc', 'docx'],
    classIds: [],
    isVisible: true
  });
  const [rubric, setRubric] = useState([
    { criteria: 'Content Quality', maxPoints: 25, description: 'Accuracy and completeness of content' },
    { criteria: 'Organization', maxPoints: 25, description: 'Structure and flow of presentation' },
    { criteria: 'Creativity', maxPoints: 25, description: 'Original ideas and creative approach' },
    { criteria: 'Presentation', maxPoints: 25, description: 'Overall presentation and formatting' }
  ]);

  const subjects = ['Mathematics', 'Science', 'English', 'Art', 'History', 'Geography', 'Computer Science'];
  const levels = [
    { id: 1, title: "Early Explorer", range: "Ages 3-4" },
    { id: 2, title: "Young Learner", range: "Ages 4-5" },
    { id: 3, title: "Foundation Builder", range: "Ages 5-6" },
    { id: 4, title: "Knowledge Seeker", range: "Ages 6-7" },
    { id: 5, title: "Advanced Explorer", range: "Ages 7-8+" }
  ];

  const fileTypes = [
    { value: 'pdf', label: 'PDF Documents', icon: '📄' },
    { value: 'doc', label: 'Word Documents (.doc)', icon: '📝' },
    { value: 'docx', label: 'Word Documents (.docx)', icon: '📝' },
    { value: 'ppt', label: 'PowerPoint (.ppt)', icon: '📊' },
    { value: 'pptx', label: 'PowerPoint (.pptx)', icon: '📊' },
    { value: 'jpg', label: 'JPEG Images', icon: '🖼️' },
    { value: 'png', label: 'PNG Images', icon: '🖼️' },
    { value: 'zip', label: 'ZIP Archives', icon: '📦' },
    { value: 'txt', label: 'Text Files', icon: '📃' }
  ];

  // Load teacher's classes
  useEffect(() => {
    if (user?.id) {
      loadClasses();
    }
  }, [user?.id]);

  const loadClasses = async () => {
    try {
      const response = await teacherAPI.getTeacherClasses(user.id);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileTypeToggle = (fileType) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(type => type !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }));
  };

  const handleClassToggle = (classId) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  const updateRubricItem = (index, field, value) => {
    setRubric(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addRubricItem = () => {
    setRubric(prev => [...prev, { criteria: '', maxPoints: 0, description: '' }]);
  };

  const removeRubricItem = (index) => {
    if (rubric.length > 1) {
      setRubric(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotalRubricPoints = () => {
    return rubric.reduce((total, item) => total + (parseInt(item.maxPoints) || 0), 0);
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.subject) errors.push('Subject is required');
    if (!formData.level) errors.push('Level is required');
    if (!formData.dueDate) errors.push('Due date is required');
    if (formData.allowedFileTypes.length === 0) errors.push('At least one file type must be allowed');
    
    const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
    if (dueDateTime <= new Date()) errors.push('Due date must be in the future');
    
    const totalRubricPoints = calculateTotalRubricPoints();
    if (totalRubricPoints !== formData.totalPoints) {
      errors.push(`Rubric total (${totalRubricPoints}) must equal assignment total points (${formData.totalPoints})`);
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      
      const assignmentData = {
        ...formData,
        dueDate: dueDateTime.toISOString(),
        maxFileSize: formData.maxFileSize * 1024 * 1024, // Convert MB to bytes
        rubric: rubric.filter(item => item.criteria.trim()),
        teacherId: user.id
      };

      const response = await assignmentAPI.createAssignment(assignmentData);
      
      if (response.success) {
        alert(`Assignment created successfully! ${response.assignment.studentsNotified || 0} students have been notified.`);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          subject: '',
          level: '',
          dueDate: '',
          dueTime: '23:59',
          instructions: '',
          totalPoints: 100,
          maxFileSize: 10,
          allowedFileTypes: ['pdf', 'doc', 'docx'],
          classIds: [],
          isVisible: true
        });
        setRubric([
          { criteria: 'Content Quality', maxPoints: 25, description: 'Accuracy and completeness of content' },
          { criteria: 'Organization', maxPoints: 25, description: 'Structure and flow of presentation' },
          { criteria: 'Creativity', maxPoints: 25, description: 'Original ideas and creative approach' },
          { criteria: 'Presentation', maxPoints: 25, description: 'Overall presentation and formatting' }
        ]);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="teacher">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Create Assignment</h1>
          <p className="text-gray-600">Create a new assignment for your students with customizable requirements and rubric</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Science Project: Solar System"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                  className="form-input"
                  required
                >
                  <option value="">Select Level</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      Level {level.id} - {level.title} ({level.range})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Points
                </label>
                <input
                  type="number"
                  value={formData.totalPoints}
                  onChange={(e) => handleInputChange('totalPoints', parseInt(e.target.value))}
                  className="form-input"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="form-input"
                rows="3"
                placeholder="Brief description of the assignment..."
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                className="form-input"
                rows="4"
                placeholder="Detailed instructions for students..."
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Due Date & Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Time
                </label>
                <input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => handleInputChange('dueTime', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* File Requirements */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">File Requirements</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum File Size (MB)
              </label>
              <select
                value={formData.maxFileSize}
                onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
                className="form-input max-w-xs"
              >
                <option value={1}>1 MB</option>
                <option value={5}>5 MB</option>
                <option value={10}>10 MB</option>
                <option value={25}>25 MB</option>
                <option value={50}>50 MB</option>
                <option value={100}>100 MB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allowed File Types * (Select at least one)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fileTypes.map(fileType => (
                  <label key={fileType.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowedFileTypes.includes(fileType.value)}
                      onChange={() => handleFileTypeToggle(fileType.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-lg">{fileType.icon}</span>
                    <span className="text-sm text-gray-700">{fileType.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Rubric */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Grading Rubric</h2>
              <div className="text-sm text-gray-600">
                Total: {calculateTotalRubricPoints()} / {formData.totalPoints} points
              </div>
            </div>

            <div className="space-y-4">
              {rubric.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={item.criteria}
                        onChange={(e) => updateRubricItem(index, 'criteria', e.target.value)}
                        className="form-input"
                        placeholder="Criteria name..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        value={item.maxPoints}
                        onChange={(e) => updateRubricItem(index, 'maxPoints', parseInt(e.target.value) || 0)}
                        className="form-input"
                        placeholder="Points"
                        min="0"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateRubricItem(index, 'description', e.target.value)}
                        className="form-input"
                        placeholder="Description..."
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeRubricItem(index)}
                        className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={rubric.length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRubricItem}
              className="mt-4 px-4 py-2 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
            >
              + Add Rubric Item
            </button>
          </div>

          {/* Class Selection */}
          {classes.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign to Classes (Optional)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Leave empty to assign to all students at the selected level
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {classes.map(classItem => (
                  <label key={classItem.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.classIds.includes(classItem.id)}
                      onChange={() => handleClassToggle(classItem.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {classItem.name} (Level {classItem.level})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Visibility */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Visibility</h2>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isVisible}
                  onChange={() => handleInputChange('isVisible', true)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Publish Immediately</div>
                  <div className="text-sm text-gray-600">Students will see this assignment right away</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.isVisible}
                  onChange={() => handleInputChange('isVisible', false)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Save as Draft</div>
                  <div className="text-sm text-gray-600">You can publish this later</div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-8"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default CreateAssignmentPage;
