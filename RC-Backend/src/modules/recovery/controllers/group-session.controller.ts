import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GroupSessionService } from '../services/group-session.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - Group Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/group-sessions')
export class GroupSessionController {
  constructor(private readonly groupSessionService: GroupSessionService) {}

  @ApiOperation({
    summary: 'Create a group session',
    description: 'Creates a new group therapy session. The authenticated user becomes the facilitator.',
  })
  @ApiResponse({ status: 201, description: 'Group session created' })
  @Post()
  async create(@Body() dto: any, @Request() req) {
    const result = await this.groupSessionService.create(dto, req.user.sub);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'List group sessions',
    description: 'Returns a paginated list of group sessions with optional filtering by status, category, and upcoming.',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'facilitator', required: false })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated group sessions returned' })
  @Get()
  async list(
    @Query('status') status: string,
    @Query('category') category: string,
    @Query('facilitator') facilitator: string,
    @Query('upcoming') upcoming: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const result = await this.groupSessionService.list({
      status,
      category,
      facilitator,
      upcoming: upcoming === 'true',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get my enrolled sessions',
    description: 'Returns group sessions the authenticated user is enrolled in.',
  })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Enrolled sessions returned' })
  @Get('my-sessions')
  async getMyEnrolledSessions(
    @Query('upcoming') upcoming: string,
    @Request() req,
  ) {
    const result = await this.groupSessionService.getMyEnrolledSessions(
      req.user.sub,
      upcoming !== 'false',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get a group session by ID',
    description: 'Returns full details of a group session including enrolled participants.',
  })
  @ApiParam({ name: 'id', description: 'Group session ID' })
  @ApiResponse({ status: 200, description: 'Group session details returned' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.groupSessionService.getById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Join a group session',
    description: 'Enrolls the authenticated user in a group session. Returns waitlist status if session is full.',
  })
  @ApiParam({ name: 'id', description: 'Group session ID' })
  @ApiResponse({ status: 200, description: 'Enrolled or waitlisted' })
  @Post(':id/join')
  async join(@Param('id') id: string, @Request() req) {
    const result = await this.groupSessionService.join(id, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Leave a group session',
    description: 'Withdraws the authenticated user from a group session.',
  })
  @ApiParam({ name: 'id', description: 'Group session ID' })
  @ApiResponse({ status: 200, description: 'Successfully withdrawn' })
  @Post(':id/leave')
  async leave(@Param('id') id: string, @Request() req) {
    const result = await this.groupSessionService.leave(id, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Log attendance',
    description: 'Logs attendance for all participants. Facilitator only.',
  })
  @ApiParam({ name: 'id', description: 'Group session ID' })
  @ApiResponse({ status: 200, description: 'Attendance logged and session completed' })
  @Post(':id/attendance')
  async logAttendance(
    @Param('id') id: string,
    @Body() body: { records: Array<{ user_id: string; attended: boolean; notes?: string }> },
    @Request() req,
  ) {
    const result = await this.groupSessionService.logAttendance(
      id,
      req.user.sub,
      body.records,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Update session notes',
    description: 'Updates session notes and topics covered. Facilitator only.',
  })
  @ApiParam({ name: 'id', description: 'Group session ID' })
  @ApiResponse({ status: 200, description: 'Session notes updated' })
  @Patch(':id/notes')
  async updateNotes(
    @Param('id') id: string,
    @Body() body: { notes: string; topics?: string[] },
    @Request() req,
  ) {
    const result = await this.groupSessionService.updateNotes(
      id,
      req.user.sub,
      body.notes,
      body.topics,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
