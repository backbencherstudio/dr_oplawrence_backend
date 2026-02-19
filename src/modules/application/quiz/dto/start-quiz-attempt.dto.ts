import { IsNotEmpty } from 'class-validator';

export class StartQuizAttemptDto {
  @IsNotEmpty()
  quizId: string;
}
