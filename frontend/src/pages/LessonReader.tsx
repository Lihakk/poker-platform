import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../lib/axios';

interface Lesson {
  id: number;
  title: string;
  content: string;
}

const splitLesson = (content: string) =>
  content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export default function LessonReader() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    api
      .get(`/lessons/${id}`)
      .then((res) => {
        setLesson(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const paragraphs = useMemo(() => splitLesson(lesson?.content ?? ''), [lesson?.content]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="ml-64 w-full p-10">Loading lesson...</main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="ml-64 w-full p-10">Lesson not found.</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mx-auto max-w-4xl">
          <Link to="/dashboard" className="mb-6 inline-block rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-blue-300 hover:border-blue-400">
            Back to Dashboard
          </Link>

          <article className="rounded-lg border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/20">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Lesson</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white">{lesson.title}</h1>

            <div className="mt-8 space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p key={`${paragraph}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-lg leading-8 text-slate-200">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Link to="/poker-math" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 font-bold text-amber-100 hover:border-amber-300">
                Review math
              </Link>
              <Link to="/strategy-library" className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 font-bold text-fuchsia-100 hover:border-fuchsia-300">
                Open glossary
              </Link>
              <Link to="/situations" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 font-bold text-emerald-100 hover:border-emerald-300">
                Practice spots
              </Link>
            </div>
          </article>

          <div className="mt-6 flex justify-between gap-3">
            <button
              onClick={() => setCompleted((currentValue) => !currentValue)}
              className={`rounded-lg px-6 py-3 font-bold transition ${
                completed ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {completed ? 'Completed' : 'Mark as Complete'}
            </button>
            <Link to="/dashboard" className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-500">
              Continue Learning
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
