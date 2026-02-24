import { ApiProperty } from '@nestjs/swagger';

export class DailyDevotionResponseDto {
  @ApiProperty({
    description: 'Random verse for daily devotion',
    example: {
      text: 'For God so loved the world...',
      reference: 'John 3:16',
      bookName: 'John',
      chapter: 3,
      verseNumber: 16,
    },
  })
  verse: {
    text: string;
    reference: string; // "1 Corinthians 9:23"
    bookName: string;
    chapter: number;
    verseNumber: number;
  };

  @ApiProperty({
    description: 'Prayer text for daily devotion',
    example:
      'May today bring us strength, wisdom, and peace in every step we take.',
  })
  prayer: string;
}
