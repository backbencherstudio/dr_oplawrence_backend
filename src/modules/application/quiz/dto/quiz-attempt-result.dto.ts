import { ApiProperty } from '@nestjs/swagger';

export class QuizAttemptAnswerDto {
  @ApiProperty({ example: 'cmf3question123id' })
  questionId: string;

  @ApiProperty({ example: 'How many books are in the Bible?' })
  question: string;

  @ApiProperty({ example: 1 })
  selectedAnswer: number;

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: 1 })
  correctAnswer: number;

  @ApiProperty({ type: [String], example: ['60', '66', '72', '80'] })
  options: string[];

  @ApiProperty({
    example:
      'The Bible contains 66 books: 39 in the Old Testament and 27 in the New Testament.',
  })
  explanation: string;
}

export class QuizAttemptResultDto {
  @ApiProperty({ example: 'cmf3attempt123id' })
  id: string;

  @ApiProperty({ example: 'cmf3quiz123id' })
  quizId: string;

  @ApiProperty({ example: 'cmf3user123id' })
  userId: string;

  @ApiProperty({ example: 5 })
  totalQuestions: number;

  @ApiProperty({ example: 4 })
  correctAnswers: number;

  @ApiProperty({ example: 80 })
  score: number;

  @ApiProperty({ example: '2026-02-24T12:30:00.000Z' })
  completedAt: Date;

  @ApiProperty({ type: [QuizAttemptAnswerDto] })
  answers: QuizAttemptAnswerDto[];
}
