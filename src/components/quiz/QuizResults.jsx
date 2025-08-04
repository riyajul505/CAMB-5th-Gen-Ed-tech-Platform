import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { quizAPI, imageGenerationAPI } from '../../services/api';

/**
 * Quiz Results Component
 * Displays quiz results, generates achievements, and handles result saving
 */
function QuizResults({ results, resource, onRetakeQuiz, onTakeAnotherQuiz, studentId }) {
  const [achievement, setAchievement] = useState(null);
  const [loadingAchievement, setLoadingAchievement] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref to track if results have been saved to prevent duplicates
  const hasSavedRef = useRef(false);
  const resultsIdRef = useRef(null);

  useEffect(() => {
    // Create a unique identifier for this quiz result to prevent duplicate saves
    const currentResultId = `${results.studentId}-${results.resourceId}-${results.completedAt}`;
    
    // Development warning about React Strict Mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 QuizResults: Running in development mode - React Strict Mode may cause double execution');
    }
    
    // Flag to track if this effect is still active (prevent race conditions)
    let isActive = true;
    
    // Emergency backup timer to prevent infinite loading (45 seconds max)
    const emergencyTimer = setTimeout(() => {
      if (isActive && loadingAchievement) {
        console.error('🚨 QuizResults: Emergency timeout - forcing achievement display');
        setLoadingAchievement(false);
        
        if (achievement === null) {
          const emergencyAchievement = {
            ...getAchievementData(results.score),
            studentId: results.studentId,
            resourceId: results.resourceId,
            resourceTitle: results.quiz?.title || 'Quiz',
            score: results.score,
            unlockedAt: new Date().toISOString(),
            image: null,
            unlocked: results.score >= 70
          };
          setAchievement(emergencyAchievement);
        }
      }
    }, 45000); // 45 second emergency backup
    
    // CRITICAL: Enhanced duplicate prevention logic
    // Check if we've already processed this exact quiz result
    if (hasSavedRef.current && resultsIdRef.current === currentResultId) {
      console.log('🚫 QuizResults: Duplicate detected - skipping save for result ID:', currentResultId);
      console.log('🚫 QuizResults: This prevents duplicate notifications from being created');
      
      // If we've already saved but don't have an achievement, generate one
      if (achievement === null) {
        console.log('🔄 QuizResults: Already saved but no achievement, generating...');
        setTimeout(() => {
          if (isActive) {
            generateAchievement();
          }
        }, 100);
      }
      return; // Exit early to prevent any duplicate API calls
    }
    
    // First time processing this quiz result
    console.log('🔄 QuizResults: First time processing result ID:', currentResultId);
    console.log('🔄 QuizResults: Previous saved state - hasSaved:', hasSavedRef.current, 'previousId:', resultsIdRef.current);
    
    // Mark this result as being processed
    resultsIdRef.current = currentResultId;
    hasSavedRef.current = true;
    
    // Start save immediately (don't wait for achievement)
    saveResults();
    
    // Generate achievement independently with more robust handling
    // Use a longer delay to ensure the component is stable
    setTimeout(() => {
      if (isActive) {
        console.log('🚀 QuizResults: Starting achievement generation (component still active)');
        generateAchievement();
      } else {
        console.warn('⚠️ QuizResults: Component became inactive before achievement generation');
        // Force show a fallback achievement if component is still mounted but effect is inactive
        if (achievement === null) {
          const fallbackAchievement = {
            ...getAchievementData(results.score),
            studentId: results.studentId,
            resourceId: results.resourceId,
            resourceTitle: results.quiz?.title || 'Quiz',
            score: results.score,
            unlockedAt: new Date().toISOString(),
            image: null,
            unlocked: results.score >= 70
          };
          setAchievement(fallbackAchievement);
          setLoadingAchievement(false);
        }
      }
    }, 500); // Increased delay to ensure stability
    
    // Cleanup function to prevent race conditions
    return () => {
      isActive = false;
      clearTimeout(emergencyTimer);
      console.log('🧹 QuizResults: Cleanup effect for result ID:', currentResultId);
    };
  }, [results.completedAt]); // Only depend on completedAt to avoid unnecessary re-runs

  const saveResults = async () => {
    // CRITICAL: Multiple safeguards against duplicate saves
    if (saving || saved) {
      console.log('⚠️ QuizResults: Save already in progress or completed, skipping');
      return;
    }

    // Additional check using the ref to prevent race conditions
    const currentResultId = `${results.studentId}-${results.resourceId}-${results.completedAt}`;
    if (hasSavedRef.current && resultsIdRef.current === currentResultId && saved) {
      console.log('🚫 QuizResults: Duplicate save attempt detected and blocked');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      console.log('💾 QuizResults: Saving quiz results (this should only happen once per quiz):', {
        studentId: results.studentId,
        resourceId: results.resourceId,
        score: results.score,
        answers: results.answers,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        resultId: currentResultId
      });

      const response = await quizAPI.saveQuizResult({
        studentId: results.studentId,
        resourceId: results.resourceId,
        score: results.score,
        answers: results.answers,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        quizData: results.quiz,
        completedAt: results.completedAt
      });
      
      console.log('✅ QuizResults: Quiz result saved successfully:', response.data);
      console.log('✅ QuizResults: This prevents duplicate notifications from being created');
      
      if (response.data.achievementUnlocked) {
        console.log('🏆 QuizResults: Achievement unlocked:', response.data.achievement);
      }
      
      setSaved(true);
    } catch (error) {
      console.error('❌ QuizResults: Error saving quiz results:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to save quiz results');
      
      // Reset the saved flags so user can try again
      hasSavedRef.current = false;
      resultsIdRef.current = null;
    } finally {
      setSaving(false);
    }
  };

  const generateAchievement = async () => {
    // Prevent duplicate achievement generation
    if (achievement !== null) {
      console.log('⚠️ QuizResults: Achievement already generated, skipping');
      return;
    }

    console.log('🎨 QuizResults: Starting achievement generation for score:', results.score);
    
    // Set a maximum timeout for the entire achievement process
    const achievementTimeout = setTimeout(() => {
      console.warn('⏰ QuizResults: Achievement generation timed out after 30 seconds');
      setLoadingAchievement(false);
      
      // Set a fallback achievement
      const fallbackAchievement = {
        ...getAchievementData(results.score),
        studentId: results.studentId,
        resourceId: results.resourceId,
        resourceTitle: results.quiz?.title || 'Quiz',
        score: results.score,
        unlockedAt: new Date().toISOString(),
        image: null,
        unlocked: results.score >= 70
      };
      setAchievement(fallbackAchievement);
    }, 30000); // 30 second timeout

    try {
      setLoadingAchievement(true);
      console.log('🎨 QuizResults: Generating achievement for score:', results.score);
      
      // Generate achievement based on score
      const achievementData = getAchievementData(results.score);
      console.log('🏆 QuizResults: Achievement data:', achievementData);
      
      let finalAchievement = {
        ...achievementData,
        studentId: results.studentId,
        resourceId: results.resourceId,
        resourceTitle: results.quiz?.title || 'Quiz',
        score: results.score,
        unlockedAt: new Date().toISOString(),
        unlocked: achievementData.shouldGenerate,
        image: null
      };
      
      // Try to generate image for qualifying achievements
      if (achievementData.shouldGenerate) {
        // First, validate ClipDrop API key to fail fast if it's invalid
        const apiKey = import.meta.env.VITE_CLIP_DROP;
        console.log('🔑 ClipDrop API Key Check:', apiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
        
        if (!apiKey) {
          console.warn('⚠️ QuizResults: ClipDrop API key not configured, skipping image generation');
          console.warn('⚠️ To enable image generation, add VITE_CLIP_DROP=your_api_key to your .env file');
        } else {
          try {
            console.log('🖼️ QuizResults: Attempting to generate achievement image...');
            console.log('🖼️ ClipDrop API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
            
            const prompt = generateAchievementPrompt(achievementData, results);
            if (!prompt) {
              console.warn('⚠️ QuizResults: ClipDrop prompt generation failed, skipping image generation.');
              // Continue without image - this is not a critical failure
            } else {
              console.log('🖼️ QuizResults: ClipDrop prompt:', prompt);
              console.log('🖼️ QuizResults: Starting ClipDrop API call...');
              
              // Test ClipDrop connection first
              try {
                console.log('🧪 Testing ClipDrop API connection...');
                const testResponse = await fetch('https://clipdrop-api.co/text-to-image/v1', {
                  method: 'POST',
                  headers: { 
                    'x-api-key': apiKey 
                  },
                  body: new FormData() // Empty form to test connection
                });
                console.log('🧪 ClipDrop connection test status:', testResponse.status);
                
                if (testResponse.status === 401) {
                  throw new Error('ClipDrop API key is invalid');
                } else if (testResponse.status === 400) {
                  console.log('✅ ClipDrop API key is valid (400 = missing prompt, but auth OK)');
                }
              } catch (testError) {
                console.error('❌ ClipDrop connection test failed:', testError.message);
                throw testError;
              }
              
              // Proceed with actual image generation
              const imageGenerationPromise = imageGenerationAPI.generateImage(prompt);
              const imageTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Image generation timeout after 20 seconds')), 20000)
              );
              
              console.log('⏱️ Starting image generation race (20s timeout)...');
              const achievementImage = await Promise.race([imageGenerationPromise, imageTimeoutPromise]);
              
              if (achievementImage) {
                console.log('✅ QuizResults: Achievement image generated successfully');
                console.log('🖼️ Image details:', {
                  type: typeof achievementImage,
                  isBlob: achievementImage.startsWith('blob:'),
                  length: achievementImage.length
                });
                finalAchievement.image = achievementImage;
              } else {
                console.warn('⚠️ QuizResults: No image returned from ClipDrop');
              }
            }
          } catch (imageError) {
            console.warn('⚠️ QuizResults: ClipDrop image generation failed:', imageError.message);
            console.warn('⚠️ QuizResults: Error details:', imageError);
            console.warn('⚠️ QuizResults: Proceeding without image...');
            // Continue without image - this is not a critical failure
          }
        }
      } else {
        console.log('📚 QuizResults: Score too low for image generation, using fallback design');
      }
      
      // Clear the timeout since we're progressing
      clearTimeout(achievementTimeout);
      
      // CRITICAL: Always set the achievement state, even if image generation fails
      console.log('💾 QuizResults: Setting achievement state:', {
        title: finalAchievement.title,
        level: finalAchievement.level,
        score: finalAchievement.score,
        hasImage: !!finalAchievement.image
      });
      setAchievement(finalAchievement);
      
      // Save achievement to backend if it should be unlocked
      if (finalAchievement.unlocked) {
        try {
          console.log('💾 QuizResults: Saving achievement to backend...');
          
          const saveData = {
            studentId: finalAchievement.studentId,
            resourceId: finalAchievement.resourceId,
            resourceTitle: finalAchievement.resourceTitle,
            title: finalAchievement.title,
            description: finalAchievement.description,
            level: finalAchievement.level,
            icon: finalAchievement.icon,
            score: finalAchievement.score,
            image: finalAchievement.image,
            unlockedAt: finalAchievement.unlockedAt
          };
          
          // Option to save blob URLs directly (easier for development)
          // Change to false if you want to keep blob URLs instead of base64
          const saveOptions = { convertToBase64: true };
          
          const saveResponse = await quizAPI.saveAchievement(saveData, saveOptions);
          console.log('✅ QuizResults: Achievement saved to backend:', saveResponse.data);
          
          // Update achievement with saved ID if provided
          // Handle both possible response structures
          let savedAchievement = null;
          if (saveResponse.data.achievement) {
            savedAchievement = saveResponse.data.achievement;
          } else if (saveResponse.data.data && saveResponse.data.data.achievement) {
            savedAchievement = saveResponse.data.data.achievement;
          }
          
          if (savedAchievement?.id) {
            console.log('🆔 QuizResults: Updating achievement with backend ID:', savedAchievement.id);
            setAchievement(prev => ({
              ...prev,
              id: savedAchievement.id,
              createdAt: savedAchievement.createdAt
            }));
          }
        } catch (saveError) {
          console.error('❌ QuizResults: Failed to save achievement to backend:', saveError);
          // Don't fail the whole process if backend save fails
        }
      }
      
    } catch (error) {
      console.error('❌ QuizResults: Error in achievement generation process:', error);
      
      // Clear the timeout
      clearTimeout(achievementTimeout);
      
      // Set a fallback achievement even if everything fails
      const fallbackAchievement = {
        ...getAchievementData(results.score),
        studentId: results.studentId,
        resourceId: results.resourceId,
        resourceTitle: results.quiz?.title || 'Quiz',
        score: results.score,
        unlockedAt: new Date().toISOString(),
        image: null,
        unlocked: results.score >= 70
      };
      
      console.log('🔄 QuizResults: Setting fallback achievement:', fallbackAchievement);
      setAchievement(fallbackAchievement);
    } finally {
      console.log('🏁 QuizResults: Achievement generation completed, setting loading to false');
      setLoadingAchievement(false);
      
      // Clear timeout in case it's still running
      clearTimeout(achievementTimeout);
    }
  };

  const getAchievementData = (score) => {
    if (score >= 90) {
      return {
        title: "Quiz Master",
        description: "Outstanding performance! You've mastered this topic.",
        level: "gold",
        icon: "🏆",
        color: "from-yellow-400 to-orange-500",
        shouldGenerate: true
      };
    } else if (score >= 80) {
      return {
        title: "Knowledge Star",
        description: "Great job! You have a strong understanding.",
        level: "silver",
        icon: "⭐",
        color: "from-gray-300 to-gray-500",
        shouldGenerate: true
      };
    } else if (score >= 70) {
      return {
        title: "Learning Champion",
        description: "Good work! Keep practicing to improve.",
        level: "bronze",
        icon: "🥉",
        color: "from-orange-400 to-orange-600",
        shouldGenerate: true
      };
    } else {
      return {
        title: "Keep Learning",
        description: "Don't give up! Practice makes perfect.",
        level: "participation",
        icon: "📚",
        color: "from-blue-400 to-blue-600",
        shouldGenerate: true // ← ENABLE image generation for all levels!
      };
    }
  };

  const generateAchievementPrompt = (achievementData, results) => {
    const baseStyle = "digital art, cartoon style, bright colors, cheerful, kid-friendly, clean background";
    const score = results.score;
    
    // Check if ClipDrop API key is available
    const apiKey = import.meta.env.VITE_CLIP_DROP;
    if (!apiKey) {
      console.warn('⚠️ QuizResults: ClipDrop API key not configured, skipping image generation');
      return null;
    }
    
    const prompts = {
      gold: `a golden trophy, cartoon style, bright colors`,
      
      silver: `a silver star badge, cartoon style, bright colors`,
      
      bronze: `a bronze medal, cartoon style, bright colors`,
      
      participation: `a blue book with pencils, cartoon style, bright colors`
    };
    
    const prompt = prompts[achievementData.level] || prompts.participation;
    
    console.log('🎨 Generated ClipDrop prompt for', achievementData.level, 'achievement:', prompt);
    return prompt;
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return "Exceptional work! 🎉";
    if (score >= 80) return "Great job! 👏";
    if (score >= 70) return "Good effort! 👍";
    if (score >= 60) return "Keep practicing! 💪";
    return "Don't give up! 📖";
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Results Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-white">🎯</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
        <p className="text-gray-600">Here are your results for "{resource.title}"</p>
      </div>

      {/* Score Card */}
      <div className="card card-padding mb-6">
        <div className="text-center">
          <div className="mb-6">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.score)}`}>
              {results.score}%
            </div>
            <p className="text-lg text-gray-600 mb-1">{getScoreMessage(results.score)}</p>
            <p className="text-sm text-gray-500">
              {results.correctAnswers} out of {results.totalQuestions} questions correct
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.totalQuestions - results.correctAnswers}</div>
              <div className="text-sm text-gray-500">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{results.totalQuestions}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar mb-2">
            <div 
              className="progress-fill" 
              style={{ width: `${results.score}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">Quiz Performance</p>
        </div>
      </div>

      {/* Achievement Section */}
      <div className="card card-padding mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">🏅 Achievement Unlocked!</h3>
        
        {loadingAchievement ? (
          <div className="text-center py-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto mb-4 flex items-center justify-center relative overflow-hidden">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-900">🏆 Generating Achievement...</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center justify-center">
                  <span className="animate-pulse mr-2">🎨</span>
                  Creating your personalized achievement badge
                </p>
                <p className="text-xs text-gray-500">
                  This may take a few moments while we generate your unique image
                </p>
              </div>
            </div>
          </div>
        ) : achievement ? (
          <div className="text-center">
            {/* Achievement Badge */}
            <div className={`w-32 h-32 rounded-full bg-gradient-to-r ${achievement.color} mx-auto mb-4 flex items-center justify-center relative overflow-hidden`}>
              {achievement.image ? (
                <img 
                  src={achievement.image} 
                  alt={achievement.title}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    console.warn('🖼️ Achievement image failed to load, showing fallback');
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* Fallback design when no image */}
              <div 
                className={`${achievement.image ? 'hidden' : 'flex'} w-full h-full items-center justify-center flex-col text-white relative`}
                style={{ display: achievement.image ? 'none' : 'flex' }}
              >
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-gradient-to-br from-white via-transparent to-white"></div>
                </div>
                
                {/* Main achievement icon */}
                <div className="text-4xl mb-2 relative z-10 animate-pulse">
                  {achievement.icon}
                </div>
                
                {/* Achievement level indicator */}
                <div className="text-xs font-bold uppercase tracking-wider relative z-10">
                  {achievement.level}
                </div>
                
                {/* Score indicator */}
                <div className="text-sm font-semibold relative z-10">
                  {results.score}%
                </div>
              </div>
              
              {achievement.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-ping"></div>
              )}
            </div>

            {/* Achievement Info */}
            <h4 className="text-xl font-bold text-gray-900 mb-2">{achievement.title}</h4>
            <p className="text-gray-600 mb-4">{achievement.description}</p>
            
            {achievement.unlocked && (
              <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <span className="mr-2">✨</span>
                Achievement Unlocked!
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Question Review */}
      <div className="card card-padding mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Question Review</h3>
        <div className="space-y-4">
          {results.quiz.questions.map((question, index) => {
            const userAnswer = results.answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <div key={index} className="border-l-4 border-gray-200 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex-1">
                    {index + 1}. {question.question}
                  </h4>
                  <span className={`ml-4 text-lg ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? '✅' : '❌'}
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-500">Your answer:</span>{' '}
                    <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {question.options[userAnswer]}
                    </span>
                  </p>
                  {!isCorrect && (
                    <p>
                      <span className="text-gray-500">Correct answer:</span>{' '}
                      <span className="text-green-600">
                        {question.options[question.correctAnswer]}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Status */}
      {saving && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Saving your results...
          </div>
        </div>
      )}

      {saved && !saving && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <span className="mr-2">✅</span>
            Results saved successfully!
          </div>
        </div>
      )}

      {error && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg">
            <span className="mr-2">❌</span>
            {error}
          </div>
        </div>
      )}

      {/* Debug Section - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm">
            <span className="mr-2">🔧</span>
            Debug: ClipDrop API {import.meta.env.VITE_CLIP_DROP ? 'Configured' : 'Not Configured'} | 
            Score: {results.score}% | 
            Achievement: {achievement ? achievement.level : 'Loading...'}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRetakeQuiz}
          className="btn-outline"
        >
          🔄 Retake This Quiz
        </button>
        <button
          onClick={onTakeAnotherQuiz}
          className="btn-primary"
        >
          📚 Take Another Quiz
        </button>
      </div>

      {/* Tips for Improvement */}
      {results.score < 80 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Improvement</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Review the study material again before retaking</li>
            <li>• Use the AI explanations to understand concepts better</li>
            <li>• Take your time reading each question carefully</li>
            <li>• Practice with different resources to strengthen your knowledge</li>
          </ul>
        </div>
      )}
    </div>
  );
}

QuizResults.propTypes = {
  results: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onRetakeQuiz: PropTypes.func.isRequired,
  onTakeAnotherQuiz: PropTypes.func.isRequired,
  studentId: PropTypes.string.isRequired,
};

export default QuizResults; 