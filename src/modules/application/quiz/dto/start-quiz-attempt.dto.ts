import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartQuizAttemptDto {
  @ApiProperty({
    description: 'Quiz ID',
    example: 'cmf3quiz123id',
  })
  @IsNotEmpty()
  quizId: string;
}
