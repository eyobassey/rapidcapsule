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
  Query,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryVitalDto } from './dto/query.vital.dto';
import { VitalChartDataDto } from './dto/vital-chart-data.dto';
import { BasicHealthScoreService } from '../basic-health-score/basic-health-score.service';
import { ScoreChangeTrigger } from '../basic-health-score/entities/basic-health-score-history.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Vitals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('vitals')
export class VitalsController {
  constructor(
    private readonly vitalsService: VitalsService,
    @Inject(forwardRef(() => BasicHealthScoreService))
    private readonly basicHealthScoreService: BasicHealthScoreService,
  ) {}

  @ApiOperation({ summary: 'Record vitals', description: 'Submit new vital sign readings (blood pressure, temperature, SpO2, etc.). Triggers health score recalculation.' })
  @ApiResponse({ status: 201, description: 'Vitals recorded successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post()
  async create(@Body() createVitalDto: CreateVitalDto, @Request() req) {
    const result = await this.vitalsService.createVitals(
      createVitalDto,
      req.user.sub,
    );

    // Update basic health score (fire and forget - don't block response)
    const vitalTypes = Object.keys(createVitalDto).join(', ');
    this.basicHealthScoreService
      .calculateAndStoreScore(req.user.sub, ScoreChangeTrigger.VITALS_UPDATED, `Vitals updated: ${vitalTypes}`)
      .catch(err => console.error('Error updating basic health score:', err));

    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Get all vitals', description: 'Retrieve all vital readings for the authenticated user.' })
  @ApiResponse({ status: 200, description: 'All vitals returned' })
  @Get()
  async findUserVitals(@Request() req) {
    const result = await this.vitalsService.findUserVitals(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specific vital fields', description: 'Retrieve selected vital fields only (e.g., just blood_pressure and pulse_rate).' })
  @ApiResponse({ status: 200, description: 'Selected vital fields returned' })
  @Get('select')
  async getOneVitalField(@Request() req, @Query() query: QueryVitalDto) {
    const result = await this.vitalsService.getOneVitalField(
      req.user.sub,
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get most recent vitals', description: 'Retrieve the most recent reading for each vital type.' })
  @ApiResponse({ status: 200, description: 'Most recent vitals returned' })
  @Get('recent')
  async getMostRecentVitals(@Request() req) {
    const result = await this.vitalsService.getMostRecentVitals(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get vitals chart data', description: 'Retrieve time-series vital data for charting/graphing, filtered by vital type and date range.' })
  @ApiResponse({ status: 200, description: 'Chart data returned' })
  @Get('chart')
  async getVitalsChartData(
    @Query() vitalChartDataDto: VitalChartDataDto,
    @Request() req,
  ) {
    const result = await this.vitalsService.getVitalsChartData(
      vitalChartDataDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient vitals by ID', description: 'Retrieve all vitals for a specific patient (specialist/admin view).' })
  @ApiResponse({ status: 200, description: 'Patient vitals returned' })
  @Get(':patientId')
  async getPatientVitals(@Param('patientId') patientId: string) {
    const result = await this.vitalsService.findUserVitals(patientId as any);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Update vitals record', description: 'Update an existing vital reading. Triggers health score recalculation.' })
  @ApiResponse({ status: 200, description: 'Vitals updated' })
  @ApiResponse({ status: 404, description: 'Vital record not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVitalDto: UpdateVitalDto,
    @Request() req,
  ) {
    const result = await this.vitalsService.updateVitals(
      id,
      updateVitalDto,
      req.user.sub,
    );

    // Update basic health score (fire and forget)
    const vitalTypes = Object.keys(updateVitalDto).join(', ');
    this.basicHealthScoreService
      .calculateAndStoreScore(req.user.sub, ScoreChangeTrigger.VITALS_UPDATED, `Vitals updated: ${vitalTypes}`)
      .catch(err => console.error('Error updating basic health score:', err));

    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Delete vitals record', description: 'Permanently delete a vital reading.' })
  @ApiResponse({ status: 200, description: 'Vital record deleted' })
  @ApiResponse({ status: 404, description: 'Vital record not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.vitalsService.removeVital(id);
    return sendSuccessResponse(Messages.DELETED, result);
  }
}
