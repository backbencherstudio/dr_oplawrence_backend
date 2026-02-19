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
import { QuizService } from './quiz.service';
import { GetQuizzesByLevelDto } from './dto/get-quizzes-by-level.dto';
import { StartQuizAttemptDto } from './dto/start-quiz-attempt.dto';
import { SubmitQuizAnswerDto } from './dto/submit-quiz-answer.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@Controller('application/quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async getQuizzesByLevel(@Query() query: GetQuizzesByLevelDto) {
    return this.quizService.getQuizzesByLevel(query);
  }

  @Get(':id')
  async getQuizById(@Param('id') id: string) {
    return this.quizService.getQuizById(id);
  }

  @Post('attempt/start')
  async startQuizAttempt(@Request() req: any, @Body() dto: StartQuizAttemptDto) {
    const user_id = req.user.userId;
    return this.quizService.startQuizAttempt(dto, user_id);
  }

  @Post('attempt/answer')
  async submitAnswer(@Request() req: any, @Body() dto: SubmitQuizAnswerDto) {
    const user_id = req.user.userId;
    return this.quizService.submitAnswer(dto, user_id);
  }

  @Post('attempt/:attemptId/complete')
  async completeQuizAttempt(@Request() req: any, @Param('attemptId') attemptId: string) {
    const user_id = req.user.userId;
    return this.quizService.completeQuizAttempt(attemptId, user_id);
  }

  @Get('attempt/:attemptId')
  async getAttemptResult(@Request() req: any, @Param('attemptId') attemptId: string) {
    const user_id = req.user.userId;
    return this.quizService.getAttemptResult(attemptId, user_id);
  }
}
