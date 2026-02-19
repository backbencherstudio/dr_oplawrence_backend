import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { FaqModule } from './faq/faq.module';
import { BibleModule } from './bible/bible.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [NotificationModule, ContactModule, FaqModule, BibleModule, QuizModule],
})
export class ApplicationModule {}
