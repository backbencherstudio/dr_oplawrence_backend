import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class SubmitQuizAnswerDto {
  @IsNotEmpty()
  attemptId: string;

  @IsNotEmpty()
  questionId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  selectedAnswer: number;
}
