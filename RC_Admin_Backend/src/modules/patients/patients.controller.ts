import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { Types } from 'mongoose';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { PatientAdvancedFilterDto } from './dto/patient-advanced-filter.dto';
import { ChangePatientStatusDto } from './dto/change-patient-status.dto';

@ApiTags('Admin Patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Change patient status', description: 'Update a patient profile status (Active, Suspended, Deactivated, etc.)' })
  @ApiParam({ name: 'id', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient status updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async changePatientStatus(
    @Param('id') id: Types.ObjectId,
    @Body() changePatientStatusDto: ChangePatientStatusDto,
  ) {
    const result = await this.patientsService.changePatientStatus(
      changePatientStatusDto.profileStatus,
      id,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List patients', description: 'Retrieve a paginated, filterable list of all patients' })
  @ApiResponse({ status: 200, description: 'Paginated patient list returned' })
  async getPatients(
    @Query() patientAdvancedFilterDto: PatientAdvancedFilterDto,
  ) {
    const result = await this.patientsService.getPatients(
      patientAdvancedFilterDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get patient countries', description: 'Retrieve distinct list of countries from registered patients' })
  @ApiResponse({ status: 200, description: 'List of countries returned' })
  async getCountries() {
    const result = await this.patientsService.getCountries();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient details', description: 'Retrieve full profile and details for a single patient' })
  @ApiParam({ name: 'id', description: 'Patient user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient details returned' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatient(@Param('id') id: Types.ObjectId) {
    const result = await this.patientsService.getPatient(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
