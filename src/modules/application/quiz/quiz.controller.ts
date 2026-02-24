import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { GetQuizzesByLevelDto } from './dto/get-quizzes-by-level.dto';
import { StartQuizAttemptDto } from './dto/start-quiz-attempt.dto';
import { SubmitQuizAnswerDto } from './dto/submit-quiz-answer.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@ApiTags('Quiz')
@ApiBearerAuth()
@Controller('application/quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @ApiOperation({ summary: 'Get quizzes by level' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  async getQuizzesByLevel(@Query() query: GetQuizzesByLevelDto) {
    return this.quizService.getQuizzesByLevel(query);
  }

  @ApiOperation({ summary: 'Get quiz by id' })
  @ApiParam({ name: 'id', description: 'Quiz id' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get(':id')
  async getQuizById(@Param('id') id: string) {
    return this.quizService.getQuizById(id);
  }

  @ApiOperation({ summary: 'Start quiz attempt' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('attempt/start')
  async startQuizAttempt(
    @Request() req: any,
    @Body() dto: StartQuizAttemptDto,
  ) {
    const user_id = req.user.userId;
    return this.quizService.startQuizAttempt(dto, user_id);
  }

  @ApiOperation({ summary: 'Submit answer for a question' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('attempt/answer')
  async submitAnswer(@Request() req: any, @Body() dto: SubmitQuizAnswerDto) {
    const user_id = req.user.userId;
    return this.quizService.submitAnswer(dto, user_id);
  }

  @ApiOperation({ summary: 'Complete quiz attempt and get result' })
  @ApiParam({ name: 'attemptId', description: 'Quiz attempt id' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('attempt/:attemptId/complete')
  async completeQuizAttempt(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
  ) {
    const user_id = req.user.userId;
    return this.quizService.completeQuizAttempt(attemptId, user_id);
  }

  @ApiOperation({ summary: 'Get attempt result by attempt id' })
  @ApiParam({ name: 'attemptId', description: 'Quiz attempt id' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('attempt/:attemptId')
  async getAttemptResult(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
  ) {
    const user_id = req.user.userId;
    return this.quizService.getAttemptResult(attemptId, user_id);
  }
}
