import { useState, useEffect, useRef } from 'react';
import { simulationAPI } from '../../services/api';
import { geminiGameAPI } from '../../services/geminiGameAPI';
import PromptGameInterface from './PromptGameInterface';
import PropTypes from 'prop-types';

const GameifiedSimulationInterface = ({ simulation, onBack, onStateUpdate }) => {
  const [currentState, setCurrentState] = useState(simulation.state || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState({
    currentAction: null,
    selectedEquipment: [],
    mixedSolutions: [],
    observations: [],
    score: 0,
    hints: [],
    achievements: []
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [gameInstructions, setGameInstructions] = useState('');
  const [showPromptGame, setShowPromptGame] = useState(false);
  
  // Auto-save timer
  const autoSaveTimer = useRef(null);
  const lastSaveTime = useRef(Date.now());

  useEffect(() => {
    // Start auto-save timer when component mounts
    startAutoSave();
    
    // Load game instructions first
    loadGameInstructions();
    
    // Initialize game state based on current status
    if (simulation.state?.status === 'not_started' || !simulation.state?.status) {
      console.log('🎮 GameifiedSimulation: Auto-starting and initializing new game...');
      handleStartSimulation();
    } else if (simulation.state?.status === 'in_progress' || simulation.state?.status === 'paused') {
      console.log('🔄 GameifiedSimulation: Loading existing game state...');
      // Load existing game state and ensure equipment is available
      const existingGameState = simulation.state?.gameState || {};
      setGameState(prev => ({
        ...prev,
        ...existingGameState,
        // Ensure equipment is available even for resumed games
        ...((!existingGameState.availableEquipment || existingGameState.availableEquipment.length === 0) && {
          availableEquipment: [],
          availableChemicals: []
        })
      }));
      
      // If no equipment loaded, reinitialize
      if (!existingGameState.availableEquipment || existingGameState.availableEquipment.length === 0) {
        console.log('⚠️ No equipment in existing state, reinitializing...');
        initializeGameExperiment();
      }
    } else {
      console.log('✅ GameifiedSimulation: Loading completed game state...');
      setGameState(simulation.state?.gameState || {});
    }

    return () => {
      // Cleanup timer and save final state
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
      saveCurrentState();
    };
  }, [simulation.id]);

  const startAutoSave = () => {
    // Auto-save every 30 seconds
    autoSaveTimer.current = setInterval(() => {
      if (Date.now() - lastSaveTime.current > 30000) {
        saveCurrentState();
      }
    }, 30000);
  };

  const saveCurrentState = async (forceSave = false) => {
    if (!forceSave && Date.now() - lastSaveTime.current < 10000) {
      return;
    }

    try {
      const stateData = {
        state: {
          gameState,
          observations: gameState.observations,
          lastActiveAt: new Date().toISOString(),
          ...(currentState.progress !== simulation.state?.progress && { progress: currentState.progress }),
          ...(currentState.currentStep !== simulation.state?.currentStep && { currentStep: currentState.currentStep }),
          ...(currentState.status !== simulation.state?.status && { status: currentState.status })
        }
      };

      console.log('💾 GameifiedSimulation: Auto-saving game state:', stateData);
      
      await simulationAPI.updateSimulationState(simulation.id, stateData);
      lastSaveTime.current = Date.now();
      
      if (onStateUpdate) {
        onStateUpdate();
      }
      
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error saving state:', error);
    }
  };

  const loadGameInstructions = async () => {
    try {
      setLoading(true);
      console.log('📖 Loading game instructions for:', simulation.title);
      
      const instructions = await geminiGameAPI.generateGameInstructions({
        experimentTitle: simulation.title || 'Interactive Science Experiment',
        experimentType: simulation.subject || 'Science',
        level: simulation.level || 1,
        description: simulation.description || 'Interactive learning experiment'
      });
      
      setGameInstructions(instructions);
      console.log('✅ Game instructions loaded successfully');
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error loading game instructions:', error);
      setGameInstructions(`Welcome to your interactive ${simulation.title || 'science experiment'}! Drag equipment from the left panel to workspace zones, mix chemicals safely, and follow the experimental steps. Score points by making correct observations! 🧪✨`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    try {
      setLoading(true);
      console.log('▶️ GameifiedSimulation: Starting interactive simulation:', simulation.id);
      
      const response = await simulationAPI.startSimulation(simulation.id);
      
      if (response.data?.success) {
        setCurrentState(prev => ({
          ...prev,
          status: 'in_progress',
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        }));
        
        // Initialize game with Gemini
        await initializeGameExperiment();
        
        console.log('✅ GameifiedSimulation: Interactive simulation started successfully');
      }
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error starting simulation:', error);
      setError('Failed to start interactive simulation');
    } finally {
      setLoading(false);
    }
  };

  const initializeGameExperiment = async () => {
    try {
      console.log('🎮 GameifiedSimulation: Initializing game experiment for:', {
        title: simulation.title,
        subject: simulation.subject,
        level: simulation.level,
        hasVirtualLab: !!simulation.virtualLab
      });

      // First, try to use existing virtualLab data if available
      let gameSetup;
      if (simulation.virtualLab && simulation.virtualLab.equipment && simulation.virtualLab.equipment.length > 0) {
        console.log('✅ Using existing virtualLab data from simulation');
        gameSetup = {
          availableEquipment: simulation.virtualLab.equipment || [],
          availableChemicals: simulation.virtualLab.chemicals || [],
          gameObjectives: simulation.virtualLab.objectives || [
            `Complete the ${simulation.title} experiment safely`,
            'Make accurate observations',
            'Follow proper laboratory procedures'
          ],
          scoringCriteria: {
            correctAction: 10,
            observation: 5,
            completion: 50
          }
        };
      } else {
        // Fallback to AI generation or static data
        console.log('⚠️ No virtualLab data found, generating with AI/fallback');
        gameSetup = await geminiGameAPI.initializeExperiment({
          title: simulation.title,
          description: simulation.description,
          subject: simulation.subject,
          level: simulation.level
        });
      }

      console.log('🔬 Game setup initialized:', {
        equipmentCount: gameSetup.availableEquipment?.length || 0,
        chemicalCount: gameSetup.availableChemicals?.length || 0,
        objectivesCount: gameSetup.gameObjectives?.length || 0
      });

      setGameState(prev => ({
        ...prev,
        ...gameSetup,
        score: 0,
        observations: [],
        workspaceContents: {
          beaker: [],
          burette: [],
          measuring: [],
          observation: []
        }
      }));
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error initializing game:', error);
      // Use absolute fallback
      setGameState(prev => ({
        ...prev,
        availableEquipment: [
          { id: 'beaker', name: 'Beaker', description: 'For holding liquids', icon: '🥃', category: 'glassware' },
          { id: 'pipette', name: 'Pipette', description: 'For measuring volumes', icon: '💉', category: 'tools' },
          { id: 'thermometer', name: 'Thermometer', description: 'For temperature', icon: '🌡️', category: 'tools' }
        ],
        availableChemicals: [
          { id: 'water', name: 'Water', concentration: 'Pure', hazard: 'safe', color: 'clear', icon: '💧' }
        ],
        gameObjectives: [`Complete the ${simulation.title} experiment`],
        scoringCriteria: { correctAction: 10, observation: 5, completion: 50 },
        score: 0,
        observations: [],
        workspaceContents: { beaker: [], burette: [], measuring: [], observation: [] }
      }));
    }
  };

  const handleEquipmentDrag = (equipment) => {
    setDraggedItem(equipment);
  };

  const handleEquipmentDrop = async (targetZone) => {
    if (!draggedItem) return;

    try {
      setLoading(true);
      
      const actionResult = await geminiGameAPI.processGameAction({
        action: 'use_equipment',
        equipment: draggedItem,
        target: targetZone,
        currentGameState: gameState,
        experimentContext: {
          title: simulation.title,
          subject: simulation.subject,
          level: simulation.level
        }
      });

      // Update game state based on Gemini response
      setGameState(prev => ({
        ...prev,
        selectedEquipment: [...prev.selectedEquipment, draggedItem],
        currentAction: actionResult.actionDescription,
        score: prev.score + (actionResult.scoreGain || 0),
        hints: actionResult.hints || prev.hints,
        observations: [...prev.observations, {
          timestamp: new Date().toISOString(),
          action: `Used ${draggedItem.name} on ${targetZone}`,
          result: actionResult.result,
          scientificExplanation: actionResult.explanation
        }]
      }));

      // Update progress
      const newProgress = calculateProgress();
      setCurrentState(prev => ({
        ...prev,
        progress: newProgress,
        currentStep: Math.floor(newProgress / 20) // Each 20% = 1 step
      }));

      // Check for completion
      if (actionResult.experimentComplete) {
        setShowCompletionModal(true);
      }

      // Auto-save after action
      saveCurrentState(true);

    } catch (error) {
      console.error('❌ GameifiedSimulation: Error processing game action:', error);
      setError('Failed to process your action. Please try again.');
    } finally {
      setLoading(false);
      setDraggedItem(null);
    }
  };

  const handleChemicalMixing = async (chemical1, chemical2) => {
    try {
      setLoading(true);
      
      const mixingResult = await geminiGameAPI.processChemicalMixing({
        chemical1,
        chemical2,
        currentGameState: gameState,
        experimentContext: {
          title: simulation.title,
          subject: simulation.subject,
          level: simulation.level
        }
      });

      setGameState(prev => ({
        ...prev,
        mixedSolutions: [...prev.mixedSolutions, {
          id: Date.now(),
          components: [chemical1, chemical2],
          result: mixingResult.resultSolution,
          visualEffect: mixingResult.visualEffect,
          timestamp: new Date().toISOString()
        }],
        score: prev.score + (mixingResult.scoreGain || 0),
        observations: [...prev.observations, {
          timestamp: new Date().toISOString(),
          action: `Mixed ${chemical1.name} with ${chemical2.name}`,
          result: mixingResult.result,
          scientificExplanation: mixingResult.explanation,
          visualEffect: mixingResult.visualEffect
        }]
      }));

      // Auto-save after mixing
      saveCurrentState(true);

    } catch (error) {
      console.error('❌ GameifiedSimulation: Error processing chemical mixing:', error);
      setError('Failed to mix chemicals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    try {
      const hint = await geminiGameAPI.generateHint({
        currentGameState: gameState,
        experimentContext: {
          title: simulation.title,
          subject: simulation.subject,
          level: simulation.level
        }
      });

      setGameState(prev => ({
        ...prev,
        hints: [...prev.hints, {
          id: Date.now(),
          text: hint.text,
          type: hint.type,
          timestamp: new Date().toISOString()
        }]
      }));
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error getting hint:', error);
    }
  };

  const calculateProgress = () => {
    const totalPossibleActions = 10; // This could be dynamic based on experiment
    const completedActions = gameState.selectedEquipment.length + gameState.mixedSolutions.length;
    return Math.min((completedActions / totalPossibleActions) * 100, 100);
  };

  const handlePauseSimulation = async () => {
    try {
      setLoading(true);
      await saveCurrentState(true);
      
      const response = await simulationAPI.pauseSimulation(simulation.id);
      
      if (response.data?.success) {
        setCurrentState(prev => ({
          ...prev,
          status: 'paused'
        }));
        console.log('⏸️ GameifiedSimulation: Interactive simulation paused');
      }
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error pausing simulation:', error);
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
        console.log('▶️ GameifiedSimulation: Interactive simulation resumed');
      }
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error resuming simulation:', error);
      setError('Failed to resume simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSimulation = async (finalResults) => {
    try {
      setLoading(true);
      
      const response = await simulationAPI.completeSimulation(simulation.id, {
        ...finalResults,
        gameResults: {
          finalScore: gameState.score,
          actionsCompleted: gameState.selectedEquipment.length + gameState.mixedSolutions.length,
          observationsMade: gameState.observations.length,
          hintsUsed: gameState.hints.length
        }
      });
      
      if (response.data?.success) {
        setCurrentState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString()
        }));
        
        setShowCompletionModal(false);
        alert('🎉 Congratulations! You have successfully completed the interactive experiment!');
        onBack();
      }
    } catch (error) {
      console.error('❌ GameifiedSimulation: Error completing simulation:', error);
      setError('Failed to complete simulation');
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to prompt game interface
  const handleShowPromptGame = () => {
    console.log('🎮 Switching to prompt game interface');
    setShowPromptGame(true);
  };

  const handleBackFromPromptGame = () => {
    console.log('🔬 Returning to simulation interface');
    setShowPromptGame(false);
  };

  // If showing prompt game, unmount current simulation and show prompt interface
  if (showPromptGame) {
    return (
      <PromptGameInterface 
        simulation={simulation}
        onBack={handleBackFromPromptGame}
        user={{ selectedLevel: simulation.level || 1, ...simulation }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Game Header */}
      <GameHeader 
        simulation={simulation}
        currentState={currentState}
        gameState={gameState}
        onBack={onBack}
        onPause={handlePauseSimulation}
        onResume={handleResumeSimulation}
        onShowPromptGame={handleShowPromptGame}
        loading={loading}
      />

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

      {/* Game Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">🎮 How to Play</h3>
        <p className="text-blue-800 text-sm">{gameInstructions}</p>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Equipment Panel */}
        <div className="xl:col-span-1">
          <EquipmentPanel 
            equipment={gameState.availableEquipment || []}
            selectedEquipment={gameState.selectedEquipment}
            onEquipmentDrag={handleEquipmentDrag}
            disabled={currentState.status !== 'in_progress'}
          />
        </div>

        {/* Virtual Lab Workspace */}
        <div className="xl:col-span-2">
          <VirtualLabWorkspace 
            gameState={gameState}
            onEquipmentDrop={handleEquipmentDrop}
            onChemicalMixing={handleChemicalMixing}
            draggedItem={draggedItem}
            disabled={currentState.status !== 'in_progress'}
          />
        </div>

        {/* Game Progress & Observations */}
        <div className="xl:col-span-1">
          <GameProgressPanel 
            gameState={gameState}
            currentState={currentState}
            onGetHint={handleGetHint}
            disabled={currentState.status !== 'in_progress'}
          />
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <GameCompletionModal 
          gameState={gameState}
          simulation={simulation}
          onComplete={handleCompleteSimulation}
          onCancel={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  );
};

// Game Header Component
const GameHeader = ({ simulation, currentState, gameState, onBack, onPause, onResume, onShowPromptGame, loading }) => {
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
      case 'in_progress': return '🎮';
      case 'paused': return '⏸️';
      default: return '🔬';
    }
  };

  return (
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
        
        <div className="flex items-center space-x-6">
          {/* Game Score */}
          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-lg">
            <span className="text-yellow-600">🏆</span>
            <span className="font-semibold text-yellow-800">Score: {gameState.score || 0}</span>
          </div>

          {/* Status */}
          <div className={`flex items-center space-x-2 ${getStatusColor(currentState.status)}`}>
            <span className="text-lg">{getStatusIcon(currentState.status)}</span>
            <span className="font-medium capitalize">
              {currentState.status?.replace('_', ' ') || 'Not Started'}
            </span>
          </div>
          
          {/* Control Buttons */}
          <button
            onClick={onShowPromptGame}
            className="btn-outline text-purple-600 border-purple-300 hover:bg-purple-50"
            disabled={loading}
          >
            ✨ Create Custom Game
          </button>
          
          {currentState.status === 'in_progress' && (
            <button
              onClick={onPause}
              className="btn-outline text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              disabled={loading}
            >
              ⏸️ Pause Game
            </button>
          )}
          
          {currentState.status === 'paused' && (
            <button
              onClick={onResume}
              className="btn-primary"
              disabled={loading}
            >
              ▶️ Resume Game
            </button>
          )}
        </div>
      </div>

      {/* Experiment Info */}
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎮 {simulation.title || 'Interactive Science Experiment'}
            </h1>
            <p className="text-gray-600 mb-4">
              {simulation.description || 'Explore interactive science through hands-on experimentation'}
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>🧪 {simulation.subject || 'Science'}</span>
              <span>📊 Level {simulation.level || 1}</span>
              <span>⏱️ {simulation.estimatedDuration || 30} minutes</span>
              <span>🎯 Interactive Mode</span>
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
      </div>
    </div>
  );
};

// Equipment Panel Component
const EquipmentPanel = ({ equipment, selectedEquipment, onEquipmentDrag, disabled }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🔬</span>
        Lab Equipment
      </h3>
      
      <div className="space-y-3">
        {equipment.map((item, index) => (
          <EquipmentItem 
            key={index}
            item={item}
            isSelected={selectedEquipment.some(eq => eq.id === item.id)}
            onDrag={onEquipmentDrag}
            disabled={disabled}
          />
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔬</div>
          <p className="text-sm">Loading lab equipment...</p>
          <p className="text-xs mt-1 text-gray-400">
            {disabled ? 'Start experiment to access equipment' : 'Equipment will appear shortly'}
          </p>
        </div>
      )}
    </div>
  );
};

// Equipment Item Component
const EquipmentItem = ({ item, isSelected, onDrag, disabled }) => {
  return (
    <div
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-green-300 bg-green-50 text-green-800' 
          : disabled
          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50'
      }`}
      draggable={!disabled}
      onDragStart={() => !disabled && onDrag(item)}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{item.icon || '⚗️'}</div>
        <div>
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-gray-500">{item.description}</div>
        </div>
      </div>
    </div>
  );
};

// Virtual Lab Workspace Component
const VirtualLabWorkspace = ({ gameState, onEquipmentDrop, onChemicalMixing, draggedItem, disabled }) => {
  const [dragOver, setDragOver] = useState(null);

  const handleDragOver = (e, zone) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(zone);
    }
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e, zone) => {
    e.preventDefault();
    setDragOver(null);
    if (!disabled) {
      onEquipmentDrop(zone);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🧪</span>
        Interactive Lab Workspace
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Beaker Zone */}
        <DropZone 
          id="beaker"
          title="Beaker"
          icon="🍺"
          description="Drop equipment or chemicals here"
          dragOver={dragOver === 'beaker'}
          onDragOver={(e) => handleDragOver(e, 'beaker')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'beaker')}
          contents={gameState.workspaceContents?.beaker || []}
        />

        {/* Burette Zone */}
        <DropZone 
          id="burette"
          title="Burette Stand"
          icon="🧪"
          description="Set up titration equipment"
          dragOver={dragOver === 'burette'}
          onDragOver={(e) => handleDragOver(e, 'burette')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'burette')}
          contents={gameState.workspaceContents?.burette || []}
        />

        {/* Measuring Zone */}
        <DropZone 
          id="measuring"
          title="Measuring Area"
          icon="📏"
          description="Measure volumes and concentrations"
          dragOver={dragOver === 'measuring'}
          onDragOver={(e) => handleDragOver(e, 'measuring')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'measuring')}
          contents={gameState.workspaceContents?.measuring || []}
        />

        {/* Observation Zone */}
        <DropZone 
          id="observation"
          title="Observation Deck"
          icon="👁️"
          description="Record your observations"
          dragOver={dragOver === 'observation'}
          onDragOver={(e) => handleDragOver(e, 'observation')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'observation')}
          contents={gameState.workspaceContents?.observation || []}
        />
      </div>

      {/* Current Action Display */}
      {gameState.currentAction && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current Action:</h4>
          <p className="text-blue-800 text-sm">{gameState.currentAction}</p>
        </div>
      )}
    </div>
  );
};

// Drop Zone Component
const DropZone = ({ id, title, icon, description, dragOver, onDragOver, onDragLeave, onDrop, contents }) => {
  return (
    <div
      className={`p-6 border-2 border-dashed rounded-lg text-center transition-all duration-200 ${
        dragOver 
          ? 'border-primary-400 bg-primary-50' 
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      
      {contents.length > 0 && (
        <div className="space-y-1">
          {contents.map((item, index) => (
            <div key={index} className="text-xs bg-white px-2 py-1 rounded border">
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Game Progress Panel Component
const GameProgressPanel = ({ gameState, currentState, onGetHint, disabled }) => {
  return (
    <div className="space-y-4">
      {/* Score & Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">🎯 Game Progress</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Score:</span>
            <span className="font-bold text-primary-600">{gameState.score || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Actions:</span>
            <span className="font-medium">{(gameState.selectedEquipment?.length || 0) + (gameState.mixedSolutions?.length || 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Observations:</span>
            <span className="font-medium">{gameState.observations?.length || 0}</span>
          </div>
        </div>

        {!disabled && (
          <button
            onClick={onGetHint}
            className="w-full mt-3 btn-outline text-sm"
          >
            💡 Get Hint
          </button>
        )}
      </div>

      {/* Recent Hints */}
      {gameState.hints && gameState.hints.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Hints</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {gameState.hints.slice(-3).map((hint, index) => (
              <div key={hint.id || index} className="p-2 bg-yellow-50 rounded text-sm">
                {hint.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Observations */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">📝 Observations</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {gameState.observations && gameState.observations.length > 0 ? (
            gameState.observations.slice(-5).map((obs, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium text-gray-900">{obs.action}</div>
                <div className="text-gray-600 text-xs">{obs.result}</div>
                {obs.visualEffect && (
                  <div className="text-purple-600 text-xs mt-1">
                    ✨ {obs.visualEffect}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No observations yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Game Completion Modal Component
const GameCompletionModal = ({ gameState, simulation, onComplete, onCancel }) => {
  const [finalObservations, setFinalObservations] = useState('');

  const handleComplete = () => {
    const results = {
      accuracy: Math.min((gameState.score / 100) * 100, 100),
      finalObservations,
      gameScore: gameState.score,
      actionsCompleted: (gameState.selectedEquipment?.length || 0) + (gameState.mixedSolutions?.length || 0),
      observationsMade: gameState.observations?.length || 0,
      hintsUsed: gameState.hints?.length || 0,
      timeSpent: Math.round((Date.now() - new Date(simulation.state?.startedAt || Date.now()).getTime()) / 60000)
    };
    
    onComplete(results);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🎉 Experiment Complete!
          </h3>
          
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Final Score:</span>
                <div className="text-2xl font-bold text-green-800">{gameState.score}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Actions:</span>
                <div className="text-2xl font-bold text-green-800">
                  {(gameState.selectedEquipment?.length || 0) + (gameState.mixedSolutions?.length || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Observations:
            </label>
            <textarea
              value={finalObservations}
              onChange={(e) => setFinalObservations(e.target.value)}
              placeholder="What did you learn from this interactive experiment?"
              rows={4}
              className="form-input"
            />
          </div>

          <div className="flex space-x-3">
            <button onClick={onCancel} className="btn-outline flex-1">
              Continue Playing
            </button>
            <button 
              onClick={handleComplete}
              className="btn-primary flex-1"
              disabled={!finalObservations.trim()}
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
GameHeader.propTypes = {
  simulation: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
  gameState: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onResume: PropTypes.func.isRequired,
  onShowPromptGame: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

EquipmentPanel.propTypes = {
  equipment: PropTypes.array.isRequired,
  selectedEquipment: PropTypes.array.isRequired,
  onEquipmentDrag: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

EquipmentItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onDrag: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

VirtualLabWorkspace.propTypes = {
  gameState: PropTypes.object.isRequired,
  onEquipmentDrop: PropTypes.func.isRequired,
  onChemicalMixing: PropTypes.func.isRequired,
  draggedItem: PropTypes.object,
  disabled: PropTypes.bool
};

DropZone.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  dragOver: PropTypes.bool.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  contents: PropTypes.array.isRequired
};

GameProgressPanel.propTypes = {
  gameState: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
  onGetHint: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

GameCompletionModal.propTypes = {
  gameState: PropTypes.object.isRequired,
  simulation: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

GameifiedSimulationInterface.propTypes = {
  simulation: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onStateUpdate: PropTypes.func.isRequired,
};

export default GameifiedSimulationInterface;
