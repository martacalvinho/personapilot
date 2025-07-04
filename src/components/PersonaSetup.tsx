import React, { useState, useEffect } from 'react';
import { User, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { twitterService, TwitterUser, TwitterTweet } from '../services/twitter';
import { openRouterService, PersonaAnalysis } from '../services/openrouter';

interface PersonaSetupProps {
  user: TwitterUser;
  onPersonaReady: (persona: PersonaAnalysis) => void;
}

const PersonaSetup: React.FC<PersonaSetupProps> = ({ user, onPersonaReady }) => {
  const [step, setStep] = useState<'scraping' | 'analyzing' | 'complete' | 'error'>('scraping');
  const [progress, setProgress] = useState(0);
  const [tweets, setTweets] = useState<TwitterTweet[]>([]);
  const [replies, setReplies] = useState<TwitterTweet[]>([]);
  const [persona, setPersona] = useState<PersonaAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startPersonaAnalysis();
  }, [user]);

  const startPersonaAnalysis = async () => {
    try {
      setStep('scraping');
      setProgress(0);
      setError(null);

      // Step 1: Scrape user tweets
      setProgress(25);
      const userTweets = await twitterService.scrapeUserTweets(user.id);
      setTweets(userTweets);

      // Step 2: Scrape user replies
      setProgress(50);
      const userReplies = await twitterService.scrapeUserReplies(user.id);
      setReplies(userReplies);

      // Step 3: Analyze persona
      setStep('analyzing');
      setProgress(75);
      
      const tweetTexts = userTweets.map(t => t.text);
      const replyTexts = userReplies.map(r => r.text);
      
      const personaAnalysis = await openRouterService.analyzePersona(user.id, tweetTexts, replyTexts);
      setPersona(personaAnalysis);

      setProgress(100);
      setStep('complete');
      
      setTimeout(() => {
        onPersonaReady(personaAnalysis);
      }, 2000);

    } catch (err) {
      console.error('Persona analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('error');
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 'scraping':
        return progress < 50 ? 'Analyzing your tweets...' : 'Analyzing your replies...';
      case 'analyzing':
        return 'Creating your AI persona...';
      case 'complete':
        return 'Persona analysis complete!';
      case 'error':
        return 'Analysis failed';
      default:
        return 'Starting analysis...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full border border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Building Your AI Persona</h2>
          <p className="text-gray-300">
            Analyzing your X profile to understand your unique voice and style
          </p>
        </div>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">{getStepMessage()}</span>
              <span className="text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center">
            {step === 'scraping' || step === 'analyzing' ? (
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            ) : step === 'complete' ? (
              <CheckCircle className="h-8 w-8 text-green-400" />
            ) : step === 'error' ? (
              <AlertCircle className="h-8 w-8 text-red-400" />
            ) : null}
          </div>

          {/* Data Summary */}
          {tweets.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{tweets.length}</div>
                <div className="text-sm text-gray-400">Tweets Analyzed</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{replies.length}</div>
                <div className="text-sm text-gray-400">Replies Analyzed</div>
              </div>
            </div>
          )}

          {/* Persona Preview */}
          {persona && step === 'complete' && (
            <div className="bg-gray-700 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Your AI Persona</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Tone:</span>
                  <p className="text-white">{persona.tone}</p>
                </div>
                <div>
                  <span className="text-gray-400">Identity:</span>
                  <p className="text-white">{persona.identity}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Main Topics:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {persona.mainTopics.map((topic, index) => (
                      <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Interaction Style:</span>
                  <p className="text-white">{persona.interactionStyle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                <span className="text-gray-400">Confidence Score</span>
                <span className="text-white font-medium">{persona.confidence}%</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-red-400">{error}</p>
              <button
                onClick={startPersonaAnalysis}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Analysis</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonaSetup;