import { Link, useParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import QuizRunner from "../components/QuizRunner";
import { curriculum } from "../data/curriculum";

export default function StudyQuiz() {
  const { slug } = useParams();
  const topic = curriculum.find((item) => item.slug === slug);
  return (
    <PageShell>
      {topic ? (
        <QuizRunner
          key={slug}
          title={topic.title}
          questions={topic.questions}
          quizKey={`study:${topic.slug}`}
          studyLink={`/study/${topic.slug}`}
        />
      ) : (
        <div className="loading-state">
          <h1>Quiz not found</h1>
          <Link to="/strategy-library">Back to study</Link>
        </div>
      )}
    </PageShell>
  );
}
