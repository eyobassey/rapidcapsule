import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ZoomWebhook,
  ZoomWebhookDocument,
  ZoomWebhookEventType,
  ZoomWebhookStatus,
} from '../entities/zoom-webhook.entity';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
  AttendanceStatus,
  RecordingStatus,
} from '../../appointments/entities/appointment.entity';
import { Zoom, ZoomParticipant } from '../../../common/external/zoom/zoom';
import { AppointmentEscrowService } from '../../accounting/services/appointment-escrow.service';

@Injectable()
export class ZoomWebhookService {
  private readonly logger = new Logger(ZoomWebhookService.name);

  constructor(
    @InjectModel(ZoomWebhook.name) private zoomWebhookModel: Model<ZoomWebhookDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private readonly zoom: Zoom,
    private readonly appointmentEscrowService: AppointmentEscrowService,
  ) {}

  /**
   * Store and process incoming Zoom webhook event
   */
  async handleWebhookEvent(eventType: string, payload: any): Promise<void> {
    // Extract meeting ID - different webhooks use different field names
    const meetingId = payload?.object?.id?.toString() || payload?.object?.meeting_id?.toString() || '';
    const meetingUuid = payload?.object?.uuid || payload?.object?.meeting_uuid || '';

    // Store webhook for audit/replay
    const webhook = await this.zoomWebhookModel.create({
      event_type: eventType,
      event_ts: payload?.event_ts,
      meeting_id: meetingId,
      meeting_uuid: meetingUuid,
      payload,
      status: ZoomWebhookStatus.PENDING,
    });

    try {
      await this.processEvent(eventType, payload, webhook);
      webhook.status = ZoomWebhookStatus.PROCESSED;
      webhook.processed_at = new Date();
    } catch (error) {
      this.logger.error(`Failed to process Zoom webhook ${eventType}:`, error);
      webhook.status = ZoomWebhookStatus.FAILED;
      webhook.error_message = error.message;
      webhook.retry_count += 1;
    }

    await webhook.save();
  }

  /**
   * Process specific webhook event types
   */
  private async processEvent(
    eventType: string,
    payload: any,
    webhook: ZoomWebhookDocument,
  ): Promise<void> {
    // Different Zoom webhooks use different field names for meeting ID
    // - Most events: payload.object.id
    // - meeting.summary_completed: payload.object.meeting_id
    // - recording events: payload.object.id or payload.object.meeting_id
    const meetingId = (
      payload?.object?.id?.toString() ||
      payload?.object?.meeting_id?.toString()
    );

    if (!meetingId) {
      this.logger.warn(`No meeting ID in webhook payload for event ${eventType}`);
      this.logger.warn(`Payload object keys: ${Object.keys(payload?.object || {}).join(', ')}`);
      webhook.status = ZoomWebhookStatus.IGNORED;
      return;
    }

    // Find appointment by meeting_id and populate patient/specialist for email matching
    const appointment = await this.appointmentModel
      .findOne({ meeting_id: meetingId })
      .populate('patient', 'profile.contact.email profile.first_name profile.last_name')
      .populate('specialist', 'profile.contact.email profile.first_name profile.last_name');

    if (!appointment) {
      this.logger.warn(`No appointment found for meeting ID ${meetingId}`);
      webhook.status = ZoomWebhookStatus.IGNORED;
      return;
    }

    this.logger.log(`Processing ${eventType} for appointment ${appointment._id}, patient email: ${(appointment.patient as any)?.profile?.contact?.email}, specialist email: ${(appointment.specialist as any)?.profile?.contact?.email}`);

    switch (eventType) {
      case ZoomWebhookEventType.MEETING_STARTED:
        await this.handleMeetingStarted(appointment, payload);
        break;

      case ZoomWebhookEventType.MEETING_ENDED:
        await this.handleMeetingEnded(appointment, payload);
        break;

      case ZoomWebhookEventType.PARTICIPANT_JOINED:
        await this.handleParticipantJoined(appointment, payload);
        break;

      case ZoomWebhookEventType.PARTICIPANT_LEFT:
        await this.handleParticipantLeft(appointment, payload);
        break;

      case ZoomWebhookEventType.RECORDING_COMPLETED:
        await this.handleRecordingCompleted(appointment, payload);
        break;

      case ZoomWebhookEventType.RECORDING_TRANSCRIPT_COMPLETED:
        await this.handleTranscriptCompleted(appointment, payload);
        break;

      case ZoomWebhookEventType.MEETING_SUMMARY_COMPLETED:
        await this.handleMeetingSummaryCompleted(appointment, payload);
        break;

      default:
        this.logger.log(`Unhandled event type: ${eventType}`);
        webhook.status = ZoomWebhookStatus.IGNORED;
    }
  }

