import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVerseHighlightDto {
  @ApiProperty({
    example: 'cmf3abc123verseid',
    description: 'Bible verse ID to highlight',
  })
  @IsNotEmpty()
  @IsString()
  verseId: string;
}
