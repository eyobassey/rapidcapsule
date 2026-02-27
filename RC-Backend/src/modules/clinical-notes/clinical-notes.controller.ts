import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ClinicalNotesService } from './clinical-notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  CreateStructuredNoteDto,
  UpdateStructuredNoteDto,
} from './dto/create-structured-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Clinical Notes')
@ApiBearerAuth('JWT-auth')
@Controller('clinical-notes')
@UseGuards(JwtAuthGuard)
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Get('specialist')
  @ApiOperation({ summary: "Get specialist's clinical notes" })
  @ApiResponse({ status: 200, description: 'Returns all clinical notes authored by the authenticated specialist' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  async getSpecialistNotes(@Request() req: any) {
    return this.clinicalNotesService.getSpecialistNotes(req.user.sub);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get clinical notes for an appointment' })
  @ApiParam({ name: 'appointmentId', description: 'ID of the appointment', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Returns all clinical notes associated with the appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getNotes(@Param('appointmentId') appointmentId: string) {
    return this.clinicalNotesService.getNotes(appointmentId);
  }

  @Post('fetch-zoom/:appointmentId')
  @ApiOperation({ summary: 'Fetch Zoom meeting notes for an appointment' })
  @ApiParam({ name: 'appointmentId', description: 'ID of the appointment with a Zoom meeting', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Zoom clinical notes fetched and stored successfully' })
  @ApiResponse({ status: 404, description: 'Appointment or Zoom meeting not found' })
  async fetchZoomNotes(@Param('appointmentId') appointmentId: string) {
    return this.clinicalNotesService.fetchZoomClinicalNotes(appointmentId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a clinical note' })
  @ApiResponse({ status: 201, description: 'Clinical note created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - missing required fields' })
  async createNote(@Body() createNoteDto: CreateNoteDto, @Request() req: any) {
    return this.clinicalNotesService.createNote(
      createNoteDto.appointmentId,
      createNoteDto.content,
      req.user.sub,
      createNoteDto.completed,
    );
  }

  @Post('structured')
  @ApiOperation({ summary: 'Create a structured clinical note' })
  @ApiResponse({ status: 201, description: 'Structured clinical note created with SOAP-format documentation' })
  @ApiResponse({ status: 400, description: 'Validation error - missing required fields or invalid nested objects' })
  async createStructuredNote(
    @Body() createNoteDto: CreateStructuredNoteDto,
    @Request() req: any,
  ) {
    return this.clinicalNotesService.createStructuredNote(
      createNoteDto.appointmentId,
      createNoteDto,
      req.user.sub,
    );
  }

  @Patch('structured/:appointmentId/:noteId')
  @ApiOperation({ summary: 'Update a structured clinical note' })
  @ApiParam({ name: 'appointmentId', description: 'ID of the appointment', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'noteId', description: 'ID of the structured clinical note to update', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 200, description: 'Structured clinical note updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment or note not found' })
  async updateStructuredNote(
    @Param('appointmentId') appointmentId: string,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateStructuredNoteDto,
    @Request() req: any,
  ) {
    return this.clinicalNotesService.updateStructuredNote(
      appointmentId,
      noteId,
      updateNoteDto,
      req.user.sub,
    );
  }

  @Patch(':appointmentId/:noteId')
  @ApiOperation({ summary: 'Update a clinical note' })
  @ApiParam({ name: 'appointmentId', description: 'ID of the appointment', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'noteId', description: 'ID of the clinical note to update', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 200, description: 'Clinical note updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment or note not found' })
  async updateNote(
    @Param('appointmentId') appointmentId: string,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.clinicalNotesService.updateNote(appointmentId, noteId, updateNoteDto);
  }

  @Delete(':appointmentId/:noteId')
  @ApiOperation({ summary: 'Delete a clinical note' })
  @ApiParam({ name: 'appointmentId', description: 'ID of the appointment', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'noteId', description: 'ID of the clinical note to delete', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 200, description: 'Clinical note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment or note not found' })
  async deleteNote(
    @Param('appointmentId') appointmentId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.clinicalNotesService.deleteNote(appointmentId, noteId);
  }
}
