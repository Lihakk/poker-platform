import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';

interface Lesson {
  id: number;
  title: string;
  content: string;
}

export default function LessonReader() {
  const { id } = useParams(); // Grabs the ID from the URL
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/lessons/${id}`)
      .then((res) => {
        setLesson(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading...</div>;
  if (!lesson) return <div className="min-h-screen bg-slate-900 text-white p-8">Lesson not found.</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-blue-400 hover:underline mb-8 inline-block">
          ← Back to Dashboard
        </Link>
        
        <article className="prose prose-invert lg:prose-xl">
          <h1 className="text-4xl font-extrabold mb-6 text-blue-400">{lesson.title}</h1>
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl leading-relaxed">
            {lesson.content}
          </div>
        </article>

        <div className="mt-12 flex justify-between">
            <button className="px-6 py-3 bg-slate-700 rounded-lg font-bold hover:bg-slate-600">
                Mark as Complete
            </button>
            {/* Later, we will add a "Take Quiz" button here */}
        </div>
      </div>
    </div>
  );
}