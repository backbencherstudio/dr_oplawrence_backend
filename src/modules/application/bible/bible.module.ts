import { Module } from '@nestjs/common';
import { BibleService } from './bible.service';
import { BibleController } from './bible.controller';
import { BibleOpenAiService } from './bible.openai.service';

@Module({
  controllers: [BibleController],
  providers: [BibleService, BibleOpenAiService],
})
export class BibleModule {}
