import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetBooksQueryDto } from './dto/get-books.query.dto';
import { GetChaptersQueryDto } from './dto/get-chapters.query.dto';
import { GetVersesQueryDto } from './dto/get-verses.query.dto';
import { SearchBibleTopicQueryDto } from './dto/search-bible-topic.query.dto';
import { CreateVerseNoteDto } from './dto/create-verse-note.dto';
import { GetVerseNotesQueryDto } from './dto/get-verse-notes.query.dto';

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

  async searchByTopic(query: SearchBibleTopicQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const topic = query.topic.trim();

    if (!topic) {
      throw new NotFoundException('Please provide a valid search topic');
    }

    try {
      const where = {
        text: {
          contains: topic,
          mode: 'insensitive' as const,
        },
      };

      const [total, verses] = await this.prisma.$transaction([
        this.prisma.bibleVerse.count({ where }),
        this.prisma.bibleVerse.findMany({
          where,
          select: {
            id: true,
            number: true,
            text: true,
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
          orderBy: [
            {
              chapter: {
                book: {
                  name: 'asc',
                },
              },
            },
            {
              chapter: {
                number: 'asc',
              },
            },
            {
              number: 'asc',
            },
          ],
          skip,
          take: limit,
        }),
      ]);

      return {
        topic,
        page,
        limit,
        total,
        data: verses.map((verse) => ({
          id: verse.id,
          text: verse.text,
          verseNumber: verse.number,
          chapter: verse.chapter.number,
          bookName: verse.chapter.book.name,
          reference: `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number}`,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search bible topic');
    }
  }

  async upsertVerseNote(userId: string, dto: CreateVerseNoteDto) {
    try {
      const verse = await this.prisma.bibleVerse.findUnique({
        where: { id: dto.verseId },
        select: {
          id: true,
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

      if (!verse) {
        throw new NotFoundException('Verse not found');
      }

      const note = await this.prisma.bibleVerseNote.upsert({
        where: {
          user_id_verse_id: {
            user_id: userId,
            verse_id: dto.verseId,
          },
        },
        create: {
          user_id: userId,
          verse_id: dto.verseId,
          note: dto.note,
        },
        update: {
          note: dto.note,
        },
      });

      return {
        id: note.id,
        verseId: note.verse_id,
        note: note.note,
        reference: `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number}`,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to save verse note');
    }
  }

  async getMyVerseNotes(userId: string, query: GetVerseNotesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    try {
      const [total, notes] = await this.prisma.$transaction([
        this.prisma.bibleVerseNote.count({
          where: { user_id: userId },
        }),
        this.prisma.bibleVerseNote.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            note: true,
            created_at: true,
            updated_at: true,
            verse: {
              select: {
                id: true,
                number: true,
                text: true,
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
            },
          },
          orderBy: {
            updated_at: 'desc',
          },
          skip,
          take: limit,
        }),
      ]);

      return {
        page,
        limit,
        total,
        data: notes.map((item) => ({
          id: item.id,
          verseId: item.verse.id,
          note: item.note,
          verseText: item.verse.text,
          reference: `${item.verse.chapter.book.name} ${item.verse.chapter.number}:${item.verse.number}`,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to load verse notes');
    }
  }

  async getMyVerseNoteByVerseId(userId: string, verseId: string) {
    try {
      const note = await this.prisma.bibleVerseNote.findFirst({
        where: {
          user_id: userId,
          verse_id: verseId,
        },
        select: {
          id: true,
          note: true,
          created_at: true,
          updated_at: true,
          verse: {
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
          },
        },
      });

      if (!note) {
        throw new NotFoundException('Verse note not found');
      }

      return {
        id: note.id,
        verseId: note.verse.id,
        note: note.note,
        verseText: note.verse.text,
        reference: `${note.verse.chapter.book.name} ${note.verse.chapter.number}:${note.verse.number}`,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load verse note');
    }
  }

  async deleteMyVerseNote(userId: string, noteId: string) {
    try {
      const existing = await this.prisma.bibleVerseNote.findFirst({
        where: {
          id: noteId,
          user_id: userId,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Verse note not found');
      }

      await this.prisma.bibleVerseNote.delete({
        where: { id: noteId },
      });

      return { message: 'Verse note deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete verse note');
    }
  }
}
