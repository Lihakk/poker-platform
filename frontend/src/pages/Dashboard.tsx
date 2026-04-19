import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 

interface Lesson {
  id: number;
  title: string;
}

interface Quiz {
  id: number;
  title: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[]; // Lowercase to match our new Go JSON tags
  quizzes: Quiz[];   // Added this
}

export default function Dashboard() {
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    // This fetches the data from your Go backend
    api.get('/modules').then((res) => setModules(res.data));
  }, []);

  return (
    <div className="flex bg-slate-900 min-h-screen">
      <Sidebar />
      
      <div className="ml-64 p-10 w-full">
        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
          Learning <span className="text-blue-500">Path</span>
        </h1>
        <p className="text-slate-400 mb-10">Master the game of Texas Hold'em from the ground up.</p>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 max-w-6xl">
          {modules.map((mod) => (
            <div key={mod.id} className="p-1 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-xl">
              <div className="p-6 bg-slate-800/90 backdrop-blur-sm rounded-[14px] h-full border border-white/5">
                <h2 className="text-2xl font-bold text-white mb-1">{mod.title}</h2>
                <p className="text-slate-400 text-sm mb-6">{mod.description}</p>
                
                <div className="space-y-6">
                  {/* Lessons List */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Lessons</h3>
                    <div className="space-y-2">
                      {mod.lessons?.map((lesson) => (
                        <Link 
                          key={lesson.id} 
                          to={`/lesson/${lesson.id}`}
                          className="flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all group"
                        >
                          <span className="text-blue-400 group-hover:scale-110 transition-transform">📖</span>
                          <span className="text-slate-200 font-medium">{lesson.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Quizzes List */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quizzes</h3>
                    <div className="space-y-2">
                      {mod.quizzes?.map((quiz) => (
                        <Link 
                          key={quiz.id} 
                          to={`/quiz/${quiz.id}`}
                          className="flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group"
                        >
                          <span className="text-indigo-400 group-hover:scale-110 transition-transform">🧠</span>
                          <span className="text-slate-200 font-medium">{quiz.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}