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

@UseGuards(JwtAuthGuard)
@Controller('vitals')
export class VitalsController {
  constructor(
    private readonly vitalsService: VitalsService,
    @Inject(forwardRef(() => BasicHealthScoreService))
    private readonly basicHealthScoreService: BasicHealthScoreService,
  ) {}

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

  @Get()
  async findUserVitals(@Request() req) {
    const result = await this.vitalsService.findUserVitals(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('select')
  async getOneVitalField(@Request() req, @Query() query: QueryVitalDto) {
    const result = await this.vitalsService.getOneVitalField(
      req.user.sub,
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('recent')
  async getMostRecentVitals(@Request() req) {
    const result = await this.vitalsService.getMostRecentVitals(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

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

  @Get(':patientId')
  async getPatientVitals(@Param('patientId') patientId: string) {
    const result = await this.vitalsService.findUserVitals(patientId as any);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.vitalsService.removeVital(id);
    return sendSuccessResponse(Messages.DELETED, result);
  }
}