  /**
   * Handle meeting.started event
   */
  private async handleMeetingStarted(
    appointment: AppointmentDocument,
    payload: any,
  ): Promise<void> {
    const startTime = payload?.object?.start_time;
    const uuid = payload?.object?.uuid;

    this.logger.log(`Meeting started for appointment ${appointment._id}, UUID: ${uuid}`);

    await this.appointmentModel.updateOne(
      { _id: appointment._id },
      {
        status: AppointmentStatus.ONGOING,
        'meeting_platform_data.zoom_meeting_uuid': uuid,
        'meeting_platform_data.actual_start_time': startTime ? new Date(startTime) : new Date(),
      },
    );
  }

  /**
   * Handle meeting.ended event
   */
  private async handleMeetingEnded(
    appointment: AppointmentDocument,
    payload: any,
  ): Promise<void> {
    const endTime = payload?.object?.end_time;
    const duration = payload?.object?.duration;
    const uuid = payload?.object?.uuid;

    this.logger.log(`Meeting ended for appointment ${appointment._id}, duration: ${duration} mins, uuid: ${uuid}`);

    // Log patient/specialist emails for debugging
    const patientEmail = (appointment.patient as any)?.profile?.contact?.email;
    const specialistEmail = (appointment.specialist as any)?.profile?.contact?.email;
    this.logger.log(`Appointment emails - Patient: ${patientEmail}, Specialist: ${specialistEmail}`);

    // Fetch actual participants from Zoom API
    let participants: ZoomParticipant[] = [];
    try {
      const meetingIdToUse = uuid || appointment.meeting_id;
      this.logger.log(`Fetching participants for meeting: ${meetingIdToUse}`);
      participants = await this.zoom.getPastMeetingParticipants(meetingIdToUse);
      this.logger.log(`Zoom API returned ${participants.length} participants`);

      // Log participant details for debugging
      participants.forEach((p, i) => {
        this.logger.log(`Participant ${i + 1}: name="${p.name}", email="${p.user_email}", duration=${p.duration}min`);
      });
    } catch (error) {
      this.logger.warn(`Could not fetch participants: ${error.message}`);
    }

    // Determine attendance status based on participants (pass duration for fallback logic)
    const attendanceStatus = this.determineAttendanceStatus(appointment, participants, duration);
    this.logger.log(`Determined attendance status: ${attendanceStatus}`);

    // Map participants to our schema
    const mappedParticipants = participants.map((p) => ({
      participant_id: p.id || p.user_id,
      name: p.name,
      email: p.user_email,
      user_type: this.determineUserType(appointment, p.user_email),
      join_time: p.join_time ? new Date(p.join_time) : null,
      leave_time: p.leave_time ? new Date(p.leave_time) : null,
      duration_minutes: p.duration,
    }));

    // Determine final status based on attendance and duration
    const finalStatus = this.determineFinalStatus(attendanceStatus, participants.length, duration);
    this.logger.log(`Final status for appointment: ${finalStatus}`);

    await this.appointmentModel.updateOne(
      { _id: appointment._id },
      {
        status: finalStatus,
        'meeting_platform_data.actual_end_time': endTime ? new Date(endTime) : new Date(),
        'meeting_platform_data.actual_duration_minutes': duration,
        'attendance.attendance_status': attendanceStatus,
        participants: mappedParticipants,
        'call_duration.time_taken': duration || 0,
        'call_duration.unit': 'Minutes',
        'call_duration.formatted_string': `${duration || 0} Minutes`,
      },
    );

    // Settle escrow if funds were held (release to specialist and platform)
    if (appointment.escrow?.status === 'held') {
      const settlementType = finalStatus === AppointmentStatus.COMPLETED ? 'completed' : 'no_show';
      try {
        const settleBatch = await this.appointmentEscrowService.settleAppointmentFunds({
          appointment_id: appointment._id.toString(),
          settlement_type: settlementType,
        });
        this.logger.log(`Escrow settled (${settlementType}) for appointment ${appointment._id}. Batch: ${settleBatch.batch_id}`);

        // Update appointment with settlement details
        await this.appointmentModel.updateOne(
          { _id: appointment._id },
          {
            'escrow.status': 'settled',
            'escrow.settled_at': new Date(),
            'escrow.settlement_batch_id': settleBatch.batch_id,
            'escrow.settlement_type': settlementType,
          },
        );
      } catch (escrowError) {
        this.logger.error(`Failed to settle escrow for appointment ${appointment._id}: ${escrowError.message}`);
        // Continue - the scheduled task will retry settlement later
      }
    }
  }

