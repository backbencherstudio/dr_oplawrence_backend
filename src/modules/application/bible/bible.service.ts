import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetBooksQueryDto } from './dto/get-books.query.dto';
import { GetChaptersQueryDto } from './dto/get-chapters.query.dto';
import { GetVersesQueryDto } from './dto/get-verses.query.dto';

@Injectable()
export class BibleService {
  constructor(private readonly prisma: PrismaService) {}

  async getBooks(query: GetBooksQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const skip = (page - 1) * limit;
    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : undefined;

    try {
      return await this.prisma.bibleBook.findMany({
        select: {
          id: true,
          name: true,
        },
        where,
        orderBy: {
          created_at: 'asc',
        },
        skip,
        take: limit,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to load bible books');
    }
  }

  async getChapters(query: GetChaptersQueryDto) {
    try {
      const book = await this.prisma.bibleBook.findUnique({
        where: { id: query.bookId },
        select: { id: true },
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      return await this.prisma.bibleChapter.findMany({
        where: { book_id: query.bookId },
        select: {
          id: true,
          number: true,
        },
        orderBy: {
          number: 'asc',
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load bible chapters');
    }
  }

  async getVerses(query: GetVersesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const skip = (page - 1) * limit;

    try {
      const chapter = await this.prisma.bibleChapter.findUnique({
        where: { id: query.chapterId },
        select: { id: true },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      return await this.prisma.bibleVerse.findMany({
        where: { chapter_id: query.chapterId },
        select: {
          id: true,
          number: true,
          text: true,
        },
        orderBy: {
          number: 'asc',
        },
        skip,
        take: limit,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load bible verses');
    }
  }

  async getDailyDevotion() {
    try {
      const totalVerses = await this.prisma.bibleVerse.count();
      const totalPrayers = await this.prisma.prayer.count({
        where: { status: 1 },
      });

      if (totalVerses === 0) {
        throw new NotFoundException('No verses available');
      }
      if (totalPrayers === 0) {
        throw new NotFoundException('No prayers available');
      }

      // Get random verse
      const randomVerseIndex = Math.floor(Math.random() * totalVerses);
      const randomVerse = await this.prisma.bibleVerse.findFirstOrThrow({
        skip: randomVerseIndex,
        select: {
          id: true,
          text: true,
          number: true,
          chapter: {
            select: {
              number: true,
              book: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Get random prayer
      const randomPrayerIndex = Math.floor(Math.random() * totalPrayers);
      const randomPrayer = await this.prisma.prayer.findFirstOrThrow({
        where: { status: 1 },
        skip: randomPrayerIndex,
        select: {
          text: true,
        },
      });

      const bookName = randomVerse.chapter.book.name;
      const chapterNumber = randomVerse.chapter.number;
      const verseNumber = randomVerse.number;
      const reference = `${bookName} ${chapterNumber}:${verseNumber}`;

      return {
        verse: {
          text: randomVerse.text,
          reference,
          bookName,
          chapter: chapterNumber,
          verseNumber,
        },
        prayer: randomPrayer.text,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load daily devotion');
    }
  }
}
