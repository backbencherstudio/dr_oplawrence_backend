import { Module } from '@nestjs/common';
import { BibleService } from './bible.service';
import { BibleController } from './bible.controller';

@Module({
  controllers: [BibleController],
  providers: [BibleService],
})
export class BibleModule {}
