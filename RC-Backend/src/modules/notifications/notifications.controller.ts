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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkMultipleAsReadDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Request() req, @Query() query: NotificationQueryDto) {
    const userId = req.user._id.toString();
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
  async getUnreadCount(@Request() req) {
    const userId = req.user._id.toString();
    const count = await this.notificationsService.getUnreadCount(userId);
    return {
      success: true,
      data: { unread_count: count },
    };
  }

  @Get('stats')
  async getStats(@Request() req) {
    const userId = req.user._id.toString();
    const stats = await this.notificationsService.getNotificationStats(userId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user._id.toString();
    const notification = await this.notificationsService.findOne(id, userId);
    return {
      success: true,
      data: notification,
    };
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const userId = req.user._id.toString();
    const notification = await this.notificationsService.markAsRead(id, userId);
    return {
      success: true,
      message: 'Notification marked as read',
      data: notification,
    };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req) {
    const userId = req.user._id.toString();
    const result = await this.notificationsService.markAllAsRead(userId);
    return {
      success: true,
      message: `${result.modified} notifications marked as read`,
      data: result,
    };
  }

  @Post('read-multiple')
  @HttpCode(HttpStatus.OK)
  async markMultipleAsRead(@Request() req, @Body() dto: MarkMultipleAsReadDto) {
    const userId = req.user._id.toString();
    const result = await this.notificationsService.markMultipleAsRead(userId, dto);
    return {
      success: true,
      message: `${result.modified} notifications marked as read`,
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Request() req, @Param('id') id: string) {
    const userId = req.user._id.toString();
    await this.notificationsService.delete(id, userId);
    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  @Post('delete-multiple')
  @HttpCode(HttpStatus.OK)
  async deleteMultiple(@Request() req, @Body() body: { notification_ids: string[] }) {
    const userId = req.user._id.toString();
    const result = await this.notificationsService.deleteMultiple(userId, body.notification_ids);
    return {
      success: true,
      message: `${result.deleted} notifications deleted`,
      data: result,
    };
  }
}
