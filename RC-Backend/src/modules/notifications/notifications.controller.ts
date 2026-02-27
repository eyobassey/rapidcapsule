import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationOrchestratorService } from './services/notification-orchestrator.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkMultipleAsReadDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly orchestratorService: NotificationOrchestratorService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all notifications',
    description: 'Retrieves a paginated list of notifications for the authenticated user. Supports filtering by read status, type, priority, and keyword search.',
  })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async findAll(@Request() req, @Query() query: NotificationQueryDto) {
    const userId = req.user.sub.toString();
    const result = await this.notificationsService.findAllForUser(userId, query);
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: result.notifications,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: query.limit || 20,
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Returns the total number of unread notifications for the authenticated user. Useful for displaying badge counts in the UI.',
  })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.sub.toString();
    const count = await this.notificationsService.getUnreadCount(userId);
    return {
      success: true,
      data: { unread_count: count },
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get notification statistics',
    description: 'Returns aggregated notification statistics for the authenticated user, including counts by type, priority, and read status.',
  })
  @ApiResponse({ status: 200, description: 'Notification statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getStats(@Request() req) {
    const userId = req.user.sub.toString();
    const stats = await this.notificationsService.getNotificationStats(userId);
    return {
      success: true,
      data: stats,
    };
  }

  // Preferences routes - MUST be before :id routes
  @Get('preferences')
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Retrieves the notification preferences for the authenticated user, including channel preferences per notification category, quiet hours, and messaging timing settings.',
  })
  @ApiResponse({ status: 200, description: 'Notification preferences retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getPreferences(@Request() req) {
    const userId = req.user.sub.toString();
    const preferences = await this.orchestratorService.getNotificationPreferences(userId);
    return {
      success: true,
      message: 'Notification preferences retrieved successfully',
      data: preferences,
    };
  }

  @Patch('preferences')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Updates the notification preferences for the authenticated user. Supports partial updates - only the provided fields will be changed.',
  })
  @ApiResponse({ status: 200, description: 'Notification preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid preference values' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async updatePreferences(
    @Request() req,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const userId = req.user.sub.toString();
    const preferences = await this.orchestratorService.updateNotificationPreferences(userId, dto);
    return {
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences,
    };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all unread notifications as read for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async markAllAsRead(@Request() req) {
    const userId = req.user.sub.toString();
    const result = await this.notificationsService.markAllAsRead(userId);
    return {
      success: true,
      message: `${result.modified} notifications marked as read`,
      data: result,
    };
  }

  @Post('read-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark multiple notifications as read',
    description: 'Marks specific notifications as read by providing their IDs, or marks all notifications as read if mark_all is set to true.',
  })
  @ApiResponse({ status: 200, description: 'Specified notifications marked as read' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid notification IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async markMultipleAsRead(@Request() req, @Body() dto: MarkMultipleAsReadDto) {
    const userId = req.user.sub.toString();
    const result = await this.notificationsService.markMultipleAsRead(userId, dto);
    return {
      success: true,
      message: `${result.modified} notifications marked as read`,
      data: result,
    };
  }

  @Post('delete-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete multiple notifications',
    description: 'Deletes multiple notifications by their IDs for the authenticated user. Only notifications belonging to the user will be deleted.',
  })
  @ApiResponse({ status: 200, description: 'Specified notifications deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid notification IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async deleteMultiple(@Request() req, @Body() body: { notification_ids: string[] }) {
    const userId = req.user.sub.toString();
    const result = await this.notificationsService.deleteMultiple(userId, body.notification_ids);
    return {
      success: true,
      message: `${result.deleted} notifications deleted`,
      data: result,
    };
  }

  // Parameterized routes - MUST be after specific routes
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single notification',
    description: 'Retrieves a specific notification by its ID. Only returns the notification if it belongs to the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user.sub.toString();
    const notification = await this.notificationsService.findOne(id, userId);
    return {
      success: true,
      data: notification,
    };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
    description: 'Marks a specific notification as read by its ID. Only the notification owner can mark it as read.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Request() req, @Param('id') id: string) {
    const userId = req.user.sub.toString();
    const notification = await this.notificationsService.markAsRead(id, userId);
    return {
      success: true,
      message: 'Notification marked as read',
      data: notification,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'Permanently deletes a specific notification by its ID. Only the notification owner can delete it.',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async delete(@Request() req, @Param('id') id: string) {
    const userId = req.user.sub.toString();
    await this.notificationsService.delete(id, userId);
    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }
}
