import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class QuizQuestionResponseDto {
  id: string;
  question: string;
  options: string[];
  explanation?: string;
}

export class QuizResponseDto {
  id: string;
  title: string;
  description?: string;
  level: number;
  questions: QuizQuestionResponseDto[];
}
