import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { Appointment, AppointmentDocument } from '../appointments/entities/appointment.entity';
import { HealthCheckup, HealthCheckupDocument } from '../health-checkup/entities/health-checkup.entity';
import { Vital, VitalDocument } from '../vitals/entities/vital.entity';
import { Prescription, PrescriptionDocument } from '../prescriptions/entities/prescription.entity';
import { SpecialistPrescription, SpecialistPrescriptionDocument } from '../prescriptions/entities/specialist-prescription.entity';
import { PatientPrescriptionUpload, PatientPrescriptionUploadDocument } from '../pharmacy/entities/patient-prescription-upload.entity';
import { PharmacyOrder, PharmacyOrderDocument } from '../pharmacy/entities/pharmacy-order.entity';
import {
  SpecialistPatientFlag,
  SpecialistPatientFlagDocument,
} from './entities/specialist-patient-flag.entity';
import {
  PatientAccessLog,
  PatientAccessLogDocument,
  AccessType,
} from './entities/patient-access-log.entity';
import {
  GetPatientsQueryDto,
  PatientFilter,
  PatientSort,
} from './dto/get-patients-query.dto';
import { StarPatientDto } from './dto/star-patient.dto';
import { AdvancedHealthScore, AdvancedHealthScoreDocument } from '../advanced-health-score/entities/advanced-health-score.entity';
import { RecoveryProfile, RecoveryProfileDocument } from '../recovery/entities/recovery-profile.entity';
import { SobrietyLog, SobrietyLogDocument } from '../recovery/entities/sobriety-log.entity';
import { AddictionScreening, AddictionScreeningDocument } from '../recovery/entities/addiction-screening.entity';
import { CrisisEvent, CrisisEventDocument } from '../recovery/entities/crisis-event.entity';
import { RecoveryPlan, RecoveryPlanDocument } from '../recovery/entities/recovery-plan.entity';
import { CopingExerciseSession, CopingExerciseSessionDocument } from '../recovery/entities/coping-exercise-session.entity';
import { RiskAssessmentReport, RiskAssessmentReportDocument } from '../recovery/entities/risk-assessment-report.entity';
import { RecoveryMilestone, RecoveryMilestoneDocument } from '../recovery/entities/recovery-milestone.entity';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number = 300) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

