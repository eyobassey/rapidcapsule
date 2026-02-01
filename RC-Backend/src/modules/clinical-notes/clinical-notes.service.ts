import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, MeetingChannel } from '../appointments/entities/appointment.entity';
import { Zoom } from '../../common/external/zoom/zoom';
import { v4 as uuidv4 } from 'uuid';
import { CreateStructuredNoteDto, UpdateStructuredNoteDto } from './dto/create-structured-note.dto';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Injectable()
export class ClinicalNotesService {
  private readonly logger = new Logger(ClinicalNotesService.name);

  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<Appointment>,
    private readonly fileUploadHelper: FileUploadHelper,
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
      return { result: null };
    }

    try {
      const zoomService = new Zoom();
      const notesResponse = await zoomService.listClinicalNotes(appointment.meeting_id);

      if (!notesResponse.data?.notes || notesResponse.data.notes.length === 0) {
        return { result: [] };
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
      await appointment.save({ validateBeforeSave: false });

      return { result: clinicalNotes };
    } catch (error) {
      console.error('Failed to fetch Zoom clinical notes:', error.response?.data || error.message);
      return { result: null };
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
    await appointment.save({ validateBeforeSave: false });

    return { result: note };
  }

  /**
   * Create a structured clinical note with medical documentation format
   */
  async createStructuredNote(
    appointmentId: string,
    noteData: CreateStructuredNoteDto,
    specialistId: string,
  ) {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Generate content summary for backward compatibility
    const contentSummary = this.generateContentSummary(noteData);

    const note = {
      note_id: uuidv4(),
      content: contentSummary, // Auto-generated summary
      created_at: new Date(),
      completed: noteData.completed ?? !noteData.is_draft,
      created_by: specialistId,
      platform: 'custom',

      // Structured fields
      chief_complaint: noteData.chief_complaint,
      history_of_present_illness: noteData.history_of_present_illness,
      physical_examination: noteData.physical_examination,
      assessment_diagnosis: noteData.assessment_diagnosis,
      treatment_plan: noteData.treatment_plan,
      additional_notes: noteData.additional_notes,

      // Metadata
      is_draft: noteData.is_draft ?? true,
      confirmed_accurate: noteData.confirmed_accurate ?? false,
      version: 1,
    };

    if (!appointment.clinical_notes) {
      appointment.clinical_notes = [];
    }

    appointment.clinical_notes.push(note);
    await appointment.save({ validateBeforeSave: false });

    return { result: note };
  }

  /**
   * Update a structured clinical note
   */
  async updateStructuredNote(
    appointmentId: string,
    noteId: string,
    noteData: UpdateStructuredNoteDto,
    specialistId: string,
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

    // Update fields
    if (noteData.chief_complaint !== undefined) {
      note.chief_complaint = noteData.chief_complaint;
    }
    if (noteData.history_of_present_illness !== undefined) {
      note.history_of_present_illness = noteData.history_of_present_illness;
    }
    if (noteData.physical_examination !== undefined) {
      note.physical_examination = {
        ...note.physical_examination,
        ...noteData.physical_examination,
        vital_signs: {
          ...note.physical_examination?.vital_signs,
          ...noteData.physical_examination?.vital_signs,
        },
      };
    }
    if (noteData.assessment_diagnosis !== undefined) {
      note.assessment_diagnosis = {
        ...note.assessment_diagnosis,
        ...noteData.assessment_diagnosis,
      };
    }
    if (noteData.treatment_plan !== undefined) {
      note.treatment_plan = {
        ...note.treatment_plan,
        ...noteData.treatment_plan,
      };
    }
    if (noteData.additional_notes !== undefined) {
      note.additional_notes = noteData.additional_notes;
    }
    if (noteData.is_draft !== undefined) {
      note.is_draft = noteData.is_draft;
    }
    if (noteData.confirmed_accurate !== undefined) {
      note.confirmed_accurate = noteData.confirmed_accurate;
    }
    if (noteData.completed !== undefined) {
      note.completed = noteData.completed;
    }

    // Regenerate content summary
    note.content = this.generateContentSummary({
      chief_complaint: note.chief_complaint,
      assessment_diagnosis: note.assessment_diagnosis,
      treatment_plan: note.treatment_plan,
    } as CreateStructuredNoteDto);

    note.updated_at = new Date();
    note.version = (note.version || 1) + 1;

    appointment.clinical_notes[noteIndex] = note;
    await appointment.save({ validateBeforeSave: false });

    return { result: note };
  }

  /**
   * Generate a text summary from structured data for backward compatibility
   */
  private generateContentSummary(noteData: CreateStructuredNoteDto): string {
    const parts: string[] = [];

    if (noteData.chief_complaint) {
      parts.push(`Chief Complaint: ${noteData.chief_complaint}`);
    }
    if (noteData.assessment_diagnosis?.primary_diagnosis) {
      parts.push(`Diagnosis: ${noteData.assessment_diagnosis.primary_diagnosis}`);
    }
    if (noteData.treatment_plan?.follow_up_required) {
      parts.push(`Follow-up: ${noteData.treatment_plan.follow_up_required}`);
    }

    return parts.join(' | ') || 'Clinical note recorded';
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
    await appointment.save({ validateBeforeSave: false });

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

    return { result: note };
  }

  /**
   * Get all clinical notes for a specialist
   */
  async getSpecialistNotes(specialistId: string) {
    const appointments: any = await this.appointmentModel
      .find({
        specialist: new Types.ObjectId(specialistId),
        'clinical_notes': { $exists: true, $ne: [] }
      })
      .populate('patient', 'profile.first_name profile.last_name')
      .populate('specialist', 'profile.first_name profile.last_name profile.profile_image profile.profile_photo profile.specialty')
      .select('_id start_time meeting_channel clinical_notes status patient specialist')
      .sort({ start_time: -1 })
      .lean();

    if (!appointments || appointments.length === 0) {
      return { result: [] };
    }

    // Transform the data to flatten notes with appointment info
    const clinicalNotesWithContext: any[] = [];

    // Cache presigned URLs by specialist ID to avoid re-generating
    const specialistImageCache = new Map<string, string | null>();

    for (const appointment of appointments) {
      if (appointment.clinical_notes && appointment.clinical_notes.length > 0) {
        const specialistProfile = appointment.specialist?.profile;
        const specialistName = specialistProfile
          ? `${specialistProfile.first_name || ''} ${specialistProfile.last_name || ''}`.trim()
          : 'Unknown';
        const rawSpecialistImage = specialistProfile?.profile_image || specialistProfile?.profile_photo || null;

        // Get or generate presigned URL for specialist image
        let specialistImage: string | null = null;
        const specialistIdStr = appointment.specialist?._id?.toString();

        if (specialistIdStr && specialistImageCache.has(specialistIdStr)) {
          specialistImage = specialistImageCache.get(specialistIdStr) ?? null;
        } else if (rawSpecialistImage) {
          try {
            specialistImage = await this.fileUploadHelper.resolveProfileImage(rawSpecialistImage);
            if (specialistIdStr) {
              specialistImageCache.set(specialistIdStr, specialistImage);
            }
          } catch (err) {
            this.logger.warn(`Failed to resolve specialist profile image: ${err.message}`);
            if (specialistIdStr) {
              specialistImageCache.set(specialistIdStr, null);
            }
          }
        }

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
            patient_id: appointment.patient?._id,
            patient_name: appointment.patient
              ? `${appointment.patient.profile?.first_name || ''} ${appointment.patient.profile?.last_name || ''}`.trim()
              : 'Unknown Patient',
            specialist_id: appointment.specialist?._id,
            specialist_name: specialistName,
            specialist_image: specialistImage,
            specialist_specialty: specialistProfile?.specialty || null,
          });
        }
      }
    }

    // Sort by most recent first
    clinicalNotesWithContext.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { result: clinicalNotesWithContext };
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

    return { result: appointment.clinical_notes || [] };
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
    await appointment.save({ validateBeforeSave: false });

    return { message: 'Clinical note deleted successfully' };
  }
}
