import React, { useState, useEffect } from 'react';
import { User, Twitter, MessageCircle, TrendingUp, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';
import PersonaSetup from './PersonaSetup';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPersonaSetup, setShowPersonaSetup] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Twitter className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Twitter Engagement Assistant
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                AI-powered suggestions to boost your Twitter engagement and grow your audience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <MessageCircle className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Replies</h3>
                <p className="text-gray-600">Get AI-generated reply suggestions that match your voice and style</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <TrendingUp className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Engagement Analytics</h3>
                <p className="text-gray-600">Track your engagement metrics and optimize your content strategy</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <User className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Personal Brand</h3>
                <p className="text-gray-600">Build a consistent personal brand with AI-powered content suggestions</p>
              </div>
            </div>

            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Twitter className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Engagement Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPersonaSetup(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600">Here's your engagement dashboard</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Suggestions</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <MessageCircle className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">12.5%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Replies Sent</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                </div>
                <Twitter className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">89%</p>
                </div>
                <User className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Recent Suggestions */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Suggestions</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No suggestions yet</p>
                <p className="text-sm text-gray-400">
                  Connect your Twitter account to start receiving engagement suggestions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showPersonaSetup && (
        <PersonaSetup onClose={() => setShowPersonaSetup(false)} />
      )}
    </div>
  );
};

export default Dashboard;