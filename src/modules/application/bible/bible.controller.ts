import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
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
import { ExplainVerseDto } from './dto/explain-verse.dto';
import { ArchiveDailyDevotionalDto } from './dto/archive-daily-devotional.dto';
import { GetArchivedDevotionalsQueryDto } from './dto/get-archived-devotionals.query.dto';

@ApiTags('Bible')
@Controller('application/bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @ApiOperation({ summary: 'Get bible books' })
  @Get('books')
  async getBooks(@Query() query: GetBooksQueryDto) {
    return this.bibleService.getBooks(query);
  }

  @ApiOperation({ summary: 'Get chapters by book id' })
  @Get('chapters')
  async getChapters(@Query() query: GetChaptersQueryDto) {
    return this.bibleService.getChapters(query);
  }

  @ApiOperation({ summary: 'Get verses by chapter id' })
  @Get('verses')
  async getVerses(@Query() query: GetVersesQueryDto) {
    return this.bibleService.getVerses(query);
  }

  @ApiOperation({ summary: 'Get daily devotion (random verse and prayer)' })
  @Get('daily')
  async getDailyDevotion() {
    return this.bibleService.getDailyDevotion();
  }

  @ApiOperation({
    summary: 'Get random verse with AI meditation and prayer',
  })
  @Get('meditation')
  async getMeditation() {
    return this.bibleService.getMeditation();
  }

  @ApiOperation({ summary: 'Search verses by a single topic' })
  @Get('search')
  async searchByTopic(@Query() query: SearchBibleTopicQueryDto) {
    return this.bibleService.searchByTopic(query);
  }

  @ApiOperation({ summary: 'Explain a specific Bible verse with AI' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBody({ type: ExplainVerseDto })
  @Post('explain')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async explainVerse(@Body() dto: ExplainVerseDto) {
    return this.bibleService.explainVerse(dto);
  }

  @ApiOperation({
    summary: 'Generate base64 audio for a specific Bible verse with AI',
  })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBody({ type: ExplainVerseDto })
  @Post('audio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async generateVerseAudio(@Body() dto: ExplainVerseDto) {
    return this.bibleService.generateVerseAudio(dto);
  }

  @ApiOperation({ summary: 'Create or update note for a verse' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async upsertVerseNote(@Req() req: Request, @Body() dto: CreateVerseNoteDto) {
    const user_id = req.user.userId;
    return this.bibleService.upsertVerseNote(user_id, dto);
  }

  @ApiOperation({ summary: 'Archive a daily devotional for logged-in user' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBody({ type: ArchiveDailyDevotionalDto })
  @Post('devotionals/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async archiveDailyDevotional(
    @Req() req: Request,
    @Body() dto: ArchiveDailyDevotionalDto,
  ) {
    const user_id = req.user.userId;
    return this.bibleService.archiveDailyDevotional(user_id, dto);
  }

  @ApiOperation({ summary: 'Get archived daily devotionals of logged-in user' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('devotionals/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async getMyArchivedDevotionals(
    @Req() req: Request,
    @Query() query: GetArchivedDevotionalsQueryDto,
  ) {
    const user_id = req.user.userId;
    return this.bibleService.getMyArchivedDevotionals(user_id, query);
  }

  @ApiOperation({ summary: 'Delete archived daily devotional by id' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Archived devotional id' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Delete('devotionals/archive/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async deleteMyArchivedDevotional(
    @Req() req: Request,
    @Param('id') archivedId: string,
  ) {
    const user_id = req.user.userId;
    return this.bibleService.deleteMyArchivedDevotional(user_id, archivedId);
  }

  @ApiOperation({ summary: 'Get all notes of logged-in user' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Get a note by verse id for logged-in user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'verseId', description: 'Bible verse id' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Delete a note by note id for logged-in user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Verse note id' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Delete('notes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async deleteMyVerseNote(@Req() req: Request, @Param('id') noteId: string) {
    const user_id = req.user.userId;
    return this.bibleService.deleteMyVerseNote(user_id, noteId);
  }
}
