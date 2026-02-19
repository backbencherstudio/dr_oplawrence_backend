import { Controller, Get, Query } from '@nestjs/common';
import { BibleService } from './bible.service';
import { GetBooksQueryDto } from './dto/get-books.query.dto';
import { GetChaptersQueryDto } from './dto/get-chapters.query.dto';
import { GetVersesQueryDto } from './dto/get-verses.query.dto';

@Controller('application/bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('books')
  async getBooks(@Query() query: GetBooksQueryDto) {
    return this.bibleService.getBooks(query);
  }

  @Get('chapters')
  async getChapters(@Query() query: GetChaptersQueryDto) {
    return this.bibleService.getChapters(query);
  }

  @Get('verses')
  async getVerses(@Query() query: GetVersesQueryDto) {
    return this.bibleService.getVerses(query);
  }

  @Get('daily')
  async getDailyDevotion() {
    return this.bibleService.getDailyDevotion();
  }
}
