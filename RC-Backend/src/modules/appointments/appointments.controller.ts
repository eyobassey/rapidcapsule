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

@UseGuards(AdminOrJwtGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}
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

  @HttpCode(HttpStatus.OK)
  @Post('transactions/verify')
  async verifyTransaction(
    @Body() verifyAppointmentTransaction: VerifyAppointmentTransaction,
  ) {
    const { reference } = verifyAppointmentTransaction;
    const result = await this.appointmentsService.verifyTransaction(reference);
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

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

  @Get('specialist-referrals')
  async getSpecialistReferrals(@Request() req) {
    const result = await this.appointmentsService.getSpecialistReferrals(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

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

  @HttpCode(HttpStatus.OK)
  @Post('available-times')
  async getAvailableTimes(@Body() availableTimesDto: AvailableTimesDto) {
    const result = await this.appointmentsService.getAvailableTimes(
      availableTimesDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('filter-options')
  async getFilterOptions() {
    const result = await this.appointmentsService.getFilterOptions();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get()
  async getAppointments(@Request() req, @Query() queryDto: QueryDto) {
    const result = await this.appointmentsService.getAllAppointments(queryDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':id')
  async getOneAppointment(@Param('id') id: string) {
    const result = await this.appointmentsService.getOneAppointment(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('cancel')
  async cancelAppointment(@Body() cancelAppointmentDto: CancelAppointmentDto) {
    const result = await this.appointmentsService.cancelAppointment(
      cancelAppointmentDto,
    );
    return sendSuccessResponse(Messages.APPOINTMENT_CANCELLED, result);
  }

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

  @Patch('reschedule')
  async rescheduleAppointment(
    @Body() rescheduleAppointmentDto: RescheduleAppointmentDto,
  ) {
    const result = await this.appointmentsService.rescheduleAppointment(
      rescheduleAppointmentDto,
    );
    return sendSuccessResponse(Messages.APPOINTMENT_RESCHEDULE, result);
  }

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

  @Patch('end-meeting')
  async endZoomMeeting(@Body() endZoomMeetingDto: EndZoomMeetingDto) {
    const result = await this.appointmentsService.endAppointment(
      endZoomMeetingDto.appointmentId,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Patch('meeting-notes')
  async addMeetingNotes(@Body() meetingNotesDto: MeetingNotesDto) {
    const result = await this.appointmentsService.addMeetingNotes(
      meetingNotesDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

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

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    const result = await this.appointmentsService.getDocuments(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('stats')
  async getAppointmentStats() {
    const result = await this.appointmentsService.getAppointmentStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('patient/:patientId/health-profile')
  async getPatientHealthProfile(@Param('patientId') patientId: string) {
    const result = await this.appointmentsService.getPatientHealthProfile(
      patientId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get comprehensive patient health records for specialist view
   * Includes all health checkups, advanced scores, vitals, and appointment history
   */
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

  @Get('patient/:patientId/health-scores')
  async getPatientHealthScores(@Param('patientId') patientId: string) {
    const result = await this.appointmentsService.getPatientHealthScores(
      patientId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('health-scores')
  async getMyHealthScores(@Request() req) {
    const result = await this.appointmentsService.getPatientHealthScores(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get patient prescriptions for specialist view
   */
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

  /**
   * Get patient's uploaded prescriptions (external prescriptions)
   */
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

  /**
   * Get patient's pharmacy orders (medication purchases)
   */
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
