import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as moment from 'moment';
import { AppointmentsService } from '../appointments/appointments.service';
import { WalletsService } from '../wallets/wallets.service';
import { SpecialistWalletService } from '../wallets/specialist-wallet.service';
import { UnifiedWalletService } from '../accounting/services/unified-wallet.service';
import { WalletOwnerType } from '../accounting/enums/account-codes.enum';
import { SpecialistPatientsService } from '../specialist-patients/specialist-patients.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { Appointment, AppointmentDocument } from '../appointments/entities/appointment.entity';
import { SpecialistPrescription, SpecialistPrescriptionDocument } from '../prescriptions/entities/specialist-prescription.entity';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(SpecialistPrescription.name)
    private specialistPrescriptionModel: Model<SpecialistPrescriptionDocument>,
    private readonly appointmentsService: AppointmentsService,
    private readonly walletsService: WalletsService,
    private readonly specialistWalletService: SpecialistWalletService,
    private readonly unifiedWalletService: UnifiedWalletService,
    private readonly specialistPatientsService: SpecialistPatientsService,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}

  /**
   * Legacy specialist dashboard (kept for backwards compatibility)
   */
  async specialistDashboard(userId: Types.ObjectId) {
    const [appointmentsData, nextAppointment, totalEarnings] =
      await Promise.all([
        this.appointmentsService.aggregatedData(userId),
        this.appointmentsService.nextAppointment(userId),
        await this.walletsService.totalEarningsData(userId),
      ]);
    return {
      appointmentsData,
      nextAppointment,
      totalEarnings,
    };
  }

  /**
   * Enhanced specialist dashboard with comprehensive data
   */
  async specialistDashboardEnhanced(userId: string) {
    const userObjId = new Types.ObjectId(userId);

    try {
      // Fetch all data in parallel for performance
      const [
        specialist,
        todayAppointments,
        upcomingAppointments,
        patientStats,
        appointmentsData,
        walletData,
        recentActivity,
        performanceMetrics,
      ] = await Promise.all([
        this.getSpecialistProfile(userObjId),
        this.getTodayAppointments(userObjId),
        this.getUpcomingAppointments(userObjId, 5),
        this.specialistPatientsService.getPatientStats(userId),
        this.appointmentsService.aggregatedData(userObjId),
        this.unifiedWalletService.getUserEarnings(userObjId, WalletOwnerType.SPECIALIST).catch((err) => {
          this.logger.warn(`Failed to fetch wallet data: ${err.message}`);
          return { total_earnings: 0, available_balance: 0, held_balance: 0, pending_balance: 0 };
        }),
        this.getRecentActivity(userObjId, 10),
        this.getPerformanceMetrics(userObjId),
      ]);

      return {
        specialist,
        today: {
          date: new Date(),
          appointments: todayAppointments,
          appointmentCount: todayAppointments.length,
          completedToday: todayAppointments.filter(a => a.status === 'COMPLETED').length,
          pendingToday: todayAppointments.filter(a => a.status === 'OPEN').length,
        },
        upcomingAppointments,
        patientStats,
        appointmentsData,
        wallet: {
          balance: walletData?.available_balance || 0,
          heldBalance: walletData?.held_balance || 0,
          pendingBalance: walletData?.pending_balance || 0,
          totalEarnings: walletData?.total_earnings || 0,
        },
        recentActivity,
        performanceMetrics,
      };
    } catch (error) {
      this.logger.error(`Error fetching enhanced dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get specialist profile with essential info
   */
  private async getSpecialistProfile(userId: Types.ObjectId) {
    const user: any = await this.userModel
      .findById(userId)
      .select('profile professional_practice average_rating total_reviews status')
      .lean();

    if (!user) return null;

    const profileImage = await this.fileUploadHelper.resolveProfileImage(
      user.profile?.profile_image || user.profile?.profile_photo || null,
    );

    return {
      id: user._id,
      firstName: user.profile?.first_name || '',
      lastName: user.profile?.last_name || '',
      fullName: `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim(),
      specialty: user.professional_practice?.specialty || user.professional_practice?.specialization || 'Specialist',
      profileImage,
      averageRating: user.average_rating || 0,
      totalReviews: user.total_reviews || 0,
      status: user.status,
    };
  }

  /**
   * Get today's appointments
   */
  private async getTodayAppointments(userId: Types.ObjectId) {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const appointments = await this.appointmentModel
      .find({
        specialist: userId,
        start_time: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['OPEN', 'ONGOING', 'COMPLETED'] },
      })
      .populate('patient', 'profile')
      .sort({ start_time: 1 })
      .lean();

    return Promise.all(appointments.map(async (apt: any) => ({
      _id: apt._id,
      startTime: apt.start_time,
      endTime: apt.end_time,
      status: apt.status,
      appointmentType: apt.appointment_type,
      patient: apt.patient ? {
        id: apt.patient._id,
        firstName: apt.patient.profile?.first_name || '',
        lastName: apt.patient.profile?.last_name || '',
        fullName: `${apt.patient.profile?.first_name || ''} ${apt.patient.profile?.last_name || ''}`.trim(),
        profileImage: await this.fileUploadHelper.resolveProfileImage(
          apt.patient.profile?.profile_image || apt.patient.profile?.profile_photo || null,
        ),
      } : null,
      hasJoinUrl: !!apt.join_url,
      hasStartUrl: !!apt.start_url,
    })));
  }

  /**
   * Get upcoming appointments (next N appointments)
   */
  private async getUpcomingAppointments(userId: Types.ObjectId, limit: number = 5) {
    const now = new Date();

    const appointments = await this.appointmentModel
      .find({
        specialist: userId,
        start_time: { $gt: now },
        status: 'OPEN',
      })
      .populate('patient', 'profile')
      .sort({ start_time: 1 })
      .limit(limit)
      .lean();

    return Promise.all(appointments.map(async (apt: any) => ({
      _id: apt._id,
      startTime: apt.start_time,
      endTime: apt.end_time,
      status: apt.status,
      appointmentType: apt.appointment_type,
      patient: apt.patient ? {
        id: apt.patient._id,
        firstName: apt.patient.profile?.first_name || '',
        lastName: apt.patient.profile?.last_name || '',
        fullName: `${apt.patient.profile?.first_name || ''} ${apt.patient.profile?.last_name || ''}`.trim(),
        profileImage: await this.fileUploadHelper.resolveProfileImage(
          apt.patient.profile?.profile_image || apt.patient.profile?.profile_photo || null,
        ),
      } : null,
    })));
  }

  /**
   * Get recent activity (appointments and prescriptions)
   * Fetches most recent activities regardless of date
   */
  private async getRecentActivity(userId: Types.ObjectId, limit: number = 10) {
    // Get recent completed appointments (no date filter - just most recent)
    const recentAppointments = await this.appointmentModel
      .find({
        specialist: userId,
        status: 'COMPLETED',
      })
      .populate('patient', 'profile')
      .sort({ start_time: -1 })
      .limit(limit)
      .lean();

    // Get recent prescriptions (no date filter - just most recent)
    const recentPrescriptions = await this.specialistPrescriptionModel
      .find({
        specialist_id: userId,
        status: { $ne: 'draft' },
      })
      .populate('patient_id', 'profile')
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    // Combine and format activities
    const activities: any[] = [
      ...recentAppointments.map((apt: any) => ({
        type: 'appointment_completed',
        date: apt.start_time,
        title: 'Consultation Completed',
        description: `Consultation with ${apt.patient?.profile?.first_name || 'Patient'} ${apt.patient?.profile?.last_name || ''}`,
        patient: apt.patient ? {
          id: apt.patient._id,
          fullName: `${apt.patient.profile?.first_name || ''} ${apt.patient.profile?.last_name || ''}`.trim(),
        } : null,
        referenceId: apt._id,
      })),
      ...recentPrescriptions.map((rx: any) => ({
        type: 'prescription_written',
        date: rx.created_at,
        title: 'Prescription Written',
        description: `Prescription for ${(rx.patient_id as any)?.profile?.first_name || 'Patient'} ${(rx.patient_id as any)?.profile?.last_name || ''} - ${rx.medications?.length || 0} medication(s)`,
        patient: rx.patient_id ? {
          id: (rx.patient_id as any)._id,
          fullName: `${(rx.patient_id as any).profile?.first_name || ''} ${(rx.patient_id as any).profile?.last_name || ''}`.trim(),
        } : null,
        referenceId: rx._id,
      })),
    ];

    // Sort by date and limit
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(userId: Types.ObjectId) {
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    // Get appointment metrics
    const [
      totalAppointmentsThisMonth,
      completedThisMonth,
      cancelledThisMonth,
      totalAppointmentsThisWeek,
      completedThisWeek,
    ] = await Promise.all([
      this.appointmentModel.countDocuments({
        specialist: userId,
        start_time: { $gte: thirtyDaysAgo },
      }),
      this.appointmentModel.countDocuments({
        specialist: userId,
        status: 'COMPLETED',
        start_time: { $gte: thirtyDaysAgo },
      }),
      this.appointmentModel.countDocuments({
        specialist: userId,
        status: 'CANCELLED',
        start_time: { $gte: thirtyDaysAgo },
      }),
      this.appointmentModel.countDocuments({
        specialist: userId,
        start_time: { $gte: sevenDaysAgo },
      }),
      this.appointmentModel.countDocuments({
        specialist: userId,
        status: 'COMPLETED',
        start_time: { $gte: sevenDaysAgo },
      }),
    ]);

    // Get prescription count
    const prescriptionsThisMonth = await this.specialistPrescriptionModel.countDocuments({
      specialist_id: userId,
      status: { $ne: 'draft' },
      created_at: { $gte: thirtyDaysAgo },
    });

    // Calculate completion rate
    const completionRate = totalAppointmentsThisMonth > 0
      ? Math.round((completedThisMonth / totalAppointmentsThisMonth) * 100)
      : 100;

    return {
      thisMonth: {
        totalAppointments: totalAppointmentsThisMonth,
        completed: completedThisMonth,
        cancelled: cancelledThisMonth,
        prescriptions: prescriptionsThisMonth,
        completionRate,
      },
      thisWeek: {
        totalAppointments: totalAppointmentsThisWeek,
        completed: completedThisWeek,
      },
    };
  }

  /**
   * Get comprehensive specialist analytics for the analytics page
   */
  async getSpecialistAnalytics(userId: string, period: string = '30d') {
    const userObjId = new Types.ObjectId(userId);

    // Parse period
    const periodDays = this.parsePeriodToDays(period);
    const startDate = moment().subtract(periodDays, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    // Previous period for comparison
    const prevStartDate = moment().subtract(periodDays * 2, 'days').startOf('day').toDate();
    const prevEndDate = moment().subtract(periodDays, 'days').endOf('day').toDate();

    try {
      const [
        summary,
        previousSummary,
        byStatus,
        byChannel,
        byType,
        dailyTrend,
        peakHours,
        monthlyTrend,
        revenueData,
      ] = await Promise.all([
        this.getAppointmentSummary(userObjId, startDate, endDate),
        this.getAppointmentSummary(userObjId, prevStartDate, prevEndDate),
        this.getBreakdownByStatus(userObjId, startDate, endDate),
        this.getBreakdownByChannel(userObjId, startDate, endDate),
        this.getBreakdownByType(userObjId, startDate, endDate),
        this.getDailyTrend(userObjId, startDate, endDate),
        this.getPeakHours(userObjId, startDate, endDate),
        this.getMonthlyTrend(userObjId),
        this.getRevenueData(userObjId, startDate, endDate),
      ]);

      // Calculate trends
      const appointmentsTrend = this.calculateTrend(summary.total, previousSummary.total);
      const completionTrend = this.calculateTrend(summary.completionRate, previousSummary.completionRate);
      const revenueTrend = this.calculateTrend(revenueData.total, revenueData.previousTotal);
      const patientsTrend = this.calculateTrend(summary.uniquePatients, previousSummary.uniquePatients);

      return {
        period,
        dateRange: { start: startDate, end: endDate },
        summary: {
          totalAppointments: summary.total,
          completedRate: summary.completionRate,
          revenue: revenueData.total,
          uniquePatients: summary.uniquePatients,
          trends: {
            appointments: appointmentsTrend,
            completion: completionTrend,
            revenue: revenueTrend,
            patients: patientsTrend,
          },
        },
        byStatus,
        byChannel,
        byType,
        charts: {
          dailyTrend,
          peakHours,
          monthlyTrend,
          revenueByChannel: revenueData.byChannel,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching specialist analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  private parsePeriodToDays(period: string): number {
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    return periodMap[period] || 30;
  }

  private async getAppointmentSummary(userId: Types.ObjectId, startDate: Date, endDate: Date) {
    const [total, completed, uniquePatients] = await Promise.all([
      this.appointmentModel.countDocuments({
        specialist: userId,
        start_time: { $gte: startDate, $lte: endDate },
      }),
      this.appointmentModel.countDocuments({
        specialist: userId,
        status: 'COMPLETED',
        start_time: { $gte: startDate, $lte: endDate },
      }),
      this.appointmentModel.distinct('patient', {
        specialist: userId,
        start_time: { $gte: startDate, $lte: endDate },
      }).then(patients => patients.length),
    ]);

    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      uniquePatients,
    };
  }

  private async getBreakdownByStatus(userId: Types.ObjectId, startDate: Date, endDate: Date) {
    const result = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          start_time: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap: Record<string, number> = {
      completed: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      no_show: 0,
    };

    result.forEach((item: any) => {
      const status = (item._id || '').toLowerCase();
      if (status === 'completed') statusMap.completed = item.count;
      else if (status === 'open') statusMap.confirmed = item.count;
      else if (status === 'ongoing') statusMap.pending = item.count;
      else if (status === 'cancelled') statusMap.cancelled = item.count;
      else if (status === 'missed') statusMap.no_show = item.count;
    });

    return statusMap;
  }

  private async getBreakdownByChannel(userId: Types.ObjectId, startDate: Date, endDate: Date) {
    const result = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          start_time: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$meeting_channel',
          count: { $sum: 1 },
        },
      },
    ]);

    const channelMap: Record<string, number> = {
      video: 0,
      audio: 0,
      chat: 0,
      in_person: 0,
    };

    result.forEach((item: any) => {
      const channel = (item._id || '').toLowerCase();
      if (channel === 'zoom' || channel === 'google_meet' || channel === 'microsoft_teams') {
        channelMap.video += item.count;
      } else if (channel === 'phone' || channel === 'whatsapp') {
        channelMap.audio += item.count;
      } else if (channel === 'in_person') {
        channelMap.in_person = item.count;
      } else {
        channelMap.video += item.count; // Default to video
      }
    });

    return channelMap;
  }

  private async getBreakdownByType(userId: Types.ObjectId, startDate: Date, endDate: Date) {
    const result = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          start_time: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$appointment_type',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const typeMap: Record<string, number> = {};
    result.forEach((item: any) => {
      const typeName = item._id || 'Other';
      typeMap[typeName] = item.count;
    });

    return typeMap;
  }

  private async getDailyTrend(userId: Types.ObjectId, startDate: Date, endDate: Date) {
    const result = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          start_time: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$start_time' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Group by date
    const dailyData: Record<string, { date: string; completed: number; cancelled: number; total: number }> = {};

    result.forEach((item: any) => {
      const date = item._id.date;
      if (!dailyData[date]) {
        dailyData[date] = { date, completed: 0, cancelled: 0, total: 0 };
      }
      dailyData[date].total += item.count;
      if (item._id.status === 'COMPLETED') {
        dailyData[date].completed = item.count;
      } else if (item._id.status === 'CANCELLED') {
        dailyData[date].cancelled = item.count;
      }
    });

    return Object.values(dailyData);
  }

  private async getPeakHours(userId: Types.ObjectId, startDate: Date, endDate: Date) {
    const result = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          start_time: { $gte: startDate, $lte: endDate },
          status: { $in: ['COMPLETED', 'OPEN', 'ONGOING'] },
        },
      },
      {
        $group: {
          _id: { $hour: '$start_time' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Create 24-hour array
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    result.forEach((item: any) => {
      if (item._id >= 0 && item._id < 24) {
        hourlyData[item._id].count = item.count;
      }
    });

    return hourlyData;
  }

  private async getMonthlyTrend(userId: Types.ObjectId) {
    const sixMonthsAgo = moment().subtract(6, 'months').startOf('month').toDate();

    const result = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          start_time: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$start_time' },
            month: { $month: '$start_time' },
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return result.map((item: any) => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      label: moment({ year: item._id.year, month: item._id.month - 1 }).format('MMM YYYY'),
      total: item.total,
      completed: item.completed,
    }));
  }

  private async getRevenueData(userId: Types.ObjectId, startDate: Date, endDate: Date) {
    // Get revenue from completed appointments
    // Revenue is stored in escrow.consultation_fee_settled (for settled) or appointment_fee (fallback)
    const currentRevenue = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          status: 'COMPLETED',
          start_time: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$meeting_channel',
          revenue: {
            $sum: {
              $ifNull: [
                '$escrow.consultation_fee_settled',
                { $ifNull: ['$appointment_fee', 0] }
              ]
            }
          },
        },
      },
    ]);

    // Previous period for comparison
    const periodDays = moment(endDate).diff(moment(startDate), 'days');
    const prevStartDate = moment(startDate).subtract(periodDays, 'days').toDate();
    const prevEndDate = startDate;

    const previousRevenue = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: userId,
          status: 'COMPLETED',
          start_time: { $gte: prevStartDate, $lte: prevEndDate },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: [
                '$escrow.consultation_fee_settled',
                { $ifNull: ['$appointment_fee', 0] }
              ]
            }
          },
        },
      },
    ]);

    let total = 0;
    const byChannel: Record<string, number> = { video: 0, audio: 0, in_person: 0 };

    currentRevenue.forEach((item: any) => {
      total += item.revenue;
      const channel = (item._id || '').toLowerCase();
      if (channel === 'zoom' || channel === 'google_meet' || channel === 'microsoft_teams') {
        byChannel.video += item.revenue;
      } else if (channel === 'phone' || channel === 'whatsapp') {
        byChannel.audio += item.revenue;
      } else if (channel === 'in_person') {
        byChannel.in_person += item.revenue;
      } else {
        byChannel.video += item.revenue;
      }
    });

    return {
      total,
      previousTotal: previousRevenue[0]?.total || 0,
      byChannel,
    };
  }

  private calculateTrend(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'flat' };
    }
    const change = Math.round(((current - previous) / previous) * 100);
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    };
  }
}
