import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BibleImportService } from './bible-import.service';

@Module({
  imports: [PrismaModule],
  providers: [BibleImportService],
})
export class BibleModule {}