  /**
   * Handle meeting.participant_joined event
   */
  private async handleParticipantJoined(
    appointment: AppointmentDocument,
    payload: any,
  ): Promise<void> {
    const participant = payload?.object?.participant;
    const email = participant?.email;
    const joinTime = participant?.join_time || new Date();

    this.logger.log(`Participant joined: ${participant?.user_name} (${email})`);

    const userType = this.determineUserType(appointment, email);
    const updateFields: any = {};

    if (userType === 'patient') {
      updateFields['attendance.patient_joined'] = true;
      updateFields['attendance.patient_joined_at'] = new Date(joinTime);
    } else if (userType === 'specialist') {
      updateFields['attendance.specialist_joined'] = true;
      updateFields['attendance.specialist_joined_at'] = new Date(joinTime);
    }

    // Check if both have now joined
    const currentAttendance = appointment.attendance || {};
    const patientJoined = userType === 'patient' || currentAttendance.patient_joined;
    const specialistJoined = userType === 'specialist' || currentAttendance.specialist_joined;

    if (patientJoined && specialistJoined) {
      updateFields['attendance.both_joined'] = true;
      updateFields['attendance.attendance_status'] = AttendanceStatus.BOTH;
    } else if (patientJoined) {
      updateFields['attendance.attendance_status'] = AttendanceStatus.PATIENT_ONLY;
    } else if (specialistJoined) {
      updateFields['attendance.attendance_status'] = AttendanceStatus.SPECIALIST_ONLY;
    }

    // Add to participants array
    await this.appointmentModel.updateOne(
      { _id: appointment._id },
      {
        $set: updateFields,
        $push: {
          participants: {
            participant_id: participant?.participant_uuid || participant?.id,
            name: participant?.user_name,
            email: email,
            user_type: userType,
            join_time: new Date(joinTime),
          },
        },
      },
    );
  }

  /**
   * Handle meeting.participant_left event
   */
  private async handleParticipantLeft(
    appointment: AppointmentDocument,
    payload: any,
  ): Promise<void> {
    const participant = payload?.object?.participant;
    const email = participant?.email;
    const leaveTime = participant?.leave_time || new Date();

    this.logger.log(`Participant left: ${participant?.user_name} (${email})`);

    const userType = this.determineUserType(appointment, email);
    const updateFields: any = {};

    if (userType === 'patient') {
      updateFields['attendance.patient_left_at'] = new Date(leaveTime);
    } else if (userType === 'specialist') {
      updateFields['attendance.specialist_left_at'] = new Date(leaveTime);
    }

    // Update leave time in participants array
    await this.appointmentModel.updateOne(
      {
        _id: appointment._id,
        'participants.email': email,
      },
      {
        $set: {
          ...updateFields,
          'participants.$.leave_time': new Date(leaveTime),
        },
      },
    );
  }

