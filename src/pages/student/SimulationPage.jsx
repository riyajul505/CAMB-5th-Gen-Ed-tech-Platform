import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { simulationAPI } from '../../services/api';
import CreateSimulationModal from '../../components/simulation/CreateSimulationModal';
import SimulationInterface from '../../components/simulation/SimulationInterface';
import GameifiedSimulationInterface from '../../components/simulation/GameifiedSimulationInterface';
import PromptGameInterface from '../../components/simulation/PromptGameInterface';
import PropTypes from 'prop-types';

const SimulationPage = () => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [gameMode, setGameMode] = useState(true); // true = gamified, false = classic
  const [showCustomGame, setShowCustomGame] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    paused: 0,
    completed: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    subject: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchSimulations();
    }
  }, [user?.id, currentPage, filters]);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 SimulationPage: Fetching simulations for student:', user.id);

      const options = {
        page: currentPage,
        limit: 6, // Show 6 simulations per page
        ...(filters.status && { status: filters.status }),
        ...(filters.subject && { subject: filters.subject })
      };

      const response = await simulationAPI.getStudentSimulations(user.id, options);
      
      if (response.data?.success) {
        setSimulations(response.data.data.simulations || []);
        setStats(response.data.data.stats || stats);
        
        const pagination = response.data.data.pagination || {};
        setTotalPages(pagination.totalPages || 1);
        
        console.log('✅ SimulationPage: Simulations loaded:', response.data.data);
      } else {
        throw new Error('Failed to fetch simulations');
      }
    } catch (error) {
      console.error('❌ SimulationPage: Error fetching simulations:', error);
      setError(error.message || 'Failed to load simulations');
      setSimulations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSimulation = () => {
    setShowCreateModal(true);
  };

  const handleCreateCustomGame = () => {
    console.log('🎮 Opening custom game interface from simulation list');
    setShowCustomGame(true);
  };

  const handleBackFromCustomGame = () => {
    console.log('🔬 Returning to simulation list from custom game');
    setShowCustomGame(false);
  };

  const handleSimulationCreated = (newSimulation) => {
    console.log('🎉 SimulationPage: New simulation created:', newSimulation);
    setShowCreateModal(false);
    setSelectedSimulation(newSimulation);
    // Refresh the list
    fetchSimulations();
  };

  const handleSimulationSelect = (simulation) => {
    console.log('🔬 SimulationPage: Selected simulation:', simulation);
    setSelectedSimulation(simulation);
  };

  const handleBackToList = () => {
    setSelectedSimulation(null);
    // Refresh the list to get updated states
    fetchSimulations();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '⚡';
      case 'paused': return '⏸️';
      case 'not_started': return '🔬';
      default: return '🔬';
    }
  };

  const getSubjectIcon = (subject) => {
    switch (subject?.toLowerCase()) {
      case 'chemistry': return '🧪';
      case 'physics': return '⚡';
      case 'biology': return '🧬';
      case 'earth science': return '🌍';
      default: return '🔬';
    }
  };

  // Show custom game interface if requested
  if (showCustomGame) {
    return (
      <PromptGameInterface 
        simulation={{
          title: 'Custom Science Game',
          subject: 'Science',
          level: user?.selectedLevel || 1,
          description: 'Create your own interactive science game'
        }}
        onBack={handleBackFromCustomGame}
        user={user}
      />
    );
  }

  if (selectedSimulation) {
    return gameMode ? (
      <GameifiedSimulationInterface 
        simulation={selectedSimulation}
        onBack={handleBackToList}
        onStateUpdate={fetchSimulations}
      />
    ) : (
      <SimulationInterface 
        simulation={selectedSimulation}
        onBack={handleBackToList}
        onStateUpdate={fetchSimulations}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔬 Virtual Science Lab
            </h1>
            <p className="text-gray-600">
              Create and explore interactive science experiments tailored to your learning level
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Mode:</span>
              <button
                onClick={() => setGameMode(!gameMode)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  gameMode 
                    ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {gameMode ? '🎮 Game Mode' : '📋 Classic Mode'}
              </button>
            </div>
            
            <button
              onClick={handleCreateCustomGame}
              className="btn-outline text-purple-600 border-purple-300 hover:bg-purple-50 flex items-center space-x-2"
            >
              <span>🎮</span>
              <span>Create Custom Game</span>
            </button>
            
            <button
              onClick={handleCreateNewSimulation}
              className="btn-primary flex items-center space-x-2"
            >
              <span>✨</span>
              <span>Create New Experiment</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Experiments</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
            <div className="text-sm text-gray-600">Paused</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="form-input"
          >
            <option value="">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.subject}
            onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
            className="form-input"
          >
            <option value="">All Subjects</option>
            <option value="chemistry">Chemistry</option>
            <option value="physics">Physics</option>
            <option value="biology">Biology</option>
            <option value="earth science">Earth Science</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your experiments...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Experiments</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchSimulations}
            className="mt-4 btn-outline text-red-600 border-red-300 hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && simulations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Experiments Yet</h3>
          <p className="text-gray-600 mb-6">
            Start your scientific journey by creating your first virtual lab experiment!
          </p>
          <button
            onClick={handleCreateNewSimulation}
            className="btn-primary"
          >
            ✨ Create Your First Experiment
          </button>
        </div>
      )}

      {/* Simulations Grid */}
      {!loading && !error && simulations.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {simulations.map((simulation) => (
              <SimulationCard
                key={simulation.id}
                simulation={simulation}
                onSelect={handleSimulationSelect}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getSubjectIcon={getSubjectIcon}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Simulation Modal */}
      {showCreateModal && (
        <CreateSimulationModal
          onClose={() => setShowCreateModal(false)}
          onSimulationCreated={handleSimulationCreated}
          studentId={user?.id}
          studentLevel={user?.selectedLevel}
        />
      )}
    </div>
  );
};

// Simulation Card Component
const SimulationCard = ({ simulation, onSelect, getStatusColor, getStatusIcon, getSubjectIcon }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => onSelect(simulation)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getSubjectIcon(simulation.subject)}</span>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {simulation.title}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {simulation.subject} • Level {simulation.level}
              </p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(simulation.state?.status)}`}>
            <span className="mr-1">{getStatusIcon(simulation.state?.status)}</span>
            {simulation.state?.status?.replace('_', ' ')}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {simulation.description}
        </p>

        {/* Progress Bar */}
        {simulation.state?.progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{simulation.state.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${simulation.state.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>⏱️ {formatDuration(simulation.estimatedDuration)}</span>
            <span className="capitalize">📊 {simulation.difficulty}</span>
          </div>
          <span>{formatDate(simulation.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

SimulationCard.propTypes = {
  simulation: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusIcon: PropTypes.func.isRequired,
  getSubjectIcon: PropTypes.func.isRequired,
};



export default SimulationPage;
