import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import * as moment from 'moment';

import {
  PatientSearchQueryDto,
  PatientSearchType,
  DrugCatalogQueryDto,
  DrugBatchQueryDto,
  CreateDeliveryAddressDto,
  UpdateDeliveryAddressDto,
} from './dto/specialist-pharmacy.dto';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
  SpecialistPrescriptionStatus,
} from '../prescriptions/entities/specialist-prescription.entity';
import { SpecialistWalletService } from '../wallets/specialist-wallet.service';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Injectable()
export class SpecialistPharmacyService {
  private readonly logger = new Logger(SpecialistPharmacyService.name);

  constructor(
    @InjectModel(SpecialistPrescription.name)
    private prescriptionModel: Model<SpecialistPrescriptionDocument>,
    @InjectConnection() private connection: Connection,
    private readonly walletService: SpecialistWalletService,
    private readonly generalHelpers: GeneralHelpers,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}

  // ============ PATIENT SEARCH ============

  /**
   * Search patients - either from appointments (my_patients) or all patients
   */
  async searchPatients(
    specialistId: Types.ObjectId,
    query: PatientSearchQueryDto,
  ) {
    const {
      search,
      type = PatientSearchType.MY_PATIENTS,
      page = 1,
      limit = 20,
    } = query;

    const UsersCollection = this.connection.collection('users');
    const AppointmentsCollection = this.connection.collection('appointments');

    let patientIds: Types.ObjectId[] = [];

    // If searching my patients, first get patient IDs from appointments
    if (type === PatientSearchType.MY_PATIENTS) {
      const appointments = await AppointmentsCollection.distinct('patient', {
        specialist: specialistId,
      });
      patientIds = appointments.map((id) => new Types.ObjectId(id));

      if (patientIds.length === 0) {
        return this.generalHelpers.paginate([], page, limit, 0);
      }
    }

    // Build search filter
    const filter: any = {
      user_type: 'Patient',
    };

    if (type === PatientSearchType.MY_PATIENTS) {
      filter._id = { $in: patientIds };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { 'profile.first_name': searchRegex },
        { 'profile.last_name': searchRegex },
        { 'profile.contact.email': searchRegex },
        { 'profile.contact.phone.number': searchRegex },
      ];
    }

