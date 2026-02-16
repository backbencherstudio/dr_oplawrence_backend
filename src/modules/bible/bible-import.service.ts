import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

type BibleJson = {
  books: {
    name: string;
    chapters: {
      number: number;
      verses: string[];
    }[];
  }[];
};

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return [items];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

@Injectable()
export class BibleImportService implements OnModuleInit {
  private readonly logger = new Logger(BibleImportService.name);
  private readonly importBatchSize = 2000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.importBibleIfNeeded();
  }

  private async importBibleIfNeeded() {
    const existingVerseCount = await this.prisma.bibleVerse.count();
    if (existingVerseCount > 0) {
      this.logger.log('Bible already imported. Skipping.');
      return;
    }

    const filePath = join(process.cwd(), 'public', 'bible.json');
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as BibleJson;

    if (!data?.books?.length) {
      this.logger.warn('Bible JSON has no books. Skipping.');
      return;
    }

    for (const book of data.books) {
      const bookRecord = await this.prisma.bibleBook.upsert({
        where: { name: book.name },
        create: { name: book.name },
        update: {},
      });

      const chapterRows = book.chapters.map((chapter) => ({
        book_id: bookRecord.id,
        number: chapter.number,
      }));

      if (chapterRows.length > 0) {
        await this.prisma.bibleChapter.createMany({
          data: chapterRows,
          skipDuplicates: true,
        });
      }

      const chapterRecords = await this.prisma.bibleChapter.findMany({
        where: { book_id: bookRecord.id },
        select: { id: true, number: true },
      });
      const chapterIdByNumber = new Map(
        chapterRecords.map((chapter) => [chapter.number, chapter.id]),
      );

      let totalVerses = 0;
      for (const chapter of book.chapters) {
        const chapterId = chapterIdByNumber.get(chapter.number);
        if (!chapterId) {
          continue;
        }

        const verseRows = chapter.verses.map((text, index) => ({
          chapter_id: chapterId,
          number: index + 1,
          text,
        }));

        totalVerses += verseRows.length;
        for (const batch of chunkArray(verseRows, this.importBatchSize)) {
          await this.prisma.bibleVerse.createMany({
            data: batch,
            skipDuplicates: true,
          });
        }
      }

      this.logger.log(
        `Imported ${book.name} (${book.chapters.length} chapters, ${totalVerses} verses).`,
      );
    }

    this.logger.log('Bible import completed.');
  }
}
