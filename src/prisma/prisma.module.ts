import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AutoSeederService } from './auto-seeder.service';

@Global()
@Module({
  providers: [PrismaService, AutoSeederService],
  exports: [PrismaService],
})
export class PrismaModule {}