    // Get patients with pagination
    const patients = await UsersCollection.find(filter, {
      projection: {
        'profile.first_name': 1,
        'profile.last_name': 1,
        'profile.contact.email': 1,
        'profile.contact.phone': 1,
        'profile.bio.gender': 1,
        'profile.bio.date_of_birth': 1,
        'profile.profile_photo': 1,
        created_at: 1,
      },
    })
      .sort({ 'profile.first_name': 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await UsersCollection.countDocuments(filter);

    // Enrich with appointment and prescription counts
    const enrichedPatients = await Promise.all(
      patients.map(async (patient) => {
        const [appointmentCount, prescriptionCount, lastAppointment, lastPrescription] =
          await Promise.all([
            AppointmentsCollection.countDocuments({
              specialist: specialistId,
              patient: patient._id,
            }),
            this.prescriptionModel.countDocuments({
              specialist_id: specialistId,
              patient_id: patient._id,
            }),
            AppointmentsCollection.findOne(
              { specialist: specialistId, patient: patient._id },
              { sort: { appointment_date: -1 }, projection: { appointment_date: 1 } },
            ),
            this.prescriptionModel
              .findOne({
                specialist_id: specialistId,
                patient_id: patient._id,
              })
              .sort({ created_at: -1 })
              .select('created_at')
              .lean(),
          ]);

        const firstName = patient.profile?.first_name || '';
        const lastName = patient.profile?.last_name || '';
        const rawImage = patient.profile?.profile_photo || patient.profile?.bio?.profile_image || null;
        const profileImage = await this.fileUploadHelper.resolveProfileImage(rawImage);
        return {
          _id: patient._id,
          full_name: `${firstName} ${lastName}`.trim() || 'Unknown',
          first_name: firstName,
          last_name: lastName,
          email: patient.profile?.contact?.email,
          phone: patient.profile?.contact?.phone?.number
            ? `${patient.profile.contact.phone.country_code || ''}${patient.profile.contact.phone.number}`
            : null,
          gender: patient.profile?.bio?.gender,
          date_of_birth: patient.profile?.bio?.date_of_birth,
          profile_image: profileImage,
          total_appointments: appointmentCount,
          total_prescriptions: prescriptionCount,
          last_appointment_date: lastAppointment?.appointment_date,
          last_prescription_date: (lastPrescription as any)?.created_at,
        };
      }),
    );

    return this.generalHelpers.paginate(enrichedPatients, page, limit, total);
  }

  /**
   * Get patient details including medical history
   */
  async getPatientDetails(
    specialistId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    const UsersCollection = this.connection.collection('users');

    const patient = await UsersCollection.findOne(
      { _id: patientId, user_type: 'Patient' },
      {
        projection: {
          password: 0,
          twoFA_secret: 0,
          security: 0,
        },
      },
    );

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Build full_name
    const firstName = patient.profile?.first_name || '';
    const lastName = patient.profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';

    // Format phone number
    const phoneObj = patient.profile?.contact?.phone;
    let phone: string | null = null;
    if (phoneObj && phoneObj.number) {
      phone = `${phoneObj.country_code || ''} ${phoneObj.number}`.trim();
    }

    // Resolve profile image to a usable URL
    const rawImage = patient.profile?.profile_photo || patient.profile?.bio?.profile_image || null;
    const profileImage = await this.fileUploadHelper.resolveProfileImage(rawImage);

    // Return flattened structure for frontend
    return {
      _id: patient._id,
      full_name: fullName,
      email: patient.profile?.contact?.email || null,
      phone,
      date_of_birth: patient.profile?.bio?.date_of_birth || patient.profile?.date_of_birth || null,
      gender: patient.profile?.bio?.gender || patient.profile?.gender || null,
      profile_image: profileImage,
      address: patient.profile?.contact?.address1
        ? `${patient.profile.contact.address1}, ${patient.profile.contact.state || ''}, ${patient.profile.contact.country || ''}`.trim()
        : null,
      emergency_contacts: patient.emergency_contacts || [],
      // Include raw profile for any additional data needs
      profile: patient.profile,
    };
  }

  /**
   * Get patient's medical history
   */
  async getPatientMedicalHistory(patientId: Types.ObjectId) {
    const UsersCollection = this.connection.collection('users');

    const patient = await UsersCollection.findOne(
      { _id: patientId },
      {
        projection: {
          'profile.basic_health_info': 1,
          'profile.health_risk_factors': 1,
          'profile.allergies': 1,
          'profile.medications': 1,
          pre_existing_conditions: 1,
          allergies: 1,
        },
      },
    );

    // Map pre_existing_conditions to conditions array with just names
    const conditions = (patient?.pre_existing_conditions || []).map(
      (c: any) => c.name || c,
    );

    // Get allergies from either root or profile level
    const rawAllergies = patient?.allergies || patient?.profile?.allergies;

    // Extract allergies from the structured format
    let allergies: string[] = [];
    if (rawAllergies) {
      if (Array.isArray(rawAllergies)) {
        // Simple array format
        allergies = rawAllergies;
      } else if (typeof rawAllergies === 'object') {
        // Structured format with drug_allergies, food_allergies, etc.
        if (Array.isArray(rawAllergies.drug_allergies)) {
          allergies.push(...rawAllergies.drug_allergies.map((a: any) =>
            a.drug_name ? `${a.drug_name} (Drug${a.severity ? ' - ' + a.severity : ''})` : a
          ));
        }
        if (Array.isArray(rawAllergies.food_allergies)) {
          allergies.push(...rawAllergies.food_allergies.map((a: any) =>
            a.food_name ? `${a.food_name} (Food${a.severity ? ' - ' + a.severity : ''})` : a
          ));
        }
        if (Array.isArray(rawAllergies.environmental_allergies)) {
          allergies.push(...rawAllergies.environmental_allergies.map((a: any) =>
            a.allergen_name ? `${a.allergen_name} (Environmental)` : a
          ));
        }
        if (Array.isArray(rawAllergies.other_allergies)) {
          allergies.push(...rawAllergies.other_allergies.map((a: any) =>
            a.name || a.allergen_name || a
          ));
        }
      }
    }

    // Extract height and weight from basic_health_info
    const healthInfo = patient?.profile?.basic_health_info || {};
    const height = healthInfo.height;
    const weight = healthInfo.weight;

    return {
      conditions,
      allergies,
      risk_factors: patient?.profile?.health_risk_factors || {},
      health_info: healthInfo,
      current_medications: patient?.profile?.medications || [],
      // Include formatted height/weight for easy display
      height: height ? `${height.value} ${height.unit || 'cm'}` : null,
      weight: weight ? `${weight.value} ${weight.unit || 'kg'}` : null,
      blood_type: patient?.profile?.blood_type || patient?.blood_type || null,
    };
  }

  /**
   * Get patient's prescription history from ALL specialists (not just current one)
   * Enriched with prescribing specialist info
   */
  async getPatientPrescriptions(
    specialistId: Types.ObjectId,
    patientId: Types.ObjectId,
    page = 1,
    limit = 20,
  ) {
    // Only filter by patient - show prescriptions from ALL specialists
    const filter = {
      patient_id: patientId,
    };

    const UsersCollection = this.connection.collection('users');

    const [prescriptions, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.prescriptionModel.countDocuments(filter),
    ]);

    // Enrich prescriptions with specialist info
    // Note: Mongoose populate hooks already populate specialist_id as an object
    const enrichedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription: any) => {
        let prescribingSpecialistName = 'Unknown Specialist';
        let prescribingSpecialistAvatar: string | null = null;
        let prescribingSpecialistId: string | null = null;

        if (prescription.specialist_id) {
          // Check if specialist_id is already populated (object with profile)
          if (typeof prescription.specialist_id === 'object' && prescription.specialist_id.profile) {
            const profile = prescription.specialist_id.profile;
            const firstName = profile.first_name || '';
            const lastName = profile.last_name || '';
            prescribingSpecialistName = `${firstName} ${lastName}`.trim() || 'Unknown Specialist';
            // Resolve the profile photo URL through presigned URL generator
            const rawAvatar = profile.profile_photo || null;
            prescribingSpecialistAvatar = rawAvatar ? await this.fileUploadHelper.resolveProfileImage(rawAvatar) : null;
            prescribingSpecialistId = prescription.specialist_id._id?.toString() || null;
          } else if (typeof prescription.specialist_id === 'object' && prescription.specialist_id._id) {
            // Object but no profile (shouldn't happen, but handle it)
            prescribingSpecialistId = prescription.specialist_id._id?.toString() || null;
          } else {
            // Raw ObjectId or string
            prescribingSpecialistId = prescription.specialist_id?.toString() || null;
          }
        }

        return {
          ...prescription,
          specialist_name: prescribingSpecialistName,
          specialist_avatar: prescribingSpecialistAvatar,
          prescribing_specialist_id: prescribingSpecialistId,
          is_own_prescription: prescribingSpecialistId === specialistId?.toString(),
        };
      }),
    );

    return this.generalHelpers.paginate(enrichedPrescriptions, page, limit, total);
  }

  /**
   * Get patient's vital signs
   */
  async getPatientVitals(patientId: Types.ObjectId) {
    const VitalsCollection = this.connection.collection('vitals');

    // Try both userId (ObjectId) and userId (string) formats
    const vitals = await VitalsCollection.find({
      $or: [
        { userId: patientId },
        { userId: patientId.toString() },
        { user: patientId },
        { user_id: patientId },
      ],
    })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    // Helper to get the latest reading that has a value
    const getLatestWithValue = (readings: any[]) => {
      if (!Array.isArray(readings) || readings.length === 0) return null;
      // Iterate from end to find the latest with a value
      for (let i = readings.length - 1; i >= 0; i--) {
        if (readings[i].value !== undefined && readings[i].value !== null && readings[i].value !== '') {
          return readings[i];
        }
      }
      return null;
    };

    // Transform to frontend-friendly format
    // Each vital field (blood_pressure, pulse_rate, etc.) is an array of { value, unit, updatedAt }
    const records: any[] = [];

    for (const vital of vitals) {
      const bpReading = getLatestWithValue(vital.blood_pressure);
      if (bpReading) {
        records.push({
          _id: `${vital._id}_bp`,
          type: 'blood_pressure',
          value: bpReading.value,
          unit: bpReading.unit || 'mmHg',
          recorded_at: bpReading.updatedAt || vital.created_at,
        });
      }

      const hrReading = getLatestWithValue(vital.pulse_rate);
      if (hrReading) {
        records.push({
          _id: `${vital._id}_hr`,
          type: 'heart_rate',
          value: hrReading.value,
          unit: hrReading.unit || 'bpm',
          recorded_at: hrReading.updatedAt || vital.created_at,
        });
      }

      const tempReading = getLatestWithValue(vital.body_temp);
      if (tempReading) {
        records.push({
          _id: `${vital._id}_temp`,
          type: 'temperature',
          value: tempReading.value,
          unit: tempReading.unit || '°C',
          recorded_at: tempReading.updatedAt || vital.created_at,
        });
      }

      const weightReading = getLatestWithValue(vital.body_weight);
      if (weightReading) {
        records.push({
          _id: `${vital._id}_weight`,
          type: 'weight',
          value: weightReading.value,
          unit: weightReading.unit || 'kg',
          recorded_at: weightReading.updatedAt || vital.created_at,
        });
      }

      const sugarReading = getLatestWithValue(vital.blood_sugar_level);
      if (sugarReading) {
        records.push({
          _id: `${vital._id}_sugar`,
          type: 'blood_sugar',
          value: sugarReading.value,
          unit: sugarReading.unit || 'mg/dL',
          recorded_at: sugarReading.updatedAt || vital.created_at,
        });
      }
    }

    return records;
  }

  /**
   * Get patient's health checkups (only completed ones with diagnosis)
   */
  async getPatientHealthCheckups(
    patientId: Types.ObjectId,
    page = 1,
    limit = 10,
  ) {
    const HealthCheckupsCollection = this.connection.collection('health_checkups');

    // Filter for completed checkups (those with conditions/diagnosis)
    const filter = {
      user: patientId,
      'response.data.conditions.0': { $exists: true },
    };

    // Get total count for pagination
    const total = await HealthCheckupsCollection.countDocuments(filter);

    // Get paginated checkups
    const checkups = await HealthCheckupsCollection.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Transform to frontend-friendly format
    const docs = checkups.map((checkup: any) => {
      const response = checkup.response?.data || {};
      const conditions = response.conditions || [];
      const primaryCondition = conditions[0];

      // Extract symptoms from evidence (items marked as 'present' with 'initial' or 'interview' source)
      const symptoms = (checkup.request?.evidence || [])
        .filter((e: any) => e.choice_id === 'present' && e.source !== 'predefined')
        .map((e: any) => ({
          id: e.id,
          name: e.label || e.common_name || e.name || e.id,
        }));

      return {
        _id: checkup._id,
        created_at: checkup.created_at,
        health_check_for: checkup.health_check_for,
        triage_level: response.triage_level || response.triage?.level || (response.should_stop ? 'consultation' : null),
        primary_condition: primaryCondition?.common_name || primaryCondition?.name || null,
        probability: primaryCondition?.probability,
        symptoms,
        conditions: conditions.slice(0, 3).map((c: any) => ({
          name: c.common_name || c.name,
          probability: c.probability,
        })),
        has_emergency_evidence: response.has_emergency_evidence,
      };
    });

    return {
      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Get detailed health checkup by ID
   * Includes full AI assessment, all conditions, symptoms, and recommendations
   */
  async getHealthCheckupDetails(checkupId: Types.ObjectId) {
    const HealthCheckupsCollection = this.connection.collection('health_checkups');

    const checkup = await HealthCheckupsCollection.findOne({ _id: checkupId });

    if (!checkup) {
      throw new NotFoundException('Health checkup not found');
    }

    const response = checkup.response?.data || {};
    const conditions = response.conditions || [];
    const primaryCondition = conditions[0];

    // Extract all symptoms with details
    const symptoms = (checkup.request?.evidence || [])
      .filter((e: any) => e.choice_id === 'present')
      .map((e: any) => ({
        id: e.id,
        name: e.label || e.common_name || e.name || e.id,
        source: e.source || 'unknown',
        duration: e.duration,
      }));

    // Extract risk factors
    const riskFactors = (checkup.request?.evidence || [])
      .filter((e: any) => e.source === 'predefined' || e.source === 'risk_factor')
      .map((e: any) => ({
        id: e.id,
        name: e.label || e.common_name || e.name || e.id,
      }));

    // Get triage info
    const triage = response.triage || {};

    // Get specialist recommendations
    const specialistRecommendations = response.specialist_recommendations || [];

    return {
      _id: checkup._id,
      created_at: checkup.created_at,
      updated_at: checkup.updated_at,
      health_check_for: checkup.health_check_for,
      patient_info: checkup.request?.patient_info || checkup.patient_info,

      // Triage Assessment
      triage_level: response.triage_level || triage.level || (response.should_stop ? 'consultation' : null),
      has_emergency_evidence: response.has_emergency_evidence,
      should_stop: response.should_stop,

      // Primary Diagnosis
      primary_condition: primaryCondition ? {
        name: primaryCondition.common_name || primaryCondition.name,
        probability: primaryCondition.probability,
        icd10: primaryCondition.icd10_code,
        acuity: primaryCondition.acuity,
        severity: primaryCondition.severity,
        categories: primaryCondition.categories,
      } : null,

      // All Conditions (Full AI Assessment)
      conditions: conditions.map((c: any) => ({
        id: c.id,
        name: c.common_name || c.name,
        probability: c.probability,
        icd10: c.icd10_code,
        acuity: c.acuity,
        severity: c.severity,
        categories: c.categories,
      })),

      // Symptoms Reported
      symptoms,
      symptoms_count: symptoms.length,

      // Risk Factors
      risk_factors: riskFactors,

      // Triage Details
      triage_details: {
        level: triage.level || response.triage_level,
        description: triage.description,
        serious: triage.serious,
        teleconsultation_applicable: triage.teleconsultation_applicable,
      },

      // Specialist Recommendations
      specialist_recommendations: specialistRecommendations,

      // Interview Stats
      interview_stats: {
        question_count: response.question_counter || checkup.request?.question_count,
        interview_duration: checkup.interview_duration,
      },

      // AI Summary (Claude-generated detailed explanation)
      ai_summary: checkup.claude_summary?.content ? {
        overview: checkup.claude_summary.content.overview,
        key_findings: checkup.claude_summary.content.key_findings || [],
        possible_conditions_explained: checkup.claude_summary.content.possible_conditions_explained || [],
        recommendations: checkup.claude_summary.content.recommendations || [],
        when_to_seek_care: checkup.claude_summary.content.when_to_seek_care,
        lifestyle_tips: checkup.claude_summary.content.lifestyle_tips || [],
        generated_at: checkup.claude_summary.generated_at,
        model: checkup.claude_summary.model,
      } : null,
    };
  }

  // ============ DRUG CATALOG ============

  /**
   * Search drug catalog - returns available batches with drug info
   * Each batch from different manufacturers appears as a separate selectable item
   */
  async searchDrugs(query: DrugCatalogQueryDto) {
    const {
      search,
      category,
      manufacturer,
      stock_status = 'all',
      page = 1,
      limit = 20,
      sort_by = 'name',
      sort_order = 'asc',
    } = query;

    const DrugsCollection = this.connection.collection('drugentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const DosageFormsCollection = this.connection.collection('dosageformentities');

    const filter: any = {
      is_active: true,
    };

    // Text search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { generic_name: searchRegex },
        { brand_name: searchRegex },
        { search_keywords: searchRegex },
      ];
    }

    // Category filter
    if (category) {
      filter.categories = new Types.ObjectId(category);
    }

    // Get matching drugs first (without stock filter - we'll filter by batches)
    const drugs = await DrugsCollection.find(filter)
      .sort({ [sort_by]: sort_order === 'asc' ? 1 : -1 })
      .toArray();

    // Build batch-level results
    const batchResults: any[] = [];

    for (const drug of drugs) {
      // Get dosage form name
      let dosageFormName = '';
      if (drug.dosage_form) {
        const df = await DosageFormsCollection.findOne({ _id: drug.dosage_form });
        dosageFormName = df?.name || '';
      }

      // Get primary image with pre-signed URL
      let primaryImage = drug.images?.find((img) => img.is_primary)?.url ||
        drug.images?.[0]?.url;

      if (primaryImage && primaryImage.includes('s3.') && primaryImage.includes('amazonaws.com')) {
        try {
          primaryImage = await this.fileUploadHelper.getPresignedUrl(primaryImage, 3600);
        } catch (e) {
          this.logger.warn(`Failed to generate presigned URL for drug ${drug._id}: ${e.message}`);
        }
      }

      // Get available batches for this drug
      const batches = await StockBatchCollection.find({
        drug_id: drug._id,
        status: 'active',
        quantity_available: { $gt: 0 },
        $or: [
          { no_expiry: true },
          { expiry_date: { $gt: new Date() } },
        ],
      })
        .sort({ expiry_date: 1 }) // FEFO - first expiry first
        .toArray();

      if (batches.length > 0) {
        // Add each batch as a separate selectable item
        for (const batch of batches) {
          const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
          if (availableQty <= 0) continue;

          // Apply stock_status filter
          if (stock_status === 'out_of_stock') continue; // Skip in-stock batches

          // Apply manufacturer filter if provided
          if (manufacturer) {
            const mfrRegex = new RegExp(manufacturer, 'i');
            if (!batch.manufacturer || !mfrRegex.test(batch.manufacturer)) continue;
          }

          // Calculate days until expiry
          let daysUntilExpiry: number | null = null;
          let expiryStatus = 'ok';
          if (!batch.no_expiry && batch.expiry_date) {
            const diffMs = new Date(batch.expiry_date).getTime() - Date.now();
            daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30) expiryStatus = 'warning';
            if (daysUntilExpiry <= 7) expiryStatus = 'critical';
          }

          batchResults.push({
            _id: drug._id,
            batch_id: batch._id,
            batch_number: batch.batch_number,
            name: drug.name,
            generic_name: drug.generic_name,
            brand_name: drug.brand_name,
            strength: drug.strength,
            dosage_form: dosageFormName,
            manufacturer: batch.manufacturer || null,
            selling_price: batch.selling_price_override || drug.selling_price,
            quantity: availableQty,
            expiry_date: batch.expiry_date,
            no_expiry: batch.no_expiry,
            days_until_expiry: daysUntilExpiry,
            expiry_status: expiryStatus,
            primary_image: primaryImage,
            requires_prescription: drug.requires_prescription,
            is_batch: true,
          });
        }
      } else {
        // No batches - use drug's legacy quantity (for seeded data)
        if (drug.quantity > 0 || stock_status === 'out_of_stock') {
          // Apply stock_status filter for legacy drugs
          if (stock_status === 'in_stock' && drug.quantity <= 0) continue;
          if (stock_status === 'out_of_stock' && drug.quantity > 0) continue;

          // Get drug manufacturer name if it's an ObjectId
          let drugManufacturer = drug.manufacturer;
          if (drug.manufacturer && typeof drug.manufacturer === 'object') {
            const ManufacturersCollection = this.connection.collection('manufacturerentities');
            const mfr = await ManufacturersCollection.findOne({ _id: drug.manufacturer });
            drugManufacturer = mfr?.name || null;
          }

          // Apply manufacturer filter
          if (manufacturer) {
            const mfrRegex = new RegExp(manufacturer, 'i');
            if (!drugManufacturer || !mfrRegex.test(drugManufacturer)) continue;
          }

          batchResults.push({
            _id: drug._id,
            batch_id: null,
            batch_number: null,
            name: drug.name,
            generic_name: drug.generic_name,
            brand_name: drug.brand_name,
            strength: drug.strength,
            dosage_form: dosageFormName,
            manufacturer: drugManufacturer,
            selling_price: drug.selling_price,
            quantity: drug.quantity,
            expiry_date: null,
            no_expiry: true,
            days_until_expiry: null,
            expiry_status: 'ok',
            primary_image: primaryImage,
            requires_prescription: drug.requires_prescription,
            is_batch: false,
          });
        }
      }
    }

    // Sort results
    batchResults.sort((a, b) => {
      if (sort_by === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sort_order === 'asc' ? cmp : -cmp;
      }
      if (sort_by === 'selling_price') {
        return sort_order === 'asc' ? a.selling_price - b.selling_price : b.selling_price - a.selling_price;
      }
      return 0;
    });

    // Paginate
    const total = batchResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = batchResults.slice(startIndex, startIndex + limit);

    return this.generalHelpers.paginate(paginatedResults, page, limit, total);
  }

  /**
   * Get drug details with availability
   * Shows batch-level data if batches exist, otherwise falls back to drug's seeded data
   */
  async getDrugDetails(drugId: Types.ObjectId, batchId?: Types.ObjectId) {
    const DrugsCollection = this.connection.collection('drugentities');
    const ManufacturersCollection = this.connection.collection('manufacturerentities');
    const CategoriesCollection = this.connection.collection('drugcategoryentities');
    const DosageFormsCollection = this.connection.collection('dosageformentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');

    const drug = await DrugsCollection.findOne({ _id: drugId, is_active: true });

    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    // Get category names
    let categoryNames: string[] = [];
    if (drug.categories && drug.categories.length > 0) {
      const categories = await CategoriesCollection.find({
        _id: { $in: drug.categories },
      }).toArray();
      categoryNames = categories.map((c) => c.name);
    }

    // Get dosage form name
    let dosageFormName = '';
    if (drug.dosage_form) {
      const df = await DosageFormsCollection.findOne({ _id: drug.dosage_form });
      dosageFormName = df?.name || '';
    }

    let manufacturerName: string | null = null;
    let manufacturers: string[] = [];
    let sellingPrice = drug.selling_price;
    let minPrice = drug.selling_price;
    let maxPrice = drug.selling_price;
    let totalStock = drug.quantity || 0;
    let batchDetails: any[] = [];
    let selectedBatch: any = null;
    let hasBatches = false;

    // If a specific batch_id is provided, show that batch's data only
    if (batchId) {
      const batch = await StockBatchCollection.findOne({
        _id: batchId,
        drug_id: drugId,
        status: 'active',
      });

      if (batch) {
        selectedBatch = batch;
        hasBatches = true;
        const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
        totalStock = availableQty;
        manufacturerName = batch.manufacturer || null;
        sellingPrice = batch.selling_price_override || drug.selling_price;
        minPrice = sellingPrice;
        maxPrice = sellingPrice;

        let daysUntilExpiry: number | null = null;
        if (!batch.no_expiry && batch.expiry_date) {
          const diffMs = new Date(batch.expiry_date).getTime() - Date.now();
          daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }

        batchDetails = [{
          _id: batch._id,
          batch_number: batch.batch_number,
          manufacturer: batch.manufacturer || null,
          selling_price: batch.selling_price_override || drug.selling_price,
          quantity_available: availableQty,
          expiry_date: batch.expiry_date,
          no_expiry: batch.no_expiry,
          days_until_expiry: daysUntilExpiry,
        }];
      }
    } else {
      // No specific batch - get all available batches
      const availableBatches = await StockBatchCollection.find({
        drug_id: drugId,
        status: 'active',
        quantity_available: { $gt: 0 },
        $or: [{ no_expiry: true }, { expiry_date: { $gt: new Date() } }],
      })
        .sort({ expiry_date: 1 })
        .toArray();

      hasBatches = availableBatches.length > 0;

      if (hasBatches) {
        // Get data from batches
        const batchPrices: number[] = [];
        totalStock = 0;

        for (const batch of availableBatches) {
          const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
          totalStock += availableQty;

          if (batch.manufacturer) {
            manufacturers.push(batch.manufacturer);
          }

          const price = batch.selling_price_override || drug.selling_price;
          batchPrices.push(price);
        }

        // Unique manufacturers
        manufacturers = [...new Set(manufacturers)];

        if (manufacturers.length === 1) {
          manufacturerName = manufacturers[0];
        } else if (manufacturers.length > 1) {
          manufacturerName = 'Various';
        }

        // Price range
        if (batchPrices.length > 0) {
          minPrice = Math.min(...batchPrices);
          maxPrice = Math.max(...batchPrices);
          sellingPrice = minPrice; // Show lowest price as default
        }

        // Format batch details for display
        batchDetails = await Promise.all(
          availableBatches.map(async (batch) => {
            const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
            let daysUntilExpiry: number | null = null;

            if (!batch.no_expiry && batch.expiry_date) {
              const diffMs = new Date(batch.expiry_date).getTime() - Date.now();
              daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }

            return {
              _id: batch._id,
              batch_number: batch.batch_number,
              manufacturer: batch.manufacturer || null,
              selling_price: batch.selling_price_override || drug.selling_price,
              quantity_available: availableQty,
              expiry_date: batch.expiry_date,
              no_expiry: batch.no_expiry,
              days_until_expiry: daysUntilExpiry,
            };
          }),
        );
      } else {
        // Use drug's seeded data
        if (drug.manufacturer) {
          if (typeof drug.manufacturer === 'object') {
            const mfr = await ManufacturersCollection.findOne({ _id: drug.manufacturer });
            manufacturerName = mfr?.name || null;
          } else if (typeof drug.manufacturer === 'string') {
            manufacturerName = drug.manufacturer;
          }
        }
      }
    }

    return {
      _id: drug._id,
      batch_id: selectedBatch?._id || null,
      batch_number: selectedBatch?.batch_number || null,
      name: drug.name,
      generic_name: drug.generic_name,
      brand_name: drug.brand_name,
      description: drug.description,
      short_description: drug.short_description,
      strength: drug.strength,
      pack_size: drug.pack_size,
      unit_of_measure: drug.unit_of_measure,
      dosage_form: dosageFormName,
      manufacturer: manufacturerName,
      manufacturers: manufacturers, // All unique manufacturers from batches
      categories: categoryNames,
      selling_price: sellingPrice,
      min_price: minPrice,
      max_price: maxPrice,
      has_price_range: minPrice !== maxPrice,
      quantity: totalStock,
      available_stock: totalStock,
      active_batches: batchDetails.length,
      batches: batchDetails, // Detailed batch info
      has_batches: hasBatches,
      reorder_level: drug.reorder_level,
      is_low_stock: totalStock <= drug.reorder_level && totalStock > 0,
      is_out_of_stock: totalStock <= 0,
      requires_prescription: drug.requires_prescription,
      contraindications: drug.contraindications || [],
      side_effects: drug.side_effects || [],
      warnings: drug.warnings || [],
      precautions: drug.precautions || [],
      dosage_guidance: drug.dosage_guidance,
      pharmacist_counseling_points: drug.pharmacist_counseling_points,
      patient_information: drug.patient_information,
      images: await this.getImagesWithPresignedUrls(drug.images || []),
    };
  }

  /**
   * Generate pre-signed URLs for an array of images
   */
  private async getImagesWithPresignedUrls(images: any[]) {
    if (!images || images.length === 0) return [];

    return Promise.all(
      images.map(async (img) => {
        if (img.url && img.url.includes('s3.') && img.url.includes('amazonaws.com')) {
          try {
            return {
              ...img,
              url: await this.fileUploadHelper.getPresignedUrl(img.url, 3600),
            };
          } catch (e) {
            this.logger.warn(`Failed to generate presigned URL: ${e.message}`);
            return img;
          }
        }
        return img;
      }),
    );
  }

  /**
   * Get available batches for a drug
   */
  async getDrugBatches(drugId: Types.ObjectId, query: DrugBatchQueryDto) {
    const { page = 1, limit = 20, status = 'active' } = query;

    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const SuppliersCollection = this.connection.collection('supplierentities');

    const filter: any = { drug_id: drugId };

    if (status !== 'all') {
      filter.status = status;
      // Only show non-expired batches for active status
      if (status === 'active') {
        filter.$or = [{ no_expiry: true }, { expiry_date: { $gt: new Date() } }];
      }
    }

    const [batches, total] = await Promise.all([
      StockBatchCollection.find(filter)
        .sort({ no_expiry: 1, expiry_date: 1 }) // FEFO order
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      StockBatchCollection.countDocuments(filter),
    ]);

    // Enrich with supplier names
    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        let supplierName = 'Unknown';
        if (batch.supplier_id) {
          const supplier = await SuppliersCollection.findOne({
            _id: batch.supplier_id,
          });
          supplierName = supplier?.name || 'Unknown';
        }

        const now = new Date();
        const expiryDate = batch.expiry_date ? new Date(batch.expiry_date) : null;
        let daysUntilExpiry: number | null = null;
        let expiryStatus = 'ok';

        if (!batch.no_expiry && expiryDate) {
          const diffTime = expiryDate.getTime() - now.getTime();
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          daysUntilExpiry = days;

          if (days <= 0) expiryStatus = 'expired';
          else if (days <= 30) expiryStatus = 'critical';
          else if (days <= 60) expiryStatus = 'warning';
          else if (days <= 90) expiryStatus = 'attention';
        } else if (batch.no_expiry) {
          expiryStatus = 'no_expiry';
        }

        return {
          _id: batch._id,
          batch_number: batch.batch_number,
          internal_batch_id: batch.internal_batch_id,
          supplier: supplierName,
          expiry_date: batch.expiry_date,
          no_expiry: batch.no_expiry,
          quantity_available: batch.quantity_available,
          quantity_reserved: batch.quantity_reserved || 0,
          dispensable_quantity:
            batch.quantity_available - (batch.quantity_reserved || 0),
          cost_price: batch.cost_price,
          selling_price_override: batch.selling_price_override,
          status: batch.status,
          days_until_expiry: daysUntilExpiry,
          expiry_status: expiryStatus,
          manufacturer: batch.manufacturer,
        };
      }),
    );

    return this.generalHelpers.paginate(enrichedBatches, page, limit, total);
  }

  /**
   * Get drug categories
   */
  async getDrugCategories() {
    const CategoriesCollection = this.connection.collection('drugcategoryentities');

    const categories = await CategoriesCollection.find({ is_active: true })
      .sort({ name: 1 })
      .toArray();

    return categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      code: cat.code,
      description: cat.description,
    }));
  }

  /**
   * Get manufacturers
   */
  async getManufacturers() {
    const ManufacturersCollection =
      this.connection.collection('manufacturerentities');

    const manufacturers = await ManufacturersCollection.find({ is_active: true })
      .sort({ name: 1 })
      .toArray();

    return manufacturers.map((mfr) => ({
      _id: mfr._id,
      name: mfr.name,
      code: mfr.code,
      country: mfr.country,
    }));
  }

  // ============ DASHBOARD ============

  /**
   * Get specialist pharmacy dashboard stats
   */
  async getDashboardStats(specialistId: Types.ObjectId) {
    const today = moment().startOf('day').toDate();
    const weekStart = moment().startOf('week').toDate();
    const monthStart = moment().startOf('month').toDate();

    const UsersCollection = this.connection.collection('users');

    // Get unique patient count from prescriptions (not appointments)
    const uniquePatientIds = await this.prescriptionModel.distinct('patient_id', {
      specialist_id: specialistId,
    });

    const [
      prescriptionsToday,
      prescriptionsThisWeek,
      prescriptionsThisMonth,
      totalPrescriptions,
      pendingPayment,
      pendingDispensing,
      recentPrescriptions,
    ] = await Promise.all([
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        created_at: { $gte: today },
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        created_at: { $gte: weekStart },
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        created_at: { $gte: monthStart },
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        status: SpecialistPrescriptionStatus.PAID,
      }),
      this.prescriptionModel
        .find({ specialist_id: specialistId })
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),
    ]);

    // Enrich recent prescriptions with patient data
    const enrichedPrescriptions = await Promise.all(
      recentPrescriptions.map(async (prescription: any) => {
        let patientName = 'Unknown Patient';
        let patientAvatar: string | null = null;

        if (prescription.patient_id) {
          try {
            // Handle ObjectId, ObjectId-like objects, and valid string IDs
            let patientId: Types.ObjectId;

            if (prescription.patient_id instanceof Types.ObjectId) {
              patientId = prescription.patient_id;
            } else if (typeof prescription.patient_id === 'object' && prescription.patient_id._id) {
              // Handle populated patient object
              patientId = prescription.patient_id._id instanceof Types.ObjectId
                ? prescription.patient_id._id
                : new Types.ObjectId(prescription.patient_id._id.toString());
            } else if (typeof prescription.patient_id === 'string' && prescription.patient_id.length === 24) {
              patientId = new Types.ObjectId(prescription.patient_id);
            } else if (prescription.patient_id.toString && prescription.patient_id.toString().length === 24) {
              patientId = new Types.ObjectId(prescription.patient_id.toString());
            } else {
              throw new Error('Invalid patient_id format');
            }

            const patient = await UsersCollection.findOne(
              { _id: patientId },
              {
                projection: {
                  'profile.first_name': 1,
                  'profile.last_name': 1,
                  'profile.profile_photo': 1,
                },
              },
            );

            if (patient?.profile) {
              const firstName = patient.profile.first_name || '';
              const lastName = patient.profile.last_name || '';
              patientName = `${firstName} ${lastName}`.trim() || 'Unknown Patient';
              const rawAvatar = patient.profile.profile_photo || patient.profile.bio?.profile_image || null;
              patientAvatar = await this.fileUploadHelper.resolveProfileImage(rawAvatar);
            }
          } catch (e) {
            // Log but continue - don't break dashboard for one bad prescription
            console.warn('Failed to lookup patient for prescription:', prescription._id, e.message);
          }
        }

        // Extract specialist info from populated specialist_id
        let specialistName = 'Unknown Specialist';
        let specialistAvatar: string | null = null;
        if (typeof prescription.specialist_id === 'object' && prescription.specialist_id?.profile) {
          const specProfile = prescription.specialist_id.profile;
          const specFirstName = specProfile.first_name || '';
          const specLastName = specProfile.last_name || '';
          specialistName = `${specFirstName} ${specLastName}`.trim() || 'Unknown Specialist';
          // Resolve the profile photo URL through presigned URL generator
          const rawSpecAvatar = specProfile.profile_photo || null;
          specialistAvatar = rawSpecAvatar ? await this.fileUploadHelper.resolveProfileImage(rawSpecAvatar) : null;
        }

        return {
          _id: prescription._id,
          prescription_number: prescription.prescription_number,
          patient_id: prescription.patient_id,
          patient_name: patientName,
          patient_avatar: patientAvatar,
          specialist_id: prescription.specialist_id?._id || prescription.specialist_id,
          specialist_name: specialistName,
          specialist_avatar: specialistAvatar,
          items: prescription.items || [],
          items_count: prescription.items?.length || 0,
          total_amount: prescription.total_amount,
          status: prescription.status,
          payment_status: prescription.payment_status,
          created_at: prescription.created_at,
        };
      }),
    );

    // Get wallet balance
    const walletBalance = await this.walletService.getWalletBalance(specialistId);

    return {
      prescriptions_today: prescriptionsToday,
      prescriptions_this_week: prescriptionsThisWeek,
      prescriptions_this_month: prescriptionsThisMonth,
      total_prescriptions: totalPrescriptions,
      pending_payment: pendingPayment,
      pending_dispensing: pendingDispensing,
      total_patients: uniquePatientIds.length,
      wallet_balance: walletBalance.available_balance,
      recent_prescriptions: enrichedPrescriptions,
    };
  }

  // ============ PATIENT DELIVERY ADDRESSES ============

  /**
   * Get all delivery addresses for a patient
   */
  async getPatientDeliveryAddresses(patientId: Types.ObjectId) {
    const UsersCollection = this.connection.collection('users');

    const patient = await UsersCollection.findOne(
      { _id: patientId },
      { projection: { delivery_addresses: 1, profile: 1 } },
    );

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const addresses = patient.delivery_addresses || [];

    // Also include the profile address as a default option if it exists
    const profileAddress = patient.profile?.contact;
    let defaultAddress: any = null;

    if (profileAddress?.address1) {
      // For city: use address2 if present, otherwise fallback to state
      // (many profiles store city in the state field)
      const city = profileAddress.address2 || profileAddress.state || '';

      defaultAddress = {
        _id: 'profile_address',
        label: 'Profile Address',
        recipient_name: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim(),
        phone: profileAddress.phone?.number
          ? `${profileAddress.phone.country_code || ''}${profileAddress.phone.number}`
          : '',
        street: profileAddress.address1,
        city: city,
        state: profileAddress.state || '',
        country: profileAddress.country || 'Nigeria',
        postal_code: profileAddress.zip_code || '',
        is_default: false,
        is_profile_address: true,
      };
    }

    return {
      addresses,
      profile_address: defaultAddress,
    };
  }

  /**
   * Add a new delivery address for a patient
   */
  async addPatientDeliveryAddress(
    patientId: Types.ObjectId,
    dto: CreateDeliveryAddressDto,
  ) {
    const UsersCollection = this.connection.collection('users');

    // Check if patient exists
    const patient = await UsersCollection.findOne({ _id: patientId });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const newAddress = {
      _id: new Types.ObjectId(),
      label: dto.label,
      recipient_name: dto.recipient_name,
      phone: dto.phone,
      street: dto.street,
      city: dto.city,
      state: dto.state,
      country: dto.country || 'Nigeria',
      postal_code: dto.postal_code || '',
      additional_info: dto.additional_info || '',
      is_default: dto.is_default || false,
      created_at: new Date(),
    };

    // If this is set as default, remove default from other addresses
    if (dto.is_default) {
      await UsersCollection.updateOne(
        { _id: patientId },
        { $set: { 'delivery_addresses.$[].is_default': false } },
      );
    }

    // Add the new address
    await UsersCollection.updateOne(
      { _id: patientId },
      { $push: { delivery_addresses: newAddress } },
    );

    return newAddress;
  }

  /**
   * Update a delivery address for a patient
   */
  async updatePatientDeliveryAddress(
    patientId: Types.ObjectId,
    addressId: Types.ObjectId,
    dto: UpdateDeliveryAddressDto,
  ) {
    const UsersCollection = this.connection.collection('users');

    // Build update object
    const updateFields: any = {};
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined) {
        updateFields[`delivery_addresses.$.${key}`] = dto[key];
      }
    });

    // If setting as default, first remove default from all
    if (dto.is_default) {
      await UsersCollection.updateOne(
        { _id: patientId },
        { $set: { 'delivery_addresses.$[].is_default': false } },
      );
    }

    const result = await UsersCollection.updateOne(
      { _id: patientId, 'delivery_addresses._id': addressId },
      { $set: updateFields },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Address not found');
    }

    return { success: true };
  }

  /**
   * Delete a delivery address for a patient
   */
  async deletePatientDeliveryAddress(
    patientId: Types.ObjectId,
    addressId: Types.ObjectId,
  ) {
    const UsersCollection = this.connection.collection('users');

    const result = await UsersCollection.updateOne(
      { _id: patientId },
      { $pull: { delivery_addresses: { _id: addressId } } },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Address not found');
    }

    return { success: true };
  }

  /**
   * Set a delivery address as default
   */
  async setDefaultDeliveryAddress(
    patientId: Types.ObjectId,
    addressId: Types.ObjectId,
  ) {
    const UsersCollection = this.connection.collection('users');

    // Remove default from all addresses
    await UsersCollection.updateOne(
      { _id: patientId },
      { $set: { 'delivery_addresses.$[].is_default': false } },
    );

    // Set the specified address as default
    const result = await UsersCollection.updateOne(
      { _id: patientId, 'delivery_addresses._id': addressId },
      { $set: { 'delivery_addresses.$.is_default': true } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Address not found');
    }

    return { success: true };
  }

  // ============ PATIENT APPOINTMENTS ============

  /**
   * Get patient's appointment history (all specialists)
   */
  async getPatientAppointments(
    specialistId: Types.ObjectId,
    patientId: Types.ObjectId,
    page = 1,
    limit = 10,
    status?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const AppointmentsCollection = this.connection.collection('appointments');
    const UsersCollection = this.connection.collection('users');

    // Build filter - show ALL appointments for this patient
    const filter: any = { patient: patientId };

    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }

    // Get total count for pagination
    const total = await AppointmentsCollection.countDocuments(filter);

    // Get paginated appointments
    const appointments = await AppointmentsCollection.find(filter)
      .sort({ start_time: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get unique specialist IDs to fetch their info
    const specialistIds = [...new Set(appointments.map((a: any) => a.specialist?.toString()))].filter(Boolean);

    // Fetch specialist info
    const specialists = await UsersCollection.find({
      _id: { $in: specialistIds.map((id: string) => new Types.ObjectId(id)) },
    }, {
      projection: {
        'profile.first_name': 1,
        'profile.last_name': 1,
        'profile.profile_photo': 1,
        'profile.bio.profile_image': 1,
      },
    }).toArray();

    // Create specialist lookup map
    const specialistMap = new Map();
    for (const spec of specialists) {
      const firstName = spec.profile?.first_name || '';
      const lastName = spec.profile?.last_name || '';
      const rawImage = spec.profile?.profile_photo || spec.profile?.bio?.profile_image || null;
      const profileImage = await this.fileUploadHelper.resolveProfileImage(rawImage);
      specialistMap.set(spec._id.toString(), {
        _id: spec._id,
        name: `Dr. ${firstName} ${lastName}`.trim(),
        profile_image: profileImage,
      });
    }

    const enrichedAppointments = appointments.map((apt: any) => {
      // Extract time from start_time
      let appointmentTime: string | null = null;
      if (apt.start_time) {
        const date = new Date(apt.start_time);
        appointmentTime = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }

      const specialist = specialistMap.get(apt.specialist?.toString()) || null;

      return {
        _id: apt._id,
        appointment_date: apt.start_time,
        appointment_time: appointmentTime,
        duration: apt.duration_minutes || apt.duration || 30,
        status: apt.status,
        type: apt.appointment_type || apt.category || 'general',
        reason: apt.patient_notes || apt.reason,
        notes: apt.private_notes || apt.clinical_notes,
        is_follow_up: apt.is_follow_up || false,
        meeting_type: apt.meeting_type,
        specialist,
        created_at: apt.created_at,
      };
    });

    return {
      docs: enrichedAppointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  // ============ PATIENT HEALTH SCORES ============

  /**
   * Get patient's health scores (basic and advanced)
   */
  async getPatientHealthScores(patientId: Types.ObjectId) {
    const BasicHealthScoreCollection = this.connection.collection('basic_health_score_history');
    const AdvancedHealthScoreCollection = this.connection.collection('advanced_health_scores');

    // Get latest basic health score
    const latestBasic = await BasicHealthScoreCollection.findOne(
      { user_id: patientId },
      { sort: { created_at: -1 } },
    );

    // Get basic score history (last 6)
    const basicHistory = await BasicHealthScoreCollection.find({ user_id: patientId })
      .sort({ created_at: -1 })
      .limit(6)
      .toArray();

    // Get latest advanced health score
    const latestAdvanced = await AdvancedHealthScoreCollection.findOne(
      { user_id: patientId, status: 'completed' },
      { sort: { created_at: -1 } },
    );

    // Get advanced score history (last 6)
    const advancedHistory = await AdvancedHealthScoreCollection.find({
      user_id: patientId,
      status: 'completed',
    })
      .sort({ created_at: -1 })
      .limit(6)
      .toArray();

    return {
      basic: latestBasic
        ? {
            score: latestBasic.score,
            label: this.getScoreLabel(latestBasic.score),
            breakdown: latestBasic.breakdown || {},
            last_updated: latestBasic.created_at,
          }
        : null,
      basic_history: basicHistory.map((h: any) => ({
        score: h.score,
        date: h.created_at,
      })),
      advanced: latestAdvanced
        ? {
            overall_score: latestAdvanced.report?.overall_score || latestAdvanced.overall_score,
            label: this.getScoreLabel(latestAdvanced.report?.overall_score || latestAdvanced.overall_score),
            overall_status: latestAdvanced.report?.overall_status,
            overall_summary: latestAdvanced.report?.overall_summary,
            domain_scores: latestAdvanced.report?.domain_scores || latestAdvanced.category_scores || {},
            last_updated: latestAdvanced.created_at,
          }
        : null,
      advanced_history: advancedHistory.map((h: any) => ({
        score: h.report?.overall_score || h.overall_score,
        date: h.created_at,
      })),
    };
  }

  private getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  }

  // ============ PATIENT VITALS HISTORY ============

  /**
   * Get patient's vitals history for a specific vital type
   */
  async getPatientVitalsHistory(
    patientId: Types.ObjectId,
    vitalType: string,
    limit = 30,
  ) {
    const VitalsCollection = this.connection.collection('vitals');

    // Map frontend vital type to database field
    const fieldMapping: Record<string, string> = {
      blood_pressure: 'blood_pressure',
      heart_rate: 'pulse_rate',
      temperature: 'body_temp',
      weight: 'body_weight',
      blood_sugar: 'blood_sugar_level',
      oxygen_saturation: 'blood_oxygen',
      height: 'height',
    };

    const dbField = fieldMapping[vitalType] || vitalType;

    // Get vitals that have the requested field
    const vitals = await VitalsCollection.find({
      $or: [
        { userId: patientId },
        { userId: patientId.toString() },
        { user: patientId },
        { user_id: patientId },
      ],
      [`${dbField}.0`]: { $exists: true },
    })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Extract all readings from the field arrays (only those with values)
    const readings: any[] = [];
    for (const vital of vitals) {
      const fieldData = vital[dbField];
      if (Array.isArray(fieldData)) {
        for (const reading of fieldData) {
          // Only include readings that have a value
          if (reading.value !== undefined && reading.value !== null && reading.value !== '') {
            readings.push({
              value: reading.value,
              unit: reading.unit,
              recorded_at: reading.updatedAt || vital.created_at,
            });
          }
        }
      }
    }

    // Sort by date descending and limit
    readings.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    const limitedReadings = readings.slice(0, limit);

    return {
      type: vitalType,
      readings: limitedReadings,
      count: limitedReadings.length,
      stats: this.calculateVitalStats(readings, vitalType),
    };
  }

  private calculateVitalStats(readings: any[], vitalType: string) {
    if (readings.length === 0) return null;

    // For blood pressure, handle systolic/diastolic
    if (vitalType === 'blood_pressure') {
      const systolicValues = readings
        .map((r) => {
          if (typeof r.value === 'string' && r.value.includes('/')) {
            return parseInt(r.value.split('/')[0], 10);
          }
          return r.value?.systolic || null;
        })
        .filter((v) => v !== null && !isNaN(v));

      if (systolicValues.length === 0) return null;

      return {
        latest: readings[0]?.value || null,
        average: Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length),
        min: Math.min(...systolicValues),
        max: Math.max(...systolicValues),
        trend: this.calculateTrend(systolicValues),
      };
    }

    // For numeric values
    const numericValues = readings
      .map((r) => {
        const val = typeof r.value === 'string' ? parseFloat(r.value) : r.value;
        return isNaN(val) ? null : val;
      })
      .filter((v) => v !== null);

    if (numericValues.length === 0) return null;

    return {
      latest: readings[0]?.value || null,
      average: Math.round((numericValues.reduce((a, b) => a + b, 0) / numericValues.length) * 10) / 10,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      trend: this.calculateTrend(numericValues),
    };
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const recent = values.slice(0, Math.min(3, values.length));
    const older = values.slice(Math.min(3, values.length), Math.min(6, values.length));

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }
}
