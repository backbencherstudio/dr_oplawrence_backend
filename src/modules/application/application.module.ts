import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { FaqModule } from './faq/faq.module';
import { BibleModule } from './bible/bible.module';

@Module({
  imports: [NotificationModule, ContactModule, FaqModule, BibleModule],
})
export class ApplicationModule {}
