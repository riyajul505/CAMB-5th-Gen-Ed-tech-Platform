import { useState } from 'react';
import { simulationAPI } from '../../services/api';
import PropTypes from 'prop-types';

const CreateSimulationModal = ({ onClose, onSimulationCreated, studentId, studentLevel }) => {
  const [formData, setFormData] = useState({
    prompt: '',
    subject: '',
    preferredDuration: '30'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subjects = [
    { value: 'chemistry', label: 'Chemistry', icon: '🧪' },
    { value: 'physics', label: 'Physics', icon: '⚡' },
    { value: 'biology', label: 'Biology', icon: '🧬' },
    { value: 'earth science', label: 'Earth Science', icon: '🌍' }
  ];

  const examplePrompts = [
    "Create a titration experiment to find the concentration of an unknown acid",
    "Design a simple circuit to understand how electricity flows",
    "Explore how plants absorb water through their roots",
    "Investigate how different materials conduct heat",
    "Study the phases of mitosis in plant cells",
    "Experiment with chemical reactions that produce gases"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleExamplePromptClick = (prompt) => {
    setFormData(prev => ({
      ...prev,
      prompt: prompt
    }));
  };

  const validateForm = () => {
    if (!formData.prompt.trim()) {
      setError('Please describe what experiment you want to create');
      return false;
    }

    if (formData.prompt.length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      return false;
    }

    if (formData.prompt.length > 500) {
      setError('Description is too long. Please keep it under 500 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 CreateSimulationModal: Creating new simulation with data:', formData);

      const simulationData = {
        studentId: studentId,
        prompt: formData.prompt.trim(),
        level: studentLevel || 3,
        ...(formData.subject && { subject: formData.subject }),
        preferredDuration: parseInt(formData.preferredDuration) || 30
      };

      const response = await simulationAPI.generateSimulation(simulationData);

      if (response.data?.success) {
        console.log('✅ CreateSimulationModal: Simulation created successfully:', response.data.data.simulation);
        onSimulationCreated(response.data.data.simulation);
      } else {
        throw new Error(response.data?.message || 'Failed to create simulation');
      }

    } catch (error) {
      console.error('❌ CreateSimulationModal: Error creating simulation:', error);
      setError(error.message || 'Failed to create experiment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">✨ Create New Experiment</h2>
              <p className="text-gray-600 mt-1">
                Describe your experiment idea and we'll create a virtual lab for you!
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Experiment Description */}
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Experiment Description *
            </label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleInputChange}
              placeholder="Describe what kind of experiment you want to create..."
              rows={4}
              className="form-input resize-none"
              disabled={loading}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-500">
                Be specific about what you want to learn or explore
              </p>
              <span className="text-sm text-gray-400">
                {formData.prompt.length}/500
              </span>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              💡 Need inspiration? Try these examples:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExamplePromptClick(prompt)}
                  className="text-left p-3 bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-200 rounded-lg text-sm transition-colors"
                  disabled={loading}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="mb-6">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject (Optional)
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            >
              <option value="">Let AI choose the best subject</option>
              {subjects.map(subject => (
                <option key={subject.value} value={subject.value}>
                  {subject.icon} {subject.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Leave blank to let our AI determine the best subject based on your description
            </p>
          </div>

          {/* Preferred Duration */}
          <div className="mb-6">
            <label htmlFor="preferredDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Duration
            </label>
            <select
              id="preferredDuration"
              name="preferredDuration"
              value={formData.preferredDuration}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            >
              <option value="15">15 minutes - Quick experiment</option>
              <option value="30">30 minutes - Standard experiment</option>
              <option value="45">45 minutes - Detailed experiment</option>
              <option value="60">60 minutes - Comprehensive experiment</option>
            </select>
          </div>

          {/* Student Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📊 Your Learning Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Current Level:</span>
                <span className="ml-2 text-blue-800">Level {studentLevel || 'Not set'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Experiment Type:</span>
                <span className="ml-2 text-blue-800">Age-appropriate & Interactive</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 text-lg mr-2">⚠️</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
              disabled={loading || !formData.prompt.trim()}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Experiment...</span>
                </>
              ) : (
                <>
                  <span>🔬</span>
                  <span>Create Virtual Lab</span>
                </>
              )}
            </button>
          </div>

          {/* AI Generation Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              🤖 Our AI will analyze your description and create a personalized virtual lab experiment 
              with realistic equipment, procedures, and learning objectives tailored to your level.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateSimulationModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSimulationCreated: PropTypes.func.isRequired,
  studentId: PropTypes.string.isRequired,
  studentLevel: PropTypes.number,
};

export default CreateSimulationModal;
