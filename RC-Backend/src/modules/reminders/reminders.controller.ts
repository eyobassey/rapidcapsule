import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@ApiTags('Reminders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a reminder',
    description: 'Create a new reminder for the authenticated user with a title, start date/time, and recurrence settings.',
  })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() createReminderDto: CreateReminderDto, @Request() req) {
    const result = await this.remindersService.createReminder(
      createReminderDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user reminders',
    description: 'Retrieve all reminders belonging to the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Reminders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findUserReminders(@Request() req) {
    const result = await this.remindersService.getUserReminders(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a reminder',
    description: 'Update an existing reminder by its ID. All fields are optional and only provided fields will be updated.',
  })
  @ApiParam({ name: 'id', description: 'The ID of the reminder to update', example: '664f1b2e3a1b8c4e5d6f7a8b' })
  @ApiResponse({ status: 200, description: 'Reminder updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async update(
    @Param('id') id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    const result = await this.remindersService.updateReminder(
      id,
      updateReminderDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a reminder',
    description: 'Permanently remove a reminder by its ID.',
  })
  @ApiParam({ name: 'id', description: 'The ID of the reminder to delete', example: '664f1b2e3a1b8c4e5d6f7a8b' })
  @ApiResponse({ status: 200, description: 'Reminder deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async remove(@Param('id') id: string) {
    const result = await this.remindersService.removeReminder(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
