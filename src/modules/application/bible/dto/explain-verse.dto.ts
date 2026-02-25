import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ExplainVerseDto {
  @ApiProperty({
    description: 'Bible book name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  bookName: string;

  @ApiProperty({
    description: 'Chapter number',
    example: 3,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chapter: number;

  @ApiProperty({
    description: 'Verse number',
    example: 16,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  verseNumber: number;
}
