import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVerseNoteDto {
  @ApiProperty({
    example: 'cmf3abc123verseid',
    description: 'Bible verse ID',
  })
  @IsNotEmpty()
  @IsString()
  verseId: string;

  @ApiProperty({
    example: 'This verse gives me peace and hope.',
    description: 'User note for the selected verse',
    maxLength: 5000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  note: string;
}
