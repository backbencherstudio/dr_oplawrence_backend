export class DailyDevotionResponseDto {
  verse: {
    text: string;
    reference: string; // "1 Corinthians 9:23"
    bookName: string;
    chapter: number;
    verseNumber: number;
  };

  prayer: string;
}
