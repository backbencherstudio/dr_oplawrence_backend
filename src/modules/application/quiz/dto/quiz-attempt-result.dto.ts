export class QuizAttemptResultDto {
  id: string;
  quizId: string;
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  completedAt: Date;
  answers: Array<{
    questionId: string;
    question: string;
    selectedAnswer: number;
    isCorrect: boolean;
    correctAnswer: number;
    options: string[];
    explanation: string;
  }>;
}
