import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BibleService } from './bible.service';
import { GetBooksQueryDto } from './dto/get-books.query.dto';
import { GetChaptersQueryDto } from './dto/get-chapters.query.dto';
import { GetVersesQueryDto } from './dto/get-verses.query.dto';
import { SearchBibleTopicQueryDto } from './dto/search-bible-topic.query.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { CreateVerseNoteDto } from './dto/create-verse-note.dto';
import { GetVerseNotesQueryDto } from './dto/get-verse-notes.query.dto';

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

  @Get('search')
  async searchByTopic(@Query() query: SearchBibleTopicQueryDto) {
    return this.bibleService.searchByTopic(query);
  }

  @Post('notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async upsertVerseNote(@Req() req: Request, @Body() dto: CreateVerseNoteDto) {
    const user_id = req.user.userId;
    return this.bibleService.upsertVerseNote(user_id, dto);
  }

  @Get('notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async getMyVerseNotes(
    @Req() req: Request,
    @Query() query: GetVerseNotesQueryDto,
  ) {
    const user_id = req.user.userId;
    return this.bibleService.getMyVerseNotes(user_id, query);
  }

  @Get('notes/verse/:verseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async getMyVerseNoteByVerseId(
    @Req() req: Request,
    @Param('verseId') verseId: string,
  ) {
    const user_id = req.user.userId;
    return this.bibleService.getMyVerseNoteByVerseId(user_id, verseId);
  }

  @Delete('notes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async deleteMyVerseNote(@Req() req: Request, @Param('id') noteId: string) {
    const user_id = req.user.userId;
    return this.bibleService.deleteMyVerseNote(user_id, noteId);
  }
}
