import React, { useState, useEffect } from 'react';
import { User, Settings, TrendingUp, MessageCircle, Heart, Repeat2, Twitter, Loader2 } from 'lucide-react';
import { twitterService, TwitterUser } from '../services/twitter';
import { openRouterService, PersonaAnalysis } from '../services/openrouter';
import PersonaSetup from './PersonaSetup';

interface EngagementSuggestion {
  id: string;
  tweet_id: string;
  author_username: string;
  tweet_content: string;
  suggested_reply: string;
  confidence: number;
  topic: string;
  engagement_count: number;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [persona, setPersona] = useState<PersonaAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<EngagementSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPersonaSetup, setShowPersonaSetup] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (twitterService.isLoggedIn()) {
        const currentUser = twitterService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await loadUserData(currentUser.id);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // Load persona
      const userPersona = await openRouterService.getPersona(userId);
      if (userPersona) {
        setPersona(userPersona);
        // Load engagement suggestions
        const userSuggestions = await twitterService.getEngagementSuggestions(userId);
        setSuggestions(userSuggestions);
      } else {
        // No persona found, show setup
        setShowPersonaSetup(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await twitterService.authenticate();
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await twitterService.logout();
      setUser(null);
      setPersona(null);
      setSuggestions([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handlePersonaReady = (newPersona: PersonaAnalysis) => {
    setPersona(newPersona);
    setShowPersonaSetup(false);
    // Reload suggestions after persona is created
    if (user) {
      loadUserData(user.id);
    }
  };

  const handleUseSuggestion = async (suggestion: EngagementSuggestion) => {
    try {
      await twitterService.updateEngagementSuggestionStatus(suggestion.id, 'approved');
      // Update local state
      setSuggestions(prev => 
        prev.map(s => s.id === suggestion.id ? { ...s, status: 'approved' } : s)
      );
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show persona setup if user is logged in but no persona exists
  if (user && showPersonaSetup) {
    return <PersonaSetup user={user} onPersonaReady={handlePersonaReady} />;
  }

  // Show sign-in screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-700 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Twitter className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">PersonaPilot</h1>
          <p className="text-gray-300 mb-8">
            AI-powered Twitter engagement that matches your unique voice and style
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Analyze your Twitter persona</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Generate authentic engagement suggestions</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Maintain your unique voice</span>
            </div>
          </div>
          
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Twitter className="h-5 w-5" />
            <span>Sign in with X</span>
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            We only read your public tweets to understand your communication style
          </p>
        </div>
      </div>
    );
  }

  // Main dashboard for authenticated users with persona
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">PersonaPilot</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={user.profileImage || '/default-avatar.png'} 
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">@{user.username}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Suggestions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {suggestions.filter(s => s.status === 'pending').length}
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Suggestions</p>
                  <p className="text-3xl font-bold text-gray-900">{suggestions.length}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Persona Confidence</p>
                  <p className="text-3xl font-bold text-gray-900">{persona?.confidence || 0}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Recent Suggestions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Recent Engagement Suggestions</h2>
              </div>
              <div className="p-6">
                {suggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No suggestions yet. Check back soon!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.slice(0, 5).map((suggestion) => (
                      <div key={suggestion.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            Reply to @{suggestion.author_username}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            "{suggestion.suggested_reply}"
                          </p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">
                              Confidence: {suggestion.confidence}%
                            </span>
                            <span className="text-xs text-green-600">
                              Topic: {suggestion.topic}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {suggestion.status === 'pending' ? (
                            <button
                              onClick={() => handleUseSuggestion(suggestion)}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                            >
                              Use
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500 capitalize">
                              {suggestion.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Persona Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Your AI Persona</h2>
              </div>
              <div className="p-6">
                {persona ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Tone</h3>
                      <p className="text-sm text-gray-600 mt-1">{persona.tone}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Main Topics</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {persona.mainTopics.map((topic, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Identity</h3>
                      <p className="text-sm text-gray-600 mt-1">{persona.identity}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Confidence Level</h3>
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${persona.confidence}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{persona.confidence}% confidence</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowPersonaSetup(true)}
                      className="w-full mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
                    >
                      Rebuild Persona
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Persona not found</p>
                    <button 
                      onClick={() => setShowPersonaSetup(true)}
                      className="mt-2 text-blue-600 text-sm hover:text-blue-700"
                    >
                      Create Persona
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}