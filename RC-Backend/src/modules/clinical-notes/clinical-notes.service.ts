import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, MeetingChannel } from '../appointments/entities/appointment.entity';
import { Zoom } from '../../common/external/zoom/zoom';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClinicalNotesService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<Appointment>,
  ) {}

  /**
   * Fetch clinical notes from Zoom API and store in appointment record
   * Only works for Zoom meetings
   */
  async fetchZoomClinicalNotes(appointmentId: string) {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.meeting_channel !== MeetingChannel.ZOOM || !appointment.meeting_id) {
      return null;
    }

    try {
      const zoomService = new Zoom();
      const notesResponse = await zoomService.listClinicalNotes(appointment.meeting_id);

      if (!notesResponse.data?.notes || notesResponse.data.notes.length === 0) {
        return [];
      }

      // Map Zoom notes to our schema
      const clinicalNotes = notesResponse.data.notes.map((note: any) => ({
        note_id: note.id,
        content: note.content || '',
        created_at: new Date(note.created_time),
        updated_at: note.modified_time ? new Date(note.modified_time) : undefined,
        completed: note.completed || false,
        created_by: appointment.specialist,
        platform: 'zoom',
      }));

      // Add to appointment's clinical notes
      appointment.clinical_notes = [...(appointment.clinical_notes || []), ...clinicalNotes];
      await appointment.save();

      return clinicalNotes;
    } catch (error) {
      console.error('Failed to fetch Zoom clinical notes:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Create a custom clinical note (works for all meeting channels)
   */
  async createNote(
    appointmentId: string,
    content: string,
    specialistId: string,
    completed: boolean = false,
  ) {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const note = {
      note_id: uuidv4(),
      content,
      created_at: new Date(),
      completed,
      created_by: specialistId,
      platform: 'custom',
    };

    if (!appointment.clinical_notes) {
      appointment.clinical_notes = [];
    }

    appointment.clinical_notes.push(note);
    await appointment.save();

    return note;
  }

  /**
   * Update a clinical note
   * If Zoom note, also sync to Zoom API
   */
  async updateNote(
    appointmentId: string,
    noteId: string,
    updates: { content?: string; completed?: boolean },
  ) {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const noteIndex = appointment.clinical_notes?.findIndex(
      (n: any) => n.note_id === noteId,
    );

    if (noteIndex === -1 || noteIndex === undefined) {
      throw new NotFoundException('Clinical note not found');
    }

    const note = appointment.clinical_notes[noteIndex];

    // Update local record
    if (updates.content !== undefined) {
      note.content = updates.content;
    }
    if (updates.completed !== undefined) {
      note.completed = updates.completed;
    }
    note.updated_at = new Date();

    appointment.clinical_notes[noteIndex] = note;
    await appointment.save();

    // Sync to Zoom if it's a Zoom note
    if (note.platform === 'zoom' && appointment.meeting_channel === MeetingChannel.ZOOM) {
      try {
        const zoomService = new Zoom();
        await zoomService.updateClinicalNote(noteId, updates.completed ?? note.completed);
      } catch (error) {
        console.error('Failed to sync note to Zoom:', error);
        // Continue anyway - local update succeeded
      }
    }

    return note;
  }

  /**
   * Get all clinical notes for a specialist
   */
  async getSpecialistNotes(specialistId: string) {
    const appointments: any = await this.appointmentModel
      .find({
        specialist: specialistId,
        'clinical_notes': { $exists: true, $ne: [] }
      })
      .populate('patient', 'profile.first_name profile.last_name')
      .select('_id start_time meeting_channel clinical_notes status patient')
      .sort({ start_time: -1 })
      .lean();

    if (!appointments || appointments.length === 0) {
      return [];
    }

    // Transform the data to flatten notes with appointment info
    const clinicalNotesWithContext: any[] = [];

    for (const appointment of appointments) {
      if (appointment.clinical_notes && appointment.clinical_notes.length > 0) {
        for (const note of appointment.clinical_notes) {
          clinicalNotesWithContext.push({
            note_id: note.note_id,
            content: note.content,
            created_at: note.created_at,
            updated_at: note.updated_at,
            completed: note.completed,
            platform: note.platform,
            appointment_id: appointment._id,
            appointment_date: appointment.start_time,
            meeting_channel: appointment.meeting_channel,
            patient_name: appointment.patient
              ? `${appointment.patient.profile?.first_name || ''} ${appointment.patient.profile?.last_name || ''}`.trim()
              : 'Unknown Patient'
          });
        }
      }
    }

    // Sort by most recent first
    clinicalNotesWithContext.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return clinicalNotesWithContext;
  }

  /**
   * Get all clinical notes for an appointment
   */
  async getNotes(appointmentId: string) {
    const appointment = await this.appointmentModel
      .findById(appointmentId)
      .populate('clinical_notes.created_by', 'profile.first_name profile.last_name');

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment.clinical_notes || [];
  }

  /**
   * Delete a clinical note (custom notes only)
   */
  async deleteNote(appointmentId: string, noteId: string) {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const noteIndex = appointment.clinical_notes?.findIndex(
      (n: any) => n.note_id === noteId,
    );

    if (noteIndex === -1 || noteIndex === undefined) {
      throw new NotFoundException('Clinical note not found');
    }

    const note = appointment.clinical_notes[noteIndex];

    // Only allow deletion of custom notes
    if (note.platform !== 'custom') {
      throw new Error('Cannot delete notes from external platforms');
    }

    appointment.clinical_notes.splice(noteIndex, 1);
    await appointment.save();

    return { message: 'Clinical note deleted successfully' };
  }
}