  /**
   * Handle recording.completed event
   */
  private async handleRecordingCompleted(
    appointment: AppointmentDocument,
    payload: any,
  ): Promise<void> {
    const object = payload?.object;
    const recordingFiles = object?.recording_files || [];
    const shareUrl = object?.share_url;
    const password = object?.password;
    const duration = object?.duration;
    const meetingUuid = object?.uuid || appointment.meeting_platform_data?.zoom_meeting_uuid;
    const meetingId = object?.id?.toString() || appointment.meeting_id;

    this.logger.log(`Recording completed for appointment ${appointment._id}`);

    // Find the main video recording file
    const videoRecording = recordingFiles.find(
      (f: any) => f.recording_type === 'shared_screen_with_speaker_view' || f.file_type === 'MP4',
    );

    // Find transcript file if available
    const transcriptFile = recordingFiles.find(
      (f: any) => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript',
    );

    // Update recording info
    const updateFields: any = {
      'recording.recording_url': shareUrl,
      'recording.recording_password': password,
      'recording.recording_download_url': videoRecording?.download_url,
      'recording.recording_duration_minutes': duration,
      'recording.recording_file_size': videoRecording?.file_size?.toString(),
      'recording.recording_status': RecordingStatus.AVAILABLE,
      'recording.recording_expires_at': this.calculateRecordingExpiry(),
    };

    // Add transcript info if available
    if (transcriptFile) {
      this.logger.log(`Transcript found for appointment ${appointment._id}`);
      updateFields['transcript.transcript_url'] = transcriptFile.download_url;
      updateFields['transcript.transcript_status'] = 'available';

      // Try to download and parse transcript content
      try {
        const transcriptContent = await this.zoom.downloadTranscriptContent(transcriptFile.download_url);
        if (transcriptContent) {
          updateFields['transcript.transcript_text'] = transcriptContent;
          this.logger.log(`Transcript content downloaded for appointment ${appointment._id}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to download transcript content: ${error.message}`);
      }
    }

    // Try to fetch meeting summary (AI-generated by Zoom if enabled)
    try {
      const meetingIdToUse = meetingUuid || meetingId;
      const summary = await this.zoom.getMeetingSummary(meetingIdToUse);
      if (summary?.summary) {
        this.logger.log(`Meeting summary found for appointment ${appointment._id}`);
        updateFields['meeting_summary.summary'] = summary.summary;
        updateFields['meeting_summary.next_steps'] = summary.next_steps || [];
        updateFields['meeting_summary.ai_generated'] = true;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch meeting summary: ${error.message}`);
    }

    await this.appointmentModel.updateOne({ _id: appointment._id }, updateFields);
  }

  /**
   * Handle recording.transcript_completed event
   */
  private async handleTranscriptCompleted(
    appointment: AppointmentDocument,
    payload: any,
  ): Promise<void> {
    const object = payload?.object;
    const recordingFiles = object?.recording_files || [];

    this.logger.log(`Transcript completed for appointment ${appointment._id}`);

    // Find transcript file
    const transcriptFile = recordingFiles.find(
      (f: any) => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript',
    );

    if (!transcriptFile) {
      this.logger.warn(`No transcript file found in payload for appointment ${appointment._id}`);
      return;
    }

    const updateFields: any = {
      'transcript.transcript_url': transcriptFile.download_url,
      'transcript.transcript_status': 'available',
    };

    // Try to download and parse transcript content
    try {
      const transcriptContent = await this.zoom.downloadTranscriptContent(transcriptFile.download_url);
      if (transcriptContent) {
        updateFields['transcript.transcript_text'] = transcriptContent;
        this.logger.log(`Transcript content downloaded for appointment ${appointment._id}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to download transcript content: ${error.message}`);
      updateFields['transcript.transcript_status'] = 'failed';
    }

    await this.appointmentModel.updateOne({ _id: appointment._id }, updateFields);
  }

  /**
   * Handle meeting.summary_completed event
   * Fired when Zoom AI Companion finishes generating the meeting summary
   */
  private async handleMeetingSummaryCompleted(
    appointment: AppointmentDocument,
    payload: any,
  ): Promise<void> {
    const object = payload?.object;
    const meetingUuid = object?.meeting_uuid || object?.uuid || appointment.meeting_platform_data?.zoom_meeting_uuid;
    const meetingId = object?.meeting_id?.toString() || object?.id?.toString() || appointment.meeting_id;

    this.logger.log(`Meeting summary completed for appointment ${appointment._id}, meeting: ${meetingId}`);

    // Extract summary data from webhook payload
    const summaryTitle = object?.summary_title;
    const summaryCreatedTime = object?.summary_created_time;

    // The summary content might be in the payload directly (some Zoom plans)
    const summaryData = object?.summary_details || object?.meeting_summary || payload?.meeting_summary;

    const updateFields: any = {
      'meeting_summary.ai_generated': true,
      'meeting_summary.summary_status': 'available',
      'meeting_summary.created_at': summaryCreatedTime ? new Date(summaryCreatedTime) : new Date(),
    };

    if (summaryTitle) {
      updateFields['meeting_summary.title'] = summaryTitle;
    }

    if (summaryData?.summary_overview || summaryData?.summary) {
      // Summary content included in webhook payload
      this.logger.log('Summary content found in webhook payload');
      updateFields['meeting_summary.summary'] = summaryData.summary_overview || summaryData.summary;
      updateFields['meeting_summary.next_steps'] = summaryData.next_steps || [];
    } else {
      // Try to fetch summary from Zoom API (requires double-encoding for UUIDs)
      try {
        const meetingIdToUse = meetingUuid || meetingId;
        this.logger.log(`Fetching summary from API for meeting: ${meetingIdToUse}`);
        const summary = await this.zoom.getMeetingSummary(meetingIdToUse);

        if (summary?.summary) {
          this.logger.log(`Meeting summary content retrieved for appointment ${appointment._id}`);
          updateFields['meeting_summary.summary'] = summary.summary;
          updateFields['meeting_summary.next_steps'] = summary.next_steps || [];
        } else {
          // Zoom API returned metadata but not content - common limitation
          this.logger.log(`Summary generated but content not available via API for appointment ${appointment._id}`);
          // Mark as available so UI can show it's generated (viewable in Zoom)
          updateFields['meeting_summary.summary'] = 'AI meeting summary has been generated. View the full summary in your Zoom account.';
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch meeting summary: ${error.message}`);
        // Still mark as available since webhook confirmed it was generated
        updateFields['meeting_summary.summary'] = 'AI meeting summary has been generated. View the full summary in your Zoom account.';
      }
    }

    await this.appointmentModel.updateOne({ _id: appointment._id }, { $set: updateFields });
    this.logger.log(`Meeting summary saved for appointment ${appointment._id}`);
  }

