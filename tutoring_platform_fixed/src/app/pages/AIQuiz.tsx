import { useState } from "react";
import { Brain, Loader2, CheckCircle2, XCircle, Trophy, RotateCcw, Sparkles, Zap, BookOpen } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";
type Question = { question: string; options: string[]; correct: number; explanation: string };

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string; border: string; count: number }> = {
  easy: { label: "Easy", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", count: 5 },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", count: 7 },
  hard: { label: "Hard", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", count: 10 },
};

function getRating(score: number, total: number): { label: string; emoji: string; color: string } {
  const pct = (score / total) * 100;
  if (pct === 100) return { label: "Perfect!", emoji: "🏆", color: "text-amber-500" };
  if (pct >= 90) return { label: "Excellent!", emoji: "🌟", color: "text-emerald-600" };
  if (pct >= 70) return { label: "Very Good", emoji: "👏", color: "text-blue-600" };
  if (pct >= 50) return { label: "Good", emoji: "👍", color: "text-violet-600" };
  if (pct >= 30) return { label: "Needs Practice", emoji: "📚", color: "text-amber-600" };
  return { label: "Keep Trying", emoji: "💪", color: "text-rose-600" };
}

function generateQuestions(topic: string, difficulty: Difficulty): Question[] {
  const count = DIFFICULTY_CONFIG[difficulty].count;
  const templates: Record<string, Question[]> = {};
  
  // AI-style question generation based on topic keywords
  const topicLower = topic.toLowerCase();
  const questions: Question[] = [];
  
  const questionBanks: Record<string, Question[]> = {
    "machine learning": [
      { question: "What is the primary goal of supervised learning?", options: ["Learn from labeled data to make predictions", "Find hidden patterns in unlabeled data", "Maximize a reward signal", "Compress data into fewer dimensions"], correct: 0, explanation: "Supervised learning uses labeled training data to learn a mapping from inputs to outputs." },
      { question: "Which algorithm is commonly used for classification tasks?", options: ["Linear Regression", "K-Means Clustering", "Random Forest", "PCA"], correct: 2, explanation: "Random Forest is an ensemble method commonly used for both classification and regression." },
      { question: "What does 'overfitting' mean in machine learning?", options: ["Model performs well on all data", "Model learns noise in training data", "Model is too simple", "Model has no bias"], correct: 1, explanation: "Overfitting occurs when a model learns the noise and details in training data to the extent that it negatively impacts performance on new data." },
      { question: "What is the purpose of cross-validation?", options: ["Speed up training", "Assess model generalization", "Reduce model size", "Increase training data"], correct: 1, explanation: "Cross-validation helps assess how the model will generalize to an independent dataset." },
      { question: "Which activation function is most commonly used in hidden layers of deep neural networks?", options: ["Sigmoid", "Tanh", "ReLU", "Softmax"], correct: 2, explanation: "ReLU (Rectified Linear Unit) is the most widely used activation function in hidden layers due to its simplicity and effectiveness." },
      { question: "What is gradient descent?", options: ["A data preprocessing technique", "An optimization algorithm to minimize loss", "A type of neural network", "A regularization method"], correct: 1, explanation: "Gradient descent is an iterative optimization algorithm used to minimize the loss function by adjusting model parameters." },
      { question: "What is the difference between bagging and boosting?", options: ["Bagging trains models in parallel; boosting trains sequentially", "They are the same technique", "Bagging uses neural networks; boosting uses trees", "Bagging is supervised; boosting is unsupervised"], correct: 0, explanation: "Bagging (Bootstrap Aggregating) trains models independently in parallel, while boosting trains models sequentially, each correcting errors of the previous." },
      { question: "What does the bias-variance tradeoff refer to?", options: ["Choosing between CPU and GPU", "Balancing underfitting and overfitting", "Selecting training vs test data ratio", "Deciding model architecture"], correct: 1, explanation: "The bias-variance tradeoff is about finding the right model complexity — too simple leads to underfitting (high bias), too complex leads to overfitting (high variance)." },
      { question: "Which metric is best for imbalanced classification datasets?", options: ["Accuracy", "F1 Score", "Mean Squared Error", "R-squared"], correct: 1, explanation: "F1 Score balances precision and recall, making it more informative than accuracy for imbalanced datasets." },
      { question: "What is a convolutional neural network (CNN) primarily used for?", options: ["Natural language processing", "Image recognition and processing", "Time series forecasting", "Database management"], correct: 1, explanation: "CNNs are specialized neural networks designed for processing structured grid data like images." },
    ],
    default: [
      { question: `What is a fundamental concept in ${topic}?`, options: ["Theoretical framework", "Practical application", "Both theory and practice", "Neither"], correct: 2, explanation: `${topic} involves both theoretical understanding and practical application of concepts.` },
      { question: `Which approach is most effective for studying ${topic}?`, options: ["Memorization only", "Practice problems only", "Combination of theory and practice", "Watching videos only"], correct: 2, explanation: "A combination of understanding theory and solving practice problems is the most effective learning approach." },
      { question: `What skill is most important for mastering ${topic}?`, options: ["Speed reading", "Critical thinking", "Handwriting", "Typing speed"], correct: 1, explanation: "Critical thinking is essential for understanding and applying concepts in any subject." },
      { question: `How should complex problems in ${topic} be approached?`, options: ["Ignore them", "Break into smaller parts", "Guess the answer", "Skip to the next topic"], correct: 1, explanation: "Breaking complex problems into smaller, manageable parts is a proven problem-solving strategy." },
      { question: `What role does practice play in ${topic}?`, options: ["No role", "Minor role", "Essential for mastery", "Only for beginners"], correct: 2, explanation: "Regular practice is essential for building understanding and mastery in any subject." },
      { question: `Which learning method works best for ${topic}?`, options: ["Passive listening", "Active recall and testing", "Reading textbooks once", "Cramming before exams"], correct: 1, explanation: "Active recall through self-testing has been proven to be one of the most effective study methods." },
      { question: `What is the best way to verify understanding of ${topic}?`, options: ["Feeling confident", "Teaching it to someone else", "Reading more books", "Taking a break"], correct: 1, explanation: "Teaching concepts to others (the Feynman technique) is one of the best ways to verify and deepen understanding." },
      { question: `How does ${topic} relate to real-world applications?`, options: ["It doesn't", "Only in theory", "Through practical implementation", "Only in research labs"], correct: 2, explanation: "Most academic subjects have direct real-world applications through practical implementation." },
      { question: `What makes ${topic} challenging to learn?`, options: ["It's impossible", "Abstract concepts requiring deep thinking", "Too many textbooks", "No online resources"], correct: 1, explanation: "Abstract concepts that require deep analytical thinking are often what make subjects challenging but rewarding." },
      { question: `What is the key to long-term retention of ${topic}?`, options: ["One-time study", "Spaced repetition", "Highlighting notes", "Copying text"], correct: 1, explanation: "Spaced repetition — reviewing material at increasing intervals — is scientifically proven to improve long-term memory retention." },
    ]
  };

  // Find matching question bank
  let bank = questionBanks.default;
  for (const [key, qs] of Object.entries(questionBanks)) {
    if (key !== "default" && topicLower.includes(key)) { bank = qs; break; }
  }

  // Shuffle and pick questions
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const q = { ...shuffled[i] };
    // Shuffle options for harder difficulties
    if (difficulty !== "easy") {
      const correctAnswer = q.options[q.correct];
      q.options = [...q.options].sort(() => Math.random() - 0.5);
      q.correct = q.options.indexOf(correctAnswer);
    }
    questions.push(q);
  }
  return questions;
}

