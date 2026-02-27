import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  BadRequestException,
  SetMetadata,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { VerifyAppointmentTransaction } from './dto/verify-appointment-transaction';
import { QueryDto } from '../../common/helpers/url-query.dto';
import { QueryStatus } from './types/query.types';
import { DoesUserHaveCard } from '../../core/guards/doesUserHaveCard';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ReferSpecialistDto } from './dto/refer-specialist.dto';
import { EndZoomMeetingDto } from './dto/end-zoom-meeting.dto';
import { MeetingNotesDto } from './dto/meeting-notes.dto';
import { AvailableSpecialistDto } from './dto/available-specialist.dto';
import { AvailableTimesDto } from './dto/available-times.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreateSpecialistAppointmentDto } from './dto/create-specialist-appointment.dto';
import { ProcessAppointmentPaymentDto } from './dto/process-appointment-payment.dto';
import { AdminOrJwtGuard } from './guards/admin-or-jwt.guard';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { Types } from 'mongoose';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AdminOrJwtGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}

  @ApiOperation({ summary: 'Book appointment (patient)', description: 'Patient books an appointment with a specialist. Requires a saved card on file.' })
  @ApiResponse({ status: 201, description: 'Appointment created and Zoom meeting link generated' })
  @ApiResponse({ status: 400, description: 'Validation error or no saved card' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(DoesUserHaveCard)
  @Post()
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Request() req,
  ) {
    const result = await this.appointmentsService.createAppointment(
      createAppointmentDto,
      req.user,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Create appointment (specialist)', description: 'Specialist creates an appointment for a patient. Admin can pass X-Specialist-Id header to act on behalf of a specialist.' })
  @ApiResponse({ status: 201, description: 'Appointment created by specialist' })
  @ApiResponse({ status: 400, description: 'Specialist ID required or validation error' })
  @Post('specialist/create')
  async createBySpecialist(
    @Body() createSpecialistAppointmentDto: CreateSpecialistAppointmentDto,
    @Request() req,
  ) {
    // Allow admin to create appointments on behalf of specialists
    // Admin requests will include X-Specialist-Id header
    const specialistId = req.headers['x-specialist-id'] || req.user?.sub;

    if (!specialistId) {
      throw new BadRequestException('Specialist ID is required');
    }

    const result = await this.appointmentsService.createAppointmentBySpecialist(
      createSpecialistAppointmentDto,
      specialistId,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  /**
   * Process appointment payment (debit wallet)
   * Called during Step 4 of appointment creation wizard
   */
  @ApiOperation({ summary: 'Process appointment payment', description: 'Debit wallet for an appointment payment. Called during Step 4 of the appointment creation wizard.' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or validation error' })
  @Post('specialist/process-payment')
  async processAppointmentPayment(
    @Body() processPaymentDto: ProcessAppointmentPaymentDto,
    @Request() req,
  ) {
    const specialistId = req.headers['x-specialist-id'] || req.user?.sub;

    if (!specialistId) {
      throw new BadRequestException('Specialist ID is required');
    }

    const result = await this.appointmentsService.processAppointmentPayment({
      patient_id: new Types.ObjectId(processPaymentDto.patient_id),
      specialist_id: new Types.ObjectId(specialistId),
      consultation_fee: processPaymentDto.consultation_fee,
      platform_fee: processPaymentDto.platform_fee,
      total_amount: processPaymentDto.total_amount,
      payment_source: processPaymentDto.payment_source,
      appointment_type: processPaymentDto.appointment_type,
      appointment_type_name: processPaymentDto.appointment_type_name,
    });

    return sendSuccessResponse('Payment processed successfully', result);
  }

  @ApiOperation({ summary: 'Verify appointment payment', description: 'Verify a Paystack payment transaction reference for an appointment.' })
  @ApiResponse({ status: 200, description: 'Transaction verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or failed transaction reference' })
  @HttpCode(HttpStatus.OK)
  @Post('transactions/verify')
  async verifyTransaction(
    @Body() verifyAppointmentTransaction: VerifyAppointmentTransaction,
  ) {
    const { reference } = verifyAppointmentTransaction;
    const result = await this.appointmentsService.verifyTransaction(reference);
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Get patient appointments', description: 'Retrieve appointments for the authenticated patient, filtered by status. Specialist profile photos are pre-signed.' })
  @ApiResponse({ status: 200, description: 'Patient appointments retrieved' })
  @Get('patient')
  async getPatientAppointment(
    @Request() req,
    @Query() queryStatus: QueryStatus,
  ) {
    const result = await this.appointmentsService.getPatientAppointments(
      req.user.sub,
      queryStatus,
    );

    // Resolve specialist profile images (field is profile_photo, not profile_image)
    if (Array.isArray(result)) {
      await Promise.all(
        result.map(async (appointment: any) => {
          if (appointment?.specialist?.profile?.profile_photo) {
            try {
              appointment.specialist.profile.profile_photo =
                await this.fileUploadHelper.resolveProfileImage(
                  appointment.specialist.profile.profile_photo,
                );
            } catch (e) {
              // Silently ignore resolution errors
            }
          }
        }),
      );
    }

    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specialist appointments', description: 'Retrieve appointments for the authenticated specialist, filtered by status.' })
  @ApiResponse({ status: 200, description: 'Specialist appointments retrieved' })
  @Get('specialist')
  async getSpecialistAppointment(
    @Request() req,
    @Query() queryStatus: QueryStatus,
  ) {
    const result = await this.appointmentsService.getSpecialistAppointments(
      req.user.sub,
      queryStatus,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specialist referrals', description: 'Retrieve referrals received by the authenticated specialist from other specialists.' })
  @ApiResponse({ status: 200, description: 'Referrals retrieved' })
  @Get('specialist-referrals')
  async getSpecialistReferrals(@Request() req) {
    const result = await this.appointmentsService.getSpecialistReferrals(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Find available specialists', description: 'Search for available specialists by category, gender, rating, language, and preferred dates/times.' })
  @ApiResponse({ status: 200, description: 'Available specialists list returned' })
  @HttpCode(HttpStatus.OK)
  @Post('available-specialists')
  async getAvailableSpecialists(
    @Body() availableSpecialistDto: AvailableSpecialistDto,
  ) {
    const result = await this.appointmentsService.getAvailableSpecialists(
      availableSpecialistDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get available time slots', description: 'Check available appointment time slots for given dates. Optionally filter by specialist and check for patient double-booking.' })
  @ApiResponse({ status: 200, description: 'Available time slots returned' })
  @HttpCode(HttpStatus.OK)
  @Post('available-times')
  async getAvailableTimes(@Body() availableTimesDto: AvailableTimesDto) {
    const result = await this.appointmentsService.getAvailableTimes(
      availableTimesDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get appointment filter options', description: 'Retrieve available filter options (statuses, meeting types, categories) for the appointment list UI.' })
  @ApiResponse({ status: 200, description: 'Filter options retrieved' })
  @Get('filter-options')
  async getFilterOptions() {
    const result = await this.appointmentsService.getFilterOptions();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'List all appointments', description: 'Retrieve all appointments with pagination (admin/specialist view).' })
  @ApiResponse({ status: 200, description: 'Paginated appointment list' })
  @Get()
  async getAppointments(@Request() req, @Query() queryDto: QueryDto) {
    const result = await this.appointmentsService.getAllAppointments(queryDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get appointment by ID', description: 'Retrieve full details of a single appointment.' })
  @ApiResponse({ status: 200, description: 'Appointment details returned' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Get(':id')
  async getOneAppointment(@Param('id') id: string) {
    const result = await this.appointmentsService.getOneAppointment(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Cancel appointment (body)', description: 'Cancel an appointment by passing the appointment ID in the request body.' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Patch('cancel')
  async cancelAppointment(@Body() cancelAppointmentDto: CancelAppointmentDto) {
    const result = await this.appointmentsService.cancelAppointment(
      cancelAppointmentDto,
    );
    return sendSuccessResponse(Messages.APPOINTMENT_CANCELLED, result);
  }

  @ApiOperation({ summary: 'Cancel appointment (param)', description: 'Cancel an appointment by passing the appointment ID as a URL parameter.' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Patch(':id/cancel')
  async cancelAppointmentById(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const cancelDto: CancelAppointmentDto = {
      appointmentId: new Types.ObjectId(id),
    };
    const result = await this.appointmentsService.cancelAppointment(cancelDto);
    return sendSuccessResponse(Messages.APPOINTMENT_CANCELLED, result);
  }

  @ApiOperation({ summary: 'Reschedule appointment', description: 'Reschedule an appointment to a new date and time. Optionally notify the patient.' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiResponse({ status: 400, description: 'New time slot not available' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Patch('reschedule')
  async rescheduleAppointment(
    @Body() rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    const result = await this.appointmentsService.rescheduleAppointment(
      rescheduleAppointmentDto,
    );
    return sendSuccessResponse(Messages.APPOINTMENT_RESCHEDULE, result);
  }

  @ApiOperation({ summary: 'Refer patient to specialist', description: 'Specialist refers a patient to one or more other specialists with a referral note.' })
  @ApiResponse({ status: 201, description: 'Referral created and notification sent' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post('refer-specialist')
  async referPatientToSpecialist(
    @Body() referSpecialistDto: ReferSpecialistDto,
    @Request() req,
  ) {
    const result = await this.appointmentsService.referPatientToSpecialist(
      referSpecialistDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'End video meeting', description: 'End the Zoom/video meeting for an appointment and update status to completed.' })
  @ApiResponse({ status: 200, description: 'Meeting ended' })
  @Patch('end-meeting')
  async endZoomMeeting(@Body() endZoomMeetingDto: EndZoomMeetingDto) {
    const result = await this.appointmentsService.endAppointment(
      endZoomMeetingDto.appointmentId,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Add meeting notes', description: 'Add clinical notes from the consultation to an appointment record.' })
  @ApiResponse({ status: 200, description: 'Meeting notes saved' })
  @Patch('meeting-notes')
  async addMeetingNotes(@Body() meetingNotesDto: MeetingNotesDto) {
    const result = await this.appointmentsService.addMeetingNotes(
      meetingNotesDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Update private notes', description: 'Update specialist-only private notes for an appointment (not visible to patient).' })
  @ApiResponse({ status: 200, description: 'Private notes updated' })
  @Patch(':id/private-notes')
  async updatePrivateNotes(
    @Param('id') id: string,
    @Body() body: { private_notes: string },
    @Request() req,
  ) {
    const result = await this.appointmentsService.updatePrivateNotes(
      id,
      req.user.sub,
      body.private_notes,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Rate appointment', description: 'Patient rates a completed appointment (1-5 stars) with optional text review.' })
  @ApiResponse({ status: 200, description: 'Rating submitted' })
  @ApiResponse({ status: 400, description: 'Rating must be between 1 and 5' })
  @Post(':id/rate')
  async rateAppointment(
    @Param('id') id: string,
    @Body('score') score: number,
    @Body('review') review: string,
    @Request() req,
  ) {
    if (!score || score < 1 || score > 5) {
      throw new BadRequestException('Rating score must be between 1 and 5');
    }
    const result = await this.appointmentsService.rateAppointment(
      id,
      req.user.sub,
      score,
      review,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Upload appointment document', description: 'Upload a file (lab results, prescriptions, images) to an appointment. Stored in S3.' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  @ApiResponse({ status: 400, description: 'File is required' })
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const result = await this.appointmentsService.uploadDocument(
      id,
      req.user.sub,
      file,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Get appointment documents', description: 'Retrieve all uploaded documents for an appointment.' })
  @ApiResponse({ status: 200, description: 'Documents list returned' })
  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    const result = await this.appointmentsService.getDocuments(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get appointment statistics', description: 'Retrieve aggregate appointment stats (total, completed, cancelled, upcoming).' })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  @Get('stats')
  async getAppointmentStats() {
    const result = await this.appointmentsService.getAppointmentStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient health profile', description: 'Retrieve a patient\'s health profile summary for the specialist appointment view.' })
  @ApiResponse({ status: 200, description: 'Health profile returned' })
  @Get('patient/:patientId/health-profile')
  async getPatientHealthProfile(@Param('patientId') patientId: string) {
    const result = await this.appointmentsService.getPatientHealthProfile(
      patientId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient full health records', description: 'Comprehensive patient records for specialist view: health checkups, scores, vitals, and appointment history with pagination.' })
  @ApiResponse({ status: 200, description: 'Full health records returned' })
  @Get('patient/:patientId/full-health-records')
  async getPatientFullHealthRecords(
    @Param('patientId') patientId: string,
    @Query('checkupsPage') checkupsPage: string = '1',
    @Query('checkupsLimit') checkupsLimit: string = '10',
    @Query('scoresPage') scoresPage: string = '1',
    @Query('scoresLimit') scoresLimit: string = '10',
    @Query('appointmentsPage') appointmentsPage: string = '1',
    @Query('appointmentsLimit') appointmentsLimit: string = '10',
  ) {
    const result = await this.appointmentsService.getPatientFullHealthRecords(
      patientId,
      {
        checkupsPage: parseInt(checkupsPage),
        checkupsLimit: parseInt(checkupsLimit),
        scoresPage: parseInt(scoresPage),
        scoresLimit: parseInt(scoresLimit),
        appointmentsPage: parseInt(appointmentsPage),
        appointmentsLimit: parseInt(appointmentsLimit),
      },
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient health scores', description: 'Retrieve health scores for a specific patient (specialist view).' })
  @ApiResponse({ status: 200, description: 'Health scores returned' })
  @Get('patient/:patientId/health-scores')
  async getPatientHealthScores(@Param('patientId') patientId: string) {
    const result = await this.appointmentsService.getPatientHealthScores(
      patientId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get my health scores', description: 'Retrieve health scores for the authenticated patient.' })
  @ApiResponse({ status: 200, description: 'Health scores returned' })
  @Get('health-scores')
  async getMyHealthScores(@Request() req) {
    const result = await this.appointmentsService.getPatientHealthScores(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient prescriptions', description: 'Retrieve paginated prescriptions for a patient (specialist view).' })
  @ApiResponse({ status: 200, description: 'Prescriptions returned' })
  @Get('patient/:patientId/prescriptions')
  async getPatientPrescriptions(
    @Param('patientId') patientId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const result = await this.appointmentsService.getPatientPrescriptions(
      patientId,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient uploaded prescriptions', description: 'Retrieve paginated external/uploaded prescriptions for a patient.' })
  @ApiResponse({ status: 200, description: 'Uploaded prescriptions returned' })
  @Get('patient/:patientId/uploaded-prescriptions')
  async getPatientUploadedPrescriptions(
    @Param('patientId') patientId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const result = await this.appointmentsService.getPatientUploadedPrescriptions(
      patientId,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient pharmacy orders', description: 'Retrieve paginated pharmacy/medication orders for a patient.' })
  @ApiResponse({ status: 200, description: 'Pharmacy orders returned' })
  @Get('patient/:patientId/pharmacy-orders')
  async getPatientPharmacyOrders(
    @Param('patientId') patientId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const result = await this.appointmentsService.getPatientPharmacyOrders(
      patientId,
      parseInt(page),
      parseInt(limit),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get appointment details for specialist', description: 'Retrieve comprehensive appointment details including patient info, for the specialist dashboard.' })
  @ApiResponse({ status: 200, description: 'Appointment details returned' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Get(':appointmentId/specialist-details')
  async getAppointmentDetailsForSpecialist(
    @Param('appointmentId') appointmentId: string,
    @Request() req,
  ) {
    const result = await this.appointmentsService.getAppointmentDetailsForSpecialist(
      appointmentId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
