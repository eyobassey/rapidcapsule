import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagingAdminController } from './messaging-admin.controller';
import { MessagingAdminService } from './messaging-admin.service';
import { Conversation, ConversationSchema } from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { MessageAuditLog, MessageAuditLogSchema } from './entities/message-audit-log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessageAuditLog.name, schema: MessageAuditLogSchema },
    ]),
  ],
  controllers: [MessagingAdminController],
  providers: [MessagingAdminService],
})
export class MessagingAdminModule {}
