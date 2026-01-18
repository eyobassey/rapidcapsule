import { Injectable, Logger } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { QueryStatus } from '../patients/types/appointment-query.types';
import {
  aggregateDataPerDay,
  aggregateDataPerMonth,
  aggregateDataPerWeek,
  aggregateDataPerYear,
  countDocuments,
  find,
  findAndCountAll,
} from '../../common/crud/crud';
import { InjectModel } from '@nestjs/mongoose';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from './entities/appointment.entity';
import { isEmpty } from 'lodash';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { AppointmentsQueryDto } from './dto/appointments-query.dto';
import * as moment from 'moment/moment';
import { Interval } from '../patients/dto/query-interval.dto';
import { isArray } from 'class-validator';
import {
  AppointmentAnalyticsFilter,
  AppointmentsAnalyticsDto,
} from './dto/appointments-analytics.dto';
import { CreateAdminAppointmentDto } from './dto/create-admin-appointment.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PatientsService } from '../patients/patients.service';
import { SpecialistsService } from '../specialists/specialists.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private readonly patientBackendUrl = process.env.PATIENT_BACKEND_URL || 'http://localhost:5020';

  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private readonly generalHelpers: GeneralHelpers,
    private readonly httpService: HttpService,
    private readonly patientsService: PatientsService,
    private readonly specialistsService: SpecialistsService,
  ) {}
  /**
   * Admin creates appointment for patient with specialist
   * Calls patient backend's specialist appointment creation endpoint
   */
  async createAdminAppointment(createAdminAppointmentDto: CreateAdminAppointmentDto) {
    const {
      patient_id,
      specialist_id,
      category,
      appointment_date,
      start_time,
      duration_minutes,
      timezone,
      appointment_type,
      consultation_fee,
      patient_notes,
      admin_notes,
      meeting_channel,
      whatsapp_number,
      location,
      phone_number,
    } = createAdminAppointmentDto;

    try {
      // Verify patient and specialist exist (both use User model)
      const [patient, specialist] = await Promise.all([
        this.patientsService.findOne({ _id: patient_id }),
        this.patientsService.findOne({ _id: specialist_id }),
      ]);

      if (!patient) {
        throw new Error('Patient not found');
      }

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      // Prepare payload for patient backend specialist appointment endpoint
      const payload = {
        patient_id,
        category,
        appointment_date,
        start_time,
        duration_minutes: duration_minutes || 30,
        timezone: timezone || 'UTC',
        appointment_type,
        consultation_fee: consultation_fee || 0,
        patient_notes: admin_notes || patient_notes, // Admin notes take precedence
        private_notes: `Created by Admin. ${admin_notes || ''}`.trim(),
        status: 'OPEN',
        meeting_channel: meeting_channel || 'zoom',
        whatsapp_number,
        location,
        phone_number,
      };

      this.logger.log(`Admin creating appointment: Patient ${patient_id} with Specialist ${specialist_id}`);
      this.logger.log(`Calling patient backend at: ${this.patientBackendUrl}/api/appointments/specialist/create`);
      this.logger.log(`With headers: X-Admin-Request=true, X-Specialist-Id=${specialist_id}`);

      // Call patient backend's specialist appointment creation endpoint
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.patientBackendUrl}/api/appointments/specialist/create`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Request': 'true',
              'X-Specialist-Id': specialist_id.toString(),
            },
          }
        )
      );

      const responseData: any = response.data;
      this.logger.log(`Admin appointment created successfully: ${responseData?.data?._id}`);

      return responseData;
    } catch (error) {
      this.logger.error(`Failed to create admin appointment: ${error.message}`);
      this.logger.error(error.response?.data || error.stack);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to create appointment. Please try again.'
      );
    }
  }

  async getPatientAppointments(
    userId: Types.ObjectId,
    queryStatus: QueryStatus,
  ) {
    const { status } = queryStatus || {};
    return await find(this.appointmentModel, {
      patient: userId,
      ...(!isEmpty(status) && { status }),
    });
  }

  async getSpecialistAppointments(
    userId: Types.ObjectId,
    queryStatus: QueryStatus,
  ) {
    const { status } = queryStatus || {};
    return await this.appointmentModel
      .find({
        specialist: userId,
        ...(status && { status }),
      })
      .populate('patient', 'email profile')
      .exec();
  }

  async getAppointments(appointmentsQueryDto: AppointmentsQueryDto) {
    const { currentPage, pageLimit, date, status, medium, meeting_class } =
      appointmentsQueryDto;
    const { limit, offset } = this.generalHelpers.calcLimitAndOffset(
      +currentPage,
      pageLimit,
    );

    // Build status filter based on special cases
    let statusFilter = {};
    if (status === 'All') {
      // No status filter
    } else if (status === 'UPCOMING') {
      // Upcoming: OPEN appointments in the future
      statusFilter = {
        status: AppointmentStatus.OPEN,
        start_time: { $gt: new Date() },
      };
    } else if (status === 'MISSED') {
      // Missed: OPEN appointments in the past
      statusFilter = {
        status: AppointmentStatus.OPEN,
        start_time: { $lt: new Date() },
      };
    } else {
      // Regular status filter
      statusFilter = { status };
    }

    const query = {
      ...statusFilter,
      ...(date && {
        created_at: {
          $gte: new Date(new Date(date).setHours(0, 0, 0)),
          $lte: new Date(new Date(date).setHours(23, 59, 59)),
        },
      }),
      ...(medium && { meeting_type: medium }),
      ...(meeting_class && { meeting_class }),
    };
    const appointments = (await findAndCountAll({
      model: this.appointmentModel,
      query,
      limit,
      offset,
    })) as AppointmentDocument[];

    return this.generalHelpers.paginate(
      appointments,
      +currentPage,
      limit,
      await countDocuments(this.appointmentModel, { ...query }),
    );
  }

  async analyticsData() {
    const [
      totalAppointments,
      cancelledAppointments,
      completedAppointments,
      totalAppointmentsYesterday,
      cancelledAppointmentsYesterday,
      completedAppointmentsYesterday,
    ] = await Promise.all([
      countDocuments(this.appointmentModel, {}),
      countDocuments(this.appointmentModel, {
        status: AppointmentStatus.CANCELLED,
      }),
      countDocuments(this.appointmentModel, {
        status: AppointmentStatus.COMPLETED,
      }),
      countDocuments(this.appointmentModel, {
        created_at: {
          $gte: moment().subtract(1, 'day').startOf('day').toDate(),
          $lte: moment().subtract(1, 'day').endOf('day').toDate(),
        },
      }),
      countDocuments(this.appointmentModel, {
        status: AppointmentStatus.CANCELLED,
        created_at: {
          $gte: moment().subtract(1, 'day').startOf('day').toDate(),
          $lte: moment().subtract(1, 'day').endOf('day').toDate(),
        },
      }),
      countDocuments(this.appointmentModel, {
        status: AppointmentStatus.COMPLETED,
        created_at: {
          $gte: moment().subtract(1, 'day').startOf('day').toDate(),
          $lte: moment().subtract(1, 'day').endOf('day').toDate(),
        },
      }),
    ]);
    return {
      totalAppointments,
      cancelledAppointments,
      completedAppointments,
      totalAppointmentsYesterday,
      cancelledAppointmentsYesterday,
      completedAppointmentsYesterday,
    };
  }

  async analyticsGraphData(appointmentsAnalyticsDto: AppointmentsAnalyticsDto) {
    let { start_date, end_date } = appointmentsAnalyticsDto;
    const { interval, filter } = appointmentsAnalyticsDto;

    switch (interval) {
      case Interval.DAY: {
        if (!start_date)
          start_date = moment().subtract(2, 'month').startOf('month').toDate();
        if (!end_date) end_date = moment().toDate();
        if (isArray(filter)) {
          const data = await Promise.all(
            filter.map((fil) =>
              aggregateDataPerDay(this.appointmentModel, {
                created_at: {
                  $gte: moment(start_date).toDate(),
                  $lt: moment(end_date).toDate(),
                },
                ...this.filterQuery(fil),
              }),
            ),
          );
          return {
            interval,
            data: filter.map((fil, index) => ({
              filter: fil,
              data: data[index],
            })),
          };
        }
        return {
          interval,
          data: {
            filter,
            data: await aggregateDataPerDay(this.appointmentModel, {
              created_at: {
                $gte: moment(start_date).toDate(),
                $lt: moment(end_date).toDate(),
              },
              ...this.filterQuery(filter),
            }),
          },
        };
      }
      case Interval.WEEK: {
        if (!start_date) start_date = moment().subtract(3, 'month').toDate();
        if (!end_date) end_date = moment().toDate();
        if (isArray(filter)) {
          const data = await Promise.all(
            filter.map((fil) =>
              aggregateDataPerWeek(this.appointmentModel, {
                created_at: {
                  $gte: moment(start_date).toDate(),
                  $lt: moment(end_date).toDate(),
                },
                ...this.filterQuery(fil),
              }),
            ),
          );
          return {
            interval,
            data: filter.map((fil, index) => ({
              filter: fil,
              data: data[index],
            })),
          };
        }
        return {
          interval,
          data: {
            filter,
            data: await aggregateDataPerWeek(this.appointmentModel, {
              created_at: {
                $gte: moment(start_date).toDate(),
                $lt: moment(end_date).toDate(),
              },
              ...this.filterQuery(filter),
            }),
          },
        };
      }
      case Interval.MONTH: {
        if (!start_date) start_date = moment().subtract(8, 'month').toDate();
        if (!end_date) end_date = moment().toDate();
        if (isArray(filter)) {
          const data = await Promise.all(
            filter.map((fil) =>
              aggregateDataPerMonth(this.appointmentModel, {
                created_at: {
                  $gte: moment(start_date).toDate(),
                  $lt: moment(end_date).toDate(),
                },
                ...this.filterQuery(fil),
              }),
            ),
          );
          return {
            interval,
            data: filter.map((fil, index) => ({
              filter: fil,
              data: data[index],
            })),
          };
        }
        return {
          interval,
          data: {
            filter,
            data: await aggregateDataPerMonth(this.appointmentModel, {
              created_at: {
                $gte: moment(start_date).toDate(),
                $lt: moment(end_date).toDate(),
              },
              ...this.filterQuery(filter),
            }),
          },
        };
      }
      case Interval.YEAR: {
        if (isArray(filter)) {
          const data = await Promise.all(
            filter.map((fil) =>
              aggregateDataPerYear(this.appointmentModel, {
                ...this.filterQuery(fil),
              }),
            ),
          );
          return {
            interval,
            data: filter.map((fil, index) => ({
              filter: fil,
              data: data[index],
            })),
          };
        }
        return {
          interval,
          data: {
            filter,
            data: await aggregateDataPerYear(this.appointmentModel, {
              ...this.filterQuery(filter),
            }),
          },
        };
      }
      default: {
        start_date = moment().subtract(2, 'month').toDate();
        end_date = moment().toDate();
        if (isArray(filter)) {
          const data = await Promise.all(
            filter.map((fil) =>
              aggregateDataPerDay(this.appointmentModel, {
                created_at: {
                  $gte: moment(start_date).toDate(),
                  $lt: moment(end_date).toDate(),
                },
                ...this.filterQuery(fil),
              }),
            ),
          );
          return {
            interval,
            data: filter.map((fil, index) => ({
              filter: fil,
              data: data[index],
            })),
          };
        }
        return {
          interval,
          data: {
            filter,
            data: await aggregateDataPerDay(this.appointmentModel, {
              created_at: {
                $gte: moment(start_date).toDate(),
                $lt: moment(end_date).toDate(),
              },
              ...this.filterQuery(filter),
            }),
          },
        };
      }
    }
  }

  private filterQuery(filter: AppointmentAnalyticsFilter) {
    switch (filter) {
      case AppointmentAnalyticsFilter.ALL:
        return {};
      case AppointmentAnalyticsFilter.CANCELLED_APPOINTMENTS:
        return { status: AppointmentStatus.CANCELLED };
      case AppointmentAnalyticsFilter.COMPLETED_APPOINTMENTS:
        return { status: AppointmentStatus.COMPLETED };
      default:
        return {};
    }
  }
}
