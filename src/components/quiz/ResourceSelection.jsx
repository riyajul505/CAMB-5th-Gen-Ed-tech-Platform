import PropTypes from 'prop-types';

/**
 * Resource Selection Component for Quiz
 * Displays available resources for students to select for quiz generation
 */
function ResourceSelection({ resources, loading, onResourceSelect, selectedLevel }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card card-padding animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📚</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources Available</h3>
        <p className="text-gray-600 mb-4">
          There are no study materials available for Level {selectedLevel} yet.
        </p>
        <p className="text-sm text-gray-500">
          Check back later or contact your teacher for more resources.
        </p>
      </div>
    );
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case 'worksheet': return '📄';
      case 'video': return '🎥';
      case 'simulation': return '🧪';
      case 'document': return '📖';
      case 'image': return '🖼️';
      default: return '📚';
    }
  };

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'worksheet': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'video': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'simulation': return 'bg-green-50 text-green-600 border-green-200';
      case 'document': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'image': return 'bg-pink-50 text-pink-600 border-pink-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          📚 Available Study Materials (Level {selectedLevel})
        </h2>
        <p className="text-gray-600">
          Select a resource to generate an AI-powered quiz based on its content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="card card-padding hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => onResourceSelect(resource)}
          >
            {/* Resource Preview */}
            <div className="mb-4">
              <div className="h-32 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center group-hover:from-primary-100 group-hover:to-secondary-100 transition-all duration-200">
                <div className="text-center">
                  <span className="text-4xl mb-2 block">{getResourceIcon(resource.type)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResourceTypeColor(resource.type)}`}>
                    {resource.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Resource Info */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                {resource.description || 'Click to generate quiz from this content'}
              </p>
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {resource.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{resource.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <button className="w-full btn-primary group-hover:bg-primary-600 transition-colors">
              <span className="mr-2">🧠</span>
              Generate Quiz
            </button>

            {/* Additional Info */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Level {resource.level || selectedLevel}</span>
              {resource.createdAt && (
                <span>Added {new Date(resource.createdAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Quiz Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• AI will generate 5-10 questions based on the selected content</li>
          <li>• You can get instant explanations for wrong answers</li>
          <li>• Complete quizzes to unlock achievements and track your progress</li>
          <li>• Higher scores unlock special rewards!</li>
        </ul>
      </div>
    </div>
  );
}

ResourceSelection.propTypes = {
  resources: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onResourceSelect: PropTypes.func.isRequired,
  selectedLevel: PropTypes.number.isRequired,
};

export default ResourceSelection; 