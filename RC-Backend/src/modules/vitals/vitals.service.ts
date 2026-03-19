import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { Model, Types } from 'mongoose';
import { deleteOne, find, findOne } from 'src/common/crud/crud';
import { Vital, VitalDocument } from './entities/vital.entity';
import { InjectModel } from '@nestjs/mongoose';
import { QueryVitalDto } from './dto/query.vital.dto';
import { VitalChartDataDto } from './dto/vital-chart-data.dto';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import * as moment from 'moment';

const VITAL_FIELDS = [
  'body_temp', 'body_weight', 'blood_pressure', 'blood_sugar_level', 'pulse_rate',
  'spo2', 'steps', 'sleep', 'calories_burned', 'distance', 'respiratory_rate', 'stress_level',
  'body_fat', 'active_minutes', 'hydration', 'muscle_mass', 'bone_mass', 'body_water', 'visceral_fat', 'bmr',
];

@Injectable()
export class VitalsService {
  constructor(
    @InjectModel(Vital.name) private vitalModel: Model<VitalDocument>,
    private readonly generalHelpers: GeneralHelpers,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  /**
   * Batch check which patients have at least one vital record
   */
  async getPatientsWithVitals(patientIds: Types.ObjectId[]): Promise<Set<string>> {
    if (!patientIds.length) return new Set();
    const results = await this.vitalModel.find(
      { userId: { $in: patientIds } },
      { userId: 1 },
    ).lean();
    return new Set(results.map((r: any) => r.userId.toString()));
  }

  async createVitals(createVitalDto: CreateVitalDto, userId: Types.ObjectId) {
    const vitalTypes: string[] = [];
    for (const vitalDtoKey in createVitalDto) {
      vitalTypes.push(vitalDtoKey);
      await this.vitalModel.updateOne(
        { userId },
        {
          $push: { [vitalDtoKey]: createVitalDto[vitalDtoKey] },
        },
        { upsert: true },
      );
    }

    // Emit event for health insights trigger
    if (vitalTypes.length > 0) {
      this.eventEmitter.emit('vitals.logged', {
        userId: userId.toString(),
        vitalTypes,
      });
    }

    return await this.findOneUserVitals(userId);
  }

  async findOneUserVitals(userId: Types.ObjectId) {
    return await findOne(this.vitalModel, { userId });
  }

  async findUserVitals(userId: Types.ObjectId) {
    const vitals = await find(this.vitalModel, { userId });
    return vitals.reduce((acc, doc) => {
      for (const field of VITAL_FIELDS) {
        if (doc[field]?.length) acc[field] = doc[field];
      }
      acc.userId = doc.userId;
      acc._id = doc._id;
      return acc;
    }, {});
  }

  // Vitals where daily entries should be summed (not just show latest reading)
  private readonly cumulativeVitals = new Set([
    'steps', 'calories_burned', 'active_minutes', 'distance', 'sleep',
  ]);

  async getMostRecentVitals(userId: Types.ObjectId) {
    const vitals = await this.findUserVitals(userId);
    const recentVitals = {};
    for (const [key, values] of Object.entries(vitals)) {
      if (Array.isArray(values) && values.length > 0) {
        const validEntries = values.filter((v: any) => v.value);
        if (validEntries.length === 0) continue;

        if (this.cumulativeVitals.has(key)) {
          // For cumulative vitals, sum today's entries; if none, sum the most recent day
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayEntries = validEntries.filter(
            (v: any) => new Date(v.updatedAt) >= today,
          );
          let entries: any[];
          if (todayEntries.length > 0) {
            entries = todayEntries;
          } else {
            // Find the most recent day and sum all entries from that day
            const lastEntry = validEntries[validEntries.length - 1];
            const lastDay = new Date(lastEntry.updatedAt);
            lastDay.setHours(0, 0, 0, 0);
            const nextDay = new Date(lastDay);
            nextDay.setDate(nextDay.getDate() + 1);
            entries = validEntries.filter(
              (v: any) => {
                const d = new Date(v.updatedAt);
                return d >= lastDay && d < nextDay;
              },
            );
          }
          const sum = entries.reduce((acc, v: any) => acc + parseFloat(v.value || '0'), 0);
          const latest = entries.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
          const rounded = (key === 'distance' || key === 'sleep') ? parseFloat(sum.toFixed(1)) : Math.round(sum);
          recentVitals[key] = { value: String(rounded), unit: latest.unit, updatedAt: latest.updatedAt };
        } else {
          recentVitals[key] = validEntries.reduce((a, b) =>
            a.updatedAt > b.updatedAt ? a : b,
          );
        }
      }
    }
    return recentVitals;
  }

  async getOneVitalField(userId: Types.ObjectId, query: QueryVitalDto) {
    const { fieldsToSelect } = query;
    return await findOne(
      this.vitalModel,
      { userId },
      {
        ...(fieldsToSelect
          ? {
              selectFields:
                typeof fieldsToSelect === 'string'
                  ? fieldsToSelect
                  : [...fieldsToSelect],
            }
          : {}),
      },
    );
  }

  async updateVitals(
    vitalId: string,
    updateVitalDto: UpdateVitalDto,
    userId: Types.ObjectId,
  ) {
    for (const vitalDtoKey in updateVitalDto) {
      await this.vitalModel.updateOne(
        { _id: vitalId },
        {
          $push: { [vitalDtoKey]: updateVitalDto[vitalDtoKey] },
        },
      );
    }
    return await this.getMostRecentVitals(userId);
  }

  async removeVital(vitalId: string) {
    return await deleteOne(this.vitalModel, { _id: vitalId });
  }

  async getVitalsChartData(
    vitalChartDataDto: VitalChartDataDto,
    userId: Types.ObjectId,
  ) {
    const { vitalToSelect, start_date, end_date } = vitalChartDataDto;
    const vital = await findOne(
      this.vitalModel,
      { userId },
      { selectFields: vitalToSelect },
    );

    // Default to 6 months back, use start of day
    const startDate = start_date
      ? moment(start_date).startOf('day')
      : moment().subtract(6, 'months').startOf('day');

    // Default to today, use end of day to include all data from today
    const endDate = end_date
      ? moment(end_date).endOf('day')
      : moment().endOf('day');

    const selectedVital = vital?.[vitalToSelect];

    if (!selectedVital || !Array.isArray(selectedVital)) {
      return [];
    }

    const data = selectedVital.filter((d) =>
      moment(d.updatedAt).isBetween(startDate, endDate, undefined, '[]'),
    );

    // Group by date and sort chronologically
    const groupedData = this.generalHelpers.groupByDate(data, 'updatedAt');
    return groupedData.sort((a, b) =>
      moment(a.date).valueOf() - moment(b.date).valueOf()
    );
  }
}