export default function AIQuiz() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 1500));
    const qs = generateQuestions(topic.trim(), difficulty);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentQ(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnswered(false);
    setGenerating(false);
  };

  const selectAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const restart = () => {
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;
  const rating = questions.length > 0 ? getRating(score, questions.length) : null;

  // ── RESULTS ────────────────────────────────────────────
  if (showResult && questions.length > 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center text-white">
            <p className="text-6xl mb-3">{rating!.emoji}</p>
            <h1 className="text-3xl font-bold mb-1">{score}/{questions.length}</h1>
            <p className={`text-xl font-semibold text-violet-100`}>{rating!.label}</p>
            <p className="text-violet-200 text-sm mt-2">Topic: {topic} • {DIFFICULTY_CONFIG[difficulty].label}</p>
          </div>
          <div className="p-6 space-y-3">
            <h3 className="font-semibold text-slate-800 mb-3">Review Answers</h3>
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correct;
              return (
                <div key={i} className={`p-4 rounded-xl border ${isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <div className="flex items-start gap-2">
                    {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{i + 1}. {q.question}</p>
                      {!isCorrect && <p className="text-xs text-rose-600 mt-1">Your answer: {q.options[answers[i]!]} • Correct: {q.options[q.correct]}</p>}
                      <p className="text-xs text-slate-500 mt-1">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <button onClick={restart} className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RotateCcw className="w-4 h-4" /> New Quiz
            </button>
            <button onClick={() => { setShowResult(false); setCurrentQ(0); setAnswers(new Array(questions.length).fill(null)); setSelectedAnswer(null); setAnswered(false); }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">
              <RotateCcw className="w-4 h-4" /> Retry Same Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ IN PROGRESS ───────────────────────────────────
  if (questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="p-6 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Question {currentQ + 1} of {questions.length}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_CONFIG[difficulty].bg} ${DIFFICULTY_CONFIG[difficulty].color}`}>{DIFFICULTY_CONFIG[difficulty].label}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-violet-600 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} /></div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let cls = "border-slate-200 hover:border-violet-300 hover:bg-violet-50";
              if (answered) {
                if (idx === q.correct) cls = "border-emerald-400 bg-emerald-50";
                else if (idx === selectedAnswer && idx !== q.correct) cls = "border-rose-400 bg-rose-50";
                else cls = "border-slate-100 opacity-60";
              } else if (selectedAnswer === idx) {
                cls = "border-violet-400 bg-violet-50";
              }
              return (
                <button key={idx} onClick={() => selectAnswer(idx)} disabled={answered} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${cls}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${answered && idx === q.correct ? "bg-emerald-500 text-white" : answered && idx === selectedAnswer ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm text-slate-800">{opt}</span>
                  {answered && idx === q.correct && <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />}
                  {answered && idx === selectedAnswer && idx !== q.correct && <XCircle className="w-5 h-5 text-rose-600 ml-auto" />}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-medium text-blue-700 mb-1">💡 Explanation</p>
              <p className="text-sm text-blue-800">{q.explanation}</p>
            </div>
          )}

          {answered && (
            <button onClick={nextQuestion} className="w-full mt-4 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
              {currentQ < questions.length - 1 ? "Next Question →" : "View Results 🏆"}
            </button>
          )}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {questions.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === currentQ ? "bg-violet-600 scale-125" : i < currentQ ? (answers[i] === questions[i].correct ? "bg-emerald-500" : "bg-rose-400") : "bg-slate-200"}`} />
          ))}
        </div>
      </div>
    );
  }

  // ── TOPIC SELECTION ────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Brain className="w-6 h-6 text-violet-600" /> AI Quiz Generator</h1>
        <p className="text-slate-500 mt-1">Enter any topic and get instant MCQ questions to test your knowledge</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Topic / Subject</label>
          <div className="relative">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && startQuiz()} placeholder="e.g. Machine Learning Supervised Learning" className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty Level</label>
          <div className="grid grid-cols-3 gap-3">
            {(["easy", "medium", "hard"] as Difficulty[]).map(d => {
              const cfg = DIFFICULTY_CONFIG[d];
              const isActive = difficulty === d;
              return (
                <button key={d} onClick={() => setDifficulty(d)} className={`p-4 rounded-xl border-2 text-center transition-all ${isActive ? `${cfg.border} ${cfg.bg}` : "border-slate-100 hover:border-slate-200"}`}>
                  <span className="text-2xl mb-1 block">{d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"}</span>
                  <span className={`text-sm font-semibold ${isActive ? cfg.color : "text-slate-600"}`}>{cfg.label}</span>
                  <span className="block text-xs text-slate-400 mt-0.5">{cfg.count} questions</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["Machine Learning", "Data Structures", "React.js", "Python", "Database Systems", "Networking"].map(t => (
            <button key={t} onClick={() => setTopic(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${topic === t ? "bg-violet-600 text-white border-violet-600" : "border-slate-200 text-slate-600 hover:border-violet-300"}`}>
              <Sparkles className="w-3 h-3 inline mr-1" />{t}
            </button>
          ))}
        </div>

        <button onClick={startQuiz} disabled={!topic.trim() || generating} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200">
          {generating ? <><Loader2 className="w-5 h-5 animate-spin" />Generating Quiz...</> : <><Zap className="w-5 h-5" />Generate Quiz</>}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[{ icon: Brain, label: "AI-Powered", desc: "Smart question generation" }, { icon: Zap, label: "Real-time", desc: "Instant answer feedback" }, { icon: Trophy, label: "Scored", desc: "Performance rating" }].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Icon className="w-6 h-6 text-violet-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
