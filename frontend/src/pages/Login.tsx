import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Send the request to your Go backend!
      const response = await api.post('/login', { email, password });
      
      // Save the token and user data in our Zustand store
      login(response.data.token, response.data.user);
      
      // Redirect to the dashboard
      navigate('/dashboard');
    } catch (err) {
      // Check if the error is specifically an Axios HTTP error
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to login. Please try again.');
      } else {
        // Fallback for any other type of error (like network down)
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white mb-6">Poker Platform</h2>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-900/50 rounded border border-red-500/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-slate-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-4 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}