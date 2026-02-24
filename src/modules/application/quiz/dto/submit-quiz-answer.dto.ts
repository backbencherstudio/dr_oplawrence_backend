import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitQuizAnswerDto {
  @ApiProperty({
    description: 'Quiz attempt ID',
    example: 'cmf3attempt123id',
  })
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    description: 'Quiz question ID',
    example: 'cmf3question123id',
  })
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'Selected answer index (0-based)',
    example: 1,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  selectedAnswer: number;
}
