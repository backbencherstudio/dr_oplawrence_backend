import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuizQuestionResponseDto {
  @ApiProperty({ example: 'cmf3question123id' })
  id: string;

  @ApiProperty({ example: 'How many books are in the Bible?' })
  question: string;

  @ApiProperty({
    type: [String],
    example: ['60', '66', '72', '80'],
  })
  options: string[];

  @ApiPropertyOptional({
    example:
      'The Bible contains 66 books: 39 in the Old Testament and 27 in the New Testament.',
  })
  explanation?: string;
}

export class QuizResponseDto {
  @ApiProperty({ example: 'cmf3quiz123id' })
  id: string;

  @ApiProperty({ example: 'Bible Basics - Level 1' })
  title: string;

  @ApiPropertyOptional({ example: 'Test your knowledge of Bible fundamentals' })
  description?: string;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ type: [QuizQuestionResponseDto] })
  questions: QuizQuestionResponseDto[];
}