  /**
   * Determine user type based on email matching
   */
  private determineUserType(
    appointment: AppointmentDocument,
    email: string,
  ): 'patient' | 'specialist' | 'unknown' {
    if (!email) return 'unknown';

    // Get populated user emails if available
    const patientEmail = (appointment.patient as any)?.profile?.contact?.email;
    const specialistEmail = (appointment.specialist as any)?.profile?.contact?.email;

    if (patientEmail && email.toLowerCase() === patientEmail.toLowerCase()) {
      return 'patient';
    }
    if (specialistEmail && email.toLowerCase() === specialistEmail.toLowerCase()) {
      return 'specialist';
    }

    return 'unknown';
  }

  /**
   * Determine attendance status from participants list
   * Returns strict attendance - only marks specific status if emails can be matched
   */
  private determineAttendanceStatus(
    appointment: AppointmentDocument,
    participants: any[],
    meetingDuration?: number,
  ): AttendanceStatus {
    // If no participants from API but meeting had duration, mark as unknown
    if (participants.length === 0) {
      if (meetingDuration && meetingDuration > 0) {
        this.logger.log('No participants from API but meeting had duration - marking as UNKNOWN');
        return AttendanceStatus.UNKNOWN;
      }
      return AttendanceStatus.NONE;
    }

    let patientJoined = false;
    let specialistJoined = false;
    let unmatchedCount = 0;

    for (const p of participants) {
      const userType = this.determineUserType(appointment, p.user_email);
      this.logger.log(`Participant "${p.name}" (${p.user_email}) determined as: ${userType}`);
      if (userType === 'patient') patientJoined = true;
      else if (userType === 'specialist') specialistJoined = true;
      else unmatchedCount++;
    }

    // If we matched both, return BOTH
    if (patientJoined && specialistJoined) return AttendanceStatus.BOTH;

    // If we matched only one party
    if (patientJoined) {
      // If there are unmatched participants, the other could be the specialist
      return unmatchedCount > 0 ? AttendanceStatus.UNKNOWN : AttendanceStatus.PATIENT_ONLY;
    }
    if (specialistJoined) {
      // If there are unmatched participants, the other could be the patient
      return unmatchedCount > 0 ? AttendanceStatus.UNKNOWN : AttendanceStatus.SPECIALIST_ONLY;
    }

    // Participants exist but couldn't match any emails - meeting happened but unknown who
    return AttendanceStatus.UNKNOWN;
  }

