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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Search verses by a single topic' })
  @Get('search')
  async searchByTopic(@Query() query: SearchBibleTopicQueryDto) {
    return this.bibleService.searchByTopic(query);
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
