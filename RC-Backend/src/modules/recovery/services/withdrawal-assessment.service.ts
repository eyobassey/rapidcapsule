import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AddictionScreening,
  AddictionScreeningDocument,
} from '../entities/addiction-screening.entity';
import {
  WITHDRAWAL_SCALES,
  WithdrawalScale,
} from '../constants/withdrawal-scales';

@Injectable()
export class WithdrawalAssessmentService {
  constructor(
    @InjectModel(AddictionScreening.name)
    private screeningModel: Model<AddictionScreeningDocument>,
  ) {}

  /**
   * Get available withdrawal scales.
   */
  getAvailableScales(): Array<{
    id: string;
    name: string;
    short_name: string;
    description: string;
    target_substances: string[];
    max_total_score: number;
    estimated_minutes: number;
    item_count: number;
  }> {
    return Object.values(WITHDRAWAL_SCALES).map((scale) => ({
      id: scale.id,
      name: scale.name,
      short_name: scale.short_name,
      description: scale.description,
      target_substances: scale.target_substances,
      max_total_score: scale.max_total_score,
      estimated_minutes: scale.estimated_minutes,
      item_count: scale.items.length,
    }));
  }

  /**
   * Get full scale definition (items, scoring, zones) for rendering the form.
   */
  getScaleDefinition(scaleId: string): WithdrawalScale {
    const scale = WITHDRAWAL_SCALES[scaleId];
    if (!scale) {
      throw new NotFoundException(
        `Withdrawal scale "${scaleId}" not found. Available: ${Object.keys(WITHDRAWAL_SCALES).join(', ')}`,
      );
    }
    return scale;
  }

  /**
   * Administer a withdrawal assessment (specialist only).
   * Scores the responses, determines severity, and persists as a screening record.
   */
  async administer(
    patientId: string,
    specialistId: string,
    scaleId: string,
    responses: Array<{ item_id: string; value: number }>,
  ) {
    const scale = WITHDRAWAL_SCALES[scaleId];
    if (!scale) {
      throw new BadRequestException(
        `Unknown withdrawal scale: ${scaleId}`,
      );
    }

    // Validate all required items are present
    const responseMap = new Map(responses.map((r) => [r.item_id, r.value]));
    const missingItems = scale.items.filter(
      (item) => !responseMap.has(item.id),
    );
    if (missingItems.length > 0) {
      throw new BadRequestException(
        `Missing responses for items: ${missingItems.map((i) => i.id).join(', ')}`,
      );
    }

    // Validate each response value is valid for its item
    for (const response of responses) {
      const item = scale.items.find((i) => i.id === response.item_id);
      if (!item) {
        throw new BadRequestException(
          `Unknown item "${response.item_id}" for scale ${scaleId}`,
        );
      }
      const validValues = item.options.map((o) => o.value);
      if (!validValues.includes(response.value)) {
        throw new BadRequestException(
          `Invalid value ${response.value} for item "${response.item_id}". Valid: ${validValues.join(', ')}`,
        );
      }
    }

    // Calculate total score
    const totalScore = responses.reduce((sum, r) => sum + r.value, 0);

    // Determine severity zone
    const severity = scale.severity_zones.find(
      (z) => totalScore >= z.min_score && totalScore <= z.max_score,
    );

    // Build item-level breakdown
    const itemBreakdown = scale.items.map((item) => {
      const value = responseMap.get(item.id) || 0;
      const selectedOption = item.options.find((o) => o.value === value);
      return {
        item_id: item.id,
        name: item.name,
        value,
        max_score: item.max_score,
        selected_label: selectedOption?.label || '',
      };
    });

    // Persist as an AddictionScreening record
    const record = await this.screeningModel.create({
      user: new Types.ObjectId(patientId),
      instrument: scaleId,
      screening_type: 'specialist_administered',
      total_score: totalScore,
      risk_level: severity?.severity || 'mild',
      risk_zone_label: severity?.label || 'Assessment Complete',
      answers: Object.fromEntries(
        responses.map((r) => [r.item_id, r.value]),
      ),
      administered_by: new Types.ObjectId(specialistId),
      substances_identified: scale.target_substances,
    });

    return {
      assessment_id: record._id,
      scale: scale.short_name,
      instrument: scaleId,
      instrument_name: scale.short_name,
      total_score: totalScore,
      max_possible_score: scale.max_total_score,
      percentage: Math.round((totalScore / scale.max_total_score) * 100),
      risk_level: severity?.severity || 'mild',
      risk_label: severity?.label || 'Assessment Complete',
      clinical_notes: severity?.clinical_action,
      severity: severity
        ? {
            level: severity.severity,
            label: severity.label,
            clinical_action: severity.clinical_action,
            colour: severity.colour,
          }
        : null,
      item_breakdown: itemBreakdown,
      administered_by: specialistId,
      completed_at: (record as any).created_at || new Date(),
    };
  }

  /**
   * Get withdrawal assessment history for a patient.
   */
  async getHistory(
    patientId: string,
    scaleId?: string,
    page = 1,
    limit = 20,
  ) {
    const query: any = {
      user: new Types.ObjectId(patientId),
      instrument: { $in: Object.keys(WITHDRAWAL_SCALES) },
    };
    if (scaleId) {
      query.instrument = scaleId;
    }

    const skip = (page - 1) * limit;
    const [assessments, total] = await Promise.all([
      this.screeningModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('administered_by', 'profile.first_name profile.last_name')
        .lean(),
      this.screeningModel.countDocuments(query),
    ]);

    // Map entity fields to frontend-expected names
    const mapped = assessments.map((a: any) => {
      const scale = WITHDRAWAL_SCALES[a.instrument];
      return {
        ...a,
        instrument_name: scale?.short_name || a.instrument?.toUpperCase(),
        max_possible_score: scale?.max_total_score,
        risk_label: a.risk_zone_label,
        clinical_notes: scale?.severity_zones?.find(
          (z) => z.severity === a.risk_level,
        )?.clinical_action,
        responses: a.answers
          ? Object.entries(a.answers).map(([k, v]) => ({
              question_id: k,
              answer_value: v,
            }))
          : [],
      };
    });

    return {
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
