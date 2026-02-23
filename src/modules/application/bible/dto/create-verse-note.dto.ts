import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVerseNoteDto {
  @IsNotEmpty()
  @IsString()
  verseId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  note: string;
}
