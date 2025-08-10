import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layout/DashboardLayout';
import { teacherAPI } from '../../services/api';

/**
 * Teacher Resources Page Component
 * Allows teachers to upload and manage learning resources
 */
function TeacherResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Load teacher's resources
  useEffect(() => {
    if (user?.id) {
      loadResources();
    }
  }, [user?.id]);

  // Add a retry mechanism for failed loads
  const retryLoadResources = () => {
    console.log('🔄 Retrying resource load...');
    loadResources();
  };

  const loadResources = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading resources for teacher:', user.id);
      
      const response = await teacherAPI.getTeacherResources(user.id);
      console.log('📥 Raw API response:', response);
      
      // Handle different possible response structures
      let resourcesData = [];
      
      if (response.data) {
        // If response.data exists, check its structure
        if (response.data.resources && Array.isArray(response.data.resources)) {
          resourcesData = response.data.resources;
        } else if (Array.isArray(response.data)) {
          resourcesData = response.data;
        } else if (response.data.success && response.data.resources) {
          resourcesData = response.data.resources;
        } else {
          // If data exists but not in expected format, log it
          console.log('🔍 Unexpected response.data structure:', response.data);
          resourcesData = [];
        }
      } else if (response.resources && Array.isArray(response.resources)) {
        resourcesData = response.resources;
      } else if (Array.isArray(response)) {
        resourcesData = response;
      }
      
      console.log('✅ Processed resources data:', resourcesData);
      console.log('✅ Number of resources found:', resourcesData.length);
      setResources(resourcesData);
      
    } catch (error) {
      console.error('❌ Error loading resources:', error);
      console.log('🔄 Falling back to mock data');
      setResources(mockResources);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResource = async (resourceData) => {
    try {
      console.log('📤 Starting resource upload...');
      console.log('📋 Resource data:', resourceData);
      
      const response = await teacherAPI.uploadResource({
        ...resourceData,
        teacherId: user.id
      });
      
      console.log('✅ Upload response:', response);
      
      // Handle different response structures
      let newResource = null;
      let notificationsSent = 0;
      
      if (response.data) {
        if (response.data.resource) {
          newResource = response.data.resource;
        } else if (response.data.success) {
          // Check if success response has resource data
          newResource = response.data.resource || {
            id: Date.now().toString(),
            ...resourceData,
            createdAt: new Date().toISOString()
          };
        } else {
          // If no resource in response, create one from the uploaded data
          newResource = {
            id: Date.now().toString(), // Temporary ID
            ...resourceData,
            createdAt: new Date().toISOString()
          };
        }
        notificationsSent = response.data.notificationsSent || 0;
      } else if (response.resource) {
        newResource = response.resource;
        notificationsSent = response.notificationsSent || 0;
      } else {
        // Fallback: create resource from uploaded data
        newResource = {
          id: Date.now().toString(),
          ...resourceData,
          createdAt: new Date().toISOString()
        };
      }
      
      console.log('✅ Processed new resource:', newResource);
      
      // Add new resource to the list
      setResources(prev => [newResource, ...prev]);
      setShowUploadModal(false);
      
      // Show success message with notification count
      const message = `Resource uploaded successfully! ${notificationsSent} students have been notified.`;
      alert(message);
      
      console.log('✅ Resource upload completed successfully');
    } catch (error) {
      console.error('❌ Error uploading resource:', error);
      
      // Show specific error message if available
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Failed to upload resource: ${errorMessage}`);
    }
  };

  // Mock data for fallback
  const mockResources = [
    {
      id: '1',
      title: 'Algebra Worksheet',
      description: 'Basic algebra problems for level 3 students',
      type: 'worksheet',
      level: 3,
      subject: 'Mathematics',
      tags: ['algebra', 'worksheet'],
      fileName: 'algebra-worksheet.pdf',
      fileSize: 1024000,
      isPublic: true,
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Science Experiment Video',
      description: 'How to make a volcano',
      type: 'video',
      level: 4,
      subject: 'Science',
      tags: ['experiment', 'video'],
      fileName: 'volcano-experiment.mp4',
      fileSize: 25600000,
      isPublic: true,
      createdAt: '2024-01-14T14:20:00Z'
    }
  ];

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const levelMatch = selectedLevel === 'all' || resource.level === parseInt(selectedLevel);
    const typeMatch = selectedType === 'all' || resource.type === selectedType;
    return levelMatch && typeMatch;
  });

  const getResourceIcon = (type) => {
    const icons = {
      'worksheet': '📄',
      'video': '🎥',
      'simulation': '🔬',
      'document': '📋',
      'image': '🖼️'
    };
    return icons[type] || '📁';
  };

  const getResourceTypeColor = (type) => {
    const colors = {
      'worksheet': 'bg-blue-100 text-blue-800',
      'video': 'bg-purple-100 text-purple-800',
      'simulation': 'bg-green-100 text-green-800',
      'document': 'bg-yellow-100 text-yellow-800',
      'image': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

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

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <DashboardLayout userRole="teacher">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources</h1>
            <p className="text-gray-600">Upload and manage learning resources for your students</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            📤 Upload Resource
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Levels</option>
              {[1, 2, 3, 4, 5].map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="worksheet">Worksheets</option>
              <option value="video">Videos</option>
              <option value="simulation">Simulations</option>
              <option value="document">Documents</option>
              <option value="image">Images</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600">{resource.subject}</p>
                    </div>
                  </div>
                </div>

                {resource.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                )}

                {/* Resource Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelInfo(resource.level).color}`}>
                      Level {resource.level}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {resource.fileName && <div>File: {resource.fileName}</div>}
                    {resource.fileSize && <div>Size: {formatFileSize(resource.fileSize)}</div>}
                    <div>Uploaded: {new Date(resource.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{resource.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="btn btn-secondary text-sm flex-1">
                    Edit
                  </button>
                  <button className="btn btn-outline text-sm flex-1">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {resources.length === 0 ? 'No resources yet' : 'No resources match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {resources.length === 0 
                ? 'Upload your first learning resource to share with students!'
                : 'Try adjusting your filters to see more resources.'
              }
            </p>
            <div className="flex justify-center space-x-3">
              {resources.length === 0 && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn btn-primary"
                >
                  Upload Your First Resource
                </button>
              )}
              <button
                onClick={retryLoadResources}
                className="btn btn-secondary"
              >
                🔄 Retry Loading
              </button>
            </div>
          </div>
        )}

        {/* Upload Resource Modal */}
        {showUploadModal && (
          <UploadResourceModal
            onClose={() => setShowUploadModal(false)}
            onSubmit={handleUploadResource}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Upload Resource Modal Component
 */
function UploadResourceModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    level: '',
    subject: '',
    tags: '',
    url: '',
    fileName: ''
  });
  const [loading, setLoading] = useState(false);

  const resourceTypes = [
    { value: 'worksheet', label: 'Worksheet', icon: '📄' },
    { value: 'video', label: 'Video', icon: '🎥' },
    { value: 'simulation', label: 'Simulation', icon: '🔬' },
    { value: 'document', label: 'Document', icon: '📋' },
    { value: 'image', label: 'Image', icon: '🖼️' }
  ];

  const subjects = ['Mathematics', 'Science', 'English', 'Art', 'History', 'Geography'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.type || !formData.level || !formData.url) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate URL format
    try {
      new URL(formData.url);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        level: parseInt(formData.level),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Upload Learning Resource</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Algebra Worksheet"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              rows="3"
              placeholder="Brief description of the resource..."
            />
          </div>

          {/* Resource Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {resourceTypes.map(type => (
                <label
                  key={type.value}
                  className={`relative flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    formData.type === type.value ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                  {formData.type === type.value && (
                    <div className="absolute top-2 right-2 text-primary-500">✓</div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Level and Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select Level</option>
                {[1, 2, 3, 4, 5].map(level => {
                  const levelInfo = getLevelInfo(level);
                  return (
                    <option key={level} value={level}>
                      Level {level}: {levelInfo.title}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://example.com/resource.pdf"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste the URL where your resource is hosted (Google Drive, Dropbox, etc.)
            </p>
          </div>

          {/* File Name and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name
              </label>
              <input
                type="text"
                value={formData.fileName}
                onChange={(e) => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., algebra-worksheet.pdf"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="algebra, worksheet, practice"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate tags with commas
              </p>
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
              {loading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeacherResourcesPage; 