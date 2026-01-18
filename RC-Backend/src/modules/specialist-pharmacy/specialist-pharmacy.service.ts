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
      const appointments = await AppointmentsCollection.distinct('patient_id', {
        specialist_id: specialistId,
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
        'profile.bio.profile_image': 1,
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
              specialist_id: specialistId,
              patient_id: patient._id,
            }),
            this.prescriptionModel.countDocuments({
              specialist_id: specialistId,
              patient_id: patient._id,
            }),
            AppointmentsCollection.findOne(
              { specialist_id: specialistId, patient_id: patient._id },
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
          profile_image: patient.profile?.bio?.profile_image,
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

    // Return flattened structure for frontend
    return {
      _id: patient._id,
      full_name: fullName,
      email: patient.profile?.contact?.email || null,
      phone,
      date_of_birth: patient.profile?.date_of_birth || null,
      gender: patient.profile?.gender || null,
      profile_image: patient.profile?.profile_photo || patient.profile?.profile_image || null,
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
    const allergies = patient?.allergies || patient?.profile?.allergies || [];

    return {
      conditions,
      allergies: Array.isArray(allergies) ? allergies : [],
      risk_factors: patient?.profile?.health_risk_factors || {},
      health_info: patient?.profile?.basic_health_info || {},
      current_medications: patient?.profile?.medications || [],
    };
  }

  /**
   * Get patient's prescription history from this specialist
   */
  async getPatientPrescriptions(
    specialistId: Types.ObjectId,
    patientId: Types.ObjectId,
    page = 1,
    limit = 20,
  ) {
    const filter = {
      specialist_id: specialistId,
      patient_id: patientId,
    };

    const [prescriptions, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.prescriptionModel.countDocuments(filter),
    ]);

    return this.generalHelpers.paginate(prescriptions, page, limit, total);
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

    // Transform to frontend-friendly format
    return vitals.map((vital: any) => {
      const records: any[] = [];

      if (vital.blood_pressure) {
        records.push({
          _id: `${vital._id}_bp`,
          type: 'blood_pressure',
          value: `${vital.blood_pressure.systolic}/${vital.blood_pressure.diastolic}`,
          unit: 'mmHg',
          recorded_at: vital.created_at,
        });
      }
      if (vital.pulse_rate) {
        records.push({
          _id: `${vital._id}_hr`,
          type: 'heart_rate',
          value: vital.pulse_rate,
          unit: 'bpm',
          recorded_at: vital.created_at,
        });
      }
      if (vital.body_temp) {
        records.push({
          _id: `${vital._id}_temp`,
          type: 'temperature',
          value: vital.body_temp,
          unit: '°C',
          recorded_at: vital.created_at,
        });
      }
      if (vital.body_weight) {
        records.push({
          _id: `${vital._id}_weight`,
          type: 'weight',
          value: vital.body_weight,
          unit: 'kg',
          recorded_at: vital.created_at,
        });
      }
      if (vital.blood_sugar_level) {
        records.push({
          _id: `${vital._id}_sugar`,
          type: 'blood_sugar',
          value: vital.blood_sugar_level,
          unit: 'mg/dL',
          recorded_at: vital.created_at,
        });
      }

      return records;
    }).flat();
  }

  /**
   * Get patient's health checkups (only completed ones with diagnosis)
   */
  async getPatientHealthCheckups(patientId: Types.ObjectId, limit = 5) {
    const HealthCheckupsCollection = this.connection.collection('health_checkups');

    // Only get completed checkups (those with conditions/diagnosis)
    const checkups = await HealthCheckupsCollection.find({
      user: patientId,
      'response.data.conditions.0': { $exists: true },
    })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Transform to frontend-friendly format
    return checkups.map((checkup: any) => {
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
        let patientAvatar = null;

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
                  'profile.bio.profile_image': 1,
                },
              },
            );

            if (patient?.profile) {
              const firstName = patient.profile.first_name || '';
              const lastName = patient.profile.last_name || '';
              patientName = `${firstName} ${lastName}`.trim() || 'Unknown Patient';
              patientAvatar = patient.profile.bio?.profile_image || null;
            }
          } catch (e) {
            // Log but continue - don't break dashboard for one bad prescription
            console.warn('Failed to lookup patient for prescription:', prescription._id, e.message);
          }
        }

        return {
          _id: prescription._id,
          prescription_number: prescription.prescription_number,
          patient_id: prescription.patient_id,
          patient_name: patientName,
          patient_avatar: patientAvatar,
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
}
