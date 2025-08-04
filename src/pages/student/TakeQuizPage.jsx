import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { teacherAPI } from '../../services/api';
import DashboardLayout from '../../layout/DashboardLayout';
import QuizInterface from '../../components/quiz/QuizInterface';
import ResourceSelection from '../../components/quiz/ResourceSelection';
import QuizResults from '../../components/quiz/QuizResults';

/**
 * Take Quiz Page for Students
 * Allows students to select resources and take AI-generated quizzes
 */
function TakeQuizPage() {
  const { user, selectedLevel } = useAuth();
  const [currentStep, setCurrentStep] = useState('selection'); // selection, quiz, results
  const [selectedResource, setSelectedResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [quizResults, setQuizResults] = useState(null);

  // Load available resources for student's level
  useEffect(() => {
    if (selectedLevel) {
      loadResources();
    }
  }, [selectedLevel]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getResourcesByLevel(selectedLevel);
      setResources(response.data.resources || []);
    } catch (error) {
      console.error('Error loading resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceSelect = async (resource) => {
    setSelectedResource(resource);
    setCurrentStep('quiz');
    
    // Generate quiz will be handled by QuizInterface component
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setCurrentStep('results');
  };

  const handleRetakeQuiz = () => {
    setCurrentStep('selection');
    setSelectedResource(null);
    setQuizData(null);
    setQuizResults(null);
  };

  const handleTakeAnotherQuiz = () => {
    setCurrentStep('selection');
    setSelectedResource(null);
    setQuizData(null);
    setQuizResults(null);
  };

  if (!selectedLevel) {
    return (
      <DashboardLayout userRole="student">
        <div className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Learning Path Selected</h2>
            <p className="text-gray-600 mb-4">
              You need to select a learning path before taking quizzes.
            </p>
            <button
              onClick={() => window.location.href = '/select-path'}
              className="btn-primary"
            >
              Select Learning Path
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📚 Take Quiz</h1>
          <p className="text-gray-600">
            {currentStep === 'selection' && 'Choose a resource to generate an AI-powered quiz'}
            {currentStep === 'quiz' && `Taking quiz on: ${selectedResource?.title}`}
            {currentStep === 'results' && 'Quiz completed! See your results below'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'selection' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'selection' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Resource</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div className={`h-full transition-all duration-300 ${
                currentStep !== 'selection' ? 'bg-primary-500' : 'bg-gray-200'
              }`} style={{ width: currentStep === 'selection' ? '0%' : '50%' }}></div>
            </div>
            
            <div className={`flex items-center ${currentStep === 'quiz' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'quiz' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Take Quiz</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div className={`h-full transition-all duration-300 ${
                currentStep === 'results' ? 'bg-primary-500' : 'bg-gray-200'
              }`} style={{ width: currentStep === 'results' ? '100%' : '0%' }}></div>
            </div>
            
            <div className={`flex items-center ${currentStep === 'results' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'results' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Results</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'selection' && (
          <ResourceSelection
            resources={resources}
            loading={loading}
            onResourceSelect={handleResourceSelect}
            selectedLevel={selectedLevel}
          />
        )}

        {currentStep === 'quiz' && selectedResource && (
          <QuizInterface
            resource={selectedResource}
            onQuizComplete={handleQuizComplete}
            studentId={user?.id}
          />
        )}

        {currentStep === 'results' && quizResults && (
          <QuizResults
            results={quizResults}
            resource={selectedResource}
            onRetakeQuiz={handleRetakeQuiz}
            onTakeAnotherQuiz={handleTakeAnotherQuiz}
            studentId={user?.id}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default TakeQuizPage; 