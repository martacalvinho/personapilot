import React from 'react';
import { X, Twitter } from 'lucide-react';
import { twitterAuthService } from '../services/auth';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const handleTwitterAuth = async () => {
    try {
      await twitterAuthService.initiateOAuth();
    } catch (error) {
      console.error('Error initiating Twitter OAuth:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Connect Your Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Connect your Twitter account to start receiving personalized engagement suggestions.
          </p>
          
          <button
            onClick={handleTwitterAuth}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Twitter className="w-5 h-5" />
            <span>Connect with Twitter</span>
          </button>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            We'll only access your public profile and tweets to provide better suggestions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;