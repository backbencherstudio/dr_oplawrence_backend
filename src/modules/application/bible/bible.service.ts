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
import { ExplainVerseDto } from './dto/explain-verse.dto';
import { BibleOpenAiService } from './bible.openai.service';
import { ArchiveDailyDevotionalDto } from './dto/archive-daily-devotional.dto';
import { GetArchivedDevotionalsQueryDto } from './dto/get-archived-devotionals.query.dto';
import { CreateVerseHighlightDto } from './dto/create-verse-highlight.dto';
import { GetVerseHighlightsQueryDto } from './dto/get-verse-highlights.query.dto';

@Injectable()
export class BibleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bibleOpenAiService: BibleOpenAiService,
  ) {}

  async generateVerseAudio(dto: ExplainVerseDto) {
    try {
      const verseData = await this.prisma.bibleVerse.findFirst({
        where: {
          number: dto.verseNumber,
          chapter: {
            number: dto.chapter,
            book: {
              name: {
                equals: dto.bookName.trim(),
                mode: 'insensitive' as const,
              },
            },
          },
        },
        select: {
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
      });

      if (!verseData) {
        throw new NotFoundException('Verse not found');
      }

      const bookName = verseData.chapter.book.name;
      const chapter = verseData.chapter.number;
      const verseNumber = verseData.number;
      const verseText = verseData.text;
      const reference = `${bookName} ${chapter}:${verseNumber}`;

      const audioResult = await this.bibleOpenAiService.generateVerseAudio(
        reference,
        verseText,
      );

      return {
        bookName,
        chapter,
        verseNumber,
        reference,
        verseText,
        mimeType: audioResult.mimeType,
        audioBase64: audioResult.audioBase64,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate verse audio');
    }
  }

  async explainVerse(dto: ExplainVerseDto) {
    try {
      const verseData = await this.prisma.bibleVerse.findFirst({
        where: {
          number: dto.verseNumber,
          chapter: {
            number: dto.chapter,
            book: {
              name: {
                equals: dto.bookName.trim(),
                mode: 'insensitive' as const,
              },
            },
          },
        },
        select: {
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
      });

      if (!verseData) {
        throw new NotFoundException('Verse not found');
      }

      const bookName = verseData.chapter.book.name;
      const chapter = verseData.chapter.number;
      const verseNumber = verseData.number;
      const verseText = verseData.text;
      const reference = `${bookName} ${chapter}:${verseNumber}`;

      const explanation = await this.bibleOpenAiService.explainVerse(
        reference,
        verseText,
      );

      return {
        bookName,
        chapter,
        verseNumber,
        reference,
        verseText,
        explanation,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to explain verse');
    }
  }

  async getBooks(query: GetBooksQueryDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const skip = (page - 1) * limit;
    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : undefined;

    try {
      const books = await this.prisma.bibleBook.findMany({
        select: {
          id: true,
          name: true,
          chapters: {
            select: {
              id: true,
            },
          },
        },
        where,
        orderBy: {
          created_at: 'asc',
        },
        skip,
        take: limit,
      });

      if (!userId) {
        return books.map((book) => ({
          id: book.id,
          name: book.name,
          completionPercentage: 0,
        }));
      }

      const chapterIds = books.flatMap((book) =>
        book.chapters.map((chapter) => chapter.id),
      );

      const completedRows = chapterIds.length
        ? await this.prisma.bibleChapterProgress.findMany({
            where: {
              user_id: userId,
              is_completed: true,
              chapter_id: {
                in: chapterIds,
              },
            },
            select: {
              chapter_id: true,
            },
          })
        : [];

      const completedSet = new Set(completedRows.map((row) => row.chapter_id));

      return books.map((book) => {
        const totalChapters = book.chapters.length;
        const completedChapters = book.chapters.filter((chapter) =>
          completedSet.has(chapter.id),
        ).length;
        const completionPercentage =
          totalChapters === 0
            ? 0
            : Number(((completedChapters / totalChapters) * 100).toFixed(2));

        return {
          id: book.id,
          name: book.name,
          completionPercentage,
        };
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

  async getVerses(query: GetVersesQueryDto, userId?: string) {
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

      if (userId) {
        await this.prisma.bibleChapterProgress.upsert({
          where: {
            user_id_chapter_id: {
              user_id: userId,
              chapter_id: query.chapterId,
            },
          },
          create: {
            user_id: userId,
            chapter_id: query.chapterId,
            is_completed: true,
          },
          update: {
            is_completed: true,
            updated_at: new Date(),
          },
        });
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
          id: randomVerse.id,
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

  async getMeditation() {
    try {
      const totalVerses = await this.prisma.bibleVerse.count();

      if (totalVerses === 0) {
        throw new NotFoundException('No verses available');
      }

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

      const bookName = randomVerse.chapter.book.name;
      const chapterNumber = randomVerse.chapter.number;
      const verseNumber = randomVerse.number;
      const reference = `${bookName} ${chapterNumber}:${verseNumber}`;

      const aiResult =
        await this.bibleOpenAiService.generateMeditationAndPrayer(
          reference,
          randomVerse.text,
        );

      return {
        verse: {
          id: randomVerse.id,
          text: randomVerse.text,
          reference,
          bookName,
          chapter: chapterNumber,
          verseNumber,
        },
        meditation: aiResult.meditation,
        prayer: aiResult.prayer,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load meditation');
    }
  }

  async archiveDailyDevotional(userId: string, dto: ArchiveDailyDevotionalDto) {
    try {
      const verse = await this.prisma.bibleVerse.findUnique({
        where: { id: dto.verseId },
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

      if (!verse) {
        throw new NotFoundException('Verse not found');
      }

      const archived = await this.prisma.bibleArchivedDevotional.upsert({
        where: {
          user_id_verse_id: {
            user_id: userId,
            verse_id: dto.verseId,
          },
        },
        create: {
          user_id: userId,
          verse_id: dto.verseId,
        },
        update: {},
      });

      return {
        id: archived.id,
        date: archived.created_at,
        verse: verse.text,
        verseNumber: verse.number,
        chapter: verse.chapter.number,
        bookName: verse.chapter.book.name,
        reference: `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number}`,
        updatedAt: archived.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to archive daily devotional',
      );
    }
  }

  async getMyArchivedDevotionals(
    userId: string,
    query: GetArchivedDevotionalsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    try {
      const [total, devotionals] = await this.prisma.$transaction([
        this.prisma.bibleArchivedDevotional.count({
          where: { user_id: userId },
        }),
        this.prisma.bibleArchivedDevotional.findMany({
          where: { user_id: userId },
          select: {
            id: true,
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
        data: devotionals.map((item) => ({
          id: item.id,
          date: item.created_at,
          verse: item.verse.text,
          verseNumber: item.verse.number,
          chapter: item.verse.chapter.number,
          bookName: item.verse.chapter.book.name,
          reference: `${item.verse.chapter.book.name} ${item.verse.chapter.number}:${item.verse.number}`,
          updatedAt: item.updated_at,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to load archived devotionals',
      );
    }
  }

  async deleteMyArchivedDevotional(userId: string, archivedId: string) {
    try {
      const existing = await this.prisma.bibleArchivedDevotional.findFirst({
        where: {
          id: archivedId,
          user_id: userId,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Archived devotional not found');
      }

      await this.prisma.bibleArchivedDevotional.delete({
        where: { id: archivedId },
      });

      return { message: 'Archived devotional deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete archived devotional',
      );
    }
  }

  async upsertVerseHighlight(userId: string, dto: CreateVerseHighlightDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const verse = await this.prisma.bibleVerse.findUnique({
        where: { id: dto.verseId },
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

      if (!verse) {
        throw new NotFoundException('Verse not found');
      }

      const highlight = await this.prisma.bibleVerseHighlight.upsert({
        where: {
          user_id_verse_id: {
            user_id: userId,
            verse_id: dto.verseId,
          },
        },
        create: {
          user_id: userId,
          verse_id: dto.verseId,
        },
        update: {},
      });

      return {
        id: highlight.id,
        verseId: verse.id,
        verseText: verse.text,
        reference: `${verse.chapter.book.name} ${verse.chapter.number}:${verse.number}`,
        createdAt: highlight.created_at,
        updatedAt: highlight.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to save verse highlight');
    }
  }

  async getMyVerseHighlights(
    userId: string,
    query: GetVerseHighlightsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const [total, highlights] = await this.prisma.$transaction([
        this.prisma.bibleVerseHighlight.count({
          where: { user_id: userId },
        }),
        this.prisma.bibleVerseHighlight.findMany({
          where: { user_id: userId },
          select: {
            id: true,
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
        data: highlights.map((item) => ({
          id: item.id,
          verseId: item.verse.id,
          verseText: item.verse.text,
          reference: `${item.verse.chapter.book.name} ${item.verse.chapter.number}:${item.verse.number}`,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load verse highlights');
    }
  }

  async getMyVerseHighlightByVerseId(userId: string, verseId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const highlight = await this.prisma.bibleVerseHighlight.findFirst({
        where: {
          user_id: userId,
          verse_id: verseId,
        },
        select: {
          id: true,
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

      if (!highlight) {
        throw new NotFoundException('Verse highlight not found');
      }

      return {
        id: highlight.id,
        verseId: highlight.verse.id,
        verseText: highlight.verse.text,
        reference: `${highlight.verse.chapter.book.name} ${highlight.verse.chapter.number}:${highlight.verse.number}`,
        createdAt: highlight.created_at,
        updatedAt: highlight.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load verse highlight');
    }
  }

  async deleteMyVerseHighlight(userId: string, highlightId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existing = await this.prisma.bibleVerseHighlight.findFirst({
        where: {
          id: highlightId,
          user_id: userId,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Verse highlight not found');
      }

      await this.prisma.bibleVerseHighlight.delete({
        where: { id: highlightId },
      });

      return { message: 'Verse highlight deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete verse highlight',
      );
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
      // check user exits
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

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
      // check user exits
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

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
      // check user exits
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

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
      // check user exits
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

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
