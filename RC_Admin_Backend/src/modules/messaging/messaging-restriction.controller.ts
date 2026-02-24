import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagingRestrictionService } from './messaging-restriction.service';
import { ApplyRestrictionDto, SetMessageCapDto } from './dto/apply-restriction.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messaging Restrictions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messaging/restrictions')
export class MessagingRestrictionController {
  constructor(
    private readonly restrictionService: MessagingRestrictionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Apply restriction (read_only or blocked) to user(s)' })
  async applyRestriction(@Body() dto: ApplyRestrictionDto, @Request() req) {
    const result = await this.restrictionService.applyRestriction(
      dto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Lift restriction from a user' })
  async liftRestriction(@Param('userId') userId: string, @Request() req) {
    const result = await this.restrictionService.liftRestriction(
      userId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Post('message-cap')
  @ApiOperation({ summary: 'Set message cap for user(s)' })
  async setMessageCap(@Body() dto: SetMessageCapDto, @Request() req) {
    const result = await this.restrictionService.setMessageCap(
      dto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Delete(':userId/message-cap')
  @ApiOperation({ summary: 'Remove message cap from a user' })
  async removeMessageCap(@Param('userId') userId: string, @Request() req) {
    const result = await this.restrictionService.removeMessageCap(
      userId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List all restricted users with pagination' })
  async getRestrictions(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.restrictionService.getRestrictions({
      type,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':userId')
  @ApiOperation({ summary: "Get a user's restriction details" })
  async getUserRestriction(@Param('userId') userId: string) {
    const result = await this.restrictionService.getUserRestriction(userId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
