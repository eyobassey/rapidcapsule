import {
  Controller,
  Get,
  Body,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserSettingsService } from './user-settings.service';
import { CreateUserSettingDto } from './dto/create-user-setting.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('User Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @ApiOperation({ summary: 'Get user settings', description: 'Retrieve the current user settings and preferences' })
  @ApiResponse({ status: 200, description: 'User settings returned' })
  @Get()
  async findOne(@Request() req) {
    const result = await this.userSettingsService.findOne(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Update user settings', description: 'Update user settings and default preferences' })
  @ApiResponse({ status: 200, description: 'User settings updated' })
  @ApiResponse({ status: 400, description: 'Invalid settings data' })
  @Patch()
  async update(
    @Request() req,
    @Body() createUserSettingDto: CreateUserSettingDto,
  ) {
    const result = await this.userSettingsService.updateSetting(
      createUserSettingDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
