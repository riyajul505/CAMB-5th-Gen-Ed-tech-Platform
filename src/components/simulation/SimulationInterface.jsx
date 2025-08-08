import { useState, useEffect, useRef } from 'react';
import { simulationAPI } from '../../services/api';
import PropTypes from 'prop-types';

const SimulationInterface = ({ simulation, onBack, onStateUpdate }) => {
  const [currentState, setCurrentState] = useState(simulation.state || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInputs, setUserInputs] = useState(simulation.state?.userInputs || {});
  const [observations, setObservations] = useState(simulation.state?.observations || []);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Auto-save timer
  const autoSaveTimer = useRef(null);
  const lastSaveTime = useRef(Date.now());

  useEffect(() => {
    // Start auto-save timer when component mounts
    startAutoSave();
    
    // Mark as started if not already started (and avoid duplicate starts)
    if (simulation.state?.status === 'not_started' && currentState.status === 'not_started') {
      console.log('🔄 SimulationInterface: Auto-starting simulation...');
      handleStartSimulation();
    } else {
      console.log('🔄 SimulationInterface: Simulation already started, status:', simulation.state?.status);
    }

    return () => {
      // Cleanup timer and save final state
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
      saveCurrentState();
    };
  }, []);

  const startAutoSave = () => {
    // Auto-save every 30 seconds
    autoSaveTimer.current = setInterval(() => {
      if (Date.now() - lastSaveTime.current > 30000) { // Only save if 30s passed
        saveCurrentState();
      }
    }, 30000);
  };

  const saveCurrentState = async (forceSave = false) => {
    if (!forceSave && Date.now() - lastSaveTime.current < 10000) {
      // Prevent too frequent saves (minimum 10s apart)
      return;
    }

    try {
      // Only include changed state data to avoid unnecessary updates
      const stateData = {
        state: {
          userInputs,
          observations,
          lastActiveAt: new Date().toISOString(),
          // Only include status, progress, currentStep if they've actually changed
          ...(currentState.progress !== simulation.state?.progress && { progress: currentState.progress }),
          ...(currentState.currentStep !== simulation.state?.currentStep && { currentStep: currentState.currentStep }),
          // Don't send status unless it's actually changing to avoid "invalid state transition" errors
          ...(currentState.status !== simulation.state?.status && { status: currentState.status })
        }
      };

      console.log('💾 SimulationInterface: Auto-saving state:', stateData);
      console.log('💾 SimulationInterface: Current simulation state:', simulation.state);
      console.log('💾 SimulationInterface: Current component state:', currentState);
      
      await simulationAPI.updateSimulationState(simulation.id, stateData);
      lastSaveTime.current = Date.now();
      
      // Update parent component
      if (onStateUpdate) {
        onStateUpdate();
      }
      
    } catch (error) {
      console.error('❌ SimulationInterface: Error saving state:', error);
      console.error('❌ SimulationInterface: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Don't show error for auto-save failures to avoid disrupting user
    }
  };

  const handleStartSimulation = async () => {
    try {
      setLoading(true);
      console.log('▶️ SimulationInterface: Starting simulation:', simulation.id);
      
      const response = await simulationAPI.startSimulation(simulation.id);
      
      if (response.data?.success) {
        setCurrentState(prev => ({
          ...prev,
          status: 'in_progress',
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        }));
        console.log('✅ SimulationInterface: Simulation started successfully');
      }
    } catch (error) {
      console.error('❌ SimulationInterface: Error starting simulation:', error);
      setError('Failed to start simulation');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSimulation = async () => {
    try {
      setLoading(true);
      await saveCurrentState(true); // Force save current progress
      
      const response = await simulationAPI.pauseSimulation(simulation.id);
      
      if (response.data?.success) {
        setCurrentState(prev => ({
          ...prev,
          status: 'paused'
        }));
        console.log('⏸️ SimulationInterface: Simulation paused');
      }
    } catch (error) {
      console.error('❌ SimulationInterface: Error pausing simulation:', error);
      setError('Failed to pause simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSimulation = async () => {
    try {
      setLoading(true);
      
      const response = await simulationAPI.resumeSimulation(simulation.id);
      
      if (response.data?.success) {
        setCurrentState(prev => ({
          ...prev,
          status: 'in_progress',
          lastActiveAt: new Date().toISOString()
        }));
        console.log('▶️ SimulationInterface: Simulation resumed');
      }
    } catch (error) {
      console.error('❌ SimulationInterface: Error resuming simulation:', error);
      setError('Failed to resume simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (stepIndex, stepData) => {
    console.log('✅ SimulationInterface: Step completed:', stepIndex, stepData);
    
    // Update progress
    const totalSteps = simulation.virtualLab?.procedure?.length || 5;
    const newProgress = Math.min(((stepIndex + 1) / totalSteps) * 100, 100);
    
    // Add observation
    const newObservation = {
      step: stepIndex + 1,
      timestamp: new Date().toISOString(),
      observation: stepData.observation || `Completed step ${stepIndex + 1}`
    };

    setCurrentState(prev => ({
      ...prev,
      currentStep: stepIndex + 1,
      progress: newProgress
    }));

    setObservations(prev => [...prev, newObservation]);
    
    // Update user inputs
    if (stepData.inputs) {
      setUserInputs(prev => ({
        ...prev,
        ...stepData.inputs
      }));
    }

    // Check if simulation is complete
    if (newProgress >= 100) {
      setShowCompletionModal(true);
    } else {
      // Auto-save progress
      saveCurrentState(true);
    }
  };

  const handleCompleteSimulation = async (finalResults) => {
    try {
      setLoading(true);
      
      console.log('🏁 SimulationInterface: Completing simulation with results:', finalResults);
      
      const response = await simulationAPI.completeSimulation(simulation.id, finalResults);
      
      if (response.data?.success) {
        setCurrentState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString()
        }));
        
        setShowCompletionModal(false);
        
        // Show success message
        alert('🎉 Congratulations! You have successfully completed the experiment!');
        
        // Return to simulation list
        onBack();
      }
    } catch (error) {
      console.error('❌ SimulationInterface: Error completing simulation:', error);
      setError('Failed to complete simulation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '⚡';
      case 'paused': return '⏸️';
      default: return '🔬';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="btn-outline flex items-center space-x-2"
            disabled={loading}
          >
            <span>←</span>
            <span>Back to Experiments</span>
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Status */}
            <div className={`flex items-center space-x-2 ${getStatusColor(currentState.status)}`}>
              <span className="text-lg">{getStatusIcon(currentState.status)}</span>
              <span className="font-medium capitalize">
                {currentState.status?.replace('_', ' ') || 'Not Started'}
              </span>
            </div>
            
            {/* Control Buttons */}
            {currentState.status === 'in_progress' && (
              <button
                onClick={handlePauseSimulation}
                className="btn-outline text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                disabled={loading}
              >
                ⏸️ Pause
              </button>
            )}
            
            {currentState.status === 'paused' && (
              <button
                onClick={handleResumeSimulation}
                className="btn-primary"
                disabled={loading}
              >
                ▶️ Resume
              </button>
            )}
          </div>
        </div>

        {/* Simulation Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {simulation.title}
              </h1>
              <p className="text-gray-600 mb-4">{simulation.description}</p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>🧪 {simulation.subject}</span>
                <span>📊 Level {simulation.level}</span>
                <span>⏱️ {simulation.estimatedDuration} minutes</span>
                <span>📈 {simulation.difficulty}</span>
              </div>
            </div>
            
            {/* Progress Circle */}
            <div className="text-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (currentState.progress || 0) / 100)}`}
                    className="text-primary-600 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {Math.round(currentState.progress || 0)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Progress</p>
            </div>
          </div>

          {/* Learning Objectives */}
          {simulation.objectives && simulation.objectives.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Learning Objectives</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {simulation.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-lg mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Backend Data Warning */}
      {!simulation.virtualLab && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-orange-500 text-lg mr-2">⚠️</span>
            <div>
              <span className="text-orange-700 font-medium">Using Demo Lab Data</span>
              <p className="text-orange-600 text-sm mt-1">
                The experiment data is incomplete from the server. We're showing a demo chemistry lab for your "Acid-Base Titration" experiment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Simulation Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Virtual Lab Equipment & Procedure */}
        <div className="lg:col-span-2">
          <VirtualLabInterface
            simulation={simulation}
            currentState={currentState}
            userInputs={userInputs}
            onStepComplete={handleStepComplete}
            disabled={currentState.status !== 'in_progress'}
          />
        </div>

        {/* Sidebar - Observations & Notes */}
        <div className="space-y-6">
          <ObservationPanel
            observations={observations}
            onAddObservation={(observation) => {
              const newObs = {
                step: currentState.currentStep || 0,
                timestamp: new Date().toISOString(),
                observation
              };
              setObservations(prev => [...prev, newObs]);
              saveCurrentState(true);
            }}
            disabled={currentState.status !== 'in_progress'}
          />
          
          <SafetyNotesPanel 
            safetyNotes={simulation.virtualLab?.safetyNotes || [
              'Wear safety goggles and lab coat at all times',
              'Handle all chemicals with care - acids and bases are corrosive',
              'Ensure the burette is properly clamped and secure',
              'Clean all glassware before and after use'
            ]}
          />
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal
          simulation={simulation}
          userInputs={userInputs}
          observations={observations}
          onComplete={handleCompleteSimulation}
          onCancel={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  );
};

// Virtual Lab Interface Component
const VirtualLabInterface = ({ simulation, currentState, userInputs, onStepComplete, disabled }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(currentState.currentStep || 0);
  const [stepInputs, setStepInputs] = useState({});

  // Debug logging
  console.log('🔬 VirtualLabInterface: simulation data:', simulation);
  console.log('🔬 VirtualLabInterface: virtualLab data:', simulation.virtualLab);

  // Fallback data when backend doesn't provide virtualLab (temporary fix)
  const fallbackVirtualLab = {
    equipment: ['Beaker', 'Burette', 'Pipette', 'Conical Flask', 'Measuring Cylinder'],
    chemicals: ['HCl (Hydrochloric Acid)', 'NaOH (Sodium Hydroxide)', 'Phenolphthalein Indicator'],
    procedure: [
      'Fill the burette with NaOH solution to the 0.00 mL mark',
      'Add 25.0 mL of the unknown HCl solution to a conical flask using a pipette',
      'Add 2-3 drops of phenolphthalein indicator to the HCl solution',
      'Place the conical flask under the burette on a white tile',
      'Begin titration by slowly adding NaOH from the burette while swirling the flask',
      'Continue adding NaOH until the solution turns from colorless to light pink',
      'Record the volume of NaOH used and repeat the titration for accuracy'
    ],
    safetyNotes: [
      'Wear safety goggles and lab coat at all times',
      'Handle all chemicals with care - acids and bases are corrosive',
      'Ensure the burette is properly clamped and secure',
      'Clean all glassware before and after use'
    ]
  };

  const procedures = simulation.virtualLab?.procedure || fallbackVirtualLab.procedure;
  const equipment = simulation.virtualLab?.equipment || fallbackVirtualLab.equipment;
  const chemicals = simulation.virtualLab?.chemicals || fallbackVirtualLab.chemicals;

  // Debug logging for arrays
  console.log('🔬 VirtualLabInterface: procedures:', procedures);
  console.log('🔬 VirtualLabInterface: equipment:', equipment);
  console.log('🔬 VirtualLabInterface: chemicals:', chemicals);
  
  // Backend issue warning
  if (!simulation.virtualLab) {
    console.warn('⚠️ BACKEND ISSUE: virtualLab data is missing from simulation object');
    console.warn('⚠️ Using fallback data for demonstration purposes');
  }

  const handleStepInput = (key, value) => {
    setStepInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCompleteCurrentStep = () => {
    const stepData = {
      inputs: stepInputs,
      observation: stepInputs.observation || `Completed step ${currentStepIndex + 1}`
    };
    
    onStepComplete(currentStepIndex, stepData);
    setCurrentStepIndex(prev => prev + 1);
    setStepInputs({});
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">🧪 Virtual Laboratory</h2>
      
      {/* Equipment Display */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">🔬 Available Equipment</h3>
        {equipment.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {equipment.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl mb-1">⚗️</div>
                <div className="text-sm text-gray-700">{item}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              ⚠️ Equipment data is being loaded from the server. Please refresh if this persists.
            </p>
          </div>
        )}
      </div>

      {/* Chemicals Display */}
      {chemicals.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">🧪 Chemicals & Materials</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {chemicals.map((chemical, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl mb-1">🧪</div>
                <div className="text-sm text-gray-700">{chemical}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Procedure Steps */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">📋 Procedure</h3>
        {procedures.length > 0 ? (
          <div className="space-y-4">
            {procedures.map((step, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                index === currentStepIndex
                  ? 'border-primary-300 bg-primary-50'
                  : index < currentStepIndex
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === currentStepIndex
                    ? 'bg-primary-600 text-white'
                    : index < currentStepIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{step}</p>
                  
                  {/* Current Step Inputs */}
                  {index === currentStepIndex && !disabled && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Observation:
                        </label>
                        <textarea
                          value={stepInputs.observation || ''}
                          onChange={(e) => handleStepInput('observation', e.target.value)}
                          placeholder="Describe what you observed during this step..."
                          rows={2}
                          className="form-input text-sm"
                        />
                      </div>
                      
                      <button
                        onClick={handleCompleteCurrentStep}
                        className="btn-primary text-sm"
                        disabled={!stepInputs.observation?.trim()}
                      >
                        Complete Step {index + 1}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              ⚠️ Experiment procedure is being loaded from the server. Please refresh if this persists.
            </p>
            <div className="mt-3">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Observation Panel Component
const ObservationPanel = ({ observations, onAddObservation, disabled }) => {
  const [newObservation, setNewObservation] = useState('');

  const handleAddObservation = () => {
    if (newObservation.trim()) {
      onAddObservation(newObservation.trim());
      setNewObservation('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">📝 Lab Notes & Observations</h3>
      
      {/* Add New Observation */}
      {!disabled && (
        <div className="mb-4">
          <textarea
            value={newObservation}
            onChange={(e) => setNewObservation(e.target.value)}
            placeholder="Add your observation..."
            rows={3}
            className="form-input text-sm mb-2"
          />
          <button
            onClick={handleAddObservation}
            className="btn-primary text-sm w-full"
            disabled={!newObservation.trim()}
          >
            Add Note
          </button>
        </div>
      )}

      {/* Observations List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {observations.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No observations yet</p>
        ) : (
          observations.map((obs, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  Step {obs.step}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(obs.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-800">{obs.observation}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Safety Notes Panel Component
const SafetyNotesPanel = ({ safetyNotes }) => {
  if (!safetyNotes || safetyNotes.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
        <span className="mr-2">⚠️</span>
        Safety Guidelines
      </h3>
      <ul className="space-y-2">
        {safetyNotes.map((note, index) => (
          <li key={index} className="text-sm text-yellow-700 flex items-start">
            <span className="mr-2 mt-0.5">•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Completion Modal Component
const CompletionModal = ({ simulation, userInputs, observations, onComplete, onCancel }) => {
  const [finalResults, setFinalResults] = useState({
    accuracy: 85,
    finalObservations: '',
    learningObjectivesMet: []
  });

  const handleComplete = () => {
    const results = {
      ...finalResults,
      timeSpent: Math.round((Date.now() - new Date(simulation.state?.startedAt || Date.now()).getTime()) / 60000),
      stepsCompleted: simulation.virtualLab?.procedure?.length || 0,
      totalSteps: simulation.virtualLab?.procedure?.length || 0
    };
    
    onComplete(results);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🎉 Complete Experiment
          </h3>
          
          <p className="text-gray-600 mb-4">
            Congratulations! You've finished all the steps. Please provide your final observations.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Observations:
            </label>
            <textarea
              value={finalResults.finalObservations}
              onChange={(e) => setFinalResults(prev => ({ ...prev, finalObservations: e.target.value }))}
              placeholder="Summarize what you learned from this experiment..."
              rows={4}
              className="form-input"
            />
          </div>

          <div className="flex space-x-3">
            <button onClick={onCancel} className="btn-outline flex-1">
              Continue Working
            </button>
            <button 
              onClick={handleComplete}
              className="btn-primary flex-1"
              disabled={!finalResults.finalObservations.trim()}
            >
              Complete Experiment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// PropTypes
VirtualLabInterface.propTypes = {
  simulation: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
  userInputs: PropTypes.object.isRequired,
  onStepComplete: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ObservationPanel.propTypes = {
  observations: PropTypes.array.isRequired,
  onAddObservation: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

SafetyNotesPanel.propTypes = {
  safetyNotes: PropTypes.array
};

CompletionModal.propTypes = {
  simulation: PropTypes.object.isRequired,
  userInputs: PropTypes.object.isRequired,
  observations: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

SimulationInterface.propTypes = {
  simulation: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onStateUpdate: PropTypes.func.isRequired,
};

export default SimulationInterface;
