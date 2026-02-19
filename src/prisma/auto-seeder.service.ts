import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from './prisma.service';

@Injectable()
export class AutoSeederService implements OnModuleInit {
  private readonly logger = new Logger(AutoSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.autoSeed();
  }

  private async autoSeed() {
    try {
      // Check if prayers exist
      const prayerCount = await this.prisma.prayer.count();
      if (prayerCount === 0) {
        this.logger.log('No prayers found. Creating from JSON...');
        await this.seedPrayers();
      }

      // Check if quizzes exist
      const quizCount = await this.prisma.quiz.count();
      if (quizCount === 0) {
        this.logger.log('No quizzes found. Creating from JSON...');
        await this.seedQuizzes();
      }
    } catch (error) {
      this.logger.error('Auto-seed failed:', error);
    }
  }

  private async seedPrayers() {
    try {
      const filePath = join(process.cwd(), 'public', 'prayers.json');
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw) as { prayers: Array<{ text: string }> };

      if (!data?.prayers?.length) {
        this.logger.warn('Prayers JSON has no data. Skipping.');
        return;
      }

      await this.prisma.prayer.createMany({
        data: data.prayers,
        skipDuplicates: true,
      });

      this.logger.log(`Created ${data.prayers.length} prayers from JSON.`);
    } catch (error) {
      this.logger.error('Failed to seed prayers from JSON:', error);
    }
  }

  private async seedQuizzes() {
    try {
      const filePath = join(process.cwd(), 'public', 'quizzes.json');
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw) as {
        quizzes: Array<{
          title: string;
          description?: string;
          level: number;
          sort_order?: number;
          questions: Array<{
            question: string;
            options: string[];
            correct_answer: number;
            explanation?: string;
            sort_order?: number;
          }>;
        }>;
      };

      if (!data?.quizzes?.length) {
        this.logger.warn('Quizzes JSON has no data. Skipping.');
        return;
      }

      let totalQuestions = 0;

      for (const quizData of data.quizzes) {
        const quiz = await this.prisma.quiz.create({
          data: {
            title: quizData.title,
            description: quizData.description,
            level: quizData.level,
            sort_order: quizData.sort_order ?? 0,
          },
        });

        const questions = quizData.questions.map((q) => ({
          quiz_id: quiz.id,
          question: q.question,
          options: JSON.stringify(q.options),
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          sort_order: q.sort_order ?? 0,
        }));

        await this.prisma.quizQuestion.createMany({
          data: questions,
        });

        totalQuestions += questions.length;
      }

      this.logger.log(
        `Created ${data.quizzes.length} quizzes with ${totalQuestions} questions from JSON.`,
      );
    } catch (error) {
      this.logger.error('Failed to seed quizzes from JSON:', error);
    }
  }
}