@Injectable()
export class SpecialistPatientsService {
  private readonly logger = new Logger(SpecialistPatientsService.name);
  // Cache for patient stats (5 minute TTL)
  private readonly statsCache = new SimpleCache<any>(300);
  // Cache for patient relationships (10 minute TTL)
  private readonly relationshipCache = new SimpleCache<boolean>(600);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(HealthCheckup.name)
    private healthCheckupModel: Model<HealthCheckupDocument>,
    @InjectModel(Vital.name)
    private vitalModel: Model<VitalDocument>,
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(SpecialistPrescription.name)
    private specialistPrescriptionModel: Model<SpecialistPrescriptionDocument>,
    @InjectModel(PatientPrescriptionUpload.name)
    private patientPrescriptionUploadModel: Model<PatientPrescriptionUploadDocument>,
    @InjectModel(PharmacyOrder.name)
    private pharmacyOrderModel: Model<PharmacyOrderDocument>,
    @InjectModel(SpecialistPatientFlag.name)
    private specialistPatientFlagModel: Model<SpecialistPatientFlagDocument>,
    @InjectModel(PatientAccessLog.name)
    private patientAccessLogModel: Model<PatientAccessLogDocument>,
    @InjectModel(AdvancedHealthScore.name)
    private advancedHealthScoreModel: Model<AdvancedHealthScoreDocument>,
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(AddictionScreening.name)
    private addictionScreeningModel: Model<AddictionScreeningDocument>,
    @InjectModel(CrisisEvent.name)
    private crisisEventModel: Model<CrisisEventDocument>,
    @InjectModel(RecoveryPlan.name)
    private recoveryPlanModel: Model<RecoveryPlanDocument>,
    @InjectModel(CopingExerciseSession.name)
    private copingExerciseSessionModel: Model<CopingExerciseSessionDocument>,
    @InjectModel(RiskAssessmentReport.name)
    private riskAssessmentReportModel: Model<RiskAssessmentReportDocument>,
    @InjectModel(RecoveryMilestone.name)
    private recoveryMilestoneModel: Model<RecoveryMilestoneDocument>,
    private fileUploadHelper: FileUploadHelper,
  ) {}

  /**
   * Get paginated list of patients for a specialist
   */
  async getPatients(specialistId: string, query: GetPatientsQueryDto) {
    const specialistObjId = this.validateObjectId(specialistId, 'specialist ID');

    const filter = query.filter || PatientFilter.MY_PATIENTS;
    const search = query.search;
    const sort = query.sort || PatientSort.LAST_VISIT;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let patientIds: Types.ObjectId[] = [];
    let totalCount = 0;

    switch (filter) {
      case PatientFilter.MY_PATIENTS:
      case PatientFilter.RECENT:
        // Get patients from appointments
        const appointmentQuery: any = {
          specialist: specialistObjId,
          status: { $in: ['COMPLETED', 'ONGOING', 'OPEN'] },
        };

        if (filter === PatientFilter.RECENT) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          appointmentQuery.start_time = { $gte: thirtyDaysAgo };
        }

        const patientAppointments = await this.appointmentModel.aggregate([
          { $match: appointmentQuery },
          { $group: { _id: '$patient', lastVisit: { $max: '$start_time' }, appointmentCount: { $sum: 1 } } },
          { $sort: { lastVisit: -1 } },
        ]);

        patientIds = patientAppointments.map((p) => p._id);
        break;

      case PatientFilter.STARRED:
        const starredFlags = await this.specialistPatientFlagModel.find({
          specialist_id: specialistObjId,
          is_starred: true,
        }).select('patient_id');

        patientIds = starredFlags.map((f) => f.patient_id);
        break;

      case PatientFilter.ALL:
        // For "all" filter, we'll query users directly with search
        break;
    }

    // Build user query
    const userQuery: any = { user_type: 'Patient' };

    if (filter !== PatientFilter.ALL && patientIds.length > 0) {
      userQuery._id = { $in: patientIds };
    } else if (filter !== PatientFilter.ALL && patientIds.length === 0) {
      // No patients found for this specialist
      return {
        patients: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Add search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      userQuery.$or = [
        { 'profile.first_name': searchRegex },
        { 'profile.last_name': searchRegex },
        { 'profile.contact.email': searchRegex },
        { 'profile.contact.phone.number': searchRegex },
      ];
    }

    // Get total count
    totalCount = await this.userModel.countDocuments(userQuery);

    // Get patients with pagination
    const patients: any[] = await this.userModel
      .find(userQuery)
      .select('profile basic_health_score status')
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich patients with additional data
    const enrichedPatients = await Promise.all(
      patients.map(async (patient: any) => {
        const patientId = patient._id;

        // Get appointment stats for this patient with this specialist
        const appointmentStats = await this.appointmentModel.aggregate([
          {
            $match: {
              patient: patientId,
              specialist: specialistObjId,
            },
          },
          {
            $group: {
              _id: null,
              totalAppointments: { $sum: 1 },
              completedAppointments: {
                $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
              },
              // Only use COMPLETED appointments for lastVisit
              lastVisit: {
                $max: {
                  $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$start_time', null],
                },
              },
            },
          },
        ]);

        // Check if this patient is in the specialist's practice (has had any appointment)
        const isMyPatient = filter === PatientFilter.ALL
          ? await this.checkPatientRelationship(specialistId, patientId.toString())
          : true;

        // Get prescription count
        const prescriptionCount = await this.prescriptionModel.countDocuments({
          patient: patientId,
          prescribed_by: specialistObjId,
        });

        // Get starred status
        const flagRecord = await this.specialistPatientFlagModel.findOne({
          specialist_id: specialistObjId,
          patient_id: patientId,
        });

        // Get latest health checkup for risk indicator
        const latestCheckup: any = await this.healthCheckupModel
          .findOne({ user: patientId })
          .sort({ created_at: -1 })
          .select('response.data.triage_level')
          .lean();

        // Calculate risk level
        let riskLevel = 'low';
        if (latestCheckup?.response?.data?.triage_level) {
          const triageLevel = latestCheckup.response.data.triage_level;
          if (triageLevel === 'emergency' || triageLevel === 'emergency_ambulance') {
            riskLevel = 'critical';
          } else if (triageLevel === 'consultation_24') {
            riskLevel = 'high';
          } else if (triageLevel === 'consultation') {
            riskLevel = 'medium';
          }
        }

        const stats = appointmentStats[0] || {
          totalAppointments: 0,
          completedAppointments: 0,
          lastVisit: null,
        };

        // Presign profile image if exists
        let presignedProfileImage = patient.profile?.profile_image || patient.profile?.profile_photo || null;
        if (presignedProfileImage && (presignedProfileImage.includes('amazonaws.com') || presignedProfileImage.includes('s3.'))) {
          try {
            presignedProfileImage = await this.fileUploadHelper.getPresignedUrl(presignedProfileImage, 3600);
          } catch (e) {
            this.logger.error(`Error presigning profile image: ${e.message}`);
          }
        }

        // Extract just the score value from basic_health_score object
        const basicScore = patient.basic_health_score;
        const basicHealthScoreValue = typeof basicScore === 'object' && basicScore !== null
          ? basicScore.score
          : basicScore;

        return {
          _id: patient._id,
          profile: {
            ...patient.profile,
            profile_image: presignedProfileImage,
          },
          basic_health_score: basicHealthScoreValue,
          basic_health_score_details: basicScore, // Keep full details for reference
          status: patient.status,
          stats: {
            totalAppointments: stats.totalAppointments,
            completedAppointments: stats.completedAppointments,
            prescriptionCount,
            lastVisit: stats.lastVisit,
          },
          isStarred: flagRecord?.is_starred || false,
          isMyPatient, // Whether this patient is in the specialist's practice
          riskLevel,
        };
      }),
    );

    // Sort enriched patients
    if (sort === PatientSort.LAST_VISIT) {
      enrichedPatients.sort((a, b) => {
        if (!a.stats.lastVisit) return 1;
        if (!b.stats.lastVisit) return -1;
        return new Date(b.stats.lastVisit).getTime() - new Date(a.stats.lastVisit).getTime();
      });
    } else if (sort === PatientSort.NAME) {
      enrichedPatients.sort((a, b) => {
        const nameA = `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.toLowerCase();
        const nameB = `${b.profile?.first_name || ''} ${b.profile?.last_name || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sort === PatientSort.RISK_LEVEL) {
      const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      enrichedPatients.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    }

    return {
      patients: enrichedPatients,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get patient statistics for the specialist (cached for 5 minutes)
   */
  async getPatientStats(specialistId: string) {
    // Check cache first
    const cacheKey = `stats:${specialistId}`;
    const cached = this.statsCache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for patient stats: ${specialistId}`);
      return cached;
    }

    const specialistObjId = new Types.ObjectId(specialistId);

    // Get total unique patients
    const totalPatients = await this.appointmentModel.distinct('patient', {
      specialist: specialistObjId,
      status: { $in: ['COMPLETED', 'ONGOING', 'OPEN'] },
    });

    // Get patients seen this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthPatients = await this.appointmentModel.distinct('patient', {
      specialist: specialistObjId,
      start_time: { $gte: startOfMonth },
      status: { $in: ['COMPLETED', 'ONGOING', 'OPEN'] },
    });

    // Get starred patients count
    const starredCount = await this.specialistPatientFlagModel.countDocuments({
      specialist_id: specialistObjId,
      is_starred: true,
    });

    // Get patients seen this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekPatients = await this.appointmentModel.distinct('patient', {
      specialist: specialistObjId,
      start_time: { $gte: startOfWeek },
      status: { $in: ['COMPLETED', 'ONGOING', 'OPEN'] },
    });

    const stats = {
      totalPatients: totalPatients.length,
      thisMonthPatients: thisMonthPatients.length,
      thisWeekPatients: thisWeekPatients.length,
      starredPatients: starredCount,
    };

    // Cache the result
    this.statsCache.set(cacheKey, stats);

    return stats;
  }

  /**
   * Get detailed patient information
   */
  async getPatientDetails(patientId: string, specialistId: string) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');
    const specialistObjId = this.validateObjectId(specialistId, 'specialist ID');

    const patient: any = await this.userModel
      .findById(patientObjId)
      .select('-profile.password -profile.twoFA_secret -security')
      .lean();

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check if specialist has relationship with patient
    const hasRelationship = await this.checkPatientRelationship(
      specialistId,
      patientId,
    );

    // Get starred status
    const flagRecord = await this.specialistPatientFlagModel.findOne({
      specialist_id: specialistObjId,
      patient_id: patientObjId,
    });

    // Get appointment stats
    const appointmentStats = await this.appointmentModel.aggregate([
      {
        $match: {
          patient: patientObjId,
          specialist: specialistObjId,
        },
      },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
          },
          // Only consider completed appointments for lastVisit
          lastVisit: {
            $max: {
              $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$start_time', null],
            },
          },
          firstVisit: { $min: '$start_time' },
        },
      },
    ]);

    // Get prescription count - use SpecialistPrescription model and exclude drafts
    const prescriptionCount = await this.specialistPrescriptionModel.countDocuments({
      patient_id: patientObjId,
      status: { $ne: 'draft' },
    });

    // Get health checkup count - only completed checkups (with diagnosis) and not deleted
    const healthCheckupCount = await this.healthCheckupModel.countDocuments({
      user: patientObjId,
      deleted_at: { $exists: false },
      'response.data.conditions': { $exists: true, $ne: [] },
    });

    // Get advanced health score
    const advancedScore: any = await this.advancedHealthScoreModel
      .findOne({ userId: patientObjId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate risk level based on:
    // 1. Recent checkups (last 14 days) triage level
    // 2. Basic health score
    // 3. Advanced health score
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get recent checkups (last 14 days) for risk assessment
    const recentCheckup: any = await this.healthCheckupModel
      .findOne({
        user: patientObjId,
        deleted_at: { $exists: false },
        'response.data.conditions': { $exists: true, $ne: [] },
        created_at: { $gte: fourteenDaysAgo },
      })
      .sort({ created_at: -1 })
      .select('response.data.triage_level created_at')
      .lean();

    // Extract health scores
    const basicScoreValue = typeof patient.basic_health_score === 'object'
      ? patient.basic_health_score?.score
      : patient.basic_health_score;
    const advancedScoreValue = advancedScore?.overallScore || advancedScore?.report?.overall_score;

    // Calculate combined risk level
    let riskLevel = this.calculateCombinedRiskLevel(
      recentCheckup?.response?.data?.triage_level,
      basicScoreValue,
      advancedScoreValue,
    );

    const stats = appointmentStats[0] || {
      totalAppointments: 0,
      completedAppointments: 0,
      lastVisit: null,
      firstVisit: null,
    };

    // Presign profile image if exists
    let presignedProfileImage = patient.profile?.profile_image || patient.profile?.profile_photo || null;
    if (presignedProfileImage && (presignedProfileImage.includes('amazonaws.com') || presignedProfileImage.includes('s3.'))) {
      try {
        presignedProfileImage = await this.fileUploadHelper.getPresignedUrl(presignedProfileImage, 3600);
      } catch (e) {
        this.logger.error(`Error presigning profile image: ${e.message}`);
      }
    }

    // Extract just the score value from basic_health_score object
    const basicScore = patient.basic_health_score;
    const basicHealthScoreValue = typeof basicScore === 'object' && basicScore !== null
      ? basicScore.score
      : basicScore;

    return {
      patient: {
        _id: patient._id,
        profile: {
          ...patient.profile,
          profile_image: presignedProfileImage,
        },
        basic_health_score: basicHealthScoreValue,
        basic_health_score_details: basicScore, // Keep full details for reference
        dependants: patient.dependants,
        pre_existing_conditions: patient.pre_existing_conditions,
        emergency_contacts: patient.emergency_contacts,
        status: patient.status,
      },
      advancedHealthScore: advancedScore?.overallScore || advancedScore?.report?.overall_score || null,
      advancedHealthScoreDetails: advancedScore, // Keep full details for reference
      isStarred: flagRecord?.is_starred || false,
      notes: flagRecord?.notes || '',
      categories: flagRecord?.categories || [],
      hasRelationship,
      riskLevel,
      stats: {
        totalAppointments: stats.totalAppointments,
        completedAppointments: stats.completedAppointments,
        prescriptionCount,
        healthCheckupCount,
        lastVisit: stats.lastVisit,
        firstVisit: stats.firstVisit,
      },
    };
  }

  /**
   * Get patient overview for dashboard
   */
  async getPatientOverview(patientId: string, specialistId: string) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');

    // Get recent vitals
    const vitals: any = await this.vitalModel.findOne({
      userId: patientObjId,
    }).lean();

    const recentVitals = this.formatRecentVitals(vitals);

    // Get recent activity (last 10 items)
    const recentActivity = await this.getRecentActivity(patientId, specialistId, 10);

    // Get medical history summary
    const patient: any = await this.userModel
      .findById(patientObjId)
      .select('pre_existing_conditions')
      .lean();

    return {
      recentVitals,
      recentActivity,
      medicalHistory: {
        conditions: patient?.pre_existing_conditions || [],
      },
    };
  }

  /**
   * Get patient health records
   */
  async getPatientHealthRecords(
    patientId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');
    const skip = (page - 1) * limit;

    // Get health checkups
    const [checkups, totalCheckups] = await Promise.all([
      this.healthCheckupModel
        .find({ user: patientObjId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.healthCheckupModel.countDocuments({
        user: patientObjId,
      }),
    ]);

    // Get health scores
    const [basicScore, advancedScores] = await Promise.all([
      this.userModel
        .findById(patientObjId)
        .select('basic_health_score')
        .lean(),
      this.advancedHealthScoreModel
        .find({ userId: patientObjId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Get vitals
    const vitals: any = await this.vitalModel.findOne({
      userId: patientObjId,
    }).lean();

    return {
      checkups: (checkups as any[]).map((c) => this.formatHealthCheckup(c)),
      basicHealthScore: (basicScore as any)?.basic_health_score,
      advancedHealthScores: advancedScores,
      vitals: this.formatVitalsHistory(vitals),
      pagination: {
        total: totalCheckups,
        page,
        limit,
        totalPages: Math.ceil(totalCheckups / limit),
      },
    };
  }

  /**
   * Get patient prescriptions
   */
  async getPatientPrescriptions(
    patientId: string,
    specialistId: string,
    type: 'all' | 'written' | 'uploaded' = 'all',
    page: number = 1,
    limit: number = 10,
  ) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');
    const skip = (page - 1) * limit;
    const results: any = {
      writtenPrescriptions: [],
      uploadedPrescriptions: [],
      pagination: {},
    };

    if (type === 'all' || type === 'written') {
      const [prescriptions, totalWritten] = await Promise.all([
        this.prescriptionModel
          .find({ patient: patientObjId })
          .populate('prescribed_by', 'profile.first_name profile.last_name professional_practice')
          .sort({ created_at: -1 })
          .skip(type === 'written' ? skip : 0)
          .limit(type === 'written' ? limit : 5)
          .lean(),
        this.prescriptionModel.countDocuments({
          patient: patientObjId,
        }),
      ]);

      results.writtenPrescriptions = prescriptions;
      results.totalWritten = totalWritten;
    }

    if (type === 'all' || type === 'uploaded') {
      const [uploads, totalUploaded] = await Promise.all([
        this.patientPrescriptionUploadModel
          .find({ patient_id: patientObjId })
          .sort({ created_at: -1 })
          .skip(type === 'uploaded' ? skip : 0)
          .limit(type === 'uploaded' ? limit : 5)
          .lean(),
        this.patientPrescriptionUploadModel.countDocuments({
          patient_id: patientObjId,
        }),
      ]);

      results.uploadedPrescriptions = uploads;
      results.totalUploaded = totalUploaded;
    }

    const total = type === 'written'
      ? results.totalWritten
      : type === 'uploaded'
        ? results.totalUploaded
        : (results.totalWritten || 0) + (results.totalUploaded || 0);

    results.pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return results;
  }

  /**
   * Get patient appointments with this specialist
   */
  async getPatientAppointments(
    patientId: string,
    specialistId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');
    const specialistObjId = this.validateObjectId(specialistId, 'specialist ID');
    const skip = (page - 1) * limit;

    const query: any = {
      patient: patientObjId,
      specialist: specialistObjId,
    };

    if (status) {
      query.status = status;
    }

    const [appointments, total] = await Promise.all([
      this.appointmentModel
        .find(query)
        .sort({ start_time: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.appointmentModel.countDocuments(query),
    ]);

    return {
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get patient pharmacy orders/purchases
   */
  async getPatientPurchases(
    patientId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.pharmacyOrderModel
        .find({ patient: patientObjId })
        .populate('items.drug', 'name generic_name strength dosage_form manufacturer')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.pharmacyOrderModel.countDocuments({
        patient: patientObjId,
      }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get patient timeline (aggregated activity)
   */
  async getPatientTimeline(
    patientId: string,
    specialistId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');
    const specialistObjId = this.validateObjectId(specialistId, 'specialist ID');

    // Fetch all activity types
    const [appointments, prescriptions, checkups, orders]: any[] = await Promise.all([
      this.appointmentModel
        .find({ patient: patientObjId, specialist: specialistObjId })
        .select('start_time status appointment_type clinical_notes')
        .lean(),
      this.prescriptionModel
        .find({ patient: patientObjId })
        .select('items progress_status')
        .lean(),
      this.healthCheckupModel
        .find({ user: patientObjId })
        .select('response.data.triage_level response.data.conditions')
        .lean(),
      this.pharmacyOrderModel
        .find({ patient: patientObjId })
        .select('status total_amount items')
        .lean(),
    ]);

    // Combine into timeline
    const timeline: any[] = [
      ...appointments.map((a: any) => ({
        type: 'appointment',
        date: a.start_time,
        data: {
          status: a.status,
          appointmentType: a.appointment_type,
          hasNotes: !!a.clinical_notes?.length,
        },
      })),
      ...prescriptions.map((p: any) => ({
        type: 'prescription',
        date: (p as any).created_at || new Date(),
        data: {
          medicationCount: p.items?.length || 0,
          status: p.progress_status,
        },
      })),
      ...checkups.map((c: any) => ({
        type: 'health_checkup',
        date: (c as any).created_at || new Date(),
        data: {
          triageLevel: c.response?.data?.triage_level,
          conditionCount: c.response?.data?.conditions?.length || 0,
        },
      })),
      ...orders.map((o: any) => ({
        type: 'pharmacy_order',
        date: (o as any).created_at || new Date(),
        data: {
          status: o.status,
          totalAmount: o.total_amount,
          itemCount: o.items?.length || 0,
        },
      })),
    ];

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate
    const total = timeline.length;
    const start = (page - 1) * limit;
    const paginatedTimeline = timeline.slice(start, start + limit);

    return {
      timeline: paginatedTimeline,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get patient dependents
   */
  async getPatientDependents(patientId: string) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');

    const patient: any = await this.userModel
      .findById(patientObjId)
      .select('dependants')
      .lean();

    return {
      dependents: patient?.dependants || [],
    };
  }

  /**
   * Star or unstar a patient
   */
  async toggleStarPatient(
    patientId: string,
    specialistId: string,
    dto: StarPatientDto,
  ) {
    const patientObjId = this.validateObjectId(patientId, 'patient ID');
    const specialistObjId = this.validateObjectId(specialistId, 'specialist ID');

    const filter = {
      specialist_id: specialistObjId,
      patient_id: patientObjId,
    };

    const update: any = {
      is_starred: dto.starred,
    };

    if (dto.notes !== undefined) {
      update.notes = dto.notes;
    }

    if (dto.categories !== undefined) {
      update.categories = dto.categories;
    }

    const result = await this.specialistPatientFlagModel.findOneAndUpdate(
      filter,
      { $set: update },
      { upsert: true, new: true },
    );

    // Invalidate stats cache since starred count changed
    this.statsCache.invalidate(`stats:${specialistId}`);

    return {
      isStarred: result.is_starred,
      notes: result.notes,
      categories: result.categories,
    };
  }

  /**
   * Check if specialist has appointment relationship with patient (cached for 10 minutes)
   */
  async checkPatientRelationship(
    specialistId: string,
    patientId: string,
  ): Promise<boolean> {
    // Validate IDs but don't throw on invalid - return false instead
    if (!specialistId || !isValidObjectId(specialistId) ||
        !patientId || !isValidObjectId(patientId)) {
      return false;
    }

    // Check cache first
    const cacheKey = `rel:${specialistId}:${patientId}`;
    const cached = this.relationshipCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const appointment = await this.appointmentModel.findOne({
      specialist: new Types.ObjectId(specialistId),
      patient: new Types.ObjectId(patientId),
    });

    const hasRelationship = !!appointment;

    // Cache the result
    this.relationshipCache.set(cacheKey, hasRelationship);

    return hasRelationship;
  }

  /**
   * Log patient access for audit trail
   */
  async logPatientAccess(
    specialistId: string,
    patientId: string,
    accessType: AccessType,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const specialistObjId = this.validateObjectId(specialistId, 'specialist ID');
      const patientObjId = this.validateObjectId(patientId, 'patient ID');

      const hadPriorAppointment = await this.checkPatientRelationship(
        specialistId,
        patientId,
      );

      await this.patientAccessLogModel.create({
        specialist_id: specialistObjId,
        patient_id: patientObjId,
        access_type: accessType,
        had_prior_appointment: hadPriorAppointment,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (error) {
      // Log error but don't throw - access logging should not block the main request
      this.logger.error(`Failed to log patient access: ${error.message}`, error.stack);
    }
  }

  // Helper methods

  /**
   * Validate and convert a string to ObjectId
   * @throws BadRequestException if the ID is invalid
   */
  private validateObjectId(id: string, fieldName: string = 'ID'): Types.ObjectId {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${fieldName}: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Calculate combined risk level based on recent checkups and health scores
   * Priority: Recent triage level > Low health scores > Default low
   */
  private calculateCombinedRiskLevel(
    recentTriageLevel: string | undefined,
    basicScore: number | undefined,
    advancedScore: number | undefined,
  ): string {
    // 1. If there's a recent checkup (within 14 days), prioritize triage level
    if (recentTriageLevel) {
      if (recentTriageLevel === 'emergency' || recentTriageLevel === 'emergency_ambulance') {
        return 'critical';
      }
      if (recentTriageLevel === 'consultation_24') {
        return 'high';
      }
      if (recentTriageLevel === 'consultation') {
        return 'medium';
      }
      // self_care triage - continue to check health scores
    }

    // 2. If no recent critical checkup, evaluate health scores
    // Use the lower of the two scores for risk assessment (more conservative)
    const scores: number[] = [];
    if (basicScore !== undefined && basicScore !== null && !isNaN(basicScore)) {
      scores.push(basicScore);
    }
    if (advancedScore !== undefined && advancedScore !== null && !isNaN(advancedScore)) {
      scores.push(advancedScore);
    }

    if (scores.length > 0) {
      const lowestScore = Math.min(...scores);

      // Score-based risk levels (assuming 0-100 scale)
      if (lowestScore < 30) {
        return 'high'; // Very low score indicates high risk
      }
      if (lowestScore < 50) {
        return 'medium'; // Low score indicates medium risk
      }
      // Score >= 50 is considered acceptable
    }

    // 3. Default to low risk if no concerning indicators
    return 'low';
  }

  private formatRecentVitals(vitals: any) {
    if (!vitals) return null;

    const getLatest = (arr: any[]) => {
      if (!arr || arr.length === 0) return null;
      return arr.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
    };

    return {
      bloodPressure: getLatest(vitals.blood_pressure),
      pulseRate: getLatest(vitals.pulse_rate),
      bodyTemp: getLatest(vitals.body_temp),
      bodyWeight: getLatest(vitals.body_weight),
      bloodSugar: getLatest(vitals.blood_sugar_level),
    };
  }

  private formatVitalsHistory(vitals: any) {
    if (!vitals) return null;

    return {
      bloodPressure: vitals.blood_pressure || [],
      pulseRate: vitals.pulse_rate || [],
      bodyTemp: vitals.body_temp || [],
      bodyWeight: vitals.body_weight || [],
      bloodSugar: vitals.blood_sugar_level || [],
    };
  }

  private formatHealthCheckup(checkup: any) {
    const symptoms = checkup.request?.symptoms || [];
    const conditions = checkup.response?.data?.conditions || [];
    const triageLevel = checkup.response?.data?.triage_level;

    return {
      _id: checkup._id,
      created_at: checkup.created_at,
      symptoms: symptoms.slice(0, 5).map((s: any) => s.common_name || s.name),
      topConditions: conditions.slice(0, 3).map((c: any) => ({
        name: c.common_name || c.name,
        probability: c.probability,
      })),
      triageLevel,
      hasClaude: !!checkup.claude_summary,
    };
  }

  private async getRecentActivity(
    patientId: string,
    specialistId: string,
    limit: number,
  ) {
    const patientObjId = new Types.ObjectId(patientId);
    const specialistObjId = new Types.ObjectId(specialistId);

    const [appointments, prescriptions, checkups]: any[] = await Promise.all([
      this.appointmentModel
        .find({ patient: patientObjId, specialist: specialistObjId })
        .sort({ start_time: -1 })
        .limit(5)
        .select('start_time status')
        .lean(),
      this.prescriptionModel
        .find({ patient: patientObjId })
        .sort({ created_at: -1 })
        .limit(5)
        .select('progress_status')
        .lean(),
      this.healthCheckupModel
        .find({ user: patientObjId })
        .sort({ created_at: -1 })
        .limit(5)
        .lean(),
    ]);

    const activities: any[] = [
      ...appointments.map((a: any) => ({
        type: 'appointment',
        date: a.start_time,
        description: `Appointment ${a.status?.toLowerCase() || 'scheduled'}`,
      })),
      ...prescriptions.map((p: any) => ({
        type: 'prescription',
        date: (p as any).created_at || new Date(),
        description: `Prescription ${p.progress_status?.toLowerCase() || 'created'}`,
      })),
      ...checkups.map((c: any) => ({
        type: 'health_checkup',
        date: (c as any).created_at || new Date(),
        description: 'Health checkup completed',
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // ─── Recovery Data for Specialists ──────────────────────────────

  /**
   * Get full recovery data for a patient — profile, risk score, logs, screenings, plan.
   */
  async getPatientRecoveryData(patientId: string, specialistId: string) {
    const profile = await this.recoveryProfileModel
      .findOne({
        user: new Types.ObjectId(patientId),
        status: { $ne: 'archived' },
        deleted_at: { $exists: false },
      })
      .lean();

    if (!profile) {
      return { has_recovery_profile: false };
    }

    const patientObjId = new Types.ObjectId(patientId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentLogs, recentScreenings, activePlan, crisisEvents, exerciseCount, riskAssessmentCount, milestoneCount, latestExercise, latestRiskAssessment, latestMilestone, moodTrendLogs] = await Promise.all([
      this.sobrietyLogModel
        .find({ user: patientObjId })
        .sort({ log_date: -1 })
        .limit(7)
        .lean(),
      this.addictionScreeningModel
        .find({ user: patientObjId, deleted_at: { $exists: false } })
        .sort({ created_at: -1 })
        .limit(3)
        .lean(),
      this.recoveryPlanModel
        .findOne({ user: patientObjId, status: 'active', deleted_at: { $exists: false } })
        .lean(),
      this.crisisEventModel
        .find({ user: patientObjId })
        .sort({ created_at: -1 })
        .limit(5)
        .lean(),
      this.copingExerciseSessionModel.countDocuments({ user: patientObjId }),
      this.riskAssessmentReportModel.countDocuments({ user: patientObjId, deleted_at: { $exists: false } }),
      this.recoveryMilestoneModel.countDocuments({ user: patientObjId }),
      this.copingExerciseSessionModel.findOne({ user: patientObjId }).sort({ created_at: -1 }).select('created_at name category').lean(),
      this.riskAssessmentReportModel.findOne({ user: patientObjId, deleted_at: { $exists: false } }).sort({ created_at: -1 }).select('created_at score level').lean(),
      this.recoveryMilestoneModel.findOne({ user: patientObjId }).sort({ created_at: -1 }).select('created_at type title value').lean(),
      this.sobrietyLogModel.find({ user: patientObjId, log_date: { $gte: thirtyDaysAgo } }).sort({ log_date: 1 }).select('log_date mood_score craving_intensity').lean(),
    ]);

    const sobrietyDays = (profile as any).sobriety_start_date
      ? Math.max(0, Math.floor((Date.now() - new Date((profile as any).sobriety_start_date).getTime()) / 86400000))
      : 0;

    return {
      has_recovery_profile: true,
      profile_summary: {
        sobriety_days: sobrietyDays,
        sobriety_start_date: (profile as any).sobriety_start_date,
        primary_substance: (profile as any).substance_use_history?.[0]?.substance || null,
        care_level: (profile as any).care_level,
        status: (profile as any).status,
        longest_streak: (profile as any).longest_sobriety_days || 0,
        total_relapses: (profile as any).total_relapse_count || 0,
        relapse_dates: (profile as any).relapse_dates || [],
      },
      risk: {
        score: (profile as any).current_risk_score ?? 0,
        level: (profile as any).current_risk_level || 'low',
        updated_at: (profile as any).risk_updated_at || null,
        history: ((profile as any).risk_history || []).slice(-30),
      },
      recent_logs: recentLogs.map((log: any) => ({
        date: log.log_date,
        sober_today: log.sober_today,
        mood_score: log.mood_score,
        craving_intensity: log.craving_intensity,
        anxiety_level: log.anxiety_level,
        sleep_quality: log.sleep_quality,
        sleep_hours: log.sleep_hours,
        triggers: log.triggers_encountered || [],
      })),
      recent_screenings: recentScreenings.map((s: any) => ({
        id: s._id,
        instrument: s.instrument,
        total_score: s.total_score,
        risk_level: s.risk_level,
        risk_zone_label: s.risk_zone_label,
        date: s.created_at,
      })),
      recovery_plan: activePlan ? {
        stage_of_change: (activePlan as any).stage_of_change,
        goals: (activePlan as any).goals,
        triggers: (activePlan as any).relapse_prevention?.triggers || [],
        coping_strategies: (activePlan as any).coping_strategies || [],
      } : null,
      crisis_events: crisisEvents.map((e: any) => ({
        type: e.type,
        severity: e.severity,
        date: e.created_at,
        resolved: e.resolved,
      })),
      counts: {
        screenings: recentScreenings.length > 0 ? await this.addictionScreeningModel.countDocuments({ user: patientObjId, deleted_at: { $exists: false } }) : 0,
        exercises: exerciseCount,
        risk_assessments: riskAssessmentCount,
        milestones: milestoneCount,
      },
      latest: {
        exercise: latestExercise ? { date: (latestExercise as any).created_at, name: (latestExercise as any).name, category: (latestExercise as any).category } : null,
        risk_assessment: latestRiskAssessment ? { date: (latestRiskAssessment as any).created_at, score: (latestRiskAssessment as any).score, level: (latestRiskAssessment as any).level } : null,
        milestone: latestMilestone ? { date: (latestMilestone as any).created_at, type: (latestMilestone as any).type, title: (latestMilestone as any).title, value: (latestMilestone as any).value } : null,
      },
      mood_trend_30d: moodTrendLogs.map((log: any) => ({
        date: log.log_date,
        mood: log.mood_score,
        craving: log.craving_intensity,
      })),
    };
  }

  /**
   * Get risk score history for a patient.
   */
  async getPatientRiskHistory(patientId: string, limit = 30, period?: string) {
    const profile = await this.recoveryProfileModel
      .findOne({
        user: new Types.ObjectId(patientId),
        status: { $ne: 'archived' },
        deleted_at: { $exists: false },
      })
      .select('risk_history current_risk_score current_risk_level risk_updated_at')
      .lean();

    if (!profile) {
      throw new NotFoundException('Recovery profile not found');
    }

    let history = (profile as any).risk_history || [];

    // Filter by period
    if (period) {
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[period] || 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      history = history.filter((h: any) => new Date(h.calculated_at) >= cutoff);
    }

    return {
      current_score: (profile as any).current_risk_score ?? 0,
      current_level: (profile as any).current_risk_level || 'low',
      updated_at: (profile as any).risk_updated_at,
      history: history.slice(-limit),
    };
  }

  /**
   * Get paginated screening history for a patient.
   */
  async getPatientScreeningHistory(patientId: string, page = 1, limit = 10) {
    const patientObjId = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    const [screenings, total] = await Promise.all([
      this.addictionScreeningModel
        .find({ user: patientObjId, deleted_at: { $exists: false } })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.addictionScreeningModel.countDocuments({ user: patientObjId, deleted_at: { $exists: false } }),
    ]);

    return {
      data: screenings.map((s: any) => ({
        id: s._id,
        instrument: s.instrument,
        total_score: s.total_score,
        max_score: s.max_score,
        risk_level: s.risk_level,
        risk_zone_label: s.risk_zone_label,
        answers: s.answers || [],
        ai_interpretation: s.ai_interpretation || null,
        date: s.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get paginated coping exercise history for a patient.
   */
  async getPatientExerciseHistory(patientId: string, page = 1, limit = 10) {
    const patientObjId = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    const [exercises, total] = await Promise.all([
      this.copingExerciseSessionModel
        .find({ user: patientObjId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.copingExerciseSessionModel.countDocuments({ user: patientObjId }),
    ]);

    return {
      data: exercises.map((e: any) => ({
        id: e._id,
        exercise_id: e.exercise_id,
        name: e.name,
        category: e.category,
        description: e.description,
        duration_minutes: e.duration_minutes,
        completed: e.completed,
        mood_before: e.mood_before,
        mood_after: e.mood_after,
        notes: e.notes,
        date: e.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get paginated risk assessment reports for a patient.
   */
  async getPatientRiskAssessments(patientId: string, page = 1, limit = 10) {
    const patientObjId = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.riskAssessmentReportModel
        .find({ user: patientObjId, deleted_at: { $exists: false } })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.riskAssessmentReportModel.countDocuments({ user: patientObjId, deleted_at: { $exists: false } }),
    ]);

    return {
      data: reports.map((r: any) => ({
        id: r._id,
        score: r.score,
        level: r.level,
        categories: r.categories,
        top_factors: r.top_factors,
        trend: r.trend,
        context_summary: r.context_summary,
        suggestions: r.suggestions,
        previous_score: r.previous_score,
        previous_level: r.previous_level,
        date: r.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get all milestones for a patient.
   */
  async getPatientMilestones(patientId: string) {
    const patientObjId = new Types.ObjectId(patientId);

    const milestones = await this.recoveryMilestoneModel
      .find({ user: patientObjId })
      .sort({ created_at: -1 })
      .lean();

    return {
      data: milestones.map((m: any) => ({
        id: m._id,
        type: m.type,
        title: m.title,
        description: m.description,
        value: m.value,
        target_value: m.target_value,
        celebrated: m.celebrated,
        celebrated_at: m.celebrated_at,
        date: m.created_at,
      })),
      total: milestones.length,
    };
  }

  /**
   * Get paginated daily check-in (sobriety log) history for a patient.
   */
  async getPatientCheckinHistory(patientId: string, page = 1, limit = 14) {
    const patientObjId = new Types.ObjectId(patientId);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.sobrietyLogModel
        .find({ user: patientObjId })
        .sort({ log_date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.sobrietyLogModel.countDocuments({ user: patientObjId }),
    ]);

    return {
      data: logs.map((log: any) => ({
        id: log._id,
        date: log.log_date,
        sober_today: log.sober_today,
        mood_score: log.mood_score,
        craving_intensity: log.craving_intensity,
        anxiety_level: log.anxiety_level,
        sleep_quality: log.sleep_quality,
        sleep_hours: log.sleep_hours,
        energy_level: log.energy_level,
        triggers_encountered: log.triggers_encountered || [],
        substances_craved: log.substances_craved || [],
        attended_meeting: log.attended_meeting_or_session,
        medications_taken: log.medications_taken,
        exercised: log.exercised,
        notes: log.notes,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get recovery overview — bird's-eye view of all recovery patients for a specialist.
   */
  async getRecoveryOverview(
    specialistId: string,
    filters: { risk_level?: string; checkin_status?: string; search?: string },
  ) {
    const specialistObjId = this.validateObjectId(specialistId, 'specialist ID');

    // 1. Find all patient IDs from specialist's appointments
    const patientAppointments = await this.appointmentModel.aggregate([
      {
        $match: {
          specialist: specialistObjId,
          status: { $in: ['COMPLETED', 'ONGOING', 'OPEN'] },
        },
      },
      { $group: { _id: '$patient' } },
    ]);
    const patientIds = patientAppointments.map((p) => p._id);

    if (!patientIds.length) {
      return {
        stats: { total: 0, high_risk: 0, critical: 0, avg_score: 0, checkin_rate: 0 },
        distribution: { low: 0, moderate: 0, high: 0, critical: 0 },
        patients: [],
      };
    }

    // 2. Get recovery profiles for those patients
    const profileFilter: any = {
      user: { $in: patientIds },
      status: { $ne: 'archived' },
      deleted_at: { $exists: false },
    };
    if (filters.risk_level) {
      profileFilter.current_risk_level = filters.risk_level;
    }

    const profiles = await this.recoveryProfileModel
      .find(profileFilter)
      .populate('user', 'profile.first_name profile.last_name profile.profile_image')
      .lean();

    if (!profiles.length) {
      return {
        stats: { total: 0, high_risk: 0, critical: 0, avg_score: 0, checkin_rate: 0 },
        distribution: { low: 0, moderate: 0, high: 0, critical: 0 },
        patients: [],
      };
    }

    const recoveryUserIds = profiles.map((p: any) => p.user?._id || p.user);

    // 3. Aggregate latest check-in per patient
    const latestCheckins = await this.sobrietyLogModel.aggregate([
      { $match: { user: { $in: recoveryUserIds } } },
      { $sort: { log_date: -1 } },
      {
        $group: {
          _id: '$user',
          last_checkin: { $first: '$log_date' },
          last_mood: { $first: '$mood_score' },
        },
      },
    ]);
    const checkinMap = new Map(latestCheckins.map((c) => [c._id.toString(), c]));

    // 4. Aggregate latest screening per patient
    const latestScreenings = await this.addictionScreeningModel.aggregate([
      {
        $match: {
          user: { $in: recoveryUserIds },
          deleted_at: { $exists: false },
        },
      },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$user',
          last_screening_date: { $first: '$created_at' },
          last_instrument: { $first: '$instrument' },
          last_risk: { $first: '$risk_level' },
        },
      },
    ]);
    const screeningMap = new Map(latestScreenings.map((s) => [s._id.toString(), s]));

    // 5. Build patient list
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    let patients = profiles.map((profile: any) => {
      const userId = (profile.user?._id || profile.user).toString();
      const user = typeof profile.user === 'object' ? profile.user : null;
      const checkin = checkinMap.get(userId);
      const screening = screeningMap.get(userId);

      const sobrietyDays = profile.sobriety_start_date
        ? Math.max(0, Math.floor((Date.now() - new Date(profile.sobriety_start_date).getTime()) / 86400000))
        : 0;

      const primarySub = profile.substance_use_history?.find((s: any) => s.is_primary);

      return {
        user_id: userId,
        name: user?.profile
          ? [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ')
          : 'Unknown',
        avatar: user?.profile?.profile_image || null,
        risk_score: profile.current_risk_score ?? 0,
        risk_level: profile.current_risk_level || 'low',
        care_level: profile.care_level,
        sobriety_days: sobrietyDays,
        last_checkin: checkin?.last_checkin || null,
        last_checkin_mood: checkin?.last_mood || null,
        last_screening_date: screening?.last_screening_date || null,
        last_screening_instrument: screening?.last_instrument || null,
        last_screening_risk: screening?.last_risk || null,
        primary_substance: primarySub?.substance || null,
        risk_updated_at: profile.risk_updated_at || null,
      };
    });

    // 6. Apply checkin_status filter
    if (filters.checkin_status) {
      patients = patients.filter((p) => {
        if (!p.last_checkin) return filters.checkin_status === 'overdue';
        const lastDate = new Date(p.last_checkin);
        switch (filters.checkin_status) {
          case 'today':
            return lastDate >= todayStart;
          case 'this_week':
            return lastDate >= weekStart;
          case 'overdue':
            return lastDate < threeDaysAgo;
          default:
            return true;
        }
      });
    }

    // 7. Apply search filter
    if (filters.search?.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      patients = patients.filter((p) => searchRegex.test(p.name));
    }

    // 8. Sort by risk score descending
    patients.sort((a, b) => b.risk_score - a.risk_score);

    // 9. Calculate stats + distribution from all profiles (unfiltered)
    const allProfiles = profiles;
    const total = allProfiles.length;
    const highRisk = allProfiles.filter((p: any) => p.current_risk_level === 'high').length;
    const critical = allProfiles.filter((p: any) => p.current_risk_level === 'critical').length;
    const avgScore = total > 0
      ? Math.round(allProfiles.reduce((sum: number, p: any) => sum + (p.current_risk_score || 0), 0) / total)
      : 0;
    const checkedInToday = latestCheckins.filter((c) => new Date(c.last_checkin) >= todayStart).length;
    const checkinRate = total > 0 ? Math.round((checkedInToday / total) * 100) : 0;

    const distribution = {
      low: allProfiles.filter((p: any) => (p.current_risk_level || 'low') === 'low').length,
      moderate: allProfiles.filter((p: any) => p.current_risk_level === 'moderate').length,
      high: highRisk,
      critical,
    };

    return {
      stats: { total, high_risk: highRisk, critical, avg_score: avgScore, checkin_rate: checkinRate },
      distribution,
      patients,
    };
  }
}
