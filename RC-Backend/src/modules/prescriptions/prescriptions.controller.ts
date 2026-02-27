import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadPrescriptionDto } from './dto/upload-prescription.dto';
import { SendPatientPrescriptionDto } from './dto/send-patient-prescription.dto';
import { SendPharmacyPrescriptionDto } from './dto/send-pharmacy-prescription.dto';
import { StartOrderPaymentDto } from './dto/start-order-payment.dto';
import { VerifyOrderPaymentDto } from './dto/verify-order-payment.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Prescriptions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @ApiOperation({ summary: 'Create prescription', description: 'Create a new internal prescription for a patient' })
  @ApiResponse({ status: 201, description: 'Prescription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid prescription data' })
  @Post()
  async createPrescription(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @Request() req,
  ) {
    const result = await this.prescriptionsService.createPrescription(
      req.user.sub,
      createPrescriptionDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Upload prescription file', description: 'Upload an external prescription document (image/PDF)' })
  @ApiResponse({ status: 201, description: 'Prescription file uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid upload data' })
  @Post('file')
  async uploadPrescription(
    @Body() uploadPrescriptionDto: UploadPrescriptionDto,
    @Request() req,
  ) {
    const result = await this.prescriptionsService.uploadPrescription(
      req.user.sub,
      uploadPrescriptionDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Start order payment', description: 'Initialize a Paystack payment transaction for a prescription order' })
  @ApiResponse({ status: 200, description: 'Payment initialized with authorization URL' })
  @ApiResponse({ status: 400, description: 'Invalid payment amount' })
  @Post('start-payment')
  async startOrderPayment(
    @Body() startOrderPaymentDto: StartOrderPaymentDto,
    @Request() req,
  ) {
    const result = await this.prescriptionsService.startOrderPayment(
      req.user.sub,
      startOrderPaymentDto.amount,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get all prescriptions', description: 'Retrieve all prescriptions (internal + external + specialist) for the authenticated patient' })
  @ApiResponse({ status: 200, description: 'Prescriptions retrieved successfully' })
  @Get()
  async getPrescriptions(@Request() req) {
    const result = await this.prescriptionsService.getPrescriptions(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get internal prescriptions', description: 'Retrieve only internally created prescriptions for the authenticated patient' })
  @ApiResponse({ status: 200, description: 'Internal prescriptions retrieved' })
  @Get('internal')
  async getInternalPrescriptions(@Request() req) {
    const result = await this.prescriptionsService.getPrescriptionsByUser(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specialist prescriptions', description: 'Retrieve prescriptions written by specialists for the authenticated patient' })
  @ApiResponse({ status: 200, description: 'Specialist prescriptions retrieved' })
  @Get('specialist')
  async getSpecialistPrescriptions(@Request() req) {
    const result = await this.prescriptionsService.getSpecialistPrescriptionsByPatient(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get external prescriptions', description: 'Retrieve uploaded prescription files/documents for the authenticated patient' })
  @ApiResponse({ status: 200, description: 'External prescriptions retrieved' })
  @Get('external')
  async getExternalPrescriptions(@Request() req) {
    const result = await this.prescriptionsService.getPrescriptionFilesByUser(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient orders', description: 'Retrieve all pharmacy orders for the authenticated patient' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @Get('orders')
  async getPatientOrders(@Request() req) {
    const result = await this.prescriptionsService.getPatientOrders(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get single order', description: 'Retrieve a specific pharmacy order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get('orders/:id')
  async getPatientOrder(@Param('id') id: Types.ObjectId) {
    const result = await this.prescriptionsService.getOneOrder(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get single prescription', description: 'Retrieve a specific prescription by ID' })
  @ApiResponse({ status: 200, description: 'Prescription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @Get(':id')
  async getOnePrescription(@Param('id') id: Types.ObjectId) {
    const result = await this.prescriptionsService.getOnePrescription(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Send prescription to patient', description: 'Send a prescription to the patient via notification/email' })
  @ApiResponse({ status: 200, description: 'Prescription sent to patient' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @Patch('send-patient')
  async sendPrescriptionToPatient(
    @Body() sendPatientPrescriptionDto: SendPatientPrescriptionDto,
  ) {
    const result = await this.prescriptionsService.sendPrescriptionToPatient(
      sendPatientPrescriptionDto,
    );
    return sendSuccessResponse(Messages.PRESCRIPTION_SENT, result);
  }

  @ApiOperation({ summary: 'Send prescription to pharmacy', description: 'Forward a prescription to a pharmacy for fulfillment' })
  @ApiResponse({ status: 200, description: 'Prescription sent to pharmacy' })
  @ApiResponse({ status: 404, description: 'Prescription or pharmacy not found' })
  @Patch('send-pharmacy')
  async sendPrescriptionToPharmacy(
    @Body() sendPharmacyPrescriptionDto: SendPharmacyPrescriptionDto,
    @Request() req,
  ) {
    const result = await this.prescriptionsService.sendPrescriptionToPharmacy(
      sendPharmacyPrescriptionDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.PRESCRIPTION_SENT, result);
  }

  @ApiOperation({ summary: 'Verify order payment', description: 'Verify a Paystack payment reference for a prescription order' })
  @ApiResponse({ status: 200, description: 'Payment verified and order updated' })
  @ApiResponse({ status: 400, description: 'Invalid or failed payment reference' })
  @Patch('verify-payment')
  async verifyOrderPayment(
    @Body() verifyOrderPaymentDto: VerifyOrderPaymentDto,
  ) {
    const result = await this.prescriptionsService.verifyOrderPayment(
      verifyOrderPaymentDto,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Confirm order', description: 'Confirm a prescription order (marks it as confirmed by patient)' })
  @ApiResponse({ status: 200, description: 'Order confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Patch('confirm-order')
  async confirmOrder(@Body() confirmOrderDto: ConfirmOrderDto) {
    const result = await this.prescriptionsService.confirmOrder(
      confirmOrderDto.orderId,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Update order', description: 'Update an existing pharmacy order details' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Patch('orders/:id')
  async updateOrder(
    @Param('id') id: Types.ObjectId,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    const result = await this.prescriptionsService.updateOrder(
      id,
      updateOrderDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Update prescription', description: 'Update an existing prescription' })
  @ApiResponse({ status: 200, description: 'Prescription updated successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @Patch(':id')
  async updatePrescription(
    @Param('id') id: Types.ObjectId,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
  ) {
    const result = await this.prescriptionsService.updatePrescription(
      id,
      updatePrescriptionDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Delete prescription', description: 'Delete a prescription by ID' })
  @ApiResponse({ status: 200, description: 'Prescription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @Delete(':id')
  async deletePrescription(@Param('id') id: Types.ObjectId) {
    const result = await this.prescriptionsService.deletePrescription(id);
    return sendSuccessResponse(Messages.DELETED, result);
  }
}
