import { Controller } from '@nestjs/common';
import { BibleService } from './bible.service';

@Controller('bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}
}
