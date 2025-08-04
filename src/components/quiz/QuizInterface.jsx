import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { quizAPI } from '../../services/api';

/**
 * Quiz Interface Component
 * Handles quiz generation, question display, and AI explanations
 */
function QuizInterface({ resource, onQuizComplete, studentId }) {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [error, setError] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Generate quiz when component mounts
  useEffect(() => {
    generateQuiz();
  }, [resource]);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await quizAPI.generateQuiz(resource);
      setQuiz(response.data.quiz);
      setAnswers(new Array(response.data.quiz.questions.length).fill(null));
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
    setIsAnswered(true);
    setShowExplanation(false);
    setAiExplanation('');
  };

  const handleExplainAnswer = async () => {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const userAnswer = currentQuestion.options[selectedAnswer];
    const correctAnswer = currentQuestion.options[currentQuestion.correctAnswer];
    
    try {
      setLoadingExplanation(true);
      const response = await quizAPI.generateConceptExplanation(
        currentQuestion.question,
        userAnswer,
        correctAnswer
      );
      setAiExplanation(response.data.explanation);
      setShowExplanation(true);
    } catch (error) {
      console.error('Error getting explanation:', error);
      setAiExplanation("I'm sorry, I couldn't generate an explanation right now. Keep practicing!");
      setShowExplanation(true);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(answers[currentQuestionIndex + 1]);
    setIsAnswered(answers[currentQuestionIndex + 1] !== null);
    setShowExplanation(false);
    setAiExplanation('');
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
    setSelectedAnswer(answers[currentQuestionIndex - 1]);
    setIsAnswered(answers[currentQuestionIndex - 1] !== null);
    setShowExplanation(false);
    setAiExplanation('');
  };

  const handleFinishQuiz = () => {
    // Calculate score
    const correctAnswers = quiz.questions.reduce((count, question, index) => {
      return count + (answers[index] === question.correctAnswer ? 1 : 0);
    }, 0);

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    
    const results = {
      quiz,
      answers,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      score,
      resourceId: resource.id,
      studentId,
      completedAt: new Date().toISOString()
    };

    onQuizComplete(results);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🧠 Generating Your Quiz...</h3>
        <p className="text-gray-600">AI is creating personalized questions based on "{resource.title}"</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quiz Generation Failed</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={generateQuiz} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allQuestionsAnswered = answers.every(answer => answer !== null);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="card card-padding mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card card-padding mb-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>
          
          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResults = isAnswered;
              
              let optionClasses = "p-4 border rounded-lg cursor-pointer transition-all duration-200 ";
              
              if (!showResults) {
                optionClasses += isSelected 
                  ? "border-primary-500 bg-primary-50 text-primary-700" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
              } else {
                if (isCorrect) {
                  optionClasses += "border-green-500 bg-green-50 text-green-700";
                } else if (isSelected && !isCorrect) {
                  optionClasses += "border-red-500 bg-red-50 text-red-700";
                } else {
                  optionClasses += "border-gray-200 bg-gray-50 text-gray-600";
                }
              }
              
              return (
                <div
                  key={index}
                  className={optionClasses}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1">{option}</span>
                    {showResults && (
                      <span className="ml-3">
                        {isCorrect ? '✅' : isSelected ? '❌' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Answer Feedback */}
        {isAnswered && (
          <div className="mt-6 p-4 rounded-lg border-l-4 border-primary-500 bg-primary-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-primary-900 mb-2">
                  {selectedAnswer === currentQuestion.correctAnswer ? '🎉 Correct!' : '🤔 Not quite right'}
                </h4>
                <p className="text-primary-800 text-sm mb-3">
                  {currentQuestion.explanation}
                </p>
                
                {/* AI Explanation Button/Content */}
                {selectedAnswer !== currentQuestion.correctAnswer && (
                  <div>
                    {!showExplanation ? (
                      <button
                        onClick={handleExplainAnswer}
                        disabled={loadingExplanation}
                        className="btn-outline text-sm"
                      >
                        {loadingExplanation ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                            Getting AI Explanation...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🤖</span>
                            Get AI Explanation
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-primary-200">
                        <h5 className="font-medium text-primary-900 mb-2">🤖 AI Tutor Explains:</h5>
                        <p className="text-primary-800 text-sm leading-relaxed">{aiExplanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="flex space-x-2">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentQuestionIndex
                  ? 'bg-primary-500'
                  : answers[index] !== null
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>

        {isLastQuestion ? (
          <button
            onClick={handleFinishQuiz}
            disabled={!allQuestionsAnswered}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allQuestionsAnswered ? 'Finish Quiz 🎯' : 'Answer All Questions'}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={!isAnswered}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

QuizInterface.propTypes = {
  resource: PropTypes.object.isRequired,
  onQuizComplete: PropTypes.func.isRequired,
  studentId: PropTypes.string.isRequired,
};

export default QuizInterface; 