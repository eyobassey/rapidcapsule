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
import { ClinicalNotesService } from './clinical-notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  CreateStructuredNoteDto,
  UpdateStructuredNoteDto,
} from './dto/create-structured-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clinical-notes')
@UseGuards(JwtAuthGuard)
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Get('specialist')
  async getSpecialistNotes(@Request() req: any) {
    return this.clinicalNotesService.getSpecialistNotes(req.user.sub);
  }

  @Get('appointment/:appointmentId')
  async getNotes(@Param('appointmentId') appointmentId: string) {
    return this.clinicalNotesService.getNotes(appointmentId);
  }

  @Post('fetch-zoom/:appointmentId')
  async fetchZoomNotes(@Param('appointmentId') appointmentId: string) {
    return this.clinicalNotesService.fetchZoomClinicalNotes(appointmentId);
  }

  @Post()
  async createNote(@Body() createNoteDto: CreateNoteDto, @Request() req: any) {
    return this.clinicalNotesService.createNote(
      createNoteDto.appointmentId,
      createNoteDto.content,
      req.user.sub,
      createNoteDto.completed,
    );
  }

  /**
   * Create a structured clinical note with medical documentation format
   */
  @Post('structured')
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

  /**
   * Update a structured clinical note
   */
  @Patch('structured/:appointmentId/:noteId')
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
  async updateNote(
    @Param('appointmentId') appointmentId: string,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.clinicalNotesService.updateNote(appointmentId, noteId, updateNoteDto);
  }

  @Delete(':appointmentId/:noteId')
  async deleteNote(
    @Param('appointmentId') appointmentId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.clinicalNotesService.deleteNote(appointmentId, noteId);
  }
}
