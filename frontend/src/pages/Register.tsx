import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../lib/axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Send the registration payload to your Go backend
      await api.post('/register', { username, email, password });
      
      setSuccess('Account created successfully! Redirecting to login...');
      
      // Wait 2 seconds so they can see the success message, then send them to login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to register. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white mb-6">Create Account</h2>
        
        {error && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-900/50 rounded border border-red-500/50">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 text-sm text-green-400 bg-green-900/50 rounded border border-green-500/50">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-slate-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
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
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-4 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}