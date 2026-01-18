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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clinical-notes')
@UseGuards(JwtAuthGuard)
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Get('specialist')
  async getSpecialistNotes(@Request() req: any) {
    return this.clinicalNotesService.getSpecialistNotes(req.user.userId);
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
      req.user.userId,
      createNoteDto.completed,
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
