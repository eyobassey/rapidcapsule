import {
  Controller,
  Post,
  Get,
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
import { PeerSupportService } from '../services/peer-support.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - Peer Support')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/peer-support')
export class PeerSupportController {
  constructor(private readonly peerSupportService: PeerSupportService) {}

  @ApiOperation({
    summary: 'Create a peer assignment',
    description: 'Assigns a peer supporter to a patient. Typically done by a specialist.',
  })
  @ApiResponse({ status: 201, description: 'Peer assignment created' })
  @Post()
  async assign(
    @Body()
    dto: {
      patient_id: string;
      peer_supporter_id: string;
      check_in_schedule?: {
        frequency?: string;
        preferred_time?: string;
        preferred_method?: string;
      };
    },
    @Request() req,
  ) {
    const result = await this.peerSupportService.assign(dto, req.user.sub);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'List my peer assignments',
    description: 'Returns peer assignments for the authenticated user, either as patient or supporter.',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['patient', 'supporter'],
    description: 'View as patient or supporter (default: patient)',
  })
  @ApiQuery({
    name: 'include_ended',
    required: false,
    type: Boolean,
    description: 'Include ended assignments (default: false)',
  })
  @ApiResponse({ status: 200, description: 'Peer assignments returned' })
  @Get()
  async list(
    @Query('role') role: 'patient' | 'supporter',
    @Query('include_ended') includeEnded: string,
    @Request() req,
  ) {
    const result = await this.peerSupportService.list(
      req.user.sub,
      role || 'patient',
      includeEnded === 'true',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get peer assignment details',
    description: 'Returns full details of a peer assignment including check-in history.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment details returned' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.peerSupportService.getById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Give consent to activate assignment',
    description: 'Patient or peer gives consent to activate the assignment. Both must consent before it becomes active.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Consent recorded' })
  @Post(':id/consent')
  async activate(
    @Param('id') id: string,
    @Body() body: { role: 'patient' | 'peer' },
    @Request() req,
  ) {
    const result = await this.peerSupportService.activate(
      id,
      req.user.sub,
      body.role,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'End a peer assignment',
    description: 'Ends an active peer assignment with an optional reason.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment ended' })
  @Post(':id/end')
  async end(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const result = await this.peerSupportService.end(
      id,
      req.user.sub,
      body.reason,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Log a peer check-in',
    description: 'Records a check-in between patient and peer supporter, with optional mood tracking.',
  })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Check-in logged' })
  @Post(':id/check-in')
  async logCheckIn(
    @Param('id') id: string,
    @Body()
    body: {
      method?: string;
      notes?: string;
      mood_before?: number;
      mood_after?: number;
    },
    @Request() req,
  ) {
    const result = await this.peerSupportService.logCheckIn(
      id,
      req.user.sub,
      body,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }
}
