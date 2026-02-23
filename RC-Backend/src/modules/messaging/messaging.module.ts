import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Conversation, ConversationSchema } from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { MessageAuditLog, MessageAuditLogSchema } from './entities/message-audit-log.entity';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { MessagingAuditService } from './messaging-audit.service';
import { MessagingUploadService } from './messaging-upload.service';
import { ConversationParticipantGuard } from './guards/conversation-participant.guard';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessageAuditLog.name, schema: MessageAuditLogSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWTKEY,
    }),
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    MessagingGateway,
    MessagingAuditService,
    MessagingUploadService,
    ConversationParticipantGuard,
    FileUploadHelper,
  ],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
