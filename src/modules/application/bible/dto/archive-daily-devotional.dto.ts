import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ArchiveDailyDevotionalDto {
  @ApiProperty({
    example: 'cmf3abc123verseid',
    description: 'Bible verse ID to archive',
  })
  @IsNotEmpty()
  @IsString()
  verseId: string;
}
