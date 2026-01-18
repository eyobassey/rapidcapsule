import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicalNotesController } from './clinical-notes.controller';
import { ClinicalNotesService } from './clinical-notes.service';
import { NoteTemplatesController } from './note-templates.controller';
import { NoteTemplatesService } from './note-templates.service';
import { Appointment, AppointmentSchema } from '../appointments/entities/appointment.entity';
import { NoteTemplate, NoteTemplateSchema } from './entities/note-template.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: NoteTemplate.name, schema: NoteTemplateSchema },
    ]),
  ],
  controllers: [NoteTemplatesController, ClinicalNotesController],
  providers: [ClinicalNotesService, NoteTemplatesService],
  exports: [ClinicalNotesService, NoteTemplatesService],
})
export class ClinicalNotesModule {}
