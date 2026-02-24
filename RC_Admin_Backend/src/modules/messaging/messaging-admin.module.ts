import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { MessagingAdminController } from './messaging-admin.controller';
import { MessagingAdminService } from './messaging-admin.service';
import { MessagingSessionController } from './messaging-session.controller';
import { MessagingSessionService } from './messaging-session.service';
import { MessagingBroadcastController } from './messaging-broadcast.controller';
import { MessagingBroadcastService } from './messaging-broadcast.service';
import { MessagingRestrictionController } from './messaging-restriction.controller';
import { MessagingRestrictionService } from './messaging-restriction.service';
import { Conversation, ConversationSchema } from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { MessageAuditLog, MessageAuditLogSchema } from './entities/message-audit-log.entity';
import { MessageBroadcast, MessageBroadcastSchema } from './entities/message-broadcast.entity';
import { User, UserSchema } from '../patients/entities/patient.entity';
import { Admin, AdminSchema } from '../users/entities/user.entity';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { GeneralHelpers } from '../../common/helpers/general.helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessageAuditLog.name, schema: MessageAuditLogSchema },
      { name: MessageBroadcast.name, schema: MessageBroadcastSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWTKEY,
    }),
  ],
  controllers: [
    MessagingAdminController,
    MessagingSessionController,
    MessagingBroadcastController,
    MessagingRestrictionController,
  ],
  providers: [
    MessagingAdminService,
    MessagingSessionService,
    MessagingBroadcastService,
    MessagingRestrictionService,
    FileUploadHelper,
    GeneralHelpers,
  ],
})
export class MessagingAdminModule {}
