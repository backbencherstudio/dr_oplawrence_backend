import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetQuizzesByLevelDto } from './dto/get-quizzes-by-level.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { StartQuizAttemptDto } from './dto/start-quiz-attempt.dto';
import { SubmitQuizAnswerDto } from './dto/submit-quiz-answer.dto';
import { QuizAttemptResultDto } from './dto/quiz-attempt-result.dto';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuizzesByLevel(
    query: GetQuizzesByLevelDto,
  ): Promise<QuizResponseDto[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    try {
      const quizzes = await this.prisma.quiz.findMany({
        where: {
          level: query.level,
          status: 1,
        },
        select: {
          id: true,
          title: true,
          description: true,
          level: true,
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
              explanation: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
        orderBy: {
          sort_order: 'asc',
        },
        skip,
        take: limit,
      });

      return quizzes.map((quiz) => ({
        ...quiz,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options),
          explanation: q.explanation,
        })),
      }));
    } catch (error) {
      throw new InternalServerErrorException('Failed to load quizzes');
    }
  }

  async getQuizById(quizId: string): Promise<QuizResponseDto> {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
        select: {
          id: true,
          title: true,
          description: true,
          level: true,
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
              explanation: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      return {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options),
          explanation: q.explanation,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load quiz');
    }
  }

  async startQuizAttempt(dto: StartQuizAttemptDto, userId: string) {
    try {
      // Verify quiz exists
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: dto.quizId },
        include: {
          questions: true,
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      // Verify user exists (optional, depending on your auth flow)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create attempt
      const attempt = await this.prisma.quizAttempt.create({
        data: {
          user_id: userId,
          quiz_id: dto.quizId,
          total_questions: quiz.questions.length,
        },
      });

      return {
        attemptId: attempt.id,
        quizId: quiz.id,
        totalQuestions: quiz.questions.length,
        title: quiz.title,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to start quiz');
    }
  }

  async submitAnswer(dto: SubmitQuizAnswerDto, userId: string) {
    try {
      // Verify attempt belongs to user
      const attempt = await this.prisma.quizAttempt.findUnique({
        where: { id: dto.attemptId },
      });

      if (!attempt) {
        throw new NotFoundException('Quiz attempt not found');
      }

      if (attempt.user_id !== userId) {
        throw new NotFoundException('You do not have access to this attempt');
      }

      // Get the question with correct answer
      const question = await this.prisma.quizQuestion.findUnique({
        where: { id: dto.questionId },
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      // Check if answer is correct
      const isCorrect = question.correct_answer === dto.selectedAnswer;

      // Record the answer
      const answer = await this.prisma.quizAnswer.create({
        data: {
          attempt_id: dto.attemptId,
          question_id: dto.questionId,
          selected_answer: dto.selectedAnswer,
          is_correct: isCorrect,
        },
      });

      // If correct, increment the correct_answers count
      if (isCorrect) {
        await this.prisma.quizAttempt.update({
          where: { id: dto.attemptId },
          data: {
            correct_answers: {
              increment: 1,
            },
          },
        });
      }

      return {
        questionId: question.id,
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to submit answer');
    }
  }

  async completeQuizAttempt(
    attemptId: string,
    userId: string,
  ): Promise<QuizAttemptResultDto> {
    try {
      // Get the attempt with all answers
      const attempt = await this.prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz_answers: {
            include: {
              question: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new NotFoundException('Quiz attempt not found');
      }

      if (attempt.user_id !== userId) {
        throw new NotFoundException('You do not have access to this attempt');
      }

      // Calculate score
      const score =
        attempt.total_questions > 0
          ? (attempt.correct_answers / attempt.total_questions) * 100
          : 0;

      // Update attempt with completion
      await this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score,
          completed_at: new Date(),
        },
      });

      // Format response
      const answers = attempt.quiz_answers.map((answer) => ({
        questionId: answer.question_id,
        question: answer.question.question,
        selectedAnswer: answer.selected_answer,
        isCorrect: answer.is_correct,
        correctAnswer: answer.question.correct_answer,
        options: JSON.parse(answer.question.options),
        explanation: answer.question.explanation || '',
      }));

      return {
        id: attempt.id,
        quizId: attempt.quiz_id,
        userId: attempt.user_id,
        totalQuestions: attempt.total_questions,
        correctAnswers: attempt.correct_answers,
        score,
        completedAt: new Date(),
        answers,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to complete quiz');
    }
  }

  async getAttemptResult(
    attemptId: string,
    userId?: string,
  ): Promise<QuizAttemptResultDto> {
    try {
      const attempt = await this.prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz_answers: {
            include: {
              question: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new NotFoundException('Quiz attempt not found');
      }

      if (userId && attempt.user_id !== userId) {
        throw new NotFoundException('You do not have access to this attempt');
      }

      const answers = attempt.quiz_answers.map((answer) => ({
        questionId: answer.question_id,
        question: answer.question.question,
        selectedAnswer: answer.selected_answer,
        isCorrect: answer.is_correct,
        correctAnswer: answer.question.correct_answer,
        options: JSON.parse(answer.question.options),
        explanation: answer.question.explanation || '',
      }));

      return {
        id: attempt.id,
        quizId: attempt.quiz_id,
        userId: attempt.user_id,
        totalQuestions: attempt.total_questions,
        correctAnswers: attempt.correct_answers,
        score: attempt.score,
        completedAt: attempt.completed_at,
        answers,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get quiz result');
    }
  }
}