  /**
   * Determine final appointment status based on attendance and meeting duration
   */
  private determineFinalStatus(
    attendanceStatus: AttendanceStatus,
    participantCount: number,
    meetingDuration?: number,
  ): AppointmentStatus {
    // If meeting had duration > 0, it definitely happened - mark as COMPLETED
    if (meetingDuration && meetingDuration > 0) {
      this.logger.log(`Meeting had duration of ${meetingDuration} mins - marking as COMPLETED`);
      return AppointmentStatus.COMPLETED;
    }

    // If both attended or we have multiple participants, mark as completed
    if (attendanceStatus === AttendanceStatus.BOTH || participantCount >= 2) {
      return AppointmentStatus.COMPLETED;
    }

    // If attendance is unknown but participants exist, mark as completed
    if (attendanceStatus === AttendanceStatus.UNKNOWN && participantCount > 0) {
      return AppointmentStatus.COMPLETED;
    }

    // If only one party attended, still mark as completed but we have the attendance record
    if (
      attendanceStatus === AttendanceStatus.PATIENT_ONLY ||
      attendanceStatus === AttendanceStatus.SPECIALIST_ONLY
    ) {
      return AppointmentStatus.COMPLETED;
    }

    // If no one attended (meeting started but no participants and no duration), mark as missed
    if (attendanceStatus === AttendanceStatus.NONE && participantCount === 0) {
      return AppointmentStatus.MISSED;
    }

    return AppointmentStatus.COMPLETED;
  }

  /**
   * Calculate recording expiry (Zoom recordings expire after 30 days by default)
   */
  private calculateRecordingExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry;
  }

  /**
   * Retry failed webhooks (can be called by a scheduled task)
   */
  async retryFailedWebhooks(maxRetries: number = 3): Promise<void> {
    const failedWebhooks = await this.zoomWebhookModel.find({
      status: ZoomWebhookStatus.FAILED,
      retry_count: { $lt: maxRetries },
    });

    this.logger.log(`Retrying ${failedWebhooks.length} failed webhooks`);

    for (const webhook of failedWebhooks) {
      try {
        await this.processEvent(webhook.event_type, webhook.payload, webhook);
        webhook.status = ZoomWebhookStatus.PROCESSED;
        webhook.processed_at = new Date();
      } catch (error) {
        webhook.retry_count += 1;
        webhook.error_message = error.message;
        if (webhook.retry_count >= maxRetries) {
          this.logger.error(`Webhook ${webhook._id} exceeded max retries`);
        }
      }
      await webhook.save();
    }
  }
}
