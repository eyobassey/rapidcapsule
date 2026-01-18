import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { DrugCategoryEntity, DrugCategoryDocument } from './entities/drug-category.entity';
import { DrugClassificationEntity, DrugClassificationDocument } from './entities/drug-classification.entity';
import { DrugRouteEntity, DrugRouteDocument } from './entities/drug-route.entity';
import { DosageFormEntity, DosageFormDocument } from './entities/dosage-form.entity';
import { DrugEntity, DrugDocument } from './entities/drug.entity';
import { ManufacturerEntity, ManufacturerDocument } from './entities/manufacturer.entity';
import { SupplierEntity, SupplierDocument, SupplierStatus } from './entities/supplier.entity';
import { StockBatchEntity, StockBatchDocument, BatchStatus } from './entities/stock-batch.entity';
import { StockTransactionEntity, StockTransactionDocument, TransactionType, ReferenceType } from './entities/stock-transaction.entity';
import { CreateDrugCategoryDto, UpdateDrugCategoryDto } from './dto/drug-category.dto';
import { CreateDrugClassificationDto, UpdateDrugClassificationDto } from './dto/drug-classification.dto';
import { CreateDrugRouteDto, UpdateDrugRouteDto } from './dto/drug-route.dto';
import { CreateDosageFormDto, UpdateDosageFormDto } from './dto/dosage-form.dto';
import { CreateManufacturerDto, UpdateManufacturerDto } from './dto/manufacturer.dto';
import { CreateDrugDto, UpdateDrugDto, UpdateDrugStockDto, DrugQueryDto } from './dto/drug.dto';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  ChangeSupplierStatusDto,
  SupplierQueryDto,
} from './dto/supplier.dto';
import {
  ReceiveStockDto,
  UpdateBatchDto,
  ChangeBatchStatusDto,
  AdjustBatchStockDto,
  ReturnToSupplierDto,
  WriteOffBatchDto,
  RecallBatchDto,
  DispenseStockDto,
  BatchQueryDto,
} from './dto/stock-batch.dto';
import { TransactionQueryDto, ReverseTransactionDto } from './dto/stock-transaction.dto';
import {
  InventoryReportQueryDto,
  StockValuationReport,
  ExpiryBatchReport,
  TransactionReport,
  CategoryValuation,
  SupplierValuation,
  ProductValuation,
  ExpiryTimelinePeriod,
  CriticalBatch,
  BatchStatusCount,
  TransactionTypeCount,
  DailyTransactionVolume,
  TopMovingDrug,
  RecentTransaction,
} from './dto/inventory-report.dto';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { ALL_SAMPLE_DRUGS, SampleDrugData } from './data/sample-drugs.data';
import {
  orderProcessingEmail,
  orderDispensedEmail,
  prescriptionShippedEmail,
  prescriptionDeliveredEmail,
  prescriptionApprovedEmail,
  prescriptionRejectedByPharmacistEmail,
  prescriptionClarificationNeededEmail,
  OrderEmailData,
  PrescriptionItem,
  PrescriptionReviewEmailData,
} from '../../core/emails/mails/prescriptionEmails';
import { orderReadyForPickupEmail } from '../../core/emails/mails/pickupEmails';
import { Logger } from '@nestjs/common';

// Predefined system categories
const SYSTEM_CATEGORIES = [
  { code: 'PAIN_RELIEF', name: 'Pain Relief', icon: 'mdi-bandage' },
  { code: 'COLD_AND_FLU', name: 'Cold & Flu', icon: 'mdi-snowflake-thermometer' },
  { code: 'ALLERGIES', name: 'Allergies', icon: 'mdi-flower-pollen' },
  { code: 'DIGESTIVE_HEALTH', name: 'Digestive Health', icon: 'mdi-stomach' },
  { code: 'VITAMINS_SUPPLEMENTS', name: 'Vitamins & Supplements', icon: 'mdi-pill' },
  { code: 'FIRST_AID', name: 'First Aid', icon: 'mdi-medical-bag' },
  { code: 'SKIN_CARE', name: 'Skin Care', icon: 'mdi-lotion' },
  { code: 'EYE_CARE', name: 'Eye Care', icon: 'mdi-eye' },
  { code: 'EAR_CARE', name: 'Ear Care', icon: 'mdi-ear-hearing' },
  { code: 'ORAL_CARE', name: 'Oral Care', icon: 'mdi-tooth' },
  { code: 'RESPIRATORY', name: 'Respiratory', icon: 'mdi-lungs' },
  { code: 'CARDIOVASCULAR', name: 'Cardiovascular', icon: 'mdi-heart-pulse' },
  { code: 'DIABETES', name: 'Diabetes', icon: 'mdi-diabetes' },
  { code: 'ANTIBIOTICS', name: 'Antibiotics', icon: 'mdi-bacteria' },
  { code: 'ANTIFUNGALS', name: 'Antifungals', icon: 'mdi-mushroom' },
  { code: 'ANTIVIRALS', name: 'Antivirals', icon: 'mdi-virus' },
  { code: 'MENTAL_HEALTH', name: 'Mental Health', icon: 'mdi-brain' },
  { code: 'HORMONES', name: 'Hormones', icon: 'mdi-chart-line' },
  { code: 'WOMENS_HEALTH', name: "Women's Health", icon: 'mdi-gender-female' },
  { code: 'MENS_HEALTH', name: "Men's Health", icon: 'mdi-gender-male' },
  { code: 'CHILDREN_HEALTH', name: "Children's Health", icon: 'mdi-baby-face' },
  { code: 'SEXUAL_HEALTH', name: 'Sexual Health', icon: 'mdi-heart' },
  { code: 'SLEEP_AIDS', name: 'Sleep Aids', icon: 'mdi-sleep' },
  { code: 'WEIGHT_MANAGEMENT', name: 'Weight Management', icon: 'mdi-scale-bathroom' },
  { code: 'SMOKING_CESSATION', name: 'Smoking Cessation', icon: 'mdi-smoking-off' },
  { code: 'EMERGENCY_CONTRACEPTION', name: 'Emergency Contraception', icon: 'mdi-shield-alert' },
  { code: 'MEDICAL_DEVICES', name: 'Medical Devices', icon: 'mdi-medical-cotton-swab' },
  { code: 'OTHER', name: 'Other', icon: 'mdi-dots-horizontal' },
];

// Predefined system classifications
const SYSTEM_CLASSIFICATIONS = [
  {
    code: 'OTC_GENERAL',
    name: 'Over The Counter (General)',
    short_code: 'OTC',
    color: 'success',
    icon: 'mdi-check-circle',
    requires_prescription: false,
    requires_pharmacist_approval: false,
    is_controlled: false,
    is_poison: false,
    restriction_level: 0,
    description: 'Can be purchased without prescription or pharmacist consultation'
  },
  {
    code: 'OTC_RESTRICTED',
    name: 'Over The Counter (Restricted)',
    short_code: 'OTC-R',
    color: 'info',
    icon: 'mdi-information',
    requires_prescription: false,
    requires_pharmacist_approval: false,
    is_controlled: false,
    is_poison: false,
    restriction_level: 1,
    description: 'Can be purchased without prescription but may require health screening'
  },
  {
    code: 'PHARMACY_ONLY',
    name: 'Pharmacy Only Medicine',
    short_code: 'POM',
    color: 'warning',
    icon: 'mdi-pharmacy',
    requires_prescription: false,
    requires_pharmacist_approval: true,
    is_controlled: false,
    is_poison: false,
    restriction_level: 2,
    description: 'Requires pharmacist consultation before purchase'
  },
  {
    code: 'PRESCRIPTION_ONLY',
    name: 'Prescription Only Medicine',
    short_code: 'Rx',
    color: 'error',
    icon: 'mdi-prescription',
    requires_prescription: true,
    requires_pharmacist_approval: true,
    is_controlled: false,
    is_poison: false,
    restriction_level: 3,
    description: 'Requires valid prescription from a licensed healthcare provider'
  },
  {
    code: 'CONTROLLED',
    name: 'Controlled Substance',
    short_code: 'CD',
    color: 'error',
    icon: 'mdi-lock',
    requires_prescription: true,
    requires_pharmacist_approval: true,
    is_controlled: true,
    is_poison: false,
    restriction_level: 4,
    description: 'Controlled drug with potential for abuse, requires special documentation'
  },
  {
    code: 'POISON',
    name: 'Poison / Dangerous Substance',
    short_code: 'P',
    color: 'error',
    icon: 'mdi-skull-crossbones',
    requires_prescription: true,
    requires_pharmacist_approval: true,
    is_controlled: false,
    is_poison: true,
    restriction_level: 4,
    description: 'Poisonous or dangerous substance requiring special handling'
  },
  {
    code: 'SCHEDULE_II',
    name: 'Schedule II (High Abuse Potential)',
    short_code: 'S2',
    color: 'error',
    icon: 'mdi-alert-octagon',
    requires_prescription: true,
    requires_pharmacist_approval: true,
    is_controlled: true,
    is_poison: false,
    restriction_level: 5,
    description: 'High potential for abuse, may lead to severe dependence'
  },
  {
    code: 'SCHEDULE_III',
    name: 'Schedule III (Moderate Abuse Potential)',
    short_code: 'S3',
    color: 'warning',
    icon: 'mdi-alert',
    requires_prescription: true,
    requires_pharmacist_approval: true,
    is_controlled: true,
    is_poison: false,
    restriction_level: 4,
    description: 'Moderate potential for abuse, may lead to moderate dependence'
  },
  {
    code: 'SCHEDULE_IV',
    name: 'Schedule IV (Low Abuse Potential)',
    short_code: 'S4',
    color: 'info',
    icon: 'mdi-alert-circle',
    requires_prescription: true,
    requires_pharmacist_approval: true,
    is_controlled: true,
    is_poison: false,
    restriction_level: 3,
    description: 'Low potential for abuse, limited dependence liability'
  },
  {
    code: 'SCHEDULE_V',
    name: 'Schedule V (Lowest Abuse Potential)',
    short_code: 'S5',
    color: 'info',
    icon: 'mdi-information-outline',
    requires_prescription: false,
    requires_pharmacist_approval: true,
    is_controlled: true,
    is_poison: false,
    restriction_level: 2,
    description: 'Lowest potential for abuse among controlled substances'
  },
];

// Predefined system routes
const SYSTEM_ROUTES = [
  { code: 'ORAL', name: 'Oral', abbreviation: 'PO', icon: 'mdi-pill', requires_professional: false, description: 'Taken by mouth' },
  { code: 'SUBLINGUAL', name: 'Sublingual', abbreviation: 'SL', icon: 'mdi-pill', requires_professional: false, description: 'Under the tongue' },
  { code: 'BUCCAL', name: 'Buccal', abbreviation: 'BUC', icon: 'mdi-pill', requires_professional: false, description: 'Between cheek and gum' },
  { code: 'TOPICAL', name: 'Topical', abbreviation: 'TOP', icon: 'mdi-lotion', requires_professional: false, description: 'Applied to skin surface' },
  { code: 'TRANSDERMAL', name: 'Transdermal', abbreviation: 'TD', icon: 'mdi-bandage', requires_professional: false, description: 'Through the skin (patch)' },
  { code: 'INHALATION', name: 'Inhalation', abbreviation: 'INH', icon: 'mdi-lungs', requires_professional: false, description: 'Breathed into lungs' },
  { code: 'NASAL', name: 'Nasal', abbreviation: 'NAS', icon: 'mdi-spray', requires_professional: false, description: 'Through the nose' },
  { code: 'OPHTHALMIC', name: 'Ophthalmic (Eye)', abbreviation: 'OPH', icon: 'mdi-eye', requires_professional: false, description: 'Applied to the eye' },
  { code: 'OTIC', name: 'Otic (Ear)', abbreviation: 'OT', icon: 'mdi-ear-hearing', requires_professional: false, description: 'Applied to the ear' },
  { code: 'RECTAL', name: 'Rectal', abbreviation: 'PR', icon: 'mdi-medical-bag', requires_professional: false, description: 'Inserted into rectum' },
  { code: 'VAGINAL', name: 'Vaginal', abbreviation: 'PV', icon: 'mdi-medical-bag', requires_professional: false, description: 'Inserted into vagina' },
  { code: 'INTRAVENOUS', name: 'Intravenous', abbreviation: 'IV', icon: 'mdi-needle', requires_professional: true, description: 'Directly into vein' },
  { code: 'INTRAMUSCULAR', name: 'Intramuscular', abbreviation: 'IM', icon: 'mdi-needle', requires_professional: true, description: 'Into muscle tissue' },
  { code: 'SUBCUTANEOUS', name: 'Subcutaneous', abbreviation: 'SC', icon: 'mdi-needle', requires_professional: false, description: 'Under the skin' },
  { code: 'INTRADERMAL', name: 'Intradermal', abbreviation: 'ID', icon: 'mdi-needle', requires_professional: true, description: 'Into the dermis' },
  { code: 'INTRATHECAL', name: 'Intrathecal', abbreviation: 'IT', icon: 'mdi-needle', requires_professional: true, description: 'Into spinal canal' },
  { code: 'EPIDURAL', name: 'Epidural', abbreviation: 'EP', icon: 'mdi-needle', requires_professional: true, description: 'Into epidural space' },
];

// Predefined system dosage forms
const SYSTEM_DOSAGE_FORMS = [
  { code: 'TABLET', name: 'Tablet', icon: 'mdi-pill', default_unit: 'tablets', compatible_routes: ['ORAL'] },
  { code: 'CAPSULE', name: 'Capsule', icon: 'mdi-pill', default_unit: 'capsules', compatible_routes: ['ORAL'] },
  { code: 'SYRUP', name: 'Syrup', icon: 'mdi-bottle-tonic', default_unit: 'ml', compatible_routes: ['ORAL'] },
  { code: 'SUSPENSION', name: 'Suspension', icon: 'mdi-bottle-tonic', default_unit: 'ml', compatible_routes: ['ORAL'] },
  { code: 'SOLUTION', name: 'Solution', icon: 'mdi-bottle-tonic', default_unit: 'ml', compatible_routes: ['ORAL', 'TOPICAL', 'OPHTHALMIC', 'OTIC'] },
  { code: 'INJECTION', name: 'Injection', icon: 'mdi-needle', default_unit: 'ml', compatible_routes: ['INTRAVENOUS', 'INTRAMUSCULAR', 'SUBCUTANEOUS'] },
  { code: 'CREAM', name: 'Cream', icon: 'mdi-lotion', default_unit: 'g', compatible_routes: ['TOPICAL'] },
  { code: 'OINTMENT', name: 'Ointment', icon: 'mdi-lotion', default_unit: 'g', compatible_routes: ['TOPICAL', 'OPHTHALMIC'] },
  { code: 'GEL', name: 'Gel', icon: 'mdi-lotion', default_unit: 'g', compatible_routes: ['TOPICAL'] },
  { code: 'LOTION', name: 'Lotion', icon: 'mdi-lotion', default_unit: 'ml', compatible_routes: ['TOPICAL'] },
  { code: 'DROPS', name: 'Drops', icon: 'mdi-eyedropper', default_unit: 'drops', compatible_routes: ['OPHTHALMIC', 'OTIC', 'ORAL'] },
  { code: 'SPRAY', name: 'Spray', icon: 'mdi-spray', default_unit: 'sprays', compatible_routes: ['NASAL', 'TOPICAL', 'ORAL'] },
  { code: 'INHALER', name: 'Inhaler', icon: 'mdi-spray', default_unit: 'puffs', compatible_routes: ['INHALATION'] },
  { code: 'NEBULIZER', name: 'Nebulizer Solution', icon: 'mdi-spray', default_unit: 'ml', compatible_routes: ['INHALATION'] },
  { code: 'PATCH', name: 'Patch', icon: 'mdi-bandage', default_unit: 'patches', compatible_routes: ['TRANSDERMAL'] },
  { code: 'SUPPOSITORY', name: 'Suppository', icon: 'mdi-pill', default_unit: 'suppositories', compatible_routes: ['RECTAL', 'VAGINAL'] },
  { code: 'POWDER', name: 'Powder', icon: 'mdi-shaker', default_unit: 'g', compatible_routes: ['ORAL', 'TOPICAL'] },
  { code: 'GRANULES', name: 'Granules', icon: 'mdi-shaker', default_unit: 'sachets', compatible_routes: ['ORAL'] },
  { code: 'EFFERVESCENT', name: 'Effervescent Tablet', icon: 'mdi-pill', default_unit: 'tablets', compatible_routes: ['ORAL'] },
  { code: 'CHEWABLE', name: 'Chewable Tablet', icon: 'mdi-pill', default_unit: 'tablets', compatible_routes: ['ORAL'] },
  { code: 'LOZENGE', name: 'Lozenge', icon: 'mdi-pill', default_unit: 'lozenges', compatible_routes: ['ORAL', 'BUCCAL'] },
  { code: 'PESSARY', name: 'Pessary', icon: 'mdi-pill', default_unit: 'pessaries', compatible_routes: ['VAGINAL'] },
  { code: 'ENEMA', name: 'Enema', icon: 'mdi-bottle-tonic', default_unit: 'ml', compatible_routes: ['RECTAL'] },
  { code: 'IMPLANT', name: 'Implant', icon: 'mdi-medical-bag', default_unit: 'implants', compatible_routes: ['SUBCUTANEOUS'] },
];

// Predefined system manufacturers (major pharmaceutical companies)
const SYSTEM_MANUFACTURERS = [
  { code: 'GLAXOSMITHKLINE', name: 'GlaxoSmithKline', short_name: 'GSK', country: 'United Kingdom', website: 'https://www.gsk.com' },
  { code: 'PFIZER', name: 'Pfizer Inc.', short_name: 'Pfizer', country: 'United States', website: 'https://www.pfizer.com' },
  { code: 'JOHNSON_JOHNSON', name: 'Johnson & Johnson', short_name: 'J&J', country: 'United States', website: 'https://www.jnj.com' },
  { code: 'ROCHE', name: 'Roche Holding AG', short_name: 'Roche', country: 'Switzerland', website: 'https://www.roche.com' },
  { code: 'NOVARTIS', name: 'Novartis International AG', short_name: 'Novartis', country: 'Switzerland', website: 'https://www.novartis.com' },
  { code: 'MERCK', name: 'Merck & Co.', short_name: 'Merck', country: 'United States', website: 'https://www.merck.com' },
  { code: 'SANOFI', name: 'Sanofi S.A.', short_name: 'Sanofi', country: 'France', website: 'https://www.sanofi.com' },
  { code: 'ABBVIE', name: 'AbbVie Inc.', short_name: 'AbbVie', country: 'United States', website: 'https://www.abbvie.com' },
  { code: 'ASTRAZENECA', name: 'AstraZeneca PLC', short_name: 'AZ', country: 'United Kingdom', website: 'https://www.astrazeneca.com' },
  { code: 'BRISTOL_MYERS', name: 'Bristol-Myers Squibb', short_name: 'BMS', country: 'United States', website: 'https://www.bms.com' },
  { code: 'ELI_LILLY', name: 'Eli Lilly and Company', short_name: 'Lilly', country: 'United States', website: 'https://www.lilly.com' },
  { code: 'BAYER', name: 'Bayer AG', short_name: 'Bayer', country: 'Germany', website: 'https://www.bayer.com' },
  { code: 'PROCTER_GAMBLE', name: 'Procter & Gamble', short_name: 'P&G', country: 'United States', website: 'https://www.pg.com' },
  { code: 'RECKITT', name: 'Reckitt Benckiser', short_name: 'Reckitt', country: 'United Kingdom', website: 'https://www.reckitt.com' },
  { code: 'TEVA', name: 'Teva Pharmaceutical Industries', short_name: 'Teva', country: 'Israel', website: 'https://www.tevapharm.com' },
  { code: 'MYLAN', name: 'Mylan N.V.', short_name: 'Mylan', country: 'United States', website: 'https://www.viatris.com' },
  { code: 'CIPLA', name: 'Cipla Limited', short_name: 'Cipla', country: 'India', website: 'https://www.cipla.com' },
  { code: 'SUN_PHARMA', name: 'Sun Pharmaceutical Industries', short_name: 'Sun', country: 'India', website: 'https://www.sunpharma.com' },
  { code: 'EMZOR', name: 'Emzor Pharmaceutical Industries', short_name: 'Emzor', country: 'Nigeria', website: 'https://www.emzorpharma.com' },
  { code: 'FIDSON', name: 'Fidson Healthcare PLC', short_name: 'Fidson', country: 'Nigeria', website: 'https://www.fidsonhealthcare.com' },
  { code: 'MAY_BAKER', name: 'May & Baker Nigeria PLC', short_name: 'M&B', country: 'Nigeria', website: 'https://www.may-baker.com' },
  { code: 'NEIMETH', name: 'Neimeth International Pharmaceuticals', short_name: 'Neimeth', country: 'Nigeria', website: 'https://www.neimethplc.com' },
  { code: 'PHARMA_DEKO', name: 'Pharma-Deko PLC', short_name: 'Pharma-Deko', country: 'Nigeria', website: 'https://www.pharmadekoplc.com' },
  { code: 'OTHER', name: 'Other / Unspecified', short_name: 'Other', country: 'N/A' },
];

@Injectable()
export class PharmacyService {
  private readonly logger = new Logger(PharmacyService.name);

  constructor(
    @InjectModel(DrugCategoryEntity.name)
    private drugCategoryModel: Model<DrugCategoryDocument>,
    @InjectModel(DrugClassificationEntity.name)
    private drugClassificationModel: Model<DrugClassificationDocument>,
    @InjectModel(DrugRouteEntity.name)
    private drugRouteModel: Model<DrugRouteDocument>,
    @InjectModel(DosageFormEntity.name)
    private dosageFormModel: Model<DosageFormDocument>,
    @InjectModel(DrugEntity.name)
    private drugModel: Model<DrugDocument>,
    @InjectModel(ManufacturerEntity.name)
    private manufacturerModel: Model<ManufacturerDocument>,
    @InjectModel(SupplierEntity.name)
    private supplierModel: Model<SupplierDocument>,
    @InjectModel(StockBatchEntity.name)
    private stockBatchModel: Model<StockBatchDocument>,
    @InjectModel(StockTransactionEntity.name)
    private stockTransactionModel: Model<StockTransactionDocument>,
    @InjectConnection() private connection: Connection,
    private fileUploadHelper: FileUploadHelper,
    private generalHelpers: GeneralHelpers,
  ) {}

  // ============ HELPER METHODS ============

  /**
   * Convert S3 URLs in drug images to presigned URLs for secure access
   */
  private async addPresignedUrlsToDrug(drug: any): Promise<any> {
    if (!drug || !drug.images || drug.images.length === 0) {
      return drug;
    }

    const drugObj = drug.toObject ? drug.toObject() : { ...drug };

    drugObj.images = await Promise.all(
      drugObj.images.map(async (img: any) => {
        if (img.url && img.url.includes('s3.') && img.url.includes('amazonaws.com')) {
          try {
            const presignedUrl = await this.fileUploadHelper.getPresignedUrl(img.url, 3600); // 1 hour expiry
            return { ...img, url: presignedUrl, originalUrl: img.url };
          } catch (e) {
            console.error('Error generating presigned URL:', e);
            return img;
          }
        }
        return img;
      })
    );

    return drugObj;
  }

  /**
   * Convert S3 URLs for multiple drugs
   */
  private async addPresignedUrlsToDrugs(drugs: any[]): Promise<any[]> {
    return Promise.all(drugs.map(drug => this.addPresignedUrlsToDrug(drug)));
  }

  // ============ INITIALIZATION ============
  // Uses upsert to create OR update system data - ensures DB always matches seed data

  async initializeAllData(): Promise<void> {
    await Promise.all([
      this.initializeCategories(),
      this.initializeClassifications(),
      this.initializeRoutes(),
      this.initializeDosageForms(),
      this.initializeManufacturers(),
    ]);
  }

  async initializeCategories(): Promise<void> {
    for (let i = 0; i < SYSTEM_CATEGORIES.length; i++) {
      const cat = SYSTEM_CATEGORIES[i];
      await this.drugCategoryModel.findOneAndUpdate(
        { code: cat.code },
        { ...cat, is_system: true, is_active: true, display_order: i },
        { upsert: true, new: true },
      );
    }
  }

  async initializeClassifications(): Promise<void> {
    for (let i = 0; i < SYSTEM_CLASSIFICATIONS.length; i++) {
      const cls = SYSTEM_CLASSIFICATIONS[i];
      await this.drugClassificationModel.findOneAndUpdate(
        { code: cls.code },
        { ...cls, is_system: true, is_active: true, display_order: i },
        { upsert: true, new: true },
      );
    }
  }

  async initializeRoutes(): Promise<void> {
    for (let i = 0; i < SYSTEM_ROUTES.length; i++) {
      const route = SYSTEM_ROUTES[i];
      await this.drugRouteModel.findOneAndUpdate(
        { code: route.code },
        { ...route, is_system: true, is_active: true, display_order: i },
        { upsert: true, new: true },
      );
    }
  }

  async initializeDosageForms(): Promise<void> {
    for (let i = 0; i < SYSTEM_DOSAGE_FORMS.length; i++) {
      const form = SYSTEM_DOSAGE_FORMS[i];
      await this.dosageFormModel.findOneAndUpdate(
        { code: form.code },
        { ...form, is_system: true, is_active: true, display_order: i },
        { upsert: true, new: true },
      );
    }
  }

  async initializeManufacturers(): Promise<void> {
    for (let i = 0; i < SYSTEM_MANUFACTURERS.length; i++) {
      const mfr = SYSTEM_MANUFACTURERS[i];
      await this.manufacturerModel.findOneAndUpdate(
        { code: mfr.code },
        { ...mfr, is_system: true, is_active: true, display_order: i },
        { upsert: true, new: true },
      );
    }
  }

  // ============ CATEGORIES ============

  async getCategories(includeInactive = false): Promise<any[]> {
    const query = includeInactive ? {} : { is_active: true };
    const categories = await this.drugCategoryModel.find(query).sort({ display_order: 1, name: 1 }).lean();

    // Generate presigned URLs for category images
    const categoriesWithPresignedUrls = await Promise.all(
      categories.map(async (category) => {
        if (category.image_url) {
          try {
            const presignedUrl = await this.fileUploadHelper.getPresignedUrl(category.image_url, 86400); // 24 hours
            return { ...category, image_url: presignedUrl };
          } catch (error) {
            console.error(`Error generating presigned URL for category ${category.code}:`, error);
            return category;
          }
        }
        return category;
      })
    );

    return categoriesWithPresignedUrls;
  }

  async getCategoryById(id: string): Promise<DrugCategoryDocument> {
    const category = await this.drugCategoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async createCategory(dto: CreateDrugCategoryDto, userId: string): Promise<DrugCategoryDocument> {
    const code = dto.code || this.generateCode(dto.name);
    const exists = await this.drugCategoryModel.findOne({ code });
    if (exists) throw new BadRequestException('Category with this code already exists');
    return this.drugCategoryModel.create({ ...dto, code, is_system: false, created_by: userId });
  }

  async updateCategory(id: string, dto: UpdateDrugCategoryDto): Promise<DrugCategoryDocument> {
    const category = await this.drugCategoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return this.drugCategoryModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const category = await this.drugCategoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    if (category.is_system) throw new BadRequestException('Cannot delete system category');
    await this.drugCategoryModel.findByIdAndUpdate(id, { is_active: false });
    return { success: true };
  }

  async uploadCategoryImage(id: string, file: Express.Multer.File): Promise<any> {
    const category = await this.drugCategoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, SVG`,
      );
    }

    // Delete old image if exists
    if (category.image_url) {
      try {
        await this.fileUploadHelper.deleteFromS3(category.image_url);
      } catch (error) {
        console.error('Error deleting old category image:', error);
      }
    }

    const fileData = [{
      buffer: file.buffer,
      filename: `${category.code.toLowerCase()}-${Date.now()}${this.getFileExtension(file.originalname)}`,
    }];

    const urls = await this.fileUploadHelper.uploadMultipleToS3(fileData, 'pharmacy/categories');
    const imageUrl = urls[0];

    const updatedCategory = await this.drugCategoryModel.findByIdAndUpdate(
      id,
      { image_url: imageUrl },
      { new: true },
    ).lean();

    // Return with presigned URL for immediate display
    const presignedUrl = await this.fileUploadHelper.getPresignedUrl(imageUrl, 86400);
    return { ...updatedCategory, image_url: presignedUrl };
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }

  /**
   * Normalize used_in_orders array - handles both old ObjectId format and new object format
   * Fetches order details if needed to ensure all fields are populated
   */
  private async normalizeUsedInOrders(usedInOrders: any[]): Promise<any[]> {
    if (!usedInOrders || usedInOrders.length === 0) {
      return [];
    }

    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const normalizedOrders = [];

    for (const item of usedInOrders) {
      // Check if item is an ObjectId or a plain string (old format)
      const isObjectId = item instanceof Types.ObjectId ||
        (typeof item === 'string' && /^[a-f\d]{24}$/i.test(item)) ||
        (item && item._bsontype === 'ObjectID');

      if (isObjectId) {
        // Old format - just an ObjectId, need to fetch order details
        const orderId = typeof item === 'string' ? item : item.toString();
        try {
          const order = await PharmacyOrdersCollection.findOne({
            _id: new Types.ObjectId(orderId),
          });
          if (order) {
            normalizedOrders.push({
              order_id: order._id.toString(),
              order_number: order.order_number || `ORD-${orderId.slice(-8).toUpperCase()}`,
              total_amount: order.total_amount || 0,
              status: order.status || 'PENDING',
              updated_at: order.updated_at || order.created_at,
            });
          }
        } catch (e) {
          // Skip invalid ObjectIds
        }
      } else if (item && typeof item === 'object') {
        // New format - already an object, ensure all fields exist
        normalizedOrders.push({
          order_id: item.order_id?.toString() || item._id?.toString(),
          order_number: item.order_number || '',
          total_amount: item.total_amount || 0,
          status: item.status || 'PENDING',
          updated_at: item.updated_at,
        });
      }
    }

    return normalizedOrders;
  }

  // ============ CLASSIFICATIONS ============

  async getClassifications(includeInactive = false): Promise<DrugClassificationDocument[]> {
    const query = includeInactive ? {} : { is_active: true };
    return this.drugClassificationModel.find(query).sort({ display_order: 1, name: 1 });
  }

  async getClassificationById(id: string): Promise<DrugClassificationDocument> {
    const classification = await this.drugClassificationModel.findById(id);
    if (!classification) throw new NotFoundException('Classification not found');
    return classification;
  }

  async createClassification(dto: CreateDrugClassificationDto, userId: string): Promise<DrugClassificationDocument> {
    const code = dto.code || this.generateCode(dto.name);
    const exists = await this.drugClassificationModel.findOne({ code });
    if (exists) throw new BadRequestException('Classification with this code already exists');
    return this.drugClassificationModel.create({ ...dto, code, is_system: false, created_by: userId });
  }

  async updateClassification(id: string, dto: UpdateDrugClassificationDto): Promise<DrugClassificationDocument> {
    const classification = await this.drugClassificationModel.findById(id);
    if (!classification) throw new NotFoundException('Classification not found');
    return this.drugClassificationModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteClassification(id: string): Promise<{ success: boolean }> {
    const classification = await this.drugClassificationModel.findById(id);
    if (!classification) throw new NotFoundException('Classification not found');
    if (classification.is_system) throw new BadRequestException('Cannot delete system classification');
    await this.drugClassificationModel.findByIdAndUpdate(id, { is_active: false });
    return { success: true };
  }

  // ============ ROUTES ============

  async getRoutes(includeInactive = false): Promise<DrugRouteDocument[]> {
    const query = includeInactive ? {} : { is_active: true };
    return this.drugRouteModel.find(query).sort({ display_order: 1, name: 1 });
  }

  async getRouteById(id: string): Promise<DrugRouteDocument> {
    const route = await this.drugRouteModel.findById(id);
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async createRoute(dto: CreateDrugRouteDto, userId: string): Promise<DrugRouteDocument> {
    const code = dto.code || this.generateCode(dto.name);
    const exists = await this.drugRouteModel.findOne({ code });
    if (exists) throw new BadRequestException('Route with this code already exists');
    return this.drugRouteModel.create({ ...dto, code, is_system: false, created_by: userId });
  }

  async updateRoute(id: string, dto: UpdateDrugRouteDto): Promise<DrugRouteDocument> {
    const route = await this.drugRouteModel.findById(id);
    if (!route) throw new NotFoundException('Route not found');
    return this.drugRouteModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteRoute(id: string): Promise<{ success: boolean }> {
    const route = await this.drugRouteModel.findById(id);
    if (!route) throw new NotFoundException('Route not found');
    if (route.is_system) throw new BadRequestException('Cannot delete system route');
    await this.drugRouteModel.findByIdAndUpdate(id, { is_active: false });
    return { success: true };
  }

  // ============ DOSAGE FORMS ============

  async getDosageForms(includeInactive = false): Promise<DosageFormDocument[]> {
    const query = includeInactive ? {} : { is_active: true };
    return this.dosageFormModel.find(query).sort({ display_order: 1, name: 1 });
  }

  async getDosageFormById(id: string): Promise<DosageFormDocument> {
    const form = await this.dosageFormModel.findById(id);
    if (!form) throw new NotFoundException('Dosage form not found');
    return form;
  }

  async createDosageForm(dto: CreateDosageFormDto, userId: string): Promise<DosageFormDocument> {
    const code = dto.code || this.generateCode(dto.name);
    const exists = await this.dosageFormModel.findOne({ code });
    if (exists) throw new BadRequestException('Dosage form with this code already exists');
    return this.dosageFormModel.create({ ...dto, code, is_system: false, created_by: userId });
  }

  async updateDosageForm(id: string, dto: UpdateDosageFormDto): Promise<DosageFormDocument> {
    const form = await this.dosageFormModel.findById(id);
    if (!form) throw new NotFoundException('Dosage form not found');
    return this.dosageFormModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteDosageForm(id: string): Promise<{ success: boolean }> {
    const form = await this.dosageFormModel.findById(id);
    if (!form) throw new NotFoundException('Dosage form not found');
    if (form.is_system) throw new BadRequestException('Cannot delete system dosage form');
    await this.dosageFormModel.findByIdAndUpdate(id, { is_active: false });
    return { success: true };
  }

  // ============ MANUFACTURERS ============

  async getManufacturers(includeInactive = false): Promise<ManufacturerDocument[]> {
    const query = includeInactive ? {} : { is_active: true };
    return this.manufacturerModel.find(query).sort({ display_order: 1, name: 1 });
  }

  async getManufacturerById(id: string): Promise<ManufacturerDocument> {
    const manufacturer = await this.manufacturerModel.findById(id);
    if (!manufacturer) throw new NotFoundException('Manufacturer not found');
    return manufacturer;
  }

  async createManufacturer(dto: CreateManufacturerDto, userId: string): Promise<ManufacturerDocument> {
    const code = dto.code || this.generateCode(dto.name);
    const exists = await this.manufacturerModel.findOne({ code });
    if (exists) throw new BadRequestException('Manufacturer with this code already exists');
    return this.manufacturerModel.create({ ...dto, code, is_system: false, created_by: userId });
  }

  async updateManufacturer(id: string, dto: UpdateManufacturerDto): Promise<ManufacturerDocument> {
    const manufacturer = await this.manufacturerModel.findById(id);
    if (!manufacturer) throw new NotFoundException('Manufacturer not found');
    return this.manufacturerModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteManufacturer(id: string): Promise<{ success: boolean }> {
    const manufacturer = await this.manufacturerModel.findById(id);
    if (!manufacturer) throw new NotFoundException('Manufacturer not found');
    if (manufacturer.is_system) throw new BadRequestException('Cannot delete system manufacturer');
    await this.manufacturerModel.findByIdAndUpdate(id, { is_active: false });
    return { success: true };
  }

  // ============ IMAGE UPLOAD ============

  async uploadDrugImages(files: Express.Multer.File[]): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.originalname}. Allowed types: JPEG, PNG, WebP, GIF`,
        );
      }
    }

    const fileData = files.map((file) => ({
      buffer: file.buffer,
      filename: file.originalname.replace(/\s+/g, '-'),
    }));

    const urls = await this.fileUploadHelper.uploadMultipleToS3(fileData, 'pharmacy/drugs');
    return { urls };
  }

  async deleteDrugImage(imageUrl: string): Promise<{ success: boolean }> {
    await this.fileUploadHelper.deleteFromS3(imageUrl);
    return { success: true };
  }

  /**
   * Generate a placeholder image for a drug using placehold.co
   * Creates a color-coded image with drug name, strength, and manufacturer
   */
  async generatePlaceholderImage(
    drugId: string,
  ): Promise<{ url: string; drug: DrugDocument }> {
    const drug = await this.drugModel.findById(drugId).populate('manufacturer');
    if (!drug) {
      throw new NotFoundException('Drug not found');
    }

    // Color schemes based on common drug categories
    const drugColors: Record<string, { bg: string; text: string }> = {
      // Pain Relief - Red/Orange
      Panadol: { bg: 'e85d04', text: 'ffffff' },
      Ibuprofen: { bg: 'dc2626', text: 'ffffff' },
      'Tylenol #3': { bg: 'ea580c', text: 'ffffff' },
      Tramadol: { bg: 'c2410c', text: 'ffffff' },
      OxyContin: { bg: 'b91c1c', text: 'ffffff' },
      // Antibiotics - Green
      Amoxicillin: { bg: '16a34a', text: 'ffffff' },
      Azithromycin: { bg: '15803d', text: 'ffffff' },
      // Cold & Flu - Blue
      'Vicks VapoRub': { bg: '0284c7', text: 'ffffff' },
      Sudafed: { bg: '0369a1', text: 'ffffff' },
      Benadryl: { bg: '0c4a6e', text: 'ffffff' },
      // Digestive - Teal
      Gaviscon: { bg: '0d9488', text: 'ffffff' },
      Omeprazole: { bg: '0f766e', text: 'ffffff' },
      // Allergy - Purple
      Loratadine: { bg: '7c3aed', text: 'ffffff' },
      // Vitamins - Orange/Yellow
      'Vitamin C': { bg: 'f59e0b', text: '000000' },
      // Chronic - Blue/Purple
      Metformin: { bg: '3b82f6', text: 'ffffff' },
      Lisinopril: { bg: '4f46e5', text: 'ffffff' },
      Sertraline: { bg: '8b5cf6', text: 'ffffff' },
      // Respiratory - Light Blue
      Salbutamol: { bg: '06b6d4', text: 'ffffff' },
      // Controlled - Dark
      Codeine: { bg: '475569', text: 'ffffff' },
      Xanax: { bg: '1e293b', text: 'ffffff' },
    };

    // Find matching color or use default
    let colors = { bg: '6b7280', text: 'ffffff' }; // Default gray
    for (const [key, value] of Object.entries(drugColors)) {
      if (drug.name.toLowerCase().includes(key.toLowerCase())) {
        colors = value;
        break;
      }
    }

    // Build image text
    let imageText = drug.name;
    if (drug.strength) {
      imageText += `\\n${drug.strength}`;
    }
    const manufacturerName =
      drug.manufacturer &&
      typeof drug.manufacturer === 'object' &&
      'name' in drug.manufacturer
        ? (drug.manufacturer as any).name
        : null;
    if (manufacturerName) {
      imageText += `\\n${manufacturerName}`;
    }

    const encodedText = encodeURIComponent(imageText);
    const placeholderUrl = `https://placehold.co/600x600/${colors.bg}/${colors.text}/png?text=${encodedText}&font=roboto`;

    // Download the image
    const https = await import('https');
    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      const request = https.get(
        placeholderUrl,
        {
          headers: { 'User-Agent': 'RapidCapsules/1.0' },
          timeout: 30000,
        },
        (response) => {
          // Handle redirects
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            https
              .get(response.headers.location, (redirectRes) => {
                const chunks: Buffer[] = [];
                redirectRes.on('data', (chunk) => chunks.push(chunk));
                redirectRes.on('end', () => resolve(Buffer.concat(chunks)));
                redirectRes.on('error', reject);
              })
              .on('error', reject);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        },
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    // Upload to S3
    const filename = `${drug.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-placeholder.png`;
    const s3Url = await this.fileUploadHelper.uploadToS3(
      imageBuffer,
      filename,
      'pharmacy/drugs',
    );

    // Update drug with new image
    const newImage = {
      url: s3Url,
      is_primary: !drug.images || drug.images.length === 0,
      alt_text: `${drug.name} ${drug.strength || ''} placeholder image`.trim(),
    };

    const currentImages = drug.images || [];
    const updatedImages = [...currentImages, newImage];

    const updatedDrug = await this.drugModel.findByIdAndUpdate(
      drugId,
      { images: updatedImages },
      { new: true },
    );

    return { url: s3Url, drug: updatedDrug };
  }

  /**
   * Generate placeholder image from drug data (for new drugs before saving)
   * Returns the image URL without saving to database
   */
  async generatePlaceholderImageFromData(data: {
    name: string;
    strength?: string;
    manufacturer?: string;
  }): Promise<{ url: string }> {
    // Color schemes based on common drug categories
    const drugColors: Record<string, { bg: string; text: string }> = {
      Panadol: { bg: 'e85d04', text: 'ffffff' },
      Ibuprofen: { bg: 'dc2626', text: 'ffffff' },
      Amoxicillin: { bg: '16a34a', text: 'ffffff' },
      Sudafed: { bg: '0369a1', text: 'ffffff' },
      Gaviscon: { bg: '0d9488', text: 'ffffff' },
      Loratadine: { bg: '7c3aed', text: 'ffffff' },
      Metformin: { bg: '3b82f6', text: 'ffffff' },
    };

    // Find matching color or use default
    let colors = { bg: '6b7280', text: 'ffffff' };
    for (const [key, value] of Object.entries(drugColors)) {
      if (data.name.toLowerCase().includes(key.toLowerCase())) {
        colors = value;
        break;
      }
    }

    // Build image text
    let imageText = data.name;
    if (data.strength) {
      imageText += `\\n${data.strength}`;
    }
    if (data.manufacturer) {
      imageText += `\\n${data.manufacturer}`;
    }

    const encodedText = encodeURIComponent(imageText);
    const placeholderUrl = `https://placehold.co/600x600/${colors.bg}/${colors.text}/png?text=${encodedText}&font=roboto`;

    // Download the image
    const https = await import('https');
    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      const request = https.get(
        placeholderUrl,
        {
          headers: { 'User-Agent': 'RapidCapsules/1.0' },
          timeout: 30000,
        },
        (response) => {
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            https
              .get(response.headers.location, (redirectRes) => {
                const chunks: Buffer[] = [];
                redirectRes.on('data', (chunk) => chunks.push(chunk));
                redirectRes.on('end', () => resolve(Buffer.concat(chunks)));
                redirectRes.on('error', reject);
              })
              .on('error', reject);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        },
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    // Upload to S3
    const filename = `${data.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-placeholder.png`;
    const s3Url = await this.fileUploadHelper.uploadToS3(
      imageBuffer,
      filename,
      'pharmacy/drugs',
    );

    return { url: s3Url };
  }

  // ============ DRUGS ============

  async getDrugs(query: DrugQueryDto): Promise<{
    drugs: DrugDocument[];
    total: number;
    totalPages: number;
    stats: { totalProducts: number; lowStock: number; outOfStock: number };
  }> {
    const { page = 1, limit = 25, search, classification, category, manufacturer, supplier, stockStatus, includeInactive, includeSampleData } = query;

    const filter: any = {};

    // By default, exclude sample data unless explicitly included
    if (!includeSampleData) {
      filter.is_sample_data = { $ne: true };
    }

    if (!includeInactive) {
      filter.is_active = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { generic_name: { $regex: search, $options: 'i' } },
        { brand_name: { $regex: search, $options: 'i' } },
      ];
    }

    if (classification) {
      filter.classification = classification;
    }

    if (category) {
      filter.categories = category;
    }

    // Filter by manufacturer - check drug-level AND batch-level manufacturer
    if (manufacturer && Types.ObjectId.isValid(manufacturer)) {
      const manufacturerDoc = await this.manufacturerModel.findById(manufacturer).select('name short_name');
      const manufacturerName = manufacturerDoc?.name;
      const manufacturerShortName = manufacturerDoc?.short_name;

      if (manufacturerName) {
        // Use raw MongoDB query to find drugs with manufacturer stored as string (legacy data)
        // This bypasses Mongoose schema validation which would fail on string values
        const db = this.drugModel.db;
        const drugsCollection = db.collection('drugentities');
        const batchesCollection = db.collection('stockbatchentities');

        // Build search patterns for legacy string data
        const nameWords = manufacturerName.split(/\s+/).filter((w) => w.length > 2);
        const stringPatterns = [
          manufacturerName,
          ...nameWords,
          ...(manufacturerShortName ? [manufacturerShortName] : []),
        ];

        // 1. Find drug IDs where drug's manufacturer matches (ObjectId or string)
        const matchingDrugIds = await drugsCollection
          .find({
            $or: [
              { manufacturer: new Types.ObjectId(manufacturer) },
              // Match string values (legacy data) - case insensitive
              ...stringPatterns.map((pattern) => ({
                manufacturer: { $regex: new RegExp(pattern, 'i') },
              })),
            ],
          })
          .project({ _id: 1 })
          .toArray();

        // 2. Also find drug IDs where batches have this manufacturer (batch-level manufacturer)
        const drugsWithMatchingBatches = await batchesCollection
          .find({
            $or: [
              { manufacturer: new Types.ObjectId(manufacturer) },
              // Match string values - case insensitive
              ...stringPatterns.map((pattern) => ({
                manufacturer: { $regex: new RegExp(pattern, 'i') },
              })),
            ],
          })
          .project({ drug_id: 1 })
          .toArray();

        // Combine both sets of drug IDs (union)
        const drugIdsFromDrugs = matchingDrugIds.map((d) => d._id.toString());
        const drugIdsFromBatches = drugsWithMatchingBatches.map((b) => b.drug_id.toString());
        const allDrugIds = [...new Set([...drugIdsFromDrugs, ...drugIdsFromBatches])];
        const drugIds = allDrugIds.map((id) => new Types.ObjectId(id));

        if (drugIds.length > 0) {
          // Merge with existing _id filter if supplier filter is also applied
          if (filter._id && filter._id.$in) {
            // Intersection of both filters
            const existingIds = filter._id.$in.map((id) => id.toString());
            filter._id = {
              $in: drugIds.filter((id) => existingIds.includes(id.toString())),
            };
          } else {
            filter._id = { $in: drugIds };
          }
        } else {
          // No matching drugs - return empty
          filter._id = { $in: [] };
        }
      } else {
        filter.manufacturer = new Types.ObjectId(manufacturer);
      }
    }

    // Filter by supplier - find drugs that have batches from this supplier
    if (supplier && Types.ObjectId.isValid(supplier)) {
      const batchesFromSupplier = await this.stockBatchModel
        .find({ supplier_id: new Types.ObjectId(supplier) })
        .distinct('drug_id');

      if (batchesFromSupplier.length > 0) {
        filter._id = { $in: batchesFromSupplier };
      } else {
        // No batches from this supplier - return empty
        filter._id = { $in: [] };
      }
    }

    if (stockStatus) {
      if (stockStatus === 'out') {
        filter.quantity = { $lte: 0 };
      } else if (stockStatus === 'low') {
        filter.$expr = { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$reorder_level'] }] };
      } else if (stockStatus === 'available') {
        filter.$expr = { $gt: ['$quantity', '$reorder_level'] };
      }
    }

    const [drugs, total] = await Promise.all([
      this.drugModel
        .find(filter)
        .populate('classification', 'name code short_code color description requires_prescription requires_pharmacist_approval')
        .populate('categories', 'name code icon')
        .populate('dosage_form', 'name code')
        .populate('route', 'name code abbreviation')
        .populate('manufacturer', 'name code short_name country')
        .populate('pharmacy_id', 'name slug is_platform_default address')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.drugModel.countDocuments(filter),
    ]);

    // Get stats - respect includeSampleData flag
    const statsFilter: any = { is_active: true };
    if (!includeSampleData) {
      statsFilter.is_sample_data = { $ne: true };
    }

    const [totalProducts, lowStock, outOfStock] = await Promise.all([
      this.drugModel.countDocuments(statsFilter),
      this.drugModel.countDocuments({
        ...statsFilter,
        $expr: { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$reorder_level'] }] },
      }),
      this.drugModel.countDocuments({ ...statsFilter, quantity: { $lte: 0 } }),
    ]);

    // Add presigned URLs for images
    const drugsWithPresignedUrls = await this.addPresignedUrlsToDrugs(drugs);

    return {
      drugs: drugsWithPresignedUrls,
      total,
      totalPages: Math.ceil(total / limit),
      stats: { totalProducts, lowStock, outOfStock },
    };
  }

  async getDrugById(id: string): Promise<any> {
    const drug = await this.drugModel
      .findById(id)
      .populate('classification')
      .populate('categories')
      .populate('dosage_form')
      .populate('route')
      .populate('manufacturer')
      .populate('pharmacy_id', 'name slug is_platform_default address');
    if (!drug) throw new NotFoundException('Drug not found');

    // Add presigned URLs for images
    return this.addPresignedUrlsToDrug(drug);
  }

  async createDrug(dto: CreateDrugDto, userId: string): Promise<DrugDocument> {
    return this.drugModel.create({
      ...dto,
      created_by: userId,
      is_sample_data: false,
    });
  }

  async updateDrug(id: string, dto: UpdateDrugDto, userId: string): Promise<DrugDocument> {
    const drug = await this.drugModel.findById(id);
    if (!drug) throw new NotFoundException('Drug not found');
    return this.drugModel.findByIdAndUpdate(id, { ...dto, updated_by: userId }, { new: true });
  }

  async updateDrugStock(id: string, dto: UpdateDrugStockDto): Promise<DrugDocument> {
    const drug = await this.drugModel.findById(id);
    if (!drug) throw new NotFoundException('Drug not found');

    let newQuantity = drug.quantity;
    if (dto.adjustment_type === 'add') {
      newQuantity = drug.quantity + dto.quantity;
    } else if (dto.adjustment_type === 'subtract') {
      newQuantity = Math.max(0, drug.quantity - dto.quantity);
    } else {
      newQuantity = dto.quantity;
    }

    // Update is_available based on quantity
    const is_available = newQuantity > 0;

    return this.drugModel.findByIdAndUpdate(
      id,
      { quantity: newQuantity, is_available },
      { new: true }
    );
  }

  async deleteDrug(id: string): Promise<{ success: boolean }> {
    const drug = await this.drugModel.findById(id);
    if (!drug) throw new NotFoundException('Drug not found');
    await this.drugModel.findByIdAndUpdate(id, { is_active: false });
    return { success: true };
  }

  async addDrugImages(id: string, images: { url: string; is_primary?: boolean; alt_text?: string }[]): Promise<DrugDocument> {
    const drug = await this.drugModel.findById(id);
    if (!drug) throw new NotFoundException('Drug not found');

    const currentImages = drug.images || [];
    const newImages = [...currentImages, ...images];

    // Ensure only one primary image
    if (images.some((img) => img.is_primary)) {
      newImages.forEach((img, idx) => {
        if (!images.includes(img)) {
          img.is_primary = false;
        }
      });
    }

    return this.drugModel.findByIdAndUpdate(id, { images: newImages }, { new: true });
  }

  async removeDrugImage(id: string, imageUrl: string): Promise<DrugDocument> {
    const drug = await this.drugModel.findById(id);
    if (!drug) throw new NotFoundException('Drug not found');

    const updatedImages = (drug.images || []).filter((img) => img.url !== imageUrl);
    await this.fileUploadHelper.deleteFromS3(imageUrl);

    return this.drugModel.findByIdAndUpdate(id, { images: updatedImages }, { new: true });
  }

  async setPrimaryImage(id: string, imageUrl: string): Promise<DrugDocument> {
    const drug = await this.drugModel.findById(id);
    if (!drug) throw new NotFoundException('Drug not found');

    const updatedImages = (drug.images || []).map((img) => ({
      ...img,
      is_primary: img.url === imageUrl,
    }));

    return this.drugModel.findByIdAndUpdate(id, { images: updatedImages }, { new: true });
  }

  // ============ SAMPLE DATA SEEDING ============

  async seedSampleDrugs(): Promise<{ seeded: number; skipped: number; updated: number }> {
    let seeded = 0;
    let skipped = 0;
    let updated = 0;

    for (const sampleDrug of ALL_SAMPLE_DRUGS) {
      // Check if drug already exists
      const exists = await this.drugModel.findOne({
        name: sampleDrug.name,
        strength: sampleDrug.strength,
        is_sample_data: true,
      });

      if (exists) {
        // If drug exists but has 0 quantity, restore it
        if (exists.quantity === 0 || !exists.is_available) {
          const newQty = Math.floor(Math.random() * 100) + 10;
          await this.drugModel.findByIdAndUpdate(exists._id, {
            quantity: newQty,
            is_available: true,
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      // Find related entities by code
      const classification = await this.drugClassificationModel.findOne({ code: sampleDrug.classification_code });
      const categories = await this.drugCategoryModel.find({ code: { $in: sampleDrug.category_codes } });
      const dosageForm = await this.dosageFormModel.findOne({ code: sampleDrug.dosage_form_code });
      const route = await this.drugRouteModel.findOne({ code: sampleDrug.route_code });
      const manufacturer = sampleDrug.manufacturer_code
        ? await this.manufacturerModel.findOne({ code: sampleDrug.manufacturer_code })
        : null;

      if (!classification) {
        console.warn(`Classification not found for ${sampleDrug.name}: ${sampleDrug.classification_code}`);
        skipped++;
        continue;
      }

      await this.drugModel.create({
        name: sampleDrug.name,
        generic_name: sampleDrug.generic_name,
        brand_name: sampleDrug.brand_name,
        manufacturer: manufacturer?._id,
        description: sampleDrug.description,
        classification: classification._id,
        categories: categories.map((c) => c._id),
        dosage_form: dosageForm?._id,
        route: route?._id,
        strength: sampleDrug.strength,
        pack_size: sampleDrug.pack_size,
        unit_of_measure: sampleDrug.unit_of_measure,
        cost_price: sampleDrug.cost_price,
        selling_price: sampleDrug.selling_price,
        quantity: Math.floor(Math.random() * 100) + 10, // Random stock 10-110
        reorder_level: 10,
        requires_prescription: sampleDrug.requires_prescription,
        requires_pharmacist_approval: sampleDrug.requires_pharmacist_approval,
        requires_health_screening: sampleDrug.requires_health_screening,
        requires_id_verification: sampleDrug.requires_id_verification,
        requires_purchase_tracking: sampleDrug.requires_purchase_tracking,
        min_age: sampleDrug.min_age,
        max_quantity_per_order: sampleDrug.max_quantity_per_order,
        max_quantity_per_period: sampleDrug.max_quantity_per_period,
        period_days: sampleDrug.period_days,
        purchase_gap_hours: sampleDrug.purchase_gap_hours,
        restriction_reason: sampleDrug.restriction_reason,
        special_controls: sampleDrug.special_controls,
        pharmacist_counseling_points: sampleDrug.pharmacist_counseling_points,
        dosage_guidance: sampleDrug.dosage_guidance,
        is_sample_data: true,
        is_active: true,
        is_available: true,
      });

      seeded++;
    }

    return { seeded, skipped, updated };
  }

  async clearSampleDrugs(): Promise<{ deleted: number }> {
    const result = await this.drugModel.deleteMany({ is_sample_data: true });
    return { deleted: result.deletedCount };
  }

  // ============ SUPPLIERS ============

  async getSuppliers(query: SupplierQueryDto = {}): Promise<{
    suppliers: SupplierDocument[];
    total: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 25, search, status, category, includeInactive, licenseExpiringSoon } = query;

    const filter: any = {};

    if (!includeInactive) {
      filter.is_active = true;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplier_code: { $regex: search, $options: 'i' } },
        { short_name: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.product_categories = category;
    }

    if (licenseExpiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filter['license.expiry_date'] = { $lte: thirtyDaysFromNow };
    }

    const [suppliers, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .populate('product_categories', 'name code')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.supplierModel.countDocuments(filter),
    ]);

    return {
      suppliers,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSupplierById(id: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id).populate('product_categories', 'name code');
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async createSupplier(dto: CreateSupplierDto, userId: string): Promise<SupplierDocument> {
    // Generate supplier code
    const supplierCode = await this.generateSupplierCode();

    return this.supplierModel.create({
      ...dto,
      supplier_code: supplierCode,
      created_by: userId,
    });
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto, userId: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id);
    if (!supplier) throw new NotFoundException('Supplier not found');
    return this.supplierModel.findByIdAndUpdate(id, { ...dto, updated_by: userId }, { new: true });
  }

  async changeSupplierStatus(id: string, dto: ChangeSupplierStatusDto, userId: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id);
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.supplierModel.findByIdAndUpdate(
      id,
      {
        status: dto.status,
        status_reason: dto.reason,
        is_active: dto.status === SupplierStatus.ACTIVE,
        updated_by: userId,
      },
      { new: true },
    );
  }

  async verifySupplierLicense(id: string, isVerified: boolean, userId: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id);
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.supplierModel.findByIdAndUpdate(
      id,
      {
        'license.is_verified': isVerified,
        'license.verified_at': isVerified ? new Date() : null,
        'license.verified_by': isVerified ? userId : null,
        updated_by: userId,
      },
      { new: true },
    );
  }

  async deleteSupplier(id: string): Promise<{ success: boolean }> {
    const supplier = await this.supplierModel.findById(id);
    if (!supplier) throw new NotFoundException('Supplier not found');

    // Check if supplier has any batches
    const batchCount = await this.stockBatchModel.countDocuments({ supplier_id: id });
    if (batchCount > 0) {
      throw new BadRequestException('Cannot delete supplier with existing stock batches. Deactivate instead.');
    }

    await this.supplierModel.findByIdAndUpdate(id, { is_active: false, status: SupplierStatus.INACTIVE });
    return { success: true };
  }

  // ============ STOCK BATCHES ============

  async receiveStock(dto: ReceiveStockDto, userId: string): Promise<StockBatchDocument> {
    // Verify drug exists
    const drug = await this.drugModel.findById(dto.drug_id);
    if (!drug) throw new NotFoundException('Drug not found');

    // Verify supplier exists and is active
    const supplier = await this.supplierModel.findById(dto.supplier_id);
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier.status !== SupplierStatus.ACTIVE) {
      throw new BadRequestException('Supplier is not active');
    }

    // Validate expiry
    if (!dto.no_expiry && !dto.expiry_date) {
      throw new BadRequestException('Expiry date is required unless item does not expire');
    }

    // Generate internal batch ID
    const internalBatchId = await this.generateBatchId();

    // Create stock batch
    const batch = await this.stockBatchModel.create({
      drug_id: dto.drug_id,
      batch_number: dto.batch_number,
      internal_batch_id: internalBatchId,
      supplier_id: dto.supplier_id,
      pharmacy_id: dto.pharmacy_id,
      expiry_date: dto.expiry_date,
      no_expiry: dto.no_expiry || false,
      manufacture_date: dto.manufacture_date,
      received_date: dto.received_date || new Date(),
      quantity_received: dto.quantity,
      quantity_available: dto.quantity,
      cost_price: dto.cost_price,
      total_cost: dto.quantity * dto.cost_price,
      selling_price_override: dto.selling_price_override,
      manufacturer: dto.manufacturer,
      purchase_order_number: dto.purchase_order_number,
      invoice_number: dto.invoice_number,
      delivery_note_number: dto.delivery_note_number,
      storage: dto.storage,
      notes: dto.notes,
      received_by: userId,
      status: BatchStatus.ACTIVE,
    });

    // Create transaction record
    await this.createStockTransaction({
      drug_id: dto.drug_id,
      batch_id: batch._id.toString(),
      type: TransactionType.RECEIVED,
      quantity: dto.quantity,
      quantity_before: 0,
      quantity_after: dto.quantity,
      unit_cost: dto.cost_price,
      total_value: dto.quantity * dto.cost_price,
      reference: {
        type: ReferenceType.PURCHASE_ORDER,
        number: dto.purchase_order_number || dto.invoice_number,
      },
      supplier_id: dto.supplier_id,
      performed_by: userId,
    });

    // Update drug total quantity
    await this.syncDrugQuantity(dto.drug_id);

    // Update supplier stats
    await this.supplierModel.findByIdAndUpdate(dto.supplier_id, {
      $inc: { total_orders: 1 },
      last_order_date: new Date(),
    });

    return batch.populate(['drug_id', 'supplier_id']);
  }

  async getBatches(query: BatchQueryDto = {}): Promise<{
    batches: StockBatchDocument[];
    total: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 25, drug_id, supplier_id, status, batch_number, hasStock, expiringWithinDays, expired, sortBy = 'received_date', sortOrder = 'desc' } = query;

    const filter: any = {};

    if (drug_id) filter.drug_id = drug_id;
    if (supplier_id) filter.supplier_id = supplier_id;
    if (status) filter.status = status;
    if (batch_number) filter.batch_number = { $regex: batch_number, $options: 'i' };

    if (hasStock) {
      filter.quantity_available = { $gt: 0 };
    }

    if (expired) {
      filter.no_expiry = { $ne: true };
      filter.expiry_date = { $lt: new Date() };
    } else if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      filter.no_expiry = { $ne: true };
      filter.expiry_date = { $lte: futureDate, $gte: new Date() };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [batches, total] = await Promise.all([
      this.stockBatchModel
        .find(filter)
        .populate('drug_id', 'name generic_name strength')
        .populate('supplier_id', 'name supplier_code')
        .populate('pharmacy_id', 'name slug is_platform_default')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      this.stockBatchModel.countDocuments(filter),
    ]);

    return {
      batches,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBatchById(id: string): Promise<StockBatchDocument> {
    const batch = await this.stockBatchModel
      .findById(id)
      .populate('drug_id')
      .populate('supplier_id')
      .populate('pharmacy_id', 'name slug is_platform_default')
      .populate('received_by', 'first_name last_name email');
    if (!batch) throw new NotFoundException('Stock batch not found');
    return batch;
  }

  async updateBatch(id: string, dto: UpdateBatchDto, userId: string): Promise<StockBatchDocument> {
    const batch = await this.stockBatchModel.findById(id);
    if (!batch) throw new NotFoundException('Stock batch not found');

    // Update allowed fields
    if (dto.batch_number !== undefined) batch.batch_number = dto.batch_number;
    if (dto.supplier_id !== undefined) batch.supplier_id = new Types.ObjectId(dto.supplier_id);
    if (dto.pharmacy_id !== undefined) batch.pharmacy_id = new Types.ObjectId(dto.pharmacy_id);
    if (dto.expiry_date !== undefined) batch.expiry_date = dto.expiry_date;
    if (dto.no_expiry !== undefined) batch.no_expiry = dto.no_expiry;
    if (dto.manufacture_date !== undefined) batch.manufacture_date = dto.manufacture_date;
    if (dto.cost_price !== undefined) batch.cost_price = dto.cost_price;
    if (dto.selling_price_override !== undefined) batch.selling_price_override = dto.selling_price_override;
    if (dto.purchase_order_number !== undefined) batch.purchase_order_number = dto.purchase_order_number;
    if (dto.invoice_number !== undefined) batch.invoice_number = dto.invoice_number;
    if (dto.notes !== undefined) batch.notes = dto.notes;
    if (dto.storage !== undefined) batch.storage = dto.storage;
    if (dto.manufacturer !== undefined) batch.manufacturer = dto.manufacturer;

    await batch.save();

    return this.stockBatchModel
      .findById(id)
      .populate('drug_id')
      .populate('supplier_id')
      .populate('pharmacy_id', 'name slug is_platform_default')
      .populate('received_by', 'first_name last_name email');
  }

  async deleteBatch(id: string, userId: string): Promise<{ message: string }> {
    const batch = await this.stockBatchModel.findById(id);
    if (!batch) throw new NotFoundException('Stock batch not found');

    // Check if batch has any transactions
    const transactionCount = await this.stockTransactionModel.countDocuments({ batch_id: batch._id });
    if (transactionCount > 1) {
      // More than just the initial RECEIVED transaction
      throw new BadRequestException(
        'Cannot delete batch with transaction history. Consider writing off or adjusting stock instead.',
      );
    }

    // If batch has stock, we need to handle it
    if (batch.quantity_available > 0) {
      throw new BadRequestException(
        'Cannot delete batch with available stock. Write off or return stock first.',
      );
    }

    // Get the drug to update its quantity if needed
    const drug = await this.drugModel.findById(batch.drug_id);

    // Delete related transactions
    await this.stockTransactionModel.deleteMany({ batch_id: batch._id });

    // Delete the batch
    await this.stockBatchModel.findByIdAndDelete(id);

    return { message: 'Batch deleted successfully' };
  }

  async getDrugBatches(drugId: string, query: BatchQueryDto = {}): Promise<{
    batches: StockBatchDocument[];
    total: number;
    stockInfo: {
      total_available: number;
      total_reserved: number;
      active_batches: number;
      earliest_expiry: Date | null;
      average_cost: number;
    };
  }> {
    const { page = 1, limit = 25, status, hasStock } = query;

    const filter: any = { drug_id: drugId };
    if (status) filter.status = status;
    if (hasStock) filter.quantity_available = { $gt: 0 };

    const [batches, total, stockInfo] = await Promise.all([
      this.stockBatchModel
        .find(filter)
        .populate('supplier_id', 'name supplier_code')
        .populate('drug_id', 'name drug_code manufacturer')
        .sort({ expiry_date: 1, no_expiry: -1 }) // FEFO order
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.stockBatchModel.countDocuments(filter),
      this.getDrugStockInfo(drugId),
    ]);

    // Manually populate manufacturer field (stored as string ObjectId, not ref)
    const manufacturerIds = batches
      .map((b) => b.manufacturer)
      .filter((m) => m && Types.ObjectId.isValid(m));

    if (manufacturerIds.length > 0) {
      const manufacturers = await this.manufacturerModel
        .find({ _id: { $in: manufacturerIds } })
        .select('name code short_name')
        .lean();

      const mfgMap = new Map(manufacturers.map((m) => [m._id.toString(), m]));

      batches.forEach((batch: any) => {
        if (batch.manufacturer && mfgMap.has(batch.manufacturer)) {
          batch.manufacturer = mfgMap.get(batch.manufacturer);
        }
      });
    }

    return { batches, total, stockInfo };
  }

  async getDrugStockInfo(drugId: string): Promise<{
    total_available: number;
    total_reserved: number;
    active_batches: number;
    earliest_expiry: Date | null;
    average_cost: number;
  }> {
    const activeBatches = await this.stockBatchModel.find({
      drug_id: drugId,
      status: BatchStatus.ACTIVE,
      quantity_available: { $gt: 0 },
    });

    const totalAvailable = activeBatches.reduce((sum, b) => sum + b.quantity_available, 0);
    const totalReserved = activeBatches.reduce((sum, b) => sum + b.quantity_reserved, 0);
    const totalCost = activeBatches.reduce((sum, b) => sum + (b.quantity_available * b.cost_price), 0);

    // Find earliest expiry (excluding no_expiry items)
    const expiringBatches = activeBatches.filter((b) => !b.no_expiry && b.expiry_date);
    const earliestExpiry = expiringBatches.length > 0
      ? expiringBatches.reduce((earliest, b) => (b.expiry_date < earliest ? b.expiry_date : earliest), expiringBatches[0].expiry_date)
      : null;

    return {
      total_available: totalAvailable,
      total_reserved: totalReserved,
      active_batches: activeBatches.length,
      earliest_expiry: earliestExpiry,
      average_cost: totalAvailable > 0 ? totalCost / totalAvailable : 0,
    };
  }

  async selectBatchesForDispensing(drugId: string, quantity: number): Promise<{
    batches: { batch: StockBatchDocument; quantity: number }[];
    total_available: number;
    can_fulfill: boolean;
  }> {
    // FEFO: First Expiry, First Out (no_expiry items come last)
    const activeBatches = await this.stockBatchModel
      .find({
        drug_id: drugId,
        status: BatchStatus.ACTIVE,
        quantity_available: { $gt: 0 },
      })
      .sort({ no_expiry: 1, expiry_date: 1 }); // Expiring first, no_expiry last

    const totalAvailable = activeBatches.reduce((sum, b) => sum + b.quantity_available, 0);
    const canFulfill = totalAvailable >= quantity;

    const selectedBatches: { batch: StockBatchDocument; quantity: number }[] = [];
    let remainingQuantity = quantity;

    for (const batch of activeBatches) {
      if (remainingQuantity <= 0) break;

      const takeQuantity = Math.min(batch.quantity_available, remainingQuantity);
      selectedBatches.push({ batch, quantity: takeQuantity });
      remainingQuantity -= takeQuantity;
    }

    return {
      batches: selectedBatches,
      total_available: totalAvailable,
      can_fulfill: canFulfill,
    };
  }

  async dispenseStock(dto: DispenseStockDto, userId: string): Promise<{
    dispensed: { batch_id: string; quantity: number; batch_number: string }[];
    total_dispensed: number;
  }> {
    // Verify drug exists
    const drug = await this.drugModel.findById(dto.drug_id);
    if (!drug) throw new NotFoundException('Drug not found');

    const dispensed: { batch_id: string; quantity: number; batch_number: string }[] = [];
    let totalDispensed = 0;

    if (dto.batch_id) {
      // Dispense from specific batch
      const batch = await this.stockBatchModel.findById(dto.batch_id);
      if (!batch) throw new NotFoundException('Stock batch not found');
      if (batch.status !== BatchStatus.ACTIVE) {
        throw new BadRequestException('Batch is not active');
      }
      if (batch.quantity_available < dto.quantity) {
        throw new BadRequestException(`Insufficient stock in batch. Available: ${batch.quantity_available}`);
      }

      await this.dispenseSingleBatch(batch, dto.quantity, dto, userId);
      dispensed.push({ batch_id: batch._id.toString(), quantity: dto.quantity, batch_number: batch.batch_number });
      totalDispensed = dto.quantity;
    } else {
      // FEFO dispensing
      const fefoResult = await this.selectBatchesForDispensing(dto.drug_id, dto.quantity);
      if (!fefoResult.can_fulfill) {
        throw new BadRequestException(
          `Insufficient stock. Requested: ${dto.quantity}, Available: ${fefoResult.total_available}`,
        );
      }

      for (const { batch, quantity } of fefoResult.batches) {
        await this.dispenseSingleBatch(batch, quantity, dto, userId);
        dispensed.push({ batch_id: batch._id.toString(), quantity, batch_number: batch.batch_number });
        totalDispensed += quantity;
      }
    }

    // Sync drug total quantity
    await this.syncDrugQuantity(dto.drug_id);

    return { dispensed, total_dispensed: totalDispensed };
  }

  private async dispenseSingleBatch(
    batch: StockBatchDocument,
    quantity: number,
    dto: DispenseStockDto,
    userId: string,
  ): Promise<void> {
    const quantityBefore = batch.quantity_available;
    const quantityAfter = quantityBefore - quantity;
    const sellingPrice = dto.selling_price || batch.selling_price_override;

    // Update batch
    await this.stockBatchModel.findByIdAndUpdate(batch._id, {
      $inc: { quantity_available: -quantity, quantity_sold: quantity },
      status: quantityAfter <= 0 ? BatchStatus.DEPLETED : BatchStatus.ACTIVE,
    });

    // Create transaction
    await this.createStockTransaction({
      drug_id: batch.drug_id.toString(),
      batch_id: batch._id.toString(),
      type: TransactionType.SOLD,
      quantity: -quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      unit_cost: batch.cost_price,
      unit_price: sellingPrice,
      total_value: quantity * (sellingPrice || batch.cost_price),
      reference: {
        type: dto.prescription_id ? ReferenceType.PRESCRIPTION : ReferenceType.SALES_ORDER,
        number: dto.order_number || dto.prescription_id,
      },
      customer_id: dto.customer_id,
      notes: dto.notes,
      performed_by: userId,
    });
  }

  async adjustBatchStock(batchId: string, dto: AdjustBatchStockDto, userId: string): Promise<StockBatchDocument> {
    const batch = await this.stockBatchModel.findById(batchId);
    if (!batch) throw new NotFoundException('Stock batch not found');

    const quantityBefore = batch.quantity_available;
    let quantityAfter: number;
    let transactionType: TransactionType;

    if (dto.adjustment_type === 'add') {
      quantityAfter = quantityBefore + dto.quantity;
      transactionType = TransactionType.ADJUSTMENT_ADD;
    } else {
      if (dto.quantity > batch.quantity_available) {
        throw new BadRequestException(`Cannot subtract ${dto.quantity} from available ${batch.quantity_available}`);
      }
      quantityAfter = quantityBefore - dto.quantity;
      transactionType = TransactionType.ADJUSTMENT_SUBTRACT;
    }

    // Update batch
    const updatedBatch = await this.stockBatchModel.findByIdAndUpdate(
      batchId,
      {
        quantity_available: quantityAfter,
        quantity_received: dto.adjustment_type === 'add' ? batch.quantity_received + dto.quantity : batch.quantity_received,
        status: quantityAfter <= 0 ? BatchStatus.DEPLETED : batch.status,
        updated_by: userId,
      },
      { new: true },
    );

    // Create transaction
    await this.createStockTransaction({
      drug_id: batch.drug_id.toString(),
      batch_id: batchId,
      type: transactionType,
      quantity: dto.adjustment_type === 'add' ? dto.quantity : -dto.quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      unit_cost: batch.cost_price,
      total_value: dto.quantity * batch.cost_price,
      reference: {
        type: ReferenceType.ADJUSTMENT,
        number: dto.reference_number,
      },
      reason: dto.reason,
      notes: dto.notes,
      performed_by: userId,
    });

    // Sync drug quantity
    await this.syncDrugQuantity(batch.drug_id.toString());

    return updatedBatch;
  }

  async changeBatchStatus(batchId: string, dto: ChangeBatchStatusDto, userId: string): Promise<StockBatchDocument> {
    const batch = await this.stockBatchModel.findById(batchId);
    if (!batch) throw new NotFoundException('Stock batch not found');

    return this.stockBatchModel.findByIdAndUpdate(
      batchId,
      {
        status: dto.status,
        status_reason: dto.reason,
        status_changed_at: new Date(),
        status_changed_by: userId,
        updated_by: userId,
      },
      { new: true },
    );
  }

  async returnToSupplier(batchId: string, dto: ReturnToSupplierDto, userId: string): Promise<StockBatchDocument> {
    const batch = await this.stockBatchModel.findById(batchId);
    if (!batch) throw new NotFoundException('Stock batch not found');

    if (dto.quantity > batch.quantity_available) {
      throw new BadRequestException(`Cannot return ${dto.quantity}. Only ${batch.quantity_available} available.`);
    }

    const quantityBefore = batch.quantity_available;
    const quantityAfter = quantityBefore - dto.quantity;

    // Update batch
    const updatedBatch = await this.stockBatchModel.findByIdAndUpdate(
      batchId,
      {
        quantity_available: quantityAfter,
        $inc: { quantity_returned: dto.quantity },
        status: quantityAfter <= 0 ? BatchStatus.DEPLETED : batch.status,
        updated_by: userId,
      },
      { new: true },
    );

    // Create transaction
    await this.createStockTransaction({
      drug_id: batch.drug_id.toString(),
      batch_id: batchId,
      type: TransactionType.RETURN_TO_SUPPLIER,
      quantity: -dto.quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      unit_cost: batch.cost_price,
      total_value: dto.quantity * batch.cost_price,
      reference: {
        type: ReferenceType.RETURN_ORDER,
        number: dto.return_authorization_number,
      },
      supplier_id: batch.supplier_id.toString(),
      reason: dto.reason,
      return_info: {
        return_authorization_number: dto.return_authorization_number,
        return_reason: dto.reason,
        credit_note_number: dto.credit_note_number,
        refund_amount: dto.refund_amount,
      },
      notes: dto.notes,
      performed_by: userId,
    });

    // Sync drug quantity
    await this.syncDrugQuantity(batch.drug_id.toString());

    return updatedBatch;
  }

  async writeOffBatch(batchId: string, dto: WriteOffBatchDto, userId: string): Promise<StockBatchDocument> {
    const batch = await this.stockBatchModel.findById(batchId);
    if (!batch) throw new NotFoundException('Stock batch not found');

    const quantityToWriteOff = dto.quantity || batch.quantity_available;
    if (quantityToWriteOff > batch.quantity_available) {
      throw new BadRequestException(`Cannot write off ${quantityToWriteOff}. Only ${batch.quantity_available} available.`);
    }

    const quantityBefore = batch.quantity_available;
    const quantityAfter = quantityBefore - quantityToWriteOff;
    const transactionType = dto.writeoff_type === 'expired' ? TransactionType.EXPIRED : TransactionType.DAMAGED;
    const newStatus = dto.writeoff_type === 'expired' ? BatchStatus.EXPIRED : batch.status;

    // Update batch
    const updatedBatch = await this.stockBatchModel.findByIdAndUpdate(
      batchId,
      {
        quantity_available: quantityAfter,
        $inc: { quantity_damaged: dto.writeoff_type === 'damaged' ? quantityToWriteOff : 0 },
        status: quantityAfter <= 0 ? newStatus : batch.status,
        status_reason: dto.reason,
        status_changed_at: new Date(),
        status_changed_by: userId,
        updated_by: userId,
      },
      { new: true },
    );

    // Create transaction
    await this.createStockTransaction({
      drug_id: batch.drug_id.toString(),
      batch_id: batchId,
      type: transactionType,
      quantity: -quantityToWriteOff,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      unit_cost: batch.cost_price,
      total_value: quantityToWriteOff * batch.cost_price,
      reference: {
        type: dto.writeoff_type === 'expired' ? ReferenceType.EXPIRY_WRITEOFF : ReferenceType.DAMAGE_WRITEOFF,
      },
      reason: dto.reason,
      notes: dto.notes,
      performed_by: userId,
    });

    // Sync drug quantity
    await this.syncDrugQuantity(batch.drug_id.toString());

    return updatedBatch;
  }

  async recallBatch(batchId: string, dto: RecallBatchDto, userId: string): Promise<StockBatchDocument> {
    const batch = await this.stockBatchModel.findById(batchId);
    if (!batch) throw new NotFoundException('Stock batch not found');

    const quantityBefore = batch.quantity_available;

    // Determine quantity to recall (default to all if not specified)
    const quantityToRecall = dto.quantity ?? quantityBefore;

    // Validate quantity
    if (quantityToRecall <= 0) {
      throw new BadRequestException('Recall quantity must be greater than 0');
    }
    if (quantityToRecall > quantityBefore) {
      throw new BadRequestException(`Cannot recall ${quantityToRecall} units. Only ${quantityBefore} available.`);
    }

    const quantityAfter = quantityBefore - quantityToRecall;
    const isFullRecall = quantityAfter === 0;

    // Update batch
    const updateData: any = {
      quantity_available: quantityAfter,
      updated_by: userId,
    };

    // Only set status to RECALLED if recalling all remaining quantity
    if (isFullRecall) {
      updateData.status = BatchStatus.RECALLED;
      updateData.status_reason = dto.recall_reason;
      updateData.status_changed_at = new Date();
      updateData.status_changed_by = userId;
      updateData.recall_info = {
        recall_number: dto.recall_number,
        recall_date: new Date(),
        recall_reason: dto.recall_reason,
        recall_class: dto.recall_class,
        recalled_by: userId,
      };
    }

    const updatedBatch = await this.stockBatchModel.findByIdAndUpdate(
      batchId,
      updateData,
      { new: true },
    );

    // Create transaction for the recalled quantity
    if (quantityToRecall > 0) {
      await this.createStockTransaction({
        drug_id: batch.drug_id.toString(),
        batch_id: batchId,
        type: TransactionType.RECALLED,
        quantity: -quantityToRecall,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        unit_cost: batch.cost_price,
        total_value: quantityToRecall * batch.cost_price,
        reference: {
          type: ReferenceType.RECALL,
          number: dto.recall_number,
        },
        reason: dto.recall_reason,
        notes: dto.notes || (isFullRecall ? 'Full batch recall' : `Partial recall: ${quantityToRecall} of ${quantityBefore} units`),
        performed_by: userId,
      });

      // Sync drug quantity
      await this.syncDrugQuantity(batch.drug_id.toString());
    }

    return updatedBatch;
  }

  // ============ EXPIRY ALERTS ============

  async getExpiringBatches(daysThreshold = 90): Promise<StockBatchDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    return this.stockBatchModel
      .find({
        status: BatchStatus.ACTIVE,
        quantity_available: { $gt: 0 },
        no_expiry: { $ne: true },
        expiry_date: { $lte: futureDate, $gte: new Date() },
      })
      .populate('drug_id', 'name generic_name strength')
      .populate('supplier_id', 'name supplier_code')
      .sort({ expiry_date: 1 });
  }

  async getExpiredBatches(): Promise<StockBatchDocument[]> {
    return this.stockBatchModel
      .find({
        status: { $in: [BatchStatus.ACTIVE, BatchStatus.EXPIRED] },
        quantity_available: { $gt: 0 },
        no_expiry: { $ne: true },
        expiry_date: { $lt: new Date() },
      })
      .populate('drug_id', 'name generic_name strength')
      .populate('supplier_id', 'name supplier_code')
      .sort({ expiry_date: 1 });
  }

  async getInventoryAlerts(): Promise<{
    expired: { count: number; batches: StockBatchDocument[] };
    expiring_critical: { count: number; batches: StockBatchDocument[] }; // <= 30 days
    expiring_warning: { count: number; batches: StockBatchDocument[] }; // 31-60 days
    expiring_info: { count: number; batches: StockBatchDocument[] }; // 61-90 days
    low_stock: { count: number; drugs: DrugDocument[] };
    out_of_stock: { count: number; drugs: DrugDocument[] };
  }> {
    const now = new Date();
    const thirtyDays = new Date(now);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const sixtyDays = new Date(now);
    sixtyDays.setDate(sixtyDays.getDate() + 60);
    const ninetyDays = new Date(now);
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const baseFilter = {
      status: BatchStatus.ACTIVE,
      quantity_available: { $gt: 0 },
      no_expiry: { $ne: true },
    };

    const populateOpts = [
      { path: 'drug_id', select: 'name generic_name strength' },
      { path: 'supplier_id', select: 'name supplier_code' },
    ];

    const [expired, critical, warning, info, lowStock, outOfStock] = await Promise.all([
      this.stockBatchModel.find({ ...baseFilter, expiry_date: { $lt: now } }).populate(populateOpts).limit(50),
      this.stockBatchModel.find({ ...baseFilter, expiry_date: { $gte: now, $lte: thirtyDays } }).populate(populateOpts).limit(50),
      this.stockBatchModel.find({ ...baseFilter, expiry_date: { $gt: thirtyDays, $lte: sixtyDays } }).populate(populateOpts).limit(50),
      this.stockBatchModel.find({ ...baseFilter, expiry_date: { $gt: sixtyDays, $lte: ninetyDays } }).populate(populateOpts).limit(50),
      this.drugModel.find({
        is_active: true,
        is_sample_data: { $ne: true },
        $expr: { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$reorder_level'] }] },
      }).limit(50),
      this.drugModel.find({ is_active: true, is_sample_data: { $ne: true }, quantity: { $lte: 0 } }).limit(50),
    ]);

    return {
      expired: { count: expired.length, batches: expired },
      expiring_critical: { count: critical.length, batches: critical },
      expiring_warning: { count: warning.length, batches: warning },
      expiring_info: { count: info.length, batches: info },
      low_stock: { count: lowStock.length, drugs: lowStock },
      out_of_stock: { count: outOfStock.length, drugs: outOfStock },
    };
  }

  async getInventorySummary(): Promise<{
    total_products: number;
    total_batches: number;
    total_stock_value: number;
    active_suppliers: number;
    alerts_count: { expired: number; expiring_soon: number; low_stock: number; out_of_stock: number };
  }> {
    const now = new Date();
    const ninetyDays = new Date(now);
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    // Summary shows ALL drugs (including sample data) for overall inventory view
    const [
      totalProducts,
      totalBatches,
      stockValueAgg,
      activeSuppliers,
      expiredCount,
      expiringSoonCount,
      lowStockCount,
      outOfStockCount,
    ] = await Promise.all([
      this.drugModel.countDocuments({ is_active: true }),
      this.stockBatchModel.countDocuments({ status: BatchStatus.ACTIVE, quantity_available: { $gt: 0 } }),
      this.stockBatchModel.aggregate([
        { $match: { status: BatchStatus.ACTIVE, quantity_available: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity_available', '$cost_price'] } } } },
      ]),
      this.supplierModel.countDocuments({ status: SupplierStatus.ACTIVE }),
      this.stockBatchModel.countDocuments({
        status: BatchStatus.ACTIVE,
        quantity_available: { $gt: 0 },
        no_expiry: { $ne: true },
        expiry_date: { $lt: now },
      }),
      this.stockBatchModel.countDocuments({
        status: BatchStatus.ACTIVE,
        quantity_available: { $gt: 0 },
        no_expiry: { $ne: true },
        expiry_date: { $gte: now, $lte: ninetyDays },
      }),
      this.drugModel.countDocuments({
        is_active: true,
        $expr: { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$reorder_level'] }] },
      }),
      this.drugModel.countDocuments({ is_active: true, quantity: { $lte: 0 } }),
    ]);

    return {
      total_products: totalProducts,
      total_batches: totalBatches,
      total_stock_value: stockValueAgg[0]?.total || 0,
      active_suppliers: activeSuppliers,
      alerts_count: {
        expired: expiredCount,
        expiring_soon: expiringSoonCount,
        low_stock: lowStockCount,
        out_of_stock: outOfStockCount,
      },
    };
  }

  // ============ STOCK TRANSACTIONS ============

  async getTransactions(query: TransactionQueryDto = {}): Promise<{
    transactions: StockTransactionDocument[];
    total: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 25, drug_id, batch_id, supplier_id, type, reference_type, reference_number, from_date, to_date, excludeReversed, sortBy = 'created_at', sortOrder = 'desc' } = query;

    const filter: any = {};

    if (drug_id) filter.drug_id = drug_id;
    if (batch_id) filter.batch_id = batch_id;
    if (supplier_id) filter.supplier_id = supplier_id;
    if (type) filter.type = type;
    if (reference_type) filter['reference.type'] = reference_type;
    if (reference_number) filter['reference.number'] = { $regex: reference_number, $options: 'i' };
    if (excludeReversed) filter.is_reversed = { $ne: true };

    if (from_date || to_date) {
      filter.transaction_date = {};
      if (from_date) filter.transaction_date.$gte = new Date(from_date);
      if (to_date) filter.transaction_date.$lte = new Date(to_date);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      this.stockTransactionModel
        .find(filter)
        .populate('drug_id', 'name generic_name strength')
        .populate('batch_id', 'batch_number internal_batch_id')
        .populate('supplier_id', 'name supplier_code')
        .populate('performed_by', 'first_name last_name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      this.stockTransactionModel.countDocuments(filter),
    ]);

    return {
      transactions,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTransactionById(id: string): Promise<StockTransactionDocument> {
    const transaction = await this.stockTransactionModel
      .findById(id)
      .populate('drug_id')
      .populate('batch_id')
      .populate('supplier_id')
      .populate('performed_by', 'first_name last_name email');
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async getDrugTransactions(drugId: string, query: TransactionQueryDto = {}): Promise<{
    transactions: StockTransactionDocument[];
    total: number;
  }> {
    const result = await this.getTransactions({ ...query, drug_id: drugId });
    return { transactions: result.transactions, total: result.total };
  }

  async getBatchTransactions(batchId: string, query: TransactionQueryDto = {}): Promise<{
    transactions: StockTransactionDocument[];
    total: number;
  }> {
    const result = await this.getTransactions({ ...query, batch_id: batchId });
    return { transactions: result.transactions, total: result.total };
  }

  // ============ HELPERS ============

  private generateCode(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  private async generateSupplierCode(): Promise<string> {
    const lastSupplier = await this.supplierModel.findOne().sort({ created_at: -1 });
    let nextNumber = 1;

    if (lastSupplier?.supplier_code) {
      const match = lastSupplier.supplier_code.match(/SUP-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `SUP-${nextNumber.toString().padStart(3, '0')}`;
  }

  private async generateBatchId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayBatches = await this.stockBatchModel.countDocuments({
      created_at: { $gte: todayStart, $lte: todayEnd },
    });

    return `BTH-${dateStr}-${(todayBatches + 1).toString().padStart(3, '0')}`;
  }

  private async generateTransactionId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayTransactions = await this.stockTransactionModel.countDocuments({
      created_at: { $gte: todayStart, $lte: todayEnd },
    });

    return `TXN-${dateStr}-${(todayTransactions + 1).toString().padStart(4, '0')}`;
  }

  private async createStockTransaction(data: {
    drug_id: string;
    batch_id: string;
    type: TransactionType;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    unit_cost?: number;
    unit_price?: number;
    total_value?: number;
    reference?: { type?: ReferenceType; id?: string; number?: string };
    reason?: string;
    notes?: string;
    supplier_id?: string;
    customer_id?: string;
    return_info?: any;
    is_reversal?: boolean;
    reverses_transaction?: string;
    performed_by: string;
  }): Promise<StockTransactionDocument> {
    const transactionId = await this.generateTransactionId();

    return this.stockTransactionModel.create({
      transaction_id: transactionId,
      ...data,
      transaction_date: new Date(),
    });
  }

  private async syncDrugQuantity(drugId: string): Promise<void> {
    // Calculate total available quantity from all active batches
    const result = await this.stockBatchModel.aggregate([
      { $match: { drug_id: new Types.ObjectId(drugId), status: BatchStatus.ACTIVE } },
      { $group: { _id: null, total: { $sum: '$quantity_available' } } },
    ]);

    const totalQuantity = result[0]?.total || 0;

    // Update drug quantity and is_available status
    await this.drugModel.findByIdAndUpdate(drugId, {
      quantity: totalQuantity,
      is_available: totalQuantity > 0,
    });
  }

  /**
   * Sync all drugs' quantity and availability status from their batches
   * This is useful for fixing data inconsistencies
   */
  async syncAllDrugQuantities(): Promise<{ synced: number; updated: number; details: any[] }> {
    const details: any[] = [];

    // Get all drugs that have ANY batches (regardless of status), summing only ACTIVE ones
    const drugsWithBatches = await this.stockBatchModel.aggregate([
      {
        $group: {
          _id: '$drug_id',
          total: {
            $sum: {
              $cond: [
                { $eq: ['$status', BatchStatus.ACTIVE] },
                '$quantity_available',
                0,
              ],
            },
          },
          batchCount: { $sum: 1 },
          activeBatchCount: {
            $sum: { $cond: [{ $eq: ['$status', BatchStatus.ACTIVE] }, 1, 0] },
          },
        },
      },
    ]);

    let updated = 0;
    for (const item of drugsWithBatches) {
      const drug = await this.drugModel.findById(item._id);
      if (drug) {
        const newQty = item.total || 0;
        const newAvailable = newQty > 0;
        if (drug.quantity !== newQty || drug.is_available !== newAvailable) {
          await this.drugModel.findByIdAndUpdate(item._id, {
            quantity: newQty,
            is_available: newAvailable,
          });
          details.push({
            drug: drug.name,
            oldQty: drug.quantity,
            newQty: newQty,
            batchCount: item.batchCount,
            activeBatchCount: item.activeBatchCount,
          });
          updated++;
        }
      }
    }

    // Only set drugs to 0 if they have batches recorded but none are active
    // Do NOT touch drugs that have no batches at all (they may have manual stock)
    const allDrugIdsWithBatches = drugsWithBatches.map(d => d._id);

    // Find drugs that have quantity > 0 but NO batches at all - log warning but don't change
    const drugsWithQtyButNoBatches = await this.drugModel.find({
      _id: { $nin: allDrugIdsWithBatches },
      quantity: { $gt: 0 },
    });

    for (const drug of drugsWithQtyButNoBatches) {
      details.push({
        drug: drug.name,
        warning: 'Drug has quantity but no batches - not modified',
        currentQty: drug.quantity,
      });
    }

    return { synced: drugsWithBatches.length, updated, details };
  }

  /**
   * Sync a single drug's quantity and availability from its batches
   */
  async syncSingleDrugQuantity(drugId: string): Promise<{ quantity: number; is_available: boolean }> {
    await this.syncDrugQuantity(drugId);
    const drug = await this.drugModel.findById(drugId);
    return { quantity: drug?.quantity || 0, is_available: drug?.is_available || false };
  }

  /**
   * Debug endpoint to check batch statuses
   */
  async debugBatchStatus(): Promise<any> {
    const allBatches = await this.stockBatchModel.find().populate('drug_id', 'name').limit(50);

    const statusCounts = await this.stockBatchModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const batchDetails = allBatches.map(b => ({
      drug: (b.drug_id as any)?.name || 'Unknown',
      batch_number: b.batch_number,
      status: b.status,
      statusType: typeof b.status,
      quantity_available: b.quantity_available,
      isActiveEnum: b.status === BatchStatus.ACTIVE,
      isActiveString: b.status === 'active',
    }));

    return {
      totalBatches: await this.stockBatchModel.countDocuments(),
      statusCounts,
      expectedActiveValue: BatchStatus.ACTIVE,
      batchDetails,
    };
  }

  // ==================== INVENTORY REPORTS ====================

  /**
   * Generate Stock Valuation Report
   * Shows total inventory value, breakdown by category and supplier
   * Includes both batch-based inventory AND drugs with direct quantity (no batches)
   */
  async getStockValuationReport(query: InventoryReportQueryDto): Promise<StockValuationReport> {
    const now = new Date();

    // Build batch filter
    const batchFilter: any = {
      status: BatchStatus.ACTIVE,
      quantity_available: { $gt: 0 },
    };

    // Date filter for when batches were received
    if (query.start_date || query.end_date) {
      batchFilter.received_date = {};
      if (query.start_date) {
        batchFilter.received_date.$gte = new Date(query.start_date);
      }
      if (query.end_date) {
        batchFilter.received_date.$lte = new Date(query.end_date);
      }
    }

    if (query.supplier_id && Types.ObjectId.isValid(query.supplier_id)) {
      batchFilter.supplier_id = new Types.ObjectId(query.supplier_id);
    } else if (query.supplier_id) {
      // Invalid supplier ID - return empty result
      batchFilter.supplier_id = new Types.ObjectId(); // Non-matching ID
    }

    // Build drug filter
    const drugFilter: any = { is_active: true };
    if (query.category_id && Types.ObjectId.isValid(query.category_id)) {
      drugFilter.categories = new Types.ObjectId(query.category_id);
    }

    // If manufacturer filter applied, filter by both drug-level AND batch-level manufacturer
    // Handle both ObjectId reference and string name (for backwards compatibility with sample data)
    let manufacturerName: string | undefined;
    if (query.manufacturer && Types.ObjectId.isValid(query.manufacturer)) {
      // Get manufacturer name for string matching
      const manufacturerDoc = await this.manufacturerModel.findById(query.manufacturer).select('name');
      manufacturerName = manufacturerDoc?.name;

      // Query separately to avoid Mongoose schema validation issues
      // First, find drugs with ObjectId reference
      const drugsByRef = await this.drugModel.find({
        manufacturer: new Types.ObjectId(query.manufacturer),
      }).select('_id');

      // Then, use collection directly to find drugs with string name (bypasses schema)
      let drugsByName: any[] = [];
      if (manufacturerName) {
        drugsByName = await this.drugModel.collection.find({
          manufacturer: manufacturerName,
        }).project({ _id: 1 }).toArray();
      }

      // Combine drug IDs
      const drugIds = [
        ...drugsByRef.map(d => d._id),
        ...drugsByName.map(d => d._id),
      ];

      // Filter batches by: drug's manufacturer OR batch's own manufacturer field
      // Batch manufacturer can be ObjectId string or manufacturer name string
      if (drugIds.length > 0 || manufacturerName) {
        batchFilter.$or = [];
        if (drugIds.length > 0) {
          batchFilter.$or.push({ drug_id: { $in: drugIds } });
        }
        if (manufacturerName) {
          // Batch manufacturer stored as ObjectId string or name string
          batchFilter.$or.push({ manufacturer: query.manufacturer }); // ObjectId string
          batchFilter.$or.push({ manufacturer: manufacturerName }); // Name string
        }
      } else {
        // No drugs for this manufacturer, return empty result
        batchFilter.drug_id = { $in: [] };
      }
    } else if (query.manufacturer) {
      // Invalid manufacturer ID provided - return empty result
      batchFilter.drug_id = { $in: [] };
    }

    // Get all active batches with drug details
    const batches = await this.stockBatchModel.find(batchFilter)
      .populate({
        path: 'drug_id',
        populate: [
          { path: 'categories', select: 'name' },
          { path: 'manufacturer', select: 'name' },
        ],
        match: query.category_id && Types.ObjectId.isValid(query.category_id)
          ? { categories: new Types.ObjectId(query.category_id) }
          : undefined,
      })
      .populate('supplier_id', 'name')
      .lean();

    // Filter out batches where drug didn't match category filter
    const validBatches = batches.filter(b => b.drug_id !== null);

    // Calculate summary
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalUnits = 0;

    const categoryMap = new Map<string, CategoryValuation>();
    const supplierMap = new Map<string, SupplierValuation>();
    const productMap = new Map<string, ProductValuation>();
    const drugsWithBatches = new Set<string>();

    for (const batch of validBatches) {
      const drug = batch.drug_id as any;
      const supplier = batch.supplier_id as any;
      const category = drug?.categories?.[0] as any; // Use first category from array

      const costValue = batch.quantity_available * (batch.cost_price || 0);
      const retailValue = batch.quantity_available * (batch.selling_price_override || drug?.selling_price || 0);

      totalCostValue += costValue;
      totalRetailValue += retailValue;
      totalUnits += batch.quantity_available;

      // Track drugs that have batches
      if (drug) {
        drugsWithBatches.add(drug._id.toString());
      }

      // Aggregate by category
      if (category) {
        const catKey = category._id.toString();
        const existing = categoryMap.get(catKey);
        if (existing) {
          existing.units += batch.quantity_available;
          existing.cost_value += costValue;
          existing.retail_value += retailValue;
        } else {
          categoryMap.set(catKey, {
            category_id: catKey,
            category_name: category.name,
            product_count: 0, // Will be calculated later
            units: batch.quantity_available,
            cost_value: costValue,
            retail_value: retailValue,
          });
        }
      }

      // Aggregate by supplier
      if (supplier) {
        const supKey = supplier._id.toString();
        const existing = supplierMap.get(supKey);
        if (existing) {
          existing.batch_count += 1;
          existing.units += batch.quantity_available;
          existing.cost_value += costValue;
        } else {
          supplierMap.set(supKey, {
            supplier_id: supKey,
            supplier_name: supplier.name,
            batch_count: 1,
            units: batch.quantity_available,
            cost_value: costValue,
          });
        }
      }

      // Aggregate by product
      if (drug) {
        const drugKey = drug._id.toString();
        const existing = productMap.get(drugKey);
        if (existing) {
          existing.total_units += batch.quantity_available;
          existing.total_cost_value += costValue;
          existing.total_retail_value += retailValue;
          existing.batch_count += 1;
          // Recalculate avg_cost
          existing.avg_cost = existing.total_cost_value / existing.total_units;
        } else {
          productMap.set(drugKey, {
            drug_id: drugKey,
            drug_name: drug.name,
            drug_code: drug.sku || '',
            category: category?.name || 'Uncategorized',
            total_units: batch.quantity_available,
            avg_cost: batch.cost_price || 0,
            total_cost_value: costValue,
            total_retail_value: retailValue,
            batch_count: 1,
            profit_margin: 0, // Will be calculated
          });
        }
      }
    }

    // Now get drugs that have direct quantity but NO batches (legacy/direct inventory)
    // Skip only if supplier filter is applied (since legacy drugs don't have suppliers)
    // Manufacturer filter CAN be applied since drugs have manufacturer field (either ObjectId or string)
    if (!query.supplier_id) {
      // Build filter for legacy drugs
      const legacyDrugFilter: any = {
        ...drugFilter,
        quantity: { $gt: 0 },
      };

      // If manufacturer filter is applied, we need to handle both ObjectId and string manufacturer
      if (query.manufacturer && Types.ObjectId.isValid(query.manufacturer)) {
        const manufacturerDoc = await this.manufacturerModel.findById(query.manufacturer).select('name');
        const manufacturerName = manufacturerDoc?.name;

        // Use raw collection query to handle both ObjectId and string manufacturer
        // Since drugFilter might have categories as ObjectId, we'll query separately
        let legacyDrugsRaw: any[] = [];

        // Query for drugs with ObjectId manufacturer reference
        const drugsByObjRef = await this.drugModel.collection.find({
          is_active: { $ne: false },
          quantity: { $gt: 0 },
          manufacturer: new Types.ObjectId(query.manufacturer),
          ...(query.category_id && Types.ObjectId.isValid(query.category_id)
            ? { categories: new Types.ObjectId(query.category_id) }
            : {}),
        }).toArray();

        // Query for drugs with string manufacturer name
        if (manufacturerName) {
          const drugsByStrName = await this.drugModel.collection.find({
            is_active: { $ne: false },
            quantity: { $gt: 0 },
            manufacturer: manufacturerName,
            ...(query.category_id && Types.ObjectId.isValid(query.category_id)
              ? { categories: new Types.ObjectId(query.category_id) }
              : {}),
          }).toArray();
          legacyDrugsRaw = [...drugsByObjRef, ...drugsByStrName];
        } else {
          legacyDrugsRaw = drugsByObjRef;
        }

        // Populate categories for these drugs
        for (const drug of legacyDrugsRaw) {
          const drugKey = drug._id.toString();

          // Skip if this drug already has batches (already counted)
          if (drugsWithBatches.has(drugKey)) {
            continue;
          }

          // Fetch category info
          let categoryName = 'Uncategorized';
          let categoryId: string | null = null;
          if (drug.categories && drug.categories.length > 0) {
            const cat = await this.drugCategoryModel.findById(drug.categories[0]).select('name').lean();
            if (cat) {
              categoryName = cat.name;
              categoryId = cat._id.toString();
            }
          }

          const costValue = drug.quantity * (drug.cost_price || 0);
          const retailValue = drug.quantity * (drug.selling_price || 0);

          totalCostValue += costValue;
          totalRetailValue += retailValue;
          totalUnits += drug.quantity;

          // Aggregate by category
          if (categoryId) {
            const existing = categoryMap.get(categoryId);
            if (existing) {
              existing.units += drug.quantity;
              existing.cost_value += costValue;
              existing.retail_value += retailValue;
            } else {
              categoryMap.set(categoryId, {
                category_id: categoryId,
                category_name: categoryName,
                product_count: 0,
                units: drug.quantity,
                cost_value: costValue,
                retail_value: retailValue,
              });
            }
          }

          // Add to product map (no supplier, no batches)
          productMap.set(drugKey, {
            drug_id: drugKey,
            drug_name: drug.name,
            drug_code: drug.sku || '',
            category: categoryName,
            total_units: drug.quantity,
            avg_cost: drug.cost_price || 0,
            total_cost_value: costValue,
            total_retail_value: retailValue,
            batch_count: 0, // No batches - direct inventory
            profit_margin: 0,
          });
        }
      } else if (!query.manufacturer) {
        // No manufacturer filter - get all drugs with quantity
        const drugsWithoutBatches = await this.drugModel.find(legacyDrugFilter)
          .populate('categories', 'name')
          .lean();

        for (const drug of drugsWithoutBatches) {
          const drugKey = drug._id.toString();

          // Skip if this drug already has batches (already counted)
          if (drugsWithBatches.has(drugKey)) {
            continue;
          }

          const category = (drug.categories as any)?.[0];
          const costValue = drug.quantity * (drug.cost_price || 0);
          const retailValue = drug.quantity * (drug.selling_price || 0);

          totalCostValue += costValue;
          totalRetailValue += retailValue;
          totalUnits += drug.quantity;

          // Aggregate by category
          if (category) {
            const catKey = category._id.toString();
            const existing = categoryMap.get(catKey);
            if (existing) {
              existing.units += drug.quantity;
              existing.cost_value += costValue;
              existing.retail_value += retailValue;
            } else {
              categoryMap.set(catKey, {
                category_id: catKey,
                category_name: category.name,
                product_count: 0,
                units: drug.quantity,
                cost_value: costValue,
                retail_value: retailValue,
              });
            }
          }

          // Add to product map (no supplier, no batches)
          productMap.set(drugKey, {
            drug_id: drugKey,
            drug_name: drug.name,
            drug_code: drug.sku || '',
            category: category?.name || 'Uncategorized',
            total_units: drug.quantity,
            avg_cost: drug.cost_price || 0,
            total_cost_value: costValue,
            total_retail_value: retailValue,
            batch_count: 0, // No batches - direct inventory
            profit_margin: 0,
          });
        }
      }
    }

    // Calculate product counts per category and profit margins
    const productsByCategory = new Map<string, Set<string>>();
    for (const [drugId, product] of productMap) {
      if (product.total_retail_value > 0) {
        product.profit_margin = ((product.total_retail_value - product.total_cost_value) / product.total_retail_value) * 100;
      }

      // Track unique products per category - need to look up the category
      if (product.category && product.category !== 'Uncategorized') {
        // Find category ID from categoryMap
        for (const [catId, catData] of categoryMap) {
          if (catData.category_name === product.category) {
            if (!productsByCategory.has(catId)) {
              productsByCategory.set(catId, new Set());
            }
            productsByCategory.get(catId)!.add(drugId);
            break;
          }
        }
      }
    }

    // Update category product counts
    for (const [catId, catData] of categoryMap) {
      catData.product_count = productsByCategory.get(catId)?.size || 0;
    }

    const potentialProfit = totalRetailValue - totalCostValue;
    const profitMarginPercent = totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0;

    return {
      summary: {
        total_products: productMap.size,
        total_batches: validBatches.length,
        total_stock_units: totalUnits,
        total_cost_value: Math.round(totalCostValue * 100) / 100,
        total_retail_value: Math.round(totalRetailValue * 100) / 100,
        potential_profit: Math.round(potentialProfit * 100) / 100,
        profit_margin_percent: Math.round(profitMarginPercent * 100) / 100,
      },
      by_category: Array.from(categoryMap.values()).sort((a, b) => b.cost_value - a.cost_value),
      by_supplier: Array.from(supplierMap.values()).sort((a, b) => b.cost_value - a.cost_value),
      products: Array.from(productMap.values())
        .sort((a, b) => b.total_cost_value - a.total_cost_value)
        .slice(0, query.limit || 50),
      generated_at: now,
      filters_applied: {
        start_date: query.start_date,
        end_date: query.end_date,
        category_id: query.category_id,
        supplier_id: query.supplier_id,
        manufacturer: query.manufacturer,
      },
    };
  }

  /**
   * Generate Expiry & Batch Report
   * Shows expiry status, critical batches, and batch status breakdown
   * Includes both batch-based inventory AND drugs with direct expiry dates
   */
  async getExpiryBatchReport(query: InventoryReportQueryDto): Promise<ExpiryBatchReport> {
    const now = new Date();
    const days30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const days60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const days90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Build drug filter for category
    const drugFilter: any = { is_active: true };
    if (query.category_id && Types.ObjectId.isValid(query.category_id)) {
      drugFilter.categories = new Types.ObjectId(query.category_id);
    }

    // Get drug IDs if any drug filter is applied
    // Handle manufacturer separately to support both ObjectId and string name
    let drugIds: Types.ObjectId[] | undefined;
    if (query.manufacturer && Types.ObjectId.isValid(query.manufacturer)) {
      // Get manufacturer name for string matching
      const manufacturerDoc = await this.manufacturerModel.findById(query.manufacturer).select('name');
      const manufacturerName = manufacturerDoc?.name;

      // Query separately to avoid Mongoose schema validation issues
      // Build base filter for category if present
      const baseFilter: any = {};
      if (query.category_id && Types.ObjectId.isValid(query.category_id)) {
        baseFilter.categories = new Types.ObjectId(query.category_id);
      }

      // First, find drugs with ObjectId reference
      const drugsByRef = await this.drugModel.find({
        ...baseFilter,
        manufacturer: new Types.ObjectId(query.manufacturer),
      }).select('_id');

      // Then, use collection directly to find drugs with string name (bypasses schema)
      let drugsByName: any[] = [];
      if (manufacturerName) {
        const nameFilter: any = { manufacturer: manufacturerName };
        if (query.category_id && Types.ObjectId.isValid(query.category_id)) {
          nameFilter.categories = new Types.ObjectId(query.category_id);
        }
        drugsByName = await this.drugModel.collection.find(nameFilter).project({ _id: 1 }).toArray();
      }

      // Combine results
      drugIds = [
        ...drugsByRef.map(d => d._id),
        ...drugsByName.map(d => d._id),
      ];
    } else if (query.manufacturer) {
      // Invalid manufacturer ID - set empty array to return no results
      drugIds = [];
    } else if (query.category_id && Types.ObjectId.isValid(query.category_id)) {
      const drugs = await this.drugModel.find(drugFilter).select('_id');
      drugIds = drugs.map(d => d._id);
    }

    // Build batch filter
    const batchFilter: any = {
      quantity_available: { $gt: 0 },
    };

    if (drugIds) {
      batchFilter.drug_id = { $in: drugIds };
    }

    if (query.supplier_id && Types.ObjectId.isValid(query.supplier_id)) {
      batchFilter.supplier_id = new Types.ObjectId(query.supplier_id);
    } else if (query.supplier_id) {
      // Invalid supplier ID - return empty result
      batchFilter.supplier_id = new Types.ObjectId();
    }

    // Get all batches with stock
    const batches = await this.stockBatchModel.find(batchFilter)
      .populate('drug_id', 'name sku selling_price')
      .populate('supplier_id', 'name')
      .lean();

    // Track which drugs have batches
    const drugsWithBatches = new Set<string>();

    // Calculate summary counts
    let totalBatches = batches.length;
    let activeBatches = 0;
    let expiredBatches = 0;
    let expiring30Days = 0;
    let expiring60Days = 0;
    let expiring90Days = 0;
    let quarantinedBatches = 0;
    let recalledBatches = 0;
    let noExpiryBatches = 0;

    // Expiry timeline periods
    const expiryTimeline: ExpiryTimelinePeriod[] = [
      { period: 'Expired', batch_count: 0, units: 0, value_at_risk: 0 },
      { period: '0-30 days', batch_count: 0, units: 0, value_at_risk: 0 },
      { period: '31-60 days', batch_count: 0, units: 0, value_at_risk: 0 },
      { period: '61-90 days', batch_count: 0, units: 0, value_at_risk: 0 },
      { period: '90+ days', batch_count: 0, units: 0, value_at_risk: 0 },
      { period: 'No expiry', batch_count: 0, units: 0, value_at_risk: 0 },
    ];

    const criticalBatches: CriticalBatch[] = [];
    const statusCounts = new Map<string, { count: number; units: number }>();

    for (const batch of batches) {
      const drug = batch.drug_id as any;
      const supplier = batch.supplier_id as any;
      const costValue = batch.quantity_available * (batch.cost_price || 0);

      // Track drugs with batches
      if (drug) {
        drugsWithBatches.add(drug._id.toString());
      }

      // Count by status
      const status = batch.status || 'unknown';
      const statusData = statusCounts.get(status) || { count: 0, units: 0 };
      statusData.count += 1;
      statusData.units += batch.quantity_available;
      statusCounts.set(status, statusData);

      if (batch.status === BatchStatus.ACTIVE) activeBatches++;
      if (batch.status === BatchStatus.QUARANTINE) quarantinedBatches++;
      if (batch.status === BatchStatus.RECALLED) recalledBatches++;

      // Handle expiry categorization
      if (batch.no_expiry) {
        noExpiryBatches++;
        expiryTimeline[5].batch_count++;
        expiryTimeline[5].units += batch.quantity_available;
        expiryTimeline[5].value_at_risk += costValue;
      } else if (batch.expiry_date) {
        const expiryDate = new Date(batch.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        if (expiryDate < now) {
          // Expired
          expiredBatches++;
          expiryTimeline[0].batch_count++;
          expiryTimeline[0].units += batch.quantity_available;
          expiryTimeline[0].value_at_risk += costValue;

          criticalBatches.push({
            batch_id: batch._id.toString(),
            internal_batch_id: batch.internal_batch_id,
            batch_number: batch.batch_number,
            drug_id: drug?._id?.toString() || '',
            drug_name: drug?.name || 'Unknown',
            drug_code: drug?.sku || '',
            supplier_name: supplier?.name || 'Unknown',
            expiry_date: batch.expiry_date,
            days_until_expiry: daysUntilExpiry,
            quantity_available: batch.quantity_available,
            cost_price: batch.cost_price || 0,
            value_at_risk: costValue,
            status: batch.status,
          });
        } else if (expiryDate <= days30) {
          // 0-30 days
          expiring30Days++;
          expiryTimeline[1].batch_count++;
          expiryTimeline[1].units += batch.quantity_available;
          expiryTimeline[1].value_at_risk += costValue;

          criticalBatches.push({
            batch_id: batch._id.toString(),
            internal_batch_id: batch.internal_batch_id,
            batch_number: batch.batch_number,
            drug_id: drug?._id?.toString() || '',
            drug_name: drug?.name || 'Unknown',
            drug_code: drug?.sku || '',
            supplier_name: supplier?.name || 'Unknown',
            expiry_date: batch.expiry_date,
            days_until_expiry: daysUntilExpiry,
            quantity_available: batch.quantity_available,
            cost_price: batch.cost_price || 0,
            value_at_risk: costValue,
            status: batch.status,
          });
        } else if (expiryDate <= days60) {
          // 31-60 days
          expiring60Days++;
          expiryTimeline[2].batch_count++;
          expiryTimeline[2].units += batch.quantity_available;
          expiryTimeline[2].value_at_risk += costValue;
        } else if (expiryDate <= days90) {
          // 61-90 days
          expiring90Days++;
          expiryTimeline[3].batch_count++;
          expiryTimeline[3].units += batch.quantity_available;
          expiryTimeline[3].value_at_risk += costValue;
        } else {
          // 90+ days
          expiryTimeline[4].batch_count++;
          expiryTimeline[4].units += batch.quantity_available;
          expiryTimeline[4].value_at_risk += costValue;
        }
      }
    }

    // Now include drugs without batches that have stock and expiry dates
    // Only if no supplier or manufacturer filter (these don't have suppliers/batch-level manufacturer)
    if (!query.supplier_id && !query.manufacturer) {
      const drugsWithoutBatches = await this.drugModel.find({
        ...drugFilter,
        quantity: { $gt: 0 },
      }).lean();

      for (const drug of drugsWithoutBatches) {
        const drugKey = drug._id.toString();

        // Skip if this drug already has batches
        if (drugsWithBatches.has(drugKey)) {
          continue;
        }

        const costValue = drug.quantity * (drug.cost_price || 0);

        // Count as "direct inventory" status
        const statusData = statusCounts.get('direct_inventory') || { count: 0, units: 0 };
        statusData.count += 1;
        statusData.units += drug.quantity;
        statusCounts.set('direct_inventory', statusData);

        // Categorize by expiry
        if (!drug.expiry_date) {
          noExpiryBatches++;
          expiryTimeline[5].batch_count++;
          expiryTimeline[5].units += drug.quantity;
          expiryTimeline[5].value_at_risk += costValue;
        } else {
          const expiryDate = new Date(drug.expiry_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

          if (expiryDate < now) {
            expiredBatches++;
            expiryTimeline[0].batch_count++;
            expiryTimeline[0].units += drug.quantity;
            expiryTimeline[0].value_at_risk += costValue;

            criticalBatches.push({
              batch_id: drugKey,
              internal_batch_id: '',
              batch_number: 'Direct Inventory',
              drug_id: drugKey,
              drug_name: drug.name,
              drug_code: drug.sku || '',
              supplier_name: 'N/A',
              expiry_date: drug.expiry_date,
              days_until_expiry: daysUntilExpiry,
              quantity_available: drug.quantity,
              cost_price: drug.cost_price || 0,
              value_at_risk: costValue,
              status: 'direct_inventory',
            });
          } else if (expiryDate <= days30) {
            expiring30Days++;
            expiryTimeline[1].batch_count++;
            expiryTimeline[1].units += drug.quantity;
            expiryTimeline[1].value_at_risk += costValue;

            criticalBatches.push({
              batch_id: drugKey,
              internal_batch_id: '',
              batch_number: 'Direct Inventory',
              drug_id: drugKey,
              drug_name: drug.name,
              drug_code: drug.sku || '',
              supplier_name: 'N/A',
              expiry_date: drug.expiry_date,
              days_until_expiry: daysUntilExpiry,
              quantity_available: drug.quantity,
              cost_price: drug.cost_price || 0,
              value_at_risk: costValue,
              status: 'direct_inventory',
            });
          } else if (expiryDate <= days60) {
            expiring60Days++;
            expiryTimeline[2].batch_count++;
            expiryTimeline[2].units += drug.quantity;
            expiryTimeline[2].value_at_risk += costValue;
          } else if (expiryDate <= days90) {
            expiring90Days++;
            expiryTimeline[3].batch_count++;
            expiryTimeline[3].units += drug.quantity;
            expiryTimeline[3].value_at_risk += costValue;
          } else {
            expiryTimeline[4].batch_count++;
            expiryTimeline[4].units += drug.quantity;
            expiryTimeline[4].value_at_risk += costValue;
          }
        }

        totalBatches++; // Count direct inventory as a "batch" for total
      }
    }

    // Convert status counts to array
    const batchesByStatus: BatchStatusCount[] = Array.from(statusCounts.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      units: data.units,
    }));

    // Sort critical batches by days_until_expiry
    criticalBatches.sort((a, b) => a.days_until_expiry - b.days_until_expiry);

    return {
      summary: {
        total_batches: totalBatches,
        active_batches: activeBatches,
        expired_batches: expiredBatches,
        expiring_30_days: expiring30Days,
        expiring_60_days: expiring60Days,
        expiring_90_days: expiring90Days,
        quarantined_batches: quarantinedBatches,
        recalled_batches: recalledBatches,
        no_expiry_batches: noExpiryBatches,
      },
      expiry_timeline: expiryTimeline,
      critical_batches: criticalBatches.slice(0, query.limit || 20),
      batches_by_status: batchesByStatus,
      generated_at: now,
      filters_applied: {
        start_date: query.start_date,
        end_date: query.end_date,
        category_id: query.category_id,
        supplier_id: query.supplier_id,
        manufacturer: query.manufacturer,
        expiry_days: query.expiry_days,
      },
    };
  }

  /**
   * Generate Transaction/Movement Report
   * Shows stock movements, transaction types, and top moving products
   */
  async getTransactionReport(query: InventoryReportQueryDto): Promise<TransactionReport> {
    const now = new Date();

    // Build transaction filter
    const txnFilter: any = {};

    // Default to last 30 days if no date range specified
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    txnFilter.created_at = {
      $gte: query.start_date ? new Date(query.start_date) : defaultStartDate,
    };
    if (query.end_date) {
      txnFilter.created_at.$lte = new Date(query.end_date);
    }

    if (query.supplier_id && Types.ObjectId.isValid(query.supplier_id)) {
      txnFilter.supplier_id = new Types.ObjectId(query.supplier_id);
    } else if (query.supplier_id) {
      // Invalid supplier ID - return empty result
      txnFilter.supplier_id = new Types.ObjectId();
    }

    // Build drug filter for category
    const drugFilter: any = {};
    if (query.category_id && Types.ObjectId.isValid(query.category_id)) {
      drugFilter.categories = new Types.ObjectId(query.category_id);
    }

    // Get drug IDs if any drug filter is applied
    // Handle manufacturer separately to support both ObjectId and string name
    if (query.manufacturer && Types.ObjectId.isValid(query.manufacturer)) {
      // Get manufacturer name for string matching
      const manufacturerDoc = await this.manufacturerModel.findById(query.manufacturer).select('name');
      const manufacturerName = manufacturerDoc?.name;

      // Find drugs where manufacturer is either the ObjectId OR the string name
      const mfgDrugFilter: any = {
        ...drugFilter,
        $or: [
          { manufacturer: new Types.ObjectId(query.manufacturer) },
          ...(manufacturerName ? [{ manufacturer: manufacturerName }] : []),
        ],
      };

      const drugs = await this.drugModel.find(mfgDrugFilter).select('_id');
      txnFilter.drug_id = { $in: drugs.map(d => d._id) };
    } else if (query.manufacturer) {
      // Invalid manufacturer ID - return empty result
      txnFilter.drug_id = { $in: [] };
    } else if (query.category_id && Types.ObjectId.isValid(query.category_id)) {
      const drugs = await this.drugModel.find(drugFilter).select('_id');
      txnFilter.drug_id = { $in: drugs.map(d => d._id) };
    }

    // Get all transactions in date range
    const transactions = await this.stockTransactionModel.find(txnFilter)
      .populate('drug_id', 'name drug_code')
      .populate('batch_id', 'batch_number')
      .populate('performed_by', 'profile.first_name profile.last_name')
      .sort({ created_at: -1 })
      .lean();

    // Calculate summary
    let totalReceived = 0;
    let totalSold = 0;
    let totalAdjustedAdd = 0;
    let totalAdjustedSubtract = 0;
    let totalReturned = 0;
    let totalWrittenOff = 0;
    let totalRecalled = 0;
    let totalValueIn = 0;
    let totalValueOut = 0;

    const typeMap = new Map<string, TransactionTypeCount>();
    const dailyMap = new Map<string, DailyTransactionVolume>();
    const drugMovementMap = new Map<string, TopMovingDrug>();

    for (const txn of transactions) {
      const drug = txn.drug_id as any;
      const batch = txn.batch_id as any;
      const performer = txn.performed_by as any;
      const value = Math.abs(txn.total_value || 0);

      // Aggregate by type
      const typeKey = txn.type;
      const typeData = typeMap.get(typeKey) || { type: typeKey, count: 0, units: 0, value: 0 };
      typeData.count += 1;
      typeData.units += Math.abs(txn.quantity);
      typeData.value += value;
      typeMap.set(typeKey, typeData);

      // Sum by transaction type
      switch (txn.type) {
        case TransactionType.RECEIVED:
          totalReceived += txn.quantity;
          totalValueIn += value;
          break;
        case TransactionType.SOLD:
          totalSold += Math.abs(txn.quantity);
          totalValueOut += value;
          break;
        case TransactionType.ADJUSTMENT_ADD:
          totalAdjustedAdd += txn.quantity;
          totalValueIn += value;
          break;
        case TransactionType.ADJUSTMENT_SUBTRACT:
          totalAdjustedSubtract += Math.abs(txn.quantity);
          totalValueOut += value;
          break;
        case TransactionType.RETURN_TO_SUPPLIER:
          totalReturned += Math.abs(txn.quantity);
          totalValueOut += value;
          break;
        case TransactionType.EXPIRED:
        case TransactionType.DAMAGED:
          totalWrittenOff += Math.abs(txn.quantity);
          totalValueOut += value;
          break;
        case TransactionType.RECALLED:
          totalRecalled += Math.abs(txn.quantity);
          totalValueOut += value;
          break;
      }

      // Aggregate by day
      const dateKey = txn.created_at.toISOString().split('T')[0];
      const dayData = dailyMap.get(dateKey) || { date: dateKey, received: 0, sold: 0, adjusted: 0, returned: 0, other: 0 };

      switch (txn.type) {
        case TransactionType.RECEIVED:
          dayData.received += txn.quantity;
          break;
        case TransactionType.SOLD:
          dayData.sold += Math.abs(txn.quantity);
          break;
        case TransactionType.ADJUSTMENT_ADD:
        case TransactionType.ADJUSTMENT_SUBTRACT:
          dayData.adjusted += txn.quantity; // Can be positive or negative
          break;
        case TransactionType.RETURN_TO_SUPPLIER:
          dayData.returned += Math.abs(txn.quantity);
          break;
        default:
          dayData.other += Math.abs(txn.quantity);
      }
      dailyMap.set(dateKey, dayData);

      // Aggregate by drug
      if (drug) {
        const drugKey = drug._id.toString();
        const drugData = drugMovementMap.get(drugKey) || {
          drug_id: drugKey,
          drug_name: drug.name,
          drug_code: drug.drug_code || '',
          total_in: 0,
          total_out: 0,
          net_change: 0,
          transaction_count: 0,
        };

        drugData.transaction_count += 1;

        if (txn.quantity > 0) {
          drugData.total_in += txn.quantity;
        } else {
          drugData.total_out += Math.abs(txn.quantity);
        }
        drugData.net_change = drugData.total_in - drugData.total_out;

        drugMovementMap.set(drugKey, drugData);
      }
    }

    // Format recent transactions
    const recentTransactions: RecentTransaction[] = transactions.slice(0, 20).map(txn => {
      const drug = txn.drug_id as any;
      const batch = txn.batch_id as any;
      const performer = txn.performed_by as any;

      return {
        transaction_id: txn.transaction_id,
        type: txn.type,
        drug_name: drug?.name || 'Unknown',
        batch_number: batch?.batch_number || txn.batch_id?.toString() || '',
        quantity: txn.quantity,
        unit_cost: txn.unit_cost || 0,
        total_value: txn.total_value || 0,
        reason: txn.reason,
        performed_by: performer?.profile
          ? `${performer.profile.first_name || ''} ${performer.profile.last_name || ''}`.trim() || 'System'
          : 'System',
        created_at: txn.created_at,
      };
    });

    const netMovement = totalReceived + totalAdjustedAdd - totalSold - totalAdjustedSubtract - totalReturned - totalWrittenOff - totalRecalled;

    return {
      summary: {
        total_transactions: transactions.length,
        total_received: totalReceived,
        total_sold: totalSold,
        total_adjusted_add: totalAdjustedAdd,
        total_adjusted_subtract: totalAdjustedSubtract,
        total_returned: totalReturned,
        total_written_off: totalWrittenOff,
        total_recalled: totalRecalled,
        net_movement: netMovement,
        total_value_in: Math.round(totalValueIn * 100) / 100,
        total_value_out: Math.round(totalValueOut * 100) / 100,
      },
      by_type: Array.from(typeMap.values()).sort((a, b) => b.count - a.count),
      by_day: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      top_moving_drugs: Array.from(drugMovementMap.values())
        .sort((a, b) => (b.total_in + b.total_out) - (a.total_in + a.total_out))
        .slice(0, query.limit || 10),
      recent_transactions: recentTransactions,
      generated_at: now,
      filters_applied: {
        start_date: query.start_date || defaultStartDate.toISOString().split('T')[0],
        end_date: query.end_date,
        category_id: query.category_id,
        supplier_id: query.supplier_id,
        manufacturer: query.manufacturer,
      },
    };
  }

  /**
   * Get manufacturers for report filter dropdown
   * Returns all active manufacturers from the ManufacturerEntity table
   */
  async getManufacturersForReports(): Promise<{ _id: string; name: string }[]> {
    const manufacturers = await this.manufacturerModel
      .find({ is_active: true })
      .select('_id name')
      .sort({ name: 1 })
      .lean();
    return manufacturers.map(m => ({ _id: m._id.toString(), name: m.name }));
  }

  // ============ PRESCRIPTIONS & ORDERS ============

  /**
   * Get all prescriptions with pagination and filtering
   */
  async getPrescriptions(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    date?: string;
  }): Promise<any> {
    const { page = 1, limit = 25, search, status, date } = query;
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');
    const InternalPrescriptionsCollection = this.connection.collection('prescriptions');
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const UsersCollection = this.connection.collection('users');

    // Build filters
    // Exclude specialist prescriptions that are linked to pharmacy orders
    // Those are processed through the pharmacy order, not here
    const specialistFilter: any = {
      linked_pharmacy_order: { $exists: false },
    };
    const internalFilter: any = {};
    const patientUploadFilter: any = { is_deleted: { $ne: true } };

    // Status filter (only for specialist prescriptions which have status)
    if (status) {
      specialistFilter.status = status.toLowerCase();
      // Map status to patient upload verification_status
      const statusMap: any = {
        'pending': 'PENDING',
        'approved': 'APPROVED',
        'rejected': 'REJECTED',
      };
      if (statusMap[status.toLowerCase()]) {
        patientUploadFilter.verification_status = statusMap[status.toLowerCase()];
      }
    }

    // Date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const dateFilter = { $gte: startOfDay, $lte: endOfDay };
      specialistFilter.created_at = dateFilter;
      internalFilter.created_at = dateFilter;
      patientUploadFilter.created_at = dateFilter;
    }

    // Search filter
    if (search) {
      specialistFilter.prescription_number = { $regex: search, $options: 'i' };
      // For patient uploads, search by original filename
      patientUploadFilter.original_filename = { $regex: search, $options: 'i' };
    }

    // Fetch from all collections
    const [specialistPrescriptions, internalPrescriptions, patientUploads] = await Promise.all([
      SpecialistPrescriptionsCollection.find(specialistFilter).sort({ created_at: -1 }).toArray(),
      status ? [] : InternalPrescriptionsCollection.find(internalFilter).sort({ created_at: -1 }).toArray(),
      PatientUploadsCollection.find(patientUploadFilter).sort({ created_at: -1 }).toArray(),
    ]);

    // Normalize specialist prescriptions
    const normalizedSpecialist = await Promise.all(
      specialistPrescriptions.map(async (prescription: any) => {
        const [patient, specialist] = await Promise.all([
          prescription.patient_id
            ? UsersCollection.findOne(
                { _id: new Types.ObjectId(prescription.patient_id) },
                { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
              )
            : null,
          prescription.specialist_id
            ? UsersCollection.findOne(
                { _id: new Types.ObjectId(prescription.specialist_id) },
                { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
              )
            : null,
        ]);

        return {
          ...prescription,
          patient: patient ? { profile: patient.profile } : null,
          specialist: specialist ? { profile: specialist.profile } : null,
          medications: prescription.items || [],
          source: 'SPECIALIST',
          type: 'Specialist Prescription',
        };
      }),
    );

    // Normalize internal prescriptions (patient-created within platform)
    const normalizedInternal = await Promise.all(
      internalPrescriptions.map(async (prescription: any) => {
        const [patient, prescribedBy] = await Promise.all([
          prescription.patient
            ? UsersCollection.findOne(
                { _id: new Types.ObjectId(prescription.patient) },
                { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
              )
            : null,
          prescription.prescribed_by
            ? UsersCollection.findOne(
                { _id: new Types.ObjectId(prescription.prescribed_by) },
                { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
              )
            : null,
        ]);

        return {
          ...prescription,
          prescription_number: `INT-${prescription._id.toString().slice(-8).toUpperCase()}`,
          patient: patient ? { profile: patient.profile } : null,
          specialist: prescribedBy ? { profile: prescribedBy.profile } : null,
          medications: prescription.items || [],
          status: prescription.progress_status || 'pending',
          source: 'INTERNAL',
          type: 'Internal Prescription',
        };
      }),
    );

    // Normalize patient uploaded prescriptions
    const normalizedUploads = await Promise.all(
      patientUploads.map(async (upload: any) => {
        const patient = upload.patient
          ? await UsersCollection.findOne(
              { _id: new Types.ObjectId(upload.patient) },
              { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
            )
          : null;

        // Extract doctor name from OCR data
        const doctorName = upload.ocr_data?.doctor_name || null;

        // Get prescription number - prioritize stored field, fallback for legacy records
        const uploadDate = new Date(upload.created_at);
        const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
        const idSuffix = upload._id.toString().slice(-4).toUpperCase();
        const prescriptionNumber = upload.prescription_number ||
          upload.digital_signature?.reference_number ||
          `RX-${dateStr}-${idSuffix}`;

        return {
          ...upload,
          prescription_number: prescriptionNumber,
          patient: patient ? { profile: patient.profile } : null,
          specialist: doctorName ? { profile: { first_name: doctorName, last_name: '' } } : null,
          medications: upload.ocr_data?.medications || upload.verified_medications || [],
          original_filename: upload.original_filename,
          s3_url: upload.s3_url,
          verification_status: upload.verification_status,
          processing_status: upload.processing_status,
          status: upload.verification_status?.toLowerCase() || 'pending',
          source: 'UPLOAD',
          type: 'Patient Upload',
        };
      }),
    );

    // Combine and sort all prescriptions by created_at descending
    const allPrescriptions = [...normalizedSpecialist, ...normalizedInternal, ...normalizedUploads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Total count
    const total = allPrescriptions.length;

    // Apply pagination to combined results
    const paginatedPrescriptions = allPrescriptions.slice((page - 1) * limit, page * limit);

    return {
      prescriptions: paginatedPrescriptions,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Get single prescription by ID
   */
  async getPrescriptionById(id: string): Promise<any> {
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');
    const InternalPrescriptionsCollection = this.connection.collection('prescriptions');
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const UsersCollection = this.connection.collection('users');

    const objectId = new Types.ObjectId(id);

    // Try to find in specialist prescriptions first
    let prescription = await SpecialistPrescriptionsCollection.findOne({ _id: objectId });
    let source = 'SPECIALIST';

    // If not found, try internal prescriptions
    if (!prescription) {
      prescription = await InternalPrescriptionsCollection.findOne({ _id: objectId });
      source = 'INTERNAL';
    }

    // If still not found, try patient uploads
    if (!prescription) {
      prescription = await PatientUploadsCollection.findOne({ _id: objectId });
      source = 'UPLOAD';
    }

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Handle patient upload differently
    if (source === 'UPLOAD') {
      const patient = prescription.patient
        ? await UsersCollection.findOne(
            { _id: new Types.ObjectId(prescription.patient) },
            { projection: {
              'profile.first_name': 1,
              'profile.last_name': 1,
              'profile.contact': 1,
              'profile.date_of_birth': 1,
              'profile.gender': 1,
              'profile.profile_photo': 1,
            } },
          )
        : null;

      const patientPhone = patient?.profile?.contact?.phone;
      const doctorName = prescription.ocr_data?.doctor_name || null;

      // Get prescription number - prioritize stored field, fallback for legacy records
      const uploadDate = new Date(prescription.created_at);
      const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
      const idSuffix = prescription._id.toString().slice(-4).toUpperCase();
      const prescriptionNumber = prescription.prescription_number ||
        prescription.digital_signature?.reference_number ||
        `RX-${dateStr}-${idSuffix}`;

      // Normalize used_in_orders for linked orders display
      const normalizedUsedInOrders = await this.normalizeUsedInOrders(prescription.used_in_orders || []);

      return {
        ...prescription,
        prescription_number: prescriptionNumber,
        patient: patient ? {
          _id: patient._id,
          profile: {
            ...patient.profile,
            phone_number: patientPhone ? `${patientPhone.country_code || ''} ${patientPhone.number || ''}`.trim() : null,
            email: patient.profile?.contact?.email || null,
          },
        } : null,
        specialist: doctorName ? { profile: { first_name: doctorName, last_name: '' } } : null,
        medications: prescription.ocr_data?.medications || prescription.verified_medications || [],
        status: prescription.verification_status?.toLowerCase() || 'pending',
        source: 'UPLOAD',
        type: 'Patient Upload',
        documents: prescription.s3_url ? [{
          url: await this.fileUploadHelper.getPresignedUrl(prescription.s3_url, 3600),
          original_filename: prescription.original_filename
        }] : [],
        used_in_orders: normalizedUsedInOrders,
      };
    }

    // Handle internal prescription
    if (source === 'INTERNAL') {
      const [patient, prescribedBy] = await Promise.all([
        prescription.patient
          ? UsersCollection.findOne(
              { _id: new Types.ObjectId(prescription.patient) },
              { projection: {
                'profile.first_name': 1,
                'profile.last_name': 1,
                'profile.contact': 1,
                'profile.date_of_birth': 1,
                'profile.gender': 1,
                'profile.profile_photo': 1,
              } },
            )
          : null,
        prescription.prescribed_by
          ? UsersCollection.findOne(
              { _id: new Types.ObjectId(prescription.prescribed_by) },
              { projection: {
                'profile.first_name': 1,
                'profile.last_name': 1,
                'profile.contact': 1,
                'professional_practice': 1,
              } },
            )
          : null,
      ]);

      const patientPhone = patient?.profile?.contact?.phone;
      const specialistPhone = prescribedBy?.profile?.contact?.phone;

      return {
        ...prescription,
        prescription_number: `INT-${prescription._id.toString().slice(-8).toUpperCase()}`,
        patient: patient ? {
          _id: patient._id,
          profile: {
            ...patient.profile,
            phone_number: patientPhone ? `${patientPhone.country_code || ''} ${patientPhone.number || ''}`.trim() : null,
            email: patient.profile?.contact?.email || null,
          },
        } : null,
        specialist: prescribedBy ? {
          _id: prescribedBy._id,
          profile: {
            ...prescribedBy.profile,
            phone_number: specialistPhone ? `${specialistPhone.country_code || ''} ${specialistPhone.number || ''}`.trim() : null,
            email: prescribedBy.profile?.contact?.email || null,
          },
          professional_practice: prescribedBy.professional_practice,
        } : null,
        medications: prescription.items || [],
        status: prescription.progress_status || 'pending',
        source: 'INTERNAL',
        type: 'Internal Prescription',
      };
    }

    // Handle specialist prescription (original logic)
    const [patient, specialist] = await Promise.all([
      prescription.patient_id
        ? UsersCollection.findOne(
            { _id: new Types.ObjectId(prescription.patient_id) },
            { projection: {
              'profile.first_name': 1,
              'profile.last_name': 1,
              'profile.contact': 1,
              'profile.date_of_birth': 1,
              'profile.gender': 1,
              'profile.profile_photo': 1,
            } },
          )
        : null,
      prescription.specialist_id
        ? UsersCollection.findOne(
            { _id: new Types.ObjectId(prescription.specialist_id) },
            { projection: {
              'profile.first_name': 1,
              'profile.last_name': 1,
              'profile.contact': 1,
              'professional_practice': 1,
            } },
          )
        : null,
    ]);

    // Format phone numbers
    const patientPhone = patient?.profile?.contact?.phone;
    const specialistPhone = specialist?.profile?.contact?.phone;

    return {
      ...prescription,
      patient: patient ? {
        _id: patient._id,
        profile: {
          ...patient.profile,
          phone_number: patientPhone ? `${patientPhone.country_code || ''} ${patientPhone.number || ''}`.trim() : null,
          email: patient.profile?.contact?.email || null,
        },
      } : null,
      specialist: specialist ? {
        _id: specialist._id,
        profile: {
          ...specialist.profile,
          phone_number: specialistPhone ? `${specialistPhone.country_code || ''} ${specialistPhone.number || ''}`.trim() : null,
          email: specialist.profile?.contact?.email || null,
        },
        professional_practice: specialist.professional_practice,
      } : null,
      medications: prescription.items || [],
      source: 'SPECIALIST',
      type: 'Specialist Prescription',
    };
  }

  /**
   * Get presigned PDF URL for a specialist prescription
   * @param id Prescription ID
   * @param expiresIn Expiration time in seconds (default: 24 hours)
   */
  async getPrescriptionPdfUrl(id: string, expiresIn: number = 86400): Promise<{ url: string; prescription_number: string }> {
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    const objectId = new Types.ObjectId(id);
    const prescription = await SpecialistPrescriptionsCollection.findOne({ _id: objectId });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (!prescription.pdf_url) {
      throw new NotFoundException('PDF not available for this prescription');
    }

    const presignedUrl = await this.fileUploadHelper.getPresignedUrl(prescription.pdf_url, expiresIn);

    return {
      url: presignedUrl,
      prescription_number: prescription.prescription_number,
    };
  }

  /**
   * Update prescription status (for patient uploads AND specialist prescriptions)
   */
  async updatePrescriptionStatus(id: string, status: string, rejectionReason?: string): Promise<any> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    const objectId = new Types.ObjectId(id);

    // First try to find in specialist prescriptions
    const specialistPrescription = await SpecialistPrescriptionsCollection.findOne({ _id: objectId });

    if (specialistPrescription) {
      // Handle specialist prescription status update
      const normalizedStatus = status.toLowerCase();

      // Validate status transition
      const validStatuses = ['draft', 'pending_payment', 'paid', 'processing', 'dispensed', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];
      if (!validStatuses.includes(normalizedStatus)) {
        throw new BadRequestException(`Invalid status: ${status}`);
      }

      const updateData: any = {
        status: normalizedStatus,
        updated_at: new Date(),
      };

      // Add timestamp for specific status changes
      if (normalizedStatus === 'processing') {
        updateData.processing_started_at = new Date();
      } else if (normalizedStatus === 'dispensed') {
        updateData.dispensed_at = new Date();
      } else if (normalizedStatus === 'shipped') {
        updateData.shipped_at = new Date();
      } else if (normalizedStatus === 'delivered') {
        updateData.delivered_at = new Date();
      } else if (normalizedStatus === 'completed') {
        updateData.completed_at = new Date();
      }

      await SpecialistPrescriptionsCollection.updateOne(
        { _id: objectId },
        { $set: updateData },
      );

      return { success: true, status: normalizedStatus, type: 'specialist' };
    }

    // If not found in specialist prescriptions, try patient uploads
    const upload = await PatientUploadsCollection.findOne({ _id: objectId });

    if (!upload) {
      throw new NotFoundException('Prescription not found');
    }

    const updateData: any = {
      verification_status: status.toUpperCase(),
      updated_at: new Date(),
    };

    if (status.toUpperCase() === 'REJECTED' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    if (status.toUpperCase() === 'APPROVED') {
      updateData.verified_at = new Date();
    }

    await PatientUploadsCollection.updateOne(
      { _id: objectId },
      { $set: updateData },
    );

    return { success: true, status: status.toUpperCase(), type: 'upload' };
  }

  // ============ PRESCRIPTION REVIEW SYSTEM ============

  /**
   * Get prescriptions pending pharmacist review
   * Returns prescriptions with verification_status: PHARMACIST_REVIEW, CLARIFICATION_RECEIVED, TIER2_FAILED
   */
  async getPrescriptionsPendingReview(query: {
    page?: number;
    limit?: number;
    priority?: 'high' | 'medium' | 'low' | 'all';
    sortBy?: 'fraud_score' | 'created_at' | 'response_deadline';
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const { page = 1, limit = 25, priority = 'all', sortBy = 'fraud_score', sortOrder = 'desc' } = query;
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const UsersCollection = this.connection.collection('users');

    // Filter for prescriptions needing review
    const filter: any = {
      verification_status: {
        $in: ['PHARMACIST_REVIEW', 'CLARIFICATION_RECEIVED', 'TIER2_FAILED', 'TIER1_FAILED']
      },
      is_deleted: { $ne: true },
    };

    // Priority filter based on fraud score
    if (priority === 'high') {
      filter.fraud_score = { $gte: 70 };
    } else if (priority === 'medium') {
      filter.fraud_score = { $gte: 40, $lt: 70 };
    } else if (priority === 'low') {
      filter.fraud_score = { $lt: 40 };
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'fraud_score') {
      sort.fraud_score = sortOrder === 'asc' ? 1 : -1;
      sort.created_at = -1; // Secondary sort
    } else if (sortBy === 'response_deadline') {
      sort['clarification.response_deadline'] = sortOrder === 'asc' ? 1 : -1;
      sort.fraud_score = -1;
    } else {
      sort.created_at = sortOrder === 'asc' ? 1 : -1;
    }

    const [uploads, total] = await Promise.all([
      PatientUploadsCollection.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      PatientUploadsCollection.countDocuments(filter),
    ]);

    // Enrich with patient data
    const enrichedUploads = await Promise.all(
      uploads.map(async (upload: any) => {
        const patient = upload.patient
          ? await UsersCollection.findOne(
              { _id: new Types.ObjectId(upload.patient) },
              { projection: { 'profile.first_name': 1, 'profile.last_name': 1, email: 1, 'profile.contact.email': 1 } },
            )
          : null;

        // Calculate risk level from fraud score
        let riskLevel = 'LOW';
        if (upload.fraud_score >= 80) riskLevel = 'CRITICAL';
        else if (upload.fraud_score >= 60) riskLevel = 'HIGH';
        else if (upload.fraud_score >= 40) riskLevel = 'MEDIUM';

        // Get prescription number - prioritize stored field, fallback for legacy records
        const uploadDate = new Date(upload.created_at);
        const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
        const idSuffix = upload._id.toString().slice(-4).toUpperCase();
        const prescriptionNumber = upload.prescription_number ||
          upload.digital_signature?.reference_number ||
          `RX-${dateStr}-${idSuffix}`;

        return {
          _id: upload._id,
          prescription_number: prescriptionNumber,
          patient: patient ? {
            _id: patient._id,
            name: patient.profile ? `${patient.profile.first_name || ''} ${patient.profile.last_name || ''}`.trim() : 'Unknown',
            email: patient.email || patient?.profile?.contact?.email,
          } : null,
          verification_status: upload.verification_status,
          fraud_score: upload.fraud_score || 0,
          fraud_flags: upload.fraud_flags || [],
          risk_level: riskLevel,
          ocr_data: upload.ocr_data,
          verified_medications: upload.verified_medications || [],
          s3_url: upload.s3_url,
          original_filename: upload.original_filename,
          created_at: upload.created_at,
          clarification: upload.clarification,
          has_pending_clarification: upload.verification_status === 'CLARIFICATION_NEEDED',
          has_clarification_response: upload.verification_status === 'CLARIFICATION_RECEIVED',
        };
      }),
    );

    return {
      prescriptions: enrichedUploads,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Get prescriptions awaiting clarification from patient
   * Returns prescriptions with verification_status: CLARIFICATION_NEEDED
   */
  async getPrescriptionsAwaitingClarification(query: {
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'response_deadline';
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const { page = 1, limit = 25, sortBy = 'created_at', sortOrder = 'desc' } = query;
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const UsersCollection = this.connection.collection('users');

    const filter: any = {
      verification_status: 'CLARIFICATION_NEEDED',
      is_deleted: { $ne: true },
    };

    // Build sort object
    const sort: any = {};
    if (sortBy === 'response_deadline') {
      sort['clarification.response_deadline'] = sortOrder === 'asc' ? 1 : -1;
      sort.created_at = -1;
    } else {
      sort.created_at = sortOrder === 'asc' ? 1 : -1;
    }

    const [uploads, total] = await Promise.all([
      PatientUploadsCollection.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      PatientUploadsCollection.countDocuments(filter),
    ]);

    // Enrich with patient data
    const enrichedUploads = await Promise.all(
      uploads.map(async (upload: any) => {
        const patient = upload.patient
          ? await UsersCollection.findOne(
              { _id: new Types.ObjectId(upload.patient) },
              { projection: { 'profile.first_name': 1, 'profile.last_name': 1, email: 1, 'profile.contact.email': 1 } },
            )
          : null;

        // Get prescription number - prioritize stored field, fallback for legacy records
        const uploadDate = new Date(upload.created_at);
        const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
        const idSuffix = upload._id.toString().slice(-4).toUpperCase();
        const prescriptionNumber = upload.prescription_number ||
          upload.digital_signature?.reference_number ||
          `RX-${dateStr}-${idSuffix}`;

        // Calculate days until deadline
        let daysUntilDeadline = null;
        if (upload.clarification?.response_deadline) {
          const deadline = new Date(upload.clarification.response_deadline);
          const now = new Date();
          daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          _id: upload._id,
          prescription_number: prescriptionNumber,
          patient: patient ? {
            _id: patient._id,
            name: patient.profile ? `${patient.profile.first_name || ''} ${patient.profile.last_name || ''}`.trim() : 'Unknown',
            email: patient.email || patient?.profile?.contact?.email,
          } : null,
          verification_status: upload.verification_status,
          fraud_score: upload.fraud_score || 0,
          s3_url: upload.s3_url,
          original_filename: upload.original_filename,
          created_at: upload.created_at,
          clarification: upload.clarification,
          days_until_deadline: daysUntilDeadline,
          is_overdue: daysUntilDeadline !== null && daysUntilDeadline < 0,
        };
      }),
    );

    return {
      prescriptions: enrichedUploads,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Get count of prescriptions in review queue
   */
  async getReviewQueueCount(): Promise<{
    total: number;
    byPriority: { critical: number; high: number; medium: number; low: number };
    byStatus: { pharmacist_review: number; clarification_received: number; tier_failed: number };
    clarificationPending: number;
  }> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');

    const baseFilter = {
      verification_status: {
        $in: ['PHARMACIST_REVIEW', 'CLARIFICATION_RECEIVED', 'TIER2_FAILED', 'TIER1_FAILED']
      },
      is_deleted: { $ne: true },
    };

    const [
      total,
      critical,
      high,
      medium,
      low,
      pharmacistReview,
      clarificationReceived,
      tierFailed,
      clarificationPending,
    ] = await Promise.all([
      PatientUploadsCollection.countDocuments(baseFilter),
      PatientUploadsCollection.countDocuments({ ...baseFilter, fraud_score: { $gte: 80 } }),
      PatientUploadsCollection.countDocuments({ ...baseFilter, fraud_score: { $gte: 60, $lt: 80 } }),
      PatientUploadsCollection.countDocuments({ ...baseFilter, fraud_score: { $gte: 40, $lt: 60 } }),
      PatientUploadsCollection.countDocuments({ ...baseFilter, fraud_score: { $lt: 40 } }),
      PatientUploadsCollection.countDocuments({ ...baseFilter, verification_status: 'PHARMACIST_REVIEW' }),
      PatientUploadsCollection.countDocuments({ ...baseFilter, verification_status: 'CLARIFICATION_RECEIVED' }),
      PatientUploadsCollection.countDocuments({
        ...baseFilter,
        verification_status: { $in: ['TIER2_FAILED', 'TIER1_FAILED'] }
      }),
      PatientUploadsCollection.countDocuments({
        verification_status: 'CLARIFICATION_NEEDED',
        is_deleted: { $ne: true },
      }),
    ]);

    return {
      total,
      byPriority: { critical, high, medium, low },
      byStatus: {
        pharmacist_review: pharmacistReview,
        clarification_received: clarificationReceived,
        tier_failed: tierFailed,
      },
      clarificationPending,
    };
  }

  /**
   * Get detailed prescription info for pharmacist review
   */
  async getPrescriptionReviewDetails(id: string): Promise<any> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const UsersCollection = this.connection.collection('users');
    const FraudAlertsCollection = this.connection.collection('fraud_alerts');
    const DrugsCollection = this.connection.collection('drugs');

    const objectId = new Types.ObjectId(id);
    const upload = await PatientUploadsCollection.findOne({ _id: objectId });

    if (!upload) {
      throw new NotFoundException('Prescription not found');
    }

    // Get patient info
    const patient = upload.patient
      ? await UsersCollection.findOne(
          { _id: new Types.ObjectId(upload.patient) },
          { projection: {
            'profile.first_name': 1,
            'profile.last_name': 1,
            'profile.contact': 1,
            'profile.date_of_birth': 1,
            'profile.gender': 1,
            email: 1,
          } },
        )
      : null;

    // Get reviewer info if already reviewed
    const reviewer = upload.reviewed_by
      ? await UsersCollection.findOne(
          { _id: new Types.ObjectId(upload.reviewed_by) },
          { projection: { 'profile.first_name': 1, 'profile.last_name': 1, email: 1 } },
        )
      : null;

    // Get clarification requester info
    const clarificationRequester = upload.clarification?.requested_by
      ? await UsersCollection.findOne(
          { _id: new Types.ObjectId(upload.clarification.requested_by) },
          { projection: { 'profile.first_name': 1, 'profile.last_name': 1, email: 1 } },
        )
      : null;

    // Get any related fraud alerts
    const fraudAlerts = await FraudAlertsCollection.find({
      prescription_id: objectId,
    }).toArray();

    // Get drug inventory info for verified medications
    const medicationsWithInventory = await Promise.all(
      (upload.verified_medications || []).map(async (med: any) => {
        if (med.matched_drug_id) {
          const drug = await DrugsCollection.findOne(
            { _id: new Types.ObjectId(med.matched_drug_id) },
            { projection: { name: 1, quantity: 1, price: 1, is_active: 1 } },
          );
          return {
            ...med,
            inventory: drug ? {
              name: drug.name,
              in_stock: drug.quantity > 0,
              quantity_available: drug.quantity,
              price: drug.price,
              is_active: drug.is_active,
            } : null,
          };
        }
        return { ...med, inventory: null };
      }),
    );

    // Calculate risk level
    let riskLevel = 'LOW';
    if (upload.fraud_score >= 80) riskLevel = 'CRITICAL';
    else if (upload.fraud_score >= 60) riskLevel = 'HIGH';
    else if (upload.fraud_score >= 40) riskLevel = 'MEDIUM';

    // Get prescription number - prioritize stored field, fallback for legacy records
    const uploadDate = new Date(upload.created_at);
    const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
    const idSuffix = upload._id.toString().slice(-4).toUpperCase();
    const prescriptionNumber = upload.prescription_number ||
      upload.digital_signature?.reference_number ||
      `RX-${dateStr}-${idSuffix}`;

    // Get presigned URL for document
    const documentUrl = upload.s3_url
      ? await this.fileUploadHelper.getPresignedUrl(upload.s3_url, 3600)
      : null;

    return {
      _id: upload._id,
      prescription_number: prescriptionNumber,
      patient: patient ? {
        _id: patient._id,
        name: patient.profile ? `${patient.profile.first_name || ''} ${patient.profile.last_name || ''}`.trim() : 'Unknown',
        email: patient.email || patient?.profile?.contact?.email,
        phone: patient.profile?.contact?.phone ?
          `${patient.profile.contact.phone.country_code || ''} ${patient.profile.contact.phone.number || ''}`.trim() : null,
        date_of_birth: patient.profile?.date_of_birth,
        gender: patient.profile?.gender,
      } : null,
      verification_status: upload.verification_status,
      processing_status: upload.processing_status,
      fraud_score: upload.fraud_score || 0,
      fraud_flags: upload.fraud_flags || [],
      risk_level: riskLevel,
      ocr_data: upload.ocr_data,
      verified_medications: medicationsWithInventory,
      document: {
        url: documentUrl,
        original_filename: upload.original_filename,
        mimetype: upload.mimetype,
        file_size: upload.file_size,
      },
      validity: {
        valid_from: upload.valid_from,
        valid_until: upload.valid_until,
        is_expired: upload.is_expired,
      },
      usage: {
        usage_count: upload.usage_count || 0,
        max_usage: upload.max_usage,
        // Normalize used_in_orders - handle both old (ObjectId array) and new (object array) formats
        used_in_orders: await this.normalizeUsedInOrders(upload.used_in_orders || []),
      },
      review: {
        reviewed_by: reviewer ? {
          _id: reviewer._id,
          name: reviewer.profile ? `${reviewer.profile.first_name || ''} ${reviewer.profile.last_name || ''}`.trim() : reviewer.email,
        } : null,
        reviewed_at: upload.reviewed_at,
        review_notes: upload.review_notes,
        rejection_reason: upload.rejection_reason,
      },
      clarification: upload.clarification ? {
        ...upload.clarification,
        requested_by: clarificationRequester ? {
          _id: clarificationRequester._id,
          name: clarificationRequester.profile ?
            `${clarificationRequester.profile.first_name || ''} ${clarificationRequester.profile.last_name || ''}`.trim() :
            clarificationRequester.email,
        } : null,
        // Presign response document URLs
        response_documents: await Promise.all(
          (upload.clarification.response_documents || []).map(async (doc: any) => ({
            ...doc,
            url: doc.url ? await this.fileUploadHelper.getPresignedUrl(doc.url, 3600) : null,
          })),
        ),
      } : null,
      fraud_alerts: fraudAlerts,
      digital_signature: upload.digital_signature,
      created_at: upload.created_at,
      updated_at: upload.updated_at,
    };
  }

  /**
   * Review and approve/reject a prescription
   */
  async reviewPrescription(
    id: string,
    reviewerId: string,
    decision: 'APPROVED' | 'REJECTED',
    data: {
      review_notes?: string;
      rejection_reason?: string;
      valid_until?: Date;
    },
  ): Promise<any> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const UsersCollection = this.connection.collection('users');

    const objectId = new Types.ObjectId(id);
    const reviewerObjectId = new Types.ObjectId(reviewerId);

    const upload = await PatientUploadsCollection.findOne({ _id: objectId });

    if (!upload) {
      throw new NotFoundException('Prescription not found');
    }

    // Check if prescription is in a reviewable state
    const reviewableStatuses = ['PHARMACIST_REVIEW', 'CLARIFICATION_RECEIVED', 'TIER2_FAILED', 'TIER1_FAILED'];
    if (!reviewableStatuses.includes(upload.verification_status)) {
      throw new BadRequestException(`Prescription cannot be reviewed in current status: ${upload.verification_status}`);
    }

    const updateData: any = {
      verification_status: decision,
      reviewed_by: reviewerObjectId,
      reviewed_at: new Date(),
      review_notes: data.review_notes || '',
      updated_at: new Date(),
    };

    if (decision === 'REJECTED') {
      if (!data.rejection_reason) {
        throw new BadRequestException('Rejection reason is required when rejecting a prescription');
      }
      updateData.rejection_reason = data.rejection_reason;
    }

    if (decision === 'APPROVED') {
      // Set validity if provided
      if (data.valid_until) {
        updateData.valid_until = new Date(data.valid_until);
      } else {
        // Default 30-day validity for approved prescriptions
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        updateData.valid_until = validUntil;
      }
      updateData.is_expired = false;
    }

    await PatientUploadsCollection.updateOne(
      { _id: objectId },
      { $set: updateData },
    );

    // Get patient info for email notification
    const patient = upload.patient
      ? await UsersCollection.findOne(
          { _id: new Types.ObjectId(upload.patient) },
          { projection: { email: 1, 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact.email': 1 } },
        )
      : null;

    // Get prescription number - prioritize stored field, fallback for legacy records
    const uploadDate = new Date(upload.created_at);
    const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
    const idSuffix = upload._id.toString().slice(-4).toUpperCase();
    const prescriptionNumber = upload.prescription_number ||
      upload.digital_signature?.reference_number ||
      `RX-${dateStr}-${idSuffix}`;
    const patientName = patient?.profile
      ? `${patient.profile.first_name || ''} ${patient.profile.last_name || ''}`.trim()
      : 'Patient';

    // Get patient email - check both root email and profile.contact.email
    const patientEmail = patient?.email || patient?.profile?.contact?.email;

    // Send email notification to patient
    if (patientEmail) {
      try {
        const emailData: PrescriptionReviewEmailData = {
          patientName,
          prescriptionNumber,
          reviewNotes: data.review_notes,
          rejectionReason: data.rejection_reason,
          validUntil: updateData.valid_until ? new Date(updateData.valid_until).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }) : undefined,
        };

        const emailBody = decision === 'APPROVED'
          ? prescriptionApprovedEmail(emailData)
          : prescriptionRejectedByPharmacistEmail(emailData);

        const subject = decision === 'APPROVED'
          ? `✅ Your Prescription Has Been Approved - ${prescriptionNumber}`
          : `❌ Prescription Not Approved - ${prescriptionNumber}`;

        await this.generalHelpers.generateEmailAndSend({
          email: patientEmail,
          subject,
          emailBody,
        });

        Logger.log(`Prescription ${decision.toLowerCase()} email sent to ${patientEmail}`, 'PharmacyService');
      } catch (emailError) {
        Logger.error(`Failed to send prescription ${decision.toLowerCase()} email: ${emailError.message}`, 'PharmacyService');
        // Don't throw - email failure shouldn't block the review action
      }
    } else {
      Logger.warn(`No email found for patient ${upload.patient} - skipping email notification`, 'PharmacyService');
    }

    return {
      success: true,
      prescription_id: id,
      prescription_number: prescriptionNumber,
      decision,
      patient: patient ? {
        email: patientEmail,
        name: patientName,
      } : null,
      valid_until: updateData.valid_until,
      reviewed_at: updateData.reviewed_at,
    };
  }

  /**
   * Request clarification from patient
   */
  async requestClarification(
    id: string,
    requesterId: string,
    data: {
      request_message: string;
      required_information?: string[];
      response_deadline_days?: number;
    },
  ): Promise<any> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const UsersCollection = this.connection.collection('users');

    const objectId = new Types.ObjectId(id);
    const requesterObjectId = new Types.ObjectId(requesterId);

    const upload = await PatientUploadsCollection.findOne({ _id: objectId });

    if (!upload) {
      throw new NotFoundException('Prescription not found');
    }

    // Check if prescription is in a state where clarification can be requested
    const validStatuses = ['PHARMACIST_REVIEW', 'TIER2_FAILED', 'TIER1_FAILED'];
    if (!validStatuses.includes(upload.verification_status)) {
      throw new BadRequestException(`Cannot request clarification for prescription in status: ${upload.verification_status}`);
    }

    // Calculate response deadline (default 7 days)
    const deadlineDays = data.response_deadline_days || 7;
    const responseDeadline = new Date();
    responseDeadline.setDate(responseDeadline.getDate() + deadlineDays);

    const clarificationData = {
      request_message: data.request_message,
      required_information: data.required_information || [],
      requested_by: requesterObjectId,
      requested_at: new Date(),
      response_deadline: responseDeadline,
      response_message: null,
      response_documents: [],
      responded_at: null,
      response_reviewed: false,
      response_reviewed_at: null,
    };

    await PatientUploadsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          verification_status: 'CLARIFICATION_NEEDED',
          clarification: clarificationData,
          updated_at: new Date(),
        },
      },
    );

    // Get patient info for email notification - include profile.contact.email in projection
    const patient = upload.patient
      ? await UsersCollection.findOne(
          { _id: new Types.ObjectId(upload.patient) },
          { projection: { email: 1, 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact.email': 1 } },
        )
      : null;

    // Get prescription number - prioritize stored field, fallback for legacy records
    const uploadDate = new Date(upload.created_at);
    const dateStr = uploadDate.toISOString().slice(0, 10).replace(/-/g, '');
    const idSuffix = upload._id.toString().slice(-4).toUpperCase();
    const prescriptionNumber = upload.prescription_number ||
      upload.digital_signature?.reference_number ||
      `RX-${dateStr}-${idSuffix}`;
    const patientName = patient?.profile
      ? `${patient.profile.first_name || ''} ${patient.profile.last_name || ''}`.trim()
      : 'Patient';

    // Get patient email - check both root email and profile.contact.email
    const patientEmail = patient?.email || patient?.profile?.contact?.email;

    // Send clarification request email to patient
    if (patientEmail) {
      try {
        const emailData: PrescriptionReviewEmailData = {
          patientName,
          prescriptionNumber,
          clarificationMessage: data.request_message,
          requiredInformation: data.required_information,
          responseDeadline: responseDeadline.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        };

        const emailBody = prescriptionClarificationNeededEmail(emailData);

        await this.generalHelpers.generateEmailAndSend({
          email: patientEmail,
          subject: `🔔 Clarification Needed for Your Prescription - ${prescriptionNumber}`,
          emailBody,
        });

        Logger.log(`Clarification request email sent to ${patientEmail}`, 'PharmacyService');
      } catch (emailError) {
        Logger.error(`Failed to send clarification request email: ${emailError.message}`, 'PharmacyService');
        // Don't throw - email failure shouldn't block the clarification request
      }
    } else {
      Logger.warn(`No email found for patient ${upload.patient} - skipping clarification email notification`, 'PharmacyService');
    }

    return {
      success: true,
      prescription_id: id,
      prescription_number: prescriptionNumber,
      status: 'CLARIFICATION_NEEDED',
      patient: patient ? {
        email: patientEmail,
        name: patientName,
      } : null,
      clarification: clarificationData,
    };
  }

  /**
   * Get all orders (prescriptions that are paid/processing/shipped/delivered)
   */
  async getOrders(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    delivery_type?: string;
  }): Promise<any> {
    const { page = 1, limit = 25, search, status, delivery_type } = query;
    const PrescriptionsCollection = this.connection.collection('specialistprescriptions');
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const UsersCollection = this.connection.collection('users');
    const PharmaciesCollection = this.connection.collection('pharmacies');

    // Build filters for specialist prescriptions (orders from specialists)
    // Exclude prescriptions that are linked to a pharmacy order (patient paid via cart checkout)
    // Those are already tracked via the patient's pharmacy order
    const specialistFilter: any = {
      status: { $in: ['paid', 'processing', 'dispensed', 'shipped', 'delivered'] },
      linked_pharmacy_order: { $exists: false }, // Exclude linked prescriptions
    };

    // Build filters for pharmacy orders (patient-created orders)
    // Show all orders except cancelled and refunded so admin can manage them
    const patientOrderFilter: any = {
      status: { $nin: ['CANCELLED', 'REFUNDED'] },
    };

    // Override with specific status if provided
    if (status) {
      specialistFilter.status = status.toLowerCase();
      patientOrderFilter.status = status.toUpperCase(); // PharmacyOrder uses uppercase
    }

    // Delivery type filter
    if (delivery_type) {
      if (delivery_type === 'DELIVERY') {
        specialistFilter['delivery_address.street'] = { $exists: true, $ne: '' };
        patientOrderFilter.delivery_method = 'DELIVERY';
      } else if (delivery_type === 'PICKUP') {
        specialistFilter.$or = [
          { 'delivery_address.street': { $exists: false } },
          { 'delivery_address.street': '' },
        ];
        patientOrderFilter.delivery_method = 'PICKUP';
      }
    }

    // Search filter - search by order number
    if (search) {
      specialistFilter.prescription_number = { $regex: search, $options: 'i' };
      patientOrderFilter.order_number = { $regex: search, $options: 'i' };
    }

    // Fetch from both collections
    const [specialistOrders, patientOrders, specialistTotal, patientTotal] = await Promise.all([
      PrescriptionsCollection.find(specialistFilter)
        .sort({ created_at: -1 })
        .toArray(),
      PharmacyOrdersCollection.find(patientOrderFilter)
        .sort({ created_at: -1 })
        .toArray(),
      PrescriptionsCollection.countDocuments(specialistFilter),
      PharmacyOrdersCollection.countDocuments(patientOrderFilter),
    ]);

    // Normalize specialist orders
    const normalizedSpecialistOrders = await Promise.all(
      specialistOrders.map(async (order: any) => {
        const patient = order.patient_id
          ? await UsersCollection.findOne(
              { _id: new Types.ObjectId(order.patient_id) },
              { projection: { 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact.phone': 1 } },
            )
          : null;

        const hasDeliveryAddress = order.delivery_address?.street;
        const deliveryType = hasDeliveryAddress ? 'DELIVERY' : 'PICKUP';

        return {
          ...order,
          order_number: order.prescription_number,
          patient: patient ? { profile: patient.profile } : null,
          items: order.items || [],
          delivery_type: deliveryType,
          status: order.status?.toUpperCase(),
          source: 'SPECIALIST', // Tag to identify the source
          total_amount: order.total_amount || 0,
        };
      }),
    );

    // Normalize patient pharmacy orders
    const normalizedPatientOrders = await Promise.all(
      patientOrders.map(async (order: any) => {
        const patient = order.patient
          ? await UsersCollection.findOne(
              { _id: new Types.ObjectId(order.patient) },
              { projection: { 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact.phone': 1 } },
            )
          : null;

        const pharmacy = order.pharmacy
          ? await PharmaciesCollection.findOne(
              { _id: new Types.ObjectId(order.pharmacy) },
              { projection: { name: 1 } },
            )
          : null;

        // Check if this order is linked to a specialist prescription
        let linkedPrescription = null;
        if (order.specialist_prescription) {
          linkedPrescription = await PrescriptionsCollection.findOne(
            { _id: new Types.ObjectId(order.specialist_prescription) },
            { projection: { prescription_number: 1 } },
          );
        }

        // Format patient phone number
        let patientProfile = patient?.profile || null;
        if (patientProfile?.contact?.phone) {
          patientProfile = {
            ...patientProfile,
            phone_number: `${patientProfile.contact.phone.country_code || ''} ${patientProfile.contact.phone.number || ''}`.trim(),
          };
        }

        return {
          ...order,
          order_number: order.order_number,
          patient: patient ? { profile: patientProfile } : null,
          pharmacy: pharmacy ? { name: pharmacy.name } : null,
          items: order.items || [],
          delivery_type: order.delivery_method || 'DELIVERY',
          status: order.status?.toUpperCase(),
          source: 'PATIENT', // Tag to identify the source
          total_amount: order.total_amount || 0,
          // Include linked specialist prescription info if exists
          linked_specialist_prescription: linkedPrescription
            ? { prescription_number: linkedPrescription.prescription_number }
            : null,
        };
      }),
    );

    // Combine and sort all orders by created_at descending
    const allOrders = [...normalizedSpecialistOrders, ...normalizedPatientOrders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Total count
    const total = specialistTotal + patientTotal;

    // Apply pagination to the combined results
    const paginatedOrders = allOrders.slice((page - 1) * limit, page * limit);

    return {
      orders: paginatedOrders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Helper method to enrich order items with drug details (manufacturer, dosage_form)
   * This handles backward compatibility for orders created before these fields were stored
   */
  private async enrichOrderItemsWithDrugDetails(
    items: any[],
    DrugsCollection: any,
  ): Promise<any[]> {
    if (!items || items.length === 0) {
      return [];
    }

    // Collect drug IDs that need enrichment
    const drugIdsToFetch: Types.ObjectId[] = [];
    for (const item of items) {
      // If manufacturer is missing, we need to fetch from drug
      if (!item.manufacturer && item.drug) {
        const drugId = typeof item.drug === 'string'
          ? new Types.ObjectId(item.drug)
          : item.drug;
        drugIdsToFetch.push(drugId);
      }
    }

    // If no items need enrichment, return original items
    if (drugIdsToFetch.length === 0) {
      return items;
    }

    // Fetch all drugs in one query
    const drugs = await DrugsCollection.find(
      { _id: { $in: drugIdsToFetch } },
      { projection: { _id: 1, manufacturer: 1 } },
    ).toArray();

    // Create a map for quick lookup
    const drugMap = new Map<string, any>();
    for (const drug of drugs) {
      drugMap.set(drug._id.toString(), drug);
    }

    // Enrich items with drug details
    return items.map((item) => {
      const drugId = item.drug?.toString();
      const drug = drugId ? drugMap.get(drugId) : null;

      return {
        ...item,
        // Use item's manufacturer if exists, otherwise fallback to drug's manufacturer
        manufacturer: item.manufacturer || drug?.manufacturer || null,
      };
    });
  }

  /**
   * Get single order by ID
   */
  async getOrderById(id: string): Promise<any> {
    const PrescriptionsCollection = this.connection.collection('specialistprescriptions');
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const UsersCollection = this.connection.collection('users');
    const PharmaciesCollection = this.connection.collection('pharmacies');

    // First try specialist prescriptions
    let order = await PrescriptionsCollection.findOne({
      _id: new Types.ObjectId(id),
    });

    if (order) {
      // It's a specialist order
      const DrugsCollection = this.connection.collection('drugentities');

      const [patient, specialist] = await Promise.all([
        order.patient_id
          ? UsersCollection.findOne(
              { _id: new Types.ObjectId(order.patient_id) },
              { projection: {
                'profile.first_name': 1,
                'profile.last_name': 1,
                'profile.contact': 1,
                'profile.date_of_birth': 1,
                'profile.gender': 1,
              } },
            )
          : null,
        order.specialist_id
          ? UsersCollection.findOne(
              { _id: new Types.ObjectId(order.specialist_id) },
              { projection: {
                'profile.first_name': 1,
                'profile.last_name': 1,
                'profile.contact': 1,
                'professional_practice': 1,
              } },
            )
          : null,
      ]);

      // Enrich items with manufacturer from drug if missing
      const enrichedItems = await this.enrichOrderItemsWithDrugDetails(
        order.items || [],
        DrugsCollection,
      );

      const hasDeliveryAddress = order.delivery_address?.street;
      const patientPhone = patient?.profile?.contact?.phone;

      return {
        ...order,
        order_number: order.prescription_number,
        patient: patient ? {
          _id: patient._id,
          profile: {
            ...patient.profile,
            phone_number: patientPhone ? `${patientPhone.country_code || ''} ${patientPhone.number || ''}`.trim() : null,
            email: patient.profile?.contact?.email || null,
          },
        } : null,
        specialist: specialist ? {
          _id: specialist._id,
          profile: specialist.profile,
          professional_practice: specialist.professional_practice,
        } : null,
        items: enrichedItems,
        delivery_type: hasDeliveryAddress ? 'DELIVERY' : 'PICKUP',
        status: order.status?.toUpperCase(),
        source: 'SPECIALIST',
      };
    }

    // Try pharmacy orders (patient-created orders)
    order = await PharmacyOrdersCollection.findOne({
      _id: new Types.ObjectId(id),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // It's a patient order
    const DrugsCollection = this.connection.collection('drugentities');

    const [patient, pharmacy] = await Promise.all([
      order.patient
        ? UsersCollection.findOne(
            { _id: new Types.ObjectId(order.patient) },
            { projection: {
              'profile.first_name': 1,
              'profile.last_name': 1,
              'profile.contact': 1,
              'profile.date_of_birth': 1,
              'profile.gender': 1,
            } },
          )
        : null,
      order.pharmacy
        ? PharmaciesCollection.findOne(
            { _id: new Types.ObjectId(order.pharmacy) },
            { projection: { name: 1, address: 1, phone: 1, email: 1 } },
          )
        : null,
    ]);

    // Fetch linked specialist prescription if exists
    let linkedPrescription = null;
    if (order.specialist_prescription) {
      const prescriptionDoc = await PrescriptionsCollection.findOne(
        { _id: new Types.ObjectId(order.specialist_prescription) },
        { projection: {
          prescription_number: 1,
          specialist_id: 1,
          items: 1,
          diagnosis: 1,
          notes: 1,
          created_at: 1,
        } },
      );

      if (prescriptionDoc) {
        // Fetch the specialist info
        const specialist = prescriptionDoc.specialist_id
          ? await UsersCollection.findOne(
              { _id: new Types.ObjectId(prescriptionDoc.specialist_id) },
              { projection: {
                'profile.first_name': 1,
                'profile.last_name': 1,
                'professional_practice': 1,
              } },
            )
          : null;

        linkedPrescription = {
          _id: prescriptionDoc._id,
          prescription_number: prescriptionDoc.prescription_number,
          diagnosis: prescriptionDoc.diagnosis,
          notes: prescriptionDoc.notes,
          items: prescriptionDoc.items,
          created_at: prescriptionDoc.created_at,
          specialist: specialist ? {
            _id: specialist._id,
            profile: specialist.profile,
            professional_practice: specialist.professional_practice,
          } : null,
        };
      }
    }

    // Enrich items with manufacturer from drug if missing
    const enrichedItems = await this.enrichOrderItemsWithDrugDetails(
      order.items || [],
      DrugsCollection,
    );

    const patientPhone = patient?.profile?.contact?.phone;

    return {
      ...order,
      order_number: order.order_number,
      patient: patient ? {
        _id: patient._id,
        profile: {
          ...patient.profile,
          phone_number: patientPhone ? `${patientPhone.country_code || ''} ${patientPhone.number || ''}`.trim() : null,
          email: patient.profile?.contact?.email || null,
        },
      } : null,
      pharmacy: pharmacy || null,
      items: enrichedItems,
      delivery_type: order.delivery_method || 'DELIVERY',
      status: order.status?.toUpperCase(),
      source: 'PATIENT',
      // Include linked specialist prescription for QA verification
      prescription: linkedPrescription,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: string, userId?: string): Promise<any> {
    const PrescriptionsCollection = this.connection.collection('specialistprescriptions');
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const UsersCollection = this.connection.collection('users');

    const now = new Date();

    // First try specialist prescriptions
    let order = await PrescriptionsCollection.findOne({
      _id: new Types.ObjectId(id),
    });

    if (order) {
      // Update specialist order
      const statusLower = status.toLowerCase();
      const updateData: any = {
        status: statusLower,
        updated_at: now,
      };

      // Add status-specific timestamps
      if (statusLower === 'dispensed') {
        updateData.dispensed_at = now;
        updateData.dispensed_by = userId ? new Types.ObjectId(userId) : null;
      } else if (statusLower === 'shipped') {
        updateData.shipped_at = now;
      } else if (statusLower === 'delivered') {
        updateData.delivered_at = now;
      }

      // Add to status history
      const statusHistoryEntry = {
        status: statusLower,
        changed_at: now,
        changed_by: userId ? new Types.ObjectId(userId) : null,
      };

      await PrescriptionsCollection.updateOne(
        { _id: new Types.ObjectId(id) },
        {
          $set: updateData,
          $push: { status_history: statusHistoryEntry },
        },
      );

      // Send email notification to patient
      await this.sendOrderStatusEmail(order, statusLower, UsersCollection, 'SPECIALIST');

      return this.getOrderById(id);
    }

    // Try pharmacy orders (patient-created orders)
    order = await PharmacyOrdersCollection.findOne({
      _id: new Types.ObjectId(id),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update patient order (uses uppercase status)
    const statusUpper = status.toUpperCase();
    const updateData: any = {
      status: statusUpper,
      updated_at: now,
      updated_by: userId ? new Types.ObjectId(userId) : null,
    };

    // Add status-specific timestamps
    if (statusUpper === 'DISPENSED' || statusUpper === 'READY_FOR_PICKUP') {
      updateData.dispensed_at = now;
      updateData.dispensed_by = userId ? new Types.ObjectId(userId) : null;
    } else if (statusUpper === 'SHIPPED' || statusUpper === 'OUT_FOR_DELIVERY') {
      updateData.shipped_at = now;
    } else if (statusUpper === 'DELIVERED' || statusUpper === 'COMPLETED') {
      updateData.actual_delivery_date = now;
    }

    // Add to status history
    const statusHistoryEntry = {
      status: statusUpper,
      timestamp: now,
      updated_by: userId ? new Types.ObjectId(userId) : null,
    };

    await PharmacyOrdersCollection.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: updateData,
        $push: { status_history: statusHistoryEntry },
      },
    );

    // Update linked prescription status if order has a prescription reference (patient uploads)
    if (order.prescription) {
      const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');

      // Map order status to prescription status
      const prescriptionStatusMap: any = {
        'PENDING': 'APPROVED', // Keep as approved while pending
        'CONFIRMED': 'APPROVED',
        'PAID': 'APPROVED',
        'PROCESSING': 'PROCESSING',
        'DISPENSED': 'DISPENSED',
        'READY_FOR_PICKUP': 'DISPENSED',
        'SHIPPED': 'SHIPPED',
        'OUT_FOR_DELIVERY': 'SHIPPED',
        'DELIVERED': 'DELIVERED',
        'COMPLETED': 'DELIVERED',
      };

      const newPrescriptionStatus = prescriptionStatusMap[statusUpper] || statusUpper;

      // Update the prescription
      await PatientUploadsCollection.updateOne(
        { _id: new Types.ObjectId(order.prescription) },
        {
          $set: {
            verification_status: newPrescriptionStatus,
            order_status: statusUpper,
            updated_at: now,
          },
          $addToSet: {
            used_in_orders: {
              order_id: new Types.ObjectId(id),
              order_number: order.order_number,
              total_amount: order.total_amount || 0,
              status: statusUpper,
              updated_at: now,
            },
          },
        },
      );

      // Also update usage_count if this is a new order being added
      await PatientUploadsCollection.updateOne(
        { _id: new Types.ObjectId(order.prescription) },
        {
          $inc: { usage_count: 0 }, // This will create the field if it doesn't exist
        },
      );

      // Update the specific order entry in used_in_orders
      await PatientUploadsCollection.updateOne(
        {
          _id: new Types.ObjectId(order.prescription),
          'used_in_orders.order_id': new Types.ObjectId(id),
        },
        {
          $set: {
            'used_in_orders.$.status': statusUpper,
            'used_in_orders.$.updated_at': now,
          },
        },
      );
    }

    // Update linked specialist prescription if order has specialist_prescription reference
    if (order.specialist_prescription) {
      const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

      // Map order status to specialist prescription status (lowercase)
      const specialistStatusMap: any = {
        'PENDING': 'paid',
        'CONFIRMED': 'paid',
        'PAID': 'paid',
        'PROCESSING': 'processing',
        'DISPENSED': 'dispensed',
        'READY_FOR_PICKUP': 'dispensed',
        'SHIPPED': 'shipped',
        'OUT_FOR_DELIVERY': 'shipped',
        'DELIVERED': 'delivered',
        'COMPLETED': 'delivered',
      };

      const newSpecialistStatus = specialistStatusMap[statusUpper] || statusUpper.toLowerCase();

      // Build update data with timestamps
      const specialistUpdateData: any = {
        status: newSpecialistStatus,
        updated_at: now,
      };

      // Add status-specific timestamps
      if (newSpecialistStatus === 'processing') {
        specialistUpdateData.processing_started_at = now;
      } else if (newSpecialistStatus === 'dispensed') {
        specialistUpdateData.dispensed_at = now;
        specialistUpdateData.dispensed_by = userId ? new Types.ObjectId(userId) : null;
      } else if (newSpecialistStatus === 'shipped') {
        specialistUpdateData.shipped_at = now;
      } else if (newSpecialistStatus === 'delivered') {
        specialistUpdateData.delivered_at = now;
      }

      // Add to status history
      const specialistStatusHistoryEntry = {
        status: newSpecialistStatus,
        changed_at: now,
        changed_by: userId ? new Types.ObjectId(userId) : null,
        note: `Synced from pharmacy order ${order.order_number}`,
      };

      await SpecialistPrescriptionsCollection.updateOne(
        { _id: new Types.ObjectId(order.specialist_prescription) },
        {
          $set: specialistUpdateData,
          $push: { status_history: specialistStatusHistoryEntry },
        },
      );

      this.logger.log(`Synced status ${newSpecialistStatus} to specialist prescription ${order.specialist_prescription}`);
    }

    // Send email notification to patient
    await this.sendOrderStatusEmail(order, statusUpper.toLowerCase(), UsersCollection, 'PATIENT');

    return this.getOrderById(id);
  }

  /**
   * Fill order medications - marks all items as filled and changes status to DISPENSED
   */
  async fillOrderMedications(id: string, userId?: string): Promise<any> {
    const PrescriptionsCollection = this.connection.collection('specialistprescriptions');
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const UsersCollection = this.connection.collection('users');

    const now = new Date();

    // First try specialist prescriptions
    let order = await PrescriptionsCollection.findOne({
      _id: new Types.ObjectId(id),
    });

    if (order) {
      // Check if status allows filling
      const currentStatus = order.status?.toLowerCase();
      if (currentStatus !== 'processing') {
        throw new BadRequestException('Order must be in PROCESSING status to fill medications');
      }

      // Mark all items as filled
      const filledItems = (order.items || []).map((item: any) => ({
        ...item,
        is_filled: true,
        filled_at: now,
        filled_by: userId ? new Types.ObjectId(userId) : null,
      }));

      const updateData: any = {
        status: 'dispensed',
        items: filledItems,
        dispensed_at: now,
        dispensed_by: userId ? new Types.ObjectId(userId) : null,
        updated_at: now,
      };

      // Add to status history
      const statusHistoryEntry = {
        status: 'dispensed',
        changed_at: now,
        changed_by: userId ? new Types.ObjectId(userId) : null,
        note: 'Medications filled',
      };

      await PrescriptionsCollection.updateOne(
        { _id: new Types.ObjectId(id) },
        {
          $set: updateData,
          $push: { status_history: statusHistoryEntry },
        },
      );

      // Send email notification
      await this.sendOrderStatusEmail(order, 'dispensed', UsersCollection, 'SPECIALIST');

      return this.getOrderById(id);
    }

    // Try pharmacy orders (patient-created orders)
    order = await PharmacyOrdersCollection.findOne({
      _id: new Types.ObjectId(id),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if status allows filling
    const currentStatus = order.status?.toUpperCase();
    if (currentStatus !== 'PROCESSING') {
      throw new BadRequestException('Order must be in PROCESSING status to fill medications');
    }

    // Mark all items as filled
    const filledItems = (order.items || []).map((item: any) => ({
      ...item,
      is_filled: true,
      filled_at: now,
      filled_by: userId ? new Types.ObjectId(userId) : null,
    }));

    const updateData: any = {
      status: 'DISPENSED',
      items: filledItems,
      dispensed_at: now,
      dispensed_by: userId ? new Types.ObjectId(userId) : null,
      updated_at: now,
      updated_by: userId ? new Types.ObjectId(userId) : null,
    };

    // Add to status history
    const statusHistoryEntry = {
      status: 'DISPENSED',
      timestamp: now,
      updated_by: userId ? new Types.ObjectId(userId) : null,
      note: 'Medications filled',
    };

    await PharmacyOrdersCollection.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: updateData,
        $push: { status_history: statusHistoryEntry },
      },
    );

    // Sync status to linked specialist prescription
    if (order.specialist_prescription) {
      const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

      const specialistUpdateData: any = {
        status: 'dispensed',
        dispensed_at: now,
        dispensed_by: userId ? new Types.ObjectId(userId) : null,
        updated_at: now,
      };

      const specialistStatusHistoryEntry = {
        status: 'dispensed',
        changed_at: now,
        changed_by: userId ? new Types.ObjectId(userId) : null,
        note: `Medications filled via pharmacy order ${order.order_number}`,
      };

      await SpecialistPrescriptionsCollection.updateOne(
        { _id: new Types.ObjectId(order.specialist_prescription) },
        {
          $set: specialistUpdateData,
          $push: { status_history: specialistStatusHistoryEntry },
        },
      );

      this.logger.log(`Synced dispensed status to specialist prescription ${order.specialist_prescription}`);
    }

    // Send email notification
    await this.sendOrderStatusEmail(order, 'dispensed', UsersCollection, 'PATIENT');

    return this.getOrderById(id);
  }

  /**
   * Send email notification for order status change
   */
  private async sendOrderStatusEmail(
    order: any,
    newStatus: string,
    UsersCollection: any,
    source: 'SPECIALIST' | 'PATIENT' = 'SPECIALIST',
  ): Promise<void> {
    try {
      // Get patient ID based on order source
      const patientId = source === 'SPECIALIST' ? order.patient_id : order.patient;
      const orderNumber = source === 'SPECIALIST' ? order.prescription_number : order.order_number;

      // Get patient details
      if (!patientId) {
        this.logger.warn(`No patient_id found for order ${orderNumber}`);
        return;
      }

      const patient = await UsersCollection.findOne(
        { _id: new Types.ObjectId(patientId) },
        { projection: { 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact': 1 } },
      );

      if (!patient) {
        this.logger.warn(`Patient not found for order ${orderNumber}`);
        return;
      }

      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patientId}`);
        return;
      }

      const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';
      const prescriptionNumber = orderNumber;

      // Check if it's a delivery or pickup order
      // Patient orders use delivery_method and address_line1, specialist orders use delivery_address.street
      const isPickup = source === 'PATIENT'
        ? order.delivery_method === 'PICKUP'
        : !order.delivery_address?.street;

      // Build items list for email
      const items: PrescriptionItem[] = (order.items || []).map((item: any) => ({
        drug_name: item.drug_name || item.name || 'Unknown Medication',
        generic_name: item.generic_name,
        drug_strength: item.drug_strength || item.strength,
        quantity: item.quantity || 1,
        dosage: item.dosage || 'As directed',
        frequency: item.frequency || 'As prescribed',
        duration: item.duration || 'As needed',
        instructions: item.instructions || item.special_instructions,
        unit_price: item.unit_price || item.price || 0,
        total_price: item.total_price || (item.quantity * (item.unit_price || item.price || 0)) || 0,
      }));

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
      const deliveryFee = order.delivery_fee || order.shipping_fee || 0;
      const totalAmount = order.total_price || order.total_amount || (subtotal + deliveryFee);

      // Build delivery address based on order source
      let deliveryAddress;
      if (source === 'PATIENT' && order.delivery_address) {
        deliveryAddress = {
          recipient_name: order.delivery_address.recipient_name || patientName,
          street: order.delivery_address.address_line1 || '',
          city: order.delivery_address.city || '',
          state: order.delivery_address.state || '',
          phone: order.delivery_address.phone || '',
        };
      } else if (order.delivery_address) {
        deliveryAddress = {
          recipient_name: order.delivery_address.recipient_name || patientName,
          street: order.delivery_address.street || '',
          city: order.delivery_address.city || '',
          state: order.delivery_address.state || '',
          phone: order.delivery_address.phone || '',
        };
      }

      // Build comprehensive email data
      const emailData: OrderEmailData = {
        patientName,
        prescriptionNumber,
        items,
        subtotal,
        deliveryFee,
        totalAmount,
        currency: '₦',
        isPickup,
        deliveryAddress,
        trackingNumber: order.tracking_number || order.delivery_tracking_number,
        courierName: order.courier_name,
        estimatedDelivery: (order.estimated_delivery || order.estimated_delivery_date)
          ? new Date(order.estimated_delivery || order.estimated_delivery_date).toLocaleDateString('en-NG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : undefined,
        shippingMethod: order.shipping_method || 'Standard Delivery',
      };

      let emailBody: string;
      let subject: string;

      switch (newStatus) {
        case 'processing':
          emailBody = orderProcessingEmail(emailData);
          subject = `Your Order #${prescriptionNumber} is Being Processed`;
          break;

        case 'ready_for_pickup':
          // Get pharmacy info for pickup email
          const PharmaciesCollection = this.connection.collection('pharmacies');
          const pharmacyId = source === 'PATIENT' ? order.pharmacy : order.pharmacy_id;
          const pharmacy = pharmacyId
            ? await PharmaciesCollection.findOne(
                { _id: new Types.ObjectId(pharmacyId) },
                { projection: { name: 1, address: 1, phone: 1 } },
              )
            : null;

          const pickupItems = (order.items || []).map((item: any) => ({
            drug_name: item.drug_name || item.name || 'Medication',
            quantity: item.quantity || 1,
          }));

          emailBody = orderReadyForPickupEmail({
            patientName,
            prescriptionNumber,
            pickupCode: order.pickup_code || 'N/A',
            pickupPharmacyName: pharmacy?.name || 'Rapid Capsule Pharmacy',
            pickupPharmacyAddress: pharmacy?.address || '',
            pickupPharmacyPhone: pharmacy?.phone || '',
            items: pickupItems,
            totalAmount: totalAmount,
            currency: 'NGN',
          });
          subject = `Your Order #${prescriptionNumber} is Ready for Pickup!`;
          break;

        case 'dispensed':
          emailBody = orderDispensedEmail(emailData);
          subject = isPickup
            ? `Your Prescription #${prescriptionNumber} is Ready for Pickup!`
            : `Your Prescription #${prescriptionNumber} Has Been Dispensed`;
          break;

        case 'shipped':
        case 'out_for_delivery':
          emailBody = prescriptionShippedEmail(emailData);
          subject = newStatus === 'out_for_delivery'
            ? `Your Order #${prescriptionNumber} is Out for Delivery!`
            : `Your Order #${prescriptionNumber} Has Been Shipped!`;
          break;

        case 'delivered':
        case 'completed':
          emailBody = prescriptionDeliveredEmail(emailData);
          subject = `Your Order #${prescriptionNumber} Has Been Delivered!`;
          break;

        default:
          // No email for other statuses
          this.logger.log(`No email template for status: ${newStatus}`);
          return;
      }

      // Send the email
      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject,
        emailBody,
        attachments: [],
      });

      this.logger.log(`Order status email sent to ${patientEmail} for ${prescriptionNumber} (${newStatus})`);
    } catch (error) {
      this.logger.error(`Failed to send order status email for ${order.prescription_number}:`, error);
      // Don't throw - email failure shouldn't block status update
    }
  }

  // ============ PHARMACY MANAGEMENT ============

  async getPharmacies(query: {
    page?: number;
    limit?: number;
    search?: string;
    verification_status?: string;
    state?: string;
    is_online?: boolean;
    is_pickup_center?: boolean;
  }): Promise<any> {
    const { page = 1, limit = 25, search, verification_status, state, is_online, is_pickup_center } = query;
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { trading_name: { $regex: search, $options: 'i' } },
        { registration_number: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (verification_status) {
      filter.verification_status = verification_status.toUpperCase();
    }

    if (state) {
      filter['address.state'] = { $regex: state, $options: 'i' };
    }

    if (is_online !== undefined) {
      filter.is_online = is_online;
    }

    if (is_pickup_center !== undefined) {
      filter.is_pickup_center = is_pickup_center;
    }

    const skip = (page - 1) * limit;

    const [pharmacies, total] = await Promise.all([
      PharmaciesCollection.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      PharmaciesCollection.countDocuments(filter),
    ]);

    return {
      pharmacies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPharmacyById(id: string): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    // Check if id is a valid ObjectId or a slug
    let pharmacy;
    if (Types.ObjectId.isValid(id) && id.length === 24) {
      pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(id) });
    }

    // If not found by ID, try finding by slug
    if (!pharmacy) {
      pharmacy = await PharmaciesCollection.findOne({ slug: id });
    }

    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }
    return pharmacy;
  }

  /**
   * Generate slug from pharmacy name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate unique slug for a pharmacy
   */
  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const PharmaciesCollection = this.connection.collection('pharmacies');
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query: any = { slug };
      if (excludeId) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }
      const existing = await PharmaciesCollection.findOne(query);
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  /**
   * Generate slugs for all existing pharmacies that don't have one
   */
  async generateSlugsForExistingPharmacies(): Promise<{ updated: number; errors: string[] }> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    // Find all pharmacies without a slug
    const pharmaciesWithoutSlug = await PharmaciesCollection.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' },
      ],
    }).toArray();

    let updated = 0;
    const errors: string[] = [];

    for (const pharmacy of pharmaciesWithoutSlug) {
      try {
        const slug = await this.generateUniqueSlug(pharmacy.name, pharmacy._id.toString());
        await PharmaciesCollection.updateOne(
          { _id: pharmacy._id },
          { $set: { slug, updated_at: new Date() } },
        );
        updated++;
      } catch (error) {
        errors.push(`Failed to generate slug for pharmacy ${pharmacy._id}: ${error.message}`);
      }
    }

    return { updated, errors };
  }

  async createPharmacy(data: any): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    // Check for duplicate registration number or email
    const existing = await PharmaciesCollection.findOne({
      $or: [
        { registration_number: data.registration_number },
        { email: data.email },
      ],
    });

    if (existing) {
      throw new BadRequestException('A pharmacy with this registration number or email already exists');
    }

    // Generate unique slug from name
    const slug = await this.generateUniqueSlug(data.name);

    const pharmacy = {
      ...data,
      slug,
      verification_status: 'PENDING',
      is_active: true,
      is_online: false,
      is_suspended: false,
      average_rating: 0,
      total_ratings: 0,
      total_orders: 0,
      wallet_balance: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await PharmaciesCollection.insertOne(pharmacy);
    return { ...pharmacy, _id: result.insertedId };
  }

  async updatePharmacy(id: string, data: any): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(id) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    // Don't allow updating registration_number or email to existing values
    if (data.registration_number && data.registration_number !== pharmacy.registration_number) {
      const existing = await PharmaciesCollection.findOne({
        registration_number: data.registration_number,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existing) {
        throw new BadRequestException('Registration number already in use');
      }
    }

    if (data.email && data.email !== pharmacy.email) {
      const existing = await PharmaciesCollection.findOne({
        email: data.email,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updateData: any = {
      ...data,
      updated_at: new Date(),
    };

    // Regenerate slug if name changed
    if (data.name && data.name !== pharmacy.name) {
      updateData.slug = await this.generateUniqueSlug(data.name, id);
    }

    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: updateData },
    );

    return this.getPharmacyById(id);
  }

  async verifyPharmacy(id: string, data: { verification_status: string; verification_notes?: string }, adminId: string): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(id) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    const updateData: any = {
      verification_status: data.verification_status.toUpperCase(),
      verification_notes: data.verification_notes || '',
      verified_at: new Date(),
      verified_by: new Types.ObjectId(adminId),
      updated_at: new Date(),
    };

    // If verified, set is_online to true
    if (data.verification_status.toUpperCase() === 'VERIFIED') {
      updateData.is_online = true;
    }

    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: updateData },
    );

    return this.getPharmacyById(id);
  }

  async suspendPharmacy(id: string, reason: string, adminId: string): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(id) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: {
          is_suspended: true,
          is_online: false,
          suspension_reason: reason,
          suspended_at: new Date(),
          suspended_by: new Types.ObjectId(adminId),
          updated_at: new Date(),
        },
      },
    );

    return this.getPharmacyById(id);
  }

  async reactivatePharmacy(id: string, adminId: string): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(id) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: {
          is_suspended: false,
          is_online: true,
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
          updated_at: new Date(),
        },
      },
    );

    return this.getPharmacyById(id);
  }

  async deletePharmacy(id: string): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(id) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    // Soft delete by setting is_active to false
    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: {
          is_active: false,
          is_online: false,
          deleted_at: new Date(),
          updated_at: new Date(),
        },
      },
    );

    return { message: 'Pharmacy deleted successfully' };
  }

  async getPharmacyStats(): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const [total, verified, pending, online, suspended] = await Promise.all([
      PharmaciesCollection.countDocuments({ is_active: { $ne: false } }),
      PharmaciesCollection.countDocuments({ verification_status: 'VERIFIED', is_active: { $ne: false } }),
      PharmaciesCollection.countDocuments({ verification_status: 'PENDING', is_active: { $ne: false } }),
      PharmaciesCollection.countDocuments({ is_online: true, is_active: { $ne: false } }),
      PharmaciesCollection.countDocuments({ is_suspended: true, is_active: { $ne: false } }),
    ]);

    return {
      total,
      verified,
      pending,
      online,
      suspended,
    };
  }

  // ============ PICKUP CENTERS ============

  async getPickupCenters(query: {
    state?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // in km
  }): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    // Base filter for active pickup centers
    const filter: any = {
      is_pickup_center: true,
      is_active: { $ne: false },
      is_suspended: { $ne: true },
      verification_status: 'VERIFIED',
    };

    // Filter by state if provided
    if (query.state) {
      filter['address.state'] = { $regex: new RegExp(query.state, 'i') };
    }

    // Filter by city if provided
    if (query.city) {
      filter['address.city'] = { $regex: new RegExp(query.city, 'i') };
    }

    // If coordinates provided, use geospatial query
    if (query.latitude && query.longitude) {
      const radiusInMeters = (query.radius || 10) * 1000; // Default 10km

      // Use $geoNear aggregation for distance calculation
      const pickupCenters = await PharmaciesCollection.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [query.longitude, query.latitude],
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            query: filter,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            address: 1,
            phone: 1,
            email: 1,
            operating_hours: 1,
            is_24_hours: 1,
            pickup_instructions: 1,
            pickup_center_settings: 1,
            average_rating: 1,
            distance: { $divide: ['$distance', 1000] }, // Convert to km
          },
        },
        { $sort: { distance: 1 } },
        { $limit: 50 },
      ]).toArray();

      return {
        pickup_centers: pickupCenters,
        total: pickupCenters.length,
        query: {
          latitude: query.latitude,
          longitude: query.longitude,
          radius: query.radius || 10,
        },
      };
    }

    // Without coordinates, just return all matching pickup centers
    const pickupCenters = await PharmaciesCollection.find(filter, {
      projection: {
        _id: 1,
        name: 1,
        slug: 1,
        address: 1,
        phone: 1,
        email: 1,
        operating_hours: 1,
        is_24_hours: 1,
        pickup_instructions: 1,
        pickup_center_settings: 1,
        average_rating: 1,
      },
    })
      .sort({ name: 1 })
      .limit(100)
      .toArray();

    return {
      pickup_centers: pickupCenters,
      total: pickupCenters.length,
    };
  }

  // ============ PHARMACY DOCUMENTS ============

  async uploadPharmacyDocument(
    pharmacyId: string,
    file: Express.Multer.File,
    documentType: string,
    uploadedBy: string,
  ): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(pharmacyId) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    // Upload file to S3
    const fileUrl = await this.fileUploadHelper.uploadToS3(
      file.buffer,
      file.originalname,
      `pharmacy-documents/${pharmacyId}`,
    );

    // Create document record
    const document = {
      document_type: documentType,
      url: fileUrl,
      file_name: file.originalname,
      uploaded_at: new Date(),
      verified: false,
    };

    // Add to documents array
    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(pharmacyId) },
      {
        $push: { documents: document },
        $set: { updated_at: new Date() },
      },
    );

    // Return updated pharmacy
    return await PharmaciesCollection.findOne({ _id: new Types.ObjectId(pharmacyId) });
  }

  async removePharmacyDocument(
    pharmacyId: string,
    docIndex: number,
    removedBy: string,
  ): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(pharmacyId) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    const documents = pharmacy.documents || [];
    if (docIndex < 0 || docIndex >= documents.length) {
      throw new NotFoundException('Document not found');
    }

    const documentToRemove = documents[docIndex];

    // Try to delete from S3 (don't fail if this errors)
    try {
      if (documentToRemove.url) {
        await this.fileUploadHelper.deleteFromS3(documentToRemove.url);
      }
    } catch (error) {
      console.error('Error deleting document from S3:', error);
    }

    // Remove from documents array
    documents.splice(docIndex, 1);

    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(pharmacyId) },
      {
        $set: {
          documents,
          updated_at: new Date(),
        },
      },
    );

    // Return updated pharmacy
    return await PharmaciesCollection.findOne({ _id: new Types.ObjectId(pharmacyId) });
  }

  async verifyPharmacyDocument(
    pharmacyId: string,
    docIndex: number,
    verified: boolean,
    rejectionReason: string | undefined,
    verifiedBy: string,
  ): Promise<any> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(pharmacyId) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    const documents = pharmacy.documents || [];
    if (docIndex < 0 || docIndex >= documents.length) {
      throw new NotFoundException('Document not found');
    }

    // Update the document verification status
    documents[docIndex].verified = verified;
    documents[docIndex].verified_at = new Date();
    documents[docIndex].verified_by = new Types.ObjectId(verifiedBy);

    if (!verified && rejectionReason) {
      documents[docIndex].rejection_reason = rejectionReason;
    } else {
      // Clear rejection reason if approving
      delete documents[docIndex].rejection_reason;
    }

    await PharmaciesCollection.updateOne(
      { _id: new Types.ObjectId(pharmacyId) },
      {
        $set: {
          documents,
          updated_at: new Date(),
        },
      },
    );

    // Return updated pharmacy
    return await PharmaciesCollection.findOne({ _id: new Types.ObjectId(pharmacyId) });
  }

  async getPharmacyDocumentPresignedUrl(
    pharmacyId: string,
    docIndex: number,
  ): Promise<{ url: string; expires_in: number }> {
    const PharmaciesCollection = this.connection.collection('pharmacies');

    const pharmacy = await PharmaciesCollection.findOne({ _id: new Types.ObjectId(pharmacyId) });
    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    const documents = pharmacy.documents || [];
    if (docIndex < 0 || docIndex >= documents.length) {
      throw new NotFoundException('Document not found');
    }

    const document = documents[docIndex];
    if (!document.url) {
      throw new NotFoundException('Document URL not found');
    }

    // Generate presigned URL valid for 1 hour
    const presignedUrl = await this.fileUploadHelper.getPresignedUrl(document.url, 3600);

    return {
      url: presignedUrl,
      expires_in: 3600, // seconds
    };
  }

  // ============ RATINGS & REVIEWS ============

  async getAllRatings(query: {
    page?: number;
    limit?: number;
    type?: string;
    minRating?: number;
    maxRating?: number;
  }): Promise<any> {
    const { page = 1, limit = 25, type, minRating, maxRating } = query;
    const skip = (page - 1) * limit;

    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const PrescriptionsCollection = this.connection.collection('specialistprescriptions');
    const UsersCollection = this.connection.collection('users');

    const ratingFilter: any = { rating: { $exists: true, $ne: null } };
    if (minRating) ratingFilter.rating.$gte = Number(minRating);
    if (maxRating) ratingFilter.rating.$lte = Number(maxRating);

    const ratings: any[] = [];

    // Get pharmacy order ratings
    if (!type || type === 'pharmacy_order') {
      const pharmacyOrderRatings = await PharmacyOrdersCollection.find(ratingFilter)
        .sort({ rated_at: -1 })
        .toArray();

      for (const order of pharmacyOrderRatings) {
        const patientId = (order.patient as any)?._id || order.patient;
        const patient = await UsersCollection.findOne(
          { _id: new Types.ObjectId(patientId) },
          { projection: { 'profile.first_name': 1, 'profile.last_name': 1, email: 1, 'profile.contact.email': 1 } },
        );

        ratings.push({
          _id: order._id,
          type: 'pharmacy_order',
          order_number: order.order_number,
          rating: order.rating,
          review: order.review,
          rated_at: order.rated_at,
          patient: patient ? {
            _id: patientId,
            name: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim(),
            email: patient.email || patient?.profile?.contact?.email,
          } : null,
          status: order.status,
        });
      }
    }

    // Get specialist prescription ratings
    if (!type || type === 'prescription') {
      const prescriptionRatings = await PrescriptionsCollection.find(ratingFilter)
        .sort({ rated_at: -1 })
        .toArray();

      for (const prescription of prescriptionRatings) {
        const patientId = (prescription.patient_id as any)?._id || prescription.patient_id;
        const patient = await UsersCollection.findOne(
          { _id: new Types.ObjectId(patientId) },
          { projection: { 'profile.first_name': 1, 'profile.last_name': 1, email: 1, 'profile.contact.email': 1 } },
        );

        const specialistId = (prescription.specialist_id as any)?._id || prescription.specialist_id;
        const specialist = await UsersCollection.findOne(
          { _id: new Types.ObjectId(specialistId) },
          { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
        );

        ratings.push({
          _id: prescription._id,
          type: 'prescription',
          order_number: prescription.prescription_number,
          rating: prescription.rating,
          review: prescription.review,
          rated_at: prescription.rated_at,
          patient: patient ? {
            _id: patientId,
            name: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim(),
            email: patient.email || patient?.profile?.contact?.email,
          } : null,
          specialist: specialist ? {
            _id: specialistId,
            name: `${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim(),
          } : null,
          status: prescription.status,
        });
      }
    }

    // Sort all ratings by rated_at
    ratings.sort((a, b) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime());

    // Paginate
    const total = ratings.length;
    const paginatedRatings = ratings.slice(skip, skip + limit);

    return {
      ratings: paginatedRatings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRatingsStats(): Promise<any> {
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const PrescriptionsCollection = this.connection.collection('specialistprescriptions');

    const ratingFilter = { rating: { $exists: true, $ne: null } };

    // Get pharmacy order ratings
    const pharmacyOrderRatings = await PharmacyOrdersCollection.find(ratingFilter, { projection: { rating: 1 } }).toArray();

    // Get prescription ratings
    const prescriptionRatings = await PrescriptionsCollection.find(ratingFilter, { projection: { rating: 1 } }).toArray();

    const allRatings = [
      ...pharmacyOrderRatings.map(r => r.rating),
      ...prescriptionRatings.map(r => r.rating),
    ];

    const totalRatings = allRatings.length;
    const averageRating = totalRatings > 0
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / totalRatings) * 10) / 10
      : 0;

    // Rating distribution
    const distribution = {
      5: allRatings.filter(r => r === 5).length,
      4: allRatings.filter(r => r === 4).length,
      3: allRatings.filter(r => r === 3).length,
      2: allRatings.filter(r => r === 2).length,
      1: allRatings.filter(r => r === 1).length,
    };

    return {
      totalRatings,
      averageRating,
      pharmacyOrderRatings: pharmacyOrderRatings.length,
      prescriptionRatings: prescriptionRatings.length,
      distribution,
    };
  }

  // ============ PHARMACY PERFORMANCE REPORT ============

  /**
   * Get comprehensive pharmacy performance report
   */
  async getPharmacyPerformance(pharmacyId: string, period: string = '30d'): Promise<any> {
    const pharmacy = await this.connection.collection('pharmacies').findOne({
      _id: new Types.ObjectId(pharmacyId),
    });

    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
    }

    const pharmacyObjectId = new Types.ObjectId(pharmacyId);

    // Fetch all data in parallel
    const [
      overview,
      orderAnalytics,
      financialMetrics,
      deliveryPerformance,
      customerSatisfaction,
      inventoryHealth,
      benchmarks,
    ] = await Promise.all([
      this.getPharmacyOverview(pharmacyObjectId, startDate, now, previousStartDate, previousEndDate),
      this.getPharmacyOrderAnalytics(pharmacyObjectId, startDate, now, period),
      this.getPharmacyFinancialMetrics(pharmacyObjectId, startDate, now, previousStartDate, previousEndDate),
      this.getPharmacyDeliveryPerformance(pharmacyObjectId, startDate, now),
      this.getPharmacyCustomerSatisfaction(pharmacyObjectId, startDate, now),
      this.getPharmacyInventoryHealth(pharmacyObjectId),
      this.getPharmacyBenchmarks(pharmacyObjectId, startDate, now),
    ]);

    return {
      pharmacy: {
        _id: pharmacy._id,
        name: pharmacy.name,
        address: pharmacy.address,
        logo: pharmacy.logo,
        status: pharmacy.status,
      },
      period,
      dateRange: { startDate, endDate: now },
      overview,
      orderAnalytics,
      financialMetrics,
      delivery: deliveryPerformance,
      customerSatisfaction,
      inventoryHealth,
      benchmarks,
    };
  }

  /**
   * Get pharmacy overview KPIs
   * Includes both pharmacyorders (patient orders) and specialistprescriptions (doctor orders)
   */
  private async getPharmacyOverview(
    pharmacyId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
  ): Promise<any> {
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    // Normalize status for comparison (specialist uses lowercase, pharmacyorders uses uppercase)
    const normalizeStatus = (status: string) => status?.toLowerCase();
    const isDelivered = (status: string) => ['delivered', 'completed', 'paid'].includes(normalizeStatus(status));
    const isCancelled = (status: string) => normalizeStatus(status) === 'cancelled';

    // Current period - pharmacy orders
    const currentPharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
    }).toArray();

    // Current period - specialist prescriptions for this pharmacy
    const currentSpecialistOrders = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
      status: { $ne: 'draft' }, // Exclude drafts
    }).toArray();

    // Previous period
    const previousPharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      created_at: { $gte: prevStartDate, $lte: prevEndDate },
    }).toArray();

    const previousSpecialistOrders = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      created_at: { $gte: prevStartDate, $lte: prevEndDate },
      status: { $ne: 'draft' },
    }).toArray();

    // All time stats
    const allTimePharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
    }).toArray();

    const allTimeSpecialistOrders = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      status: { $ne: 'draft' },
    }).toArray();

    // Combine orders
    const currentOrders = [...currentPharmacyOrders, ...currentSpecialistOrders];
    const previousOrders = [...previousPharmacyOrders, ...previousSpecialistOrders];
    const allTimeOrders = [...allTimePharmacyOrders, ...allTimeSpecialistOrders];

    // Calculate metrics
    const currentRevenue = currentOrders
      .filter(o => isDelivered(o.status))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const previousRevenue = previousOrders
      .filter(o => isDelivered(o.status))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const allTimeRevenue = allTimeOrders
      .filter(o => isDelivered(o.status))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const currentCompleted = currentOrders.filter(o => isDelivered(o.status)).length;
    const currentCancelled = currentOrders.filter(o => isCancelled(o.status)).length;
    const previousCompleted = previousOrders.filter(o => isDelivered(o.status)).length;

    const completionRate = currentOrders.length > 0
      ? Math.round((currentCompleted / currentOrders.length) * 100)
      : 0;

    const avgOrderValue = currentCompleted > 0
      ? Math.round(currentRevenue / currentCompleted)
      : 0;

    // Get inventory count - count unique drugs with stock
    const drugsWithStock = await this.stockBatchModel.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          status: BatchStatus.ACTIVE,
          quantity_available: { $gt: 0 },
        },
      },
      {
        $group: { _id: '$drug_id' },
      },
      {
        $count: 'count',
      },
    ]).exec();

    const inventoryCount = drugsWithStock[0]?.count || 0;

    // Calculate trends (percentage change)
    const revenueTrend = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    const ordersTrend = previousOrders.length > 0
      ? Math.round(((currentOrders.length - previousOrders.length) / previousOrders.length) * 100)
      : currentOrders.length > 0 ? 100 : 0;

    const completedTrend = previousCompleted > 0
      ? Math.round(((currentCompleted - previousCompleted) / previousCompleted) * 100)
      : currentCompleted > 0 ? 100 : 0;

    return {
      totalRevenue: {
        current: currentRevenue,
        allTime: allTimeRevenue,
        trend: revenueTrend,
      },
      totalOrders: {
        current: currentOrders.length,
        allTime: allTimeOrders.length,
        trend: ordersTrend,
      },
      completedOrders: {
        current: currentCompleted,
        trend: completedTrend,
      },
      cancelledOrders: currentCancelled,
      completionRate,
      avgOrderValue,
      activeInventoryItems: inventoryCount,
      averageRating: await this.getPharmacyAverageRating(pharmacyId),
    };
  }

  /**
   * Get pharmacy average rating
   */
  private async getPharmacyAverageRating(pharmacyId: Types.ObjectId): Promise<number> {
    const OrdersCollection = this.connection.collection('pharmacyorders');

    const ratedOrders = await OrdersCollection.find({
      pharmacy: pharmacyId,
      rating: { $exists: true, $ne: null },
    }, { projection: { rating: 1 } }).toArray();

    if (ratedOrders.length === 0) return 0;

    const avgRating = ratedOrders.reduce((sum, o) => sum + o.rating, 0) / ratedOrders.length;
    return Math.round(avgRating * 10) / 10;
  }

  /**
   * Get pharmacy order analytics with time series data
   * Includes both pharmacyorders and specialistprescriptions
   */
  private async getPharmacyOrderAnalytics(
    pharmacyId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
    period: string,
  ): Promise<any> {
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    // Determine date format based on period
    let dateFormat: string;
    if (period === '7d' || period === '30d') {
      dateFormat = '%Y-%m-%d';
    } else if (period === '90d') {
      dateFormat = '%Y-W%V';
    } else {
      dateFormat = '%Y-%m';
    }

    // Pharmacy orders volume over time
    const pharmacyVolumeOverTime = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total_amount' },
        },
      },
    ]).toArray();

    // Specialist prescriptions volume over time
    const specialistVolumeOverTime = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
          status: { $ne: 'draft' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total_amount' },
        },
      },
    ]).toArray();

    // Merge volume data
    const volumeMap = new Map<string, { count: number; revenue: number }>();
    pharmacyVolumeOverTime.forEach(v => volumeMap.set(v._id, { count: v.count, revenue: v.revenue || 0 }));
    specialistVolumeOverTime.forEach(v => {
      const existing = volumeMap.get(v._id) || { count: 0, revenue: 0 };
      volumeMap.set(v._id, { count: existing.count + v.count, revenue: existing.revenue + (v.revenue || 0) });
    });

    const volumeOverTime = Array.from(volumeMap.entries())
      .map(([date, data]) => ({ date, count: data.count, revenue: data.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Status distribution - pharmacy orders
    const pharmacyStatusDist = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Status distribution - specialist prescriptions (normalize to uppercase)
    const specialistStatusDist = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
          status: { $ne: 'draft' },
        },
      },
      {
        $group: {
          _id: { $toUpper: '$status' },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Merge status distributions
    const statusMap = new Map<string, number>();
    pharmacyStatusDist.forEach(s => statusMap.set(s._id, (statusMap.get(s._id) || 0) + s.count));
    specialistStatusDist.forEach(s => statusMap.set(s._id, (statusMap.get(s._id) || 0) + s.count));

    const statusDistribution = Array.from(statusMap.entries())
      .map(([_id, count]) => ({ _id, count }));

    // Order type distribution - include specialist as separate type
    const pharmacyTypeDist = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$order_type',
          count: { $sum: 1 },
          revenue: { $sum: '$total_amount' },
        },
      },
    ]).toArray();

    // Add specialist prescriptions as "SPECIALIST" type
    const specialistTotal = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
          status: { $ne: 'draft' },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$total_amount' },
        },
      },
    ]).toArray();

    const typeDistribution = [...pharmacyTypeDist];
    if (specialistTotal.length > 0 && specialistTotal[0].count > 0) {
      typeDistribution.push({
        _id: 'SPECIALIST',
        count: specialistTotal[0].count,
        revenue: specialistTotal[0].revenue || 0,
      });
    }

    // Payment method distribution (from both)
    const pharmacyPaymentDist = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
          payment_status: 'PAID',
        },
      },
      {
        $group: {
          _id: '$payment_method',
          count: { $sum: 1 },
          amount: { $sum: '$total_amount' },
        },
      },
    ]).toArray();

    const specialistPaymentDist = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
          payment_status: 'paid',
        },
      },
      {
        $group: {
          _id: '$payment_method',
          count: { $sum: 1 },
          amount: { $sum: '$total_amount' },
        },
      },
    ]).toArray();

    // Merge payment distributions
    const paymentMap = new Map<string, { count: number; amount: number }>();
    pharmacyPaymentDist.forEach(p => paymentMap.set(p._id || 'Unknown', { count: p.count, amount: p.amount || 0 }));
    specialistPaymentDist.forEach(p => {
      const key = p._id || 'Unknown';
      const existing = paymentMap.get(key) || { count: 0, amount: 0 };
      paymentMap.set(key, { count: existing.count + p.count, amount: existing.amount + (p.amount || 0) });
    });

    const paymentMethodDistribution = Array.from(paymentMap.entries())
      .map(([method, data]) => ({ _id: method, count: data.count, amount: data.amount }));

    // Calculate total revenue for the period
    const totalRevenue = volumeOverTime.reduce((sum, v) => sum + v.revenue, 0);

    return {
      timeSeries: volumeOverTime.map(v => ({
        date: v.date,
        count: v.count,
        revenue: v.revenue,
      })),
      totalRevenue,
      statusDistribution: statusDistribution.map(s => ({
        _id: s._id,
        count: s.count,
      })),
      orderTypeDistribution: typeDistribution.map(t => ({
        _id: t._id || 'UNKNOWN',
        count: t.count,
        revenue: t.revenue || 0,
      })),
      paymentMethodDistribution: paymentMethodDistribution.map(p => ({
        method: p._id,
        count: p.count,
        amount: p.amount,
      })),
    };
  }

  /**
   * Get pharmacy financial metrics
   * Includes both pharmacyorders and specialistprescriptions
   */
  private async getPharmacyFinancialMetrics(
    pharmacyId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
  ): Promise<any> {
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    // Revenue over time from pharmacy orders
    const pharmacyRevenueOverTime = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
          status: { $in: ['DELIVERED', 'COMPLETED'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          revenue: { $sum: '$total_amount' },
          orders: { $sum: 1 },
        },
      },
    ]).toArray();

    // Revenue over time from specialist prescriptions
    const prescriptionRevenueOverTime = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
          status: { $in: ['delivered', 'paid'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          revenue: { $sum: '$total_amount' },
          orders: { $sum: 1 },
        },
      },
    ]).toArray();

    // Merge revenue over time
    const revenueMap = new Map<string, { revenue: number; orders: number }>();
    for (const r of pharmacyRevenueOverTime) {
      revenueMap.set(r._id, { revenue: r.revenue, orders: r.orders });
    }
    for (const r of prescriptionRevenueOverTime) {
      const existing = revenueMap.get(r._id);
      if (existing) {
        existing.revenue += r.revenue;
        existing.orders += r.orders;
      } else {
        revenueMap.set(r._id, { revenue: r.revenue, orders: r.orders });
      }
    }
    const revenueOverTime = Array.from(revenueMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top selling products from pharmacy orders
    const pharmacyTopProducts = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
          status: { $in: ['DELIVERED', 'COMPLETED'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.drug_name',
          totalRevenue: { $sum: '$items.total_price' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
    ]).toArray();

    // Top selling products from specialist prescriptions
    const prescriptionTopProducts = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
          status: { $in: ['delivered', 'paid'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.drug_name',
          totalRevenue: { $sum: '$items.total_price' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
    ]).toArray();

    // Merge top products
    const productMap = new Map<string, { totalRevenue: number; totalQuantity: number; orderCount: number }>();
    for (const p of pharmacyTopProducts) {
      productMap.set(p._id, { totalRevenue: p.totalRevenue, totalQuantity: p.totalQuantity, orderCount: p.orderCount });
    }
    for (const p of prescriptionTopProducts) {
      const existing = productMap.get(p._id);
      if (existing) {
        existing.totalRevenue += p.totalRevenue;
        existing.totalQuantity += p.totalQuantity;
        existing.orderCount += p.orderCount;
      } else {
        productMap.set(p._id, { totalRevenue: p.totalRevenue, totalQuantity: p.totalQuantity, orderCount: p.orderCount });
      }
    }

    const topProductsByRevenue = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const topProductsByQuantity = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Average order value trend - combine both sources
    const allCurrentOrders: any[] = [];

    // Get pharmacy orders for current period
    const currentPharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
      status: { $in: ['DELIVERED', 'COMPLETED'] },
    }).toArray();
    allCurrentOrders.push(...currentPharmacyOrders);

    // Get specialist prescriptions for current period
    const currentPrescriptionOrders = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
      status: { $in: ['delivered', 'paid'] },
    }).toArray();
    allCurrentOrders.push(...currentPrescriptionOrders);

    // Group by date for avg order value trend
    const avgValueMap = new Map<string, { total: number; count: number }>();
    for (const o of allCurrentOrders) {
      const date = new Date(o.created_at).toISOString().split('T')[0];
      const existing = avgValueMap.get(date);
      if (existing) {
        existing.total += o.total_amount || 0;
        existing.count += 1;
      } else {
        avgValueMap.set(date, { total: o.total_amount || 0, count: 1 });
      }
    }
    const avgOrderValueTrend = Array.from(avgValueMap.entries())
      .map(([date, data]) => ({ date, avgValue: Math.round(data.total / data.count), orders: data.count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get previous period orders
    const prevPharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      created_at: { $gte: prevStartDate, $lte: prevEndDate },
      status: { $in: ['DELIVERED', 'COMPLETED'] },
    }).toArray();

    const prevPrescriptionOrders = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      created_at: { $gte: prevStartDate, $lte: prevEndDate },
      status: { $in: ['delivered', 'paid'] },
    }).toArray();

    const allPreviousOrders = [...prevPharmacyOrders, ...prevPrescriptionOrders];

    const totalRevenue = allCurrentOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const prevTotalRevenue = allPreviousOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Format revenue data
    const formattedRevenueOverTime = revenueOverTime.map(r => ({
      date: r.date,
      revenue: r.revenue,
      orders: r.orders,
    }));

    return {
      revenueOverTime: formattedRevenueOverTime,
      // Frontend expects 'revenueByPeriod'
      revenueByPeriod: formattedRevenueOverTime,
      // Frontend expects 'topProducts' with 'drug_name' field
      topProducts: topProductsByRevenue.map(p => ({
        drug_name: p.name,
        revenue: p.totalRevenue,
        quantity: p.totalQuantity,
        orders: p.orderCount,
      })),
      topProductsByRevenue: topProductsByRevenue.map(p => ({
        name: p.name,
        revenue: p.totalRevenue,
        quantity: p.totalQuantity,
        orders: p.orderCount,
      })),
      topProductsByQuantity: topProductsByQuantity.map(p => ({
        name: p.name,
        quantity: p.totalQuantity,
        revenue: p.totalRevenue,
        orders: p.orderCount,
      })),
      avgOrderValueTrend,
      summary: {
        totalRevenue,
        previousRevenue: prevTotalRevenue,
        revenueTrend: prevTotalRevenue > 0
          ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
          : 0,
        avgOrderValue: allCurrentOrders.length > 0
          ? Math.round(totalRevenue / allCurrentOrders.length)
          : 0,
      },
    };
  }

  /**
   * Get pharmacy delivery performance metrics
   * Includes both pharmacyorders and specialistprescriptions
   */
  private async getPharmacyDeliveryPerformance(
    pharmacyId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    // Get delivered pharmacy orders
    const deliveredPharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
      status: { $in: ['DELIVERED', 'COMPLETED'] },
    }).toArray();

    // Get delivered specialist prescriptions for this pharmacy
    const deliveredSpecialistOrders = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
      status: { $in: ['delivered', 'paid'] },
    }).toArray();

    // Combine delivered orders
    const allDeliveredOrders = [...deliveredPharmacyOrders, ...deliveredSpecialistOrders];

    // Calculate fulfillment times (for orders that have delivery dates)
    const fulfillmentTimes = allDeliveredOrders
      .filter(o => o.created_at && (o.actual_delivery_date || o.delivered_at || o.updated_at))
      .map(o => {
        const created = new Date(o.created_at).getTime();
        const delivered = new Date(o.actual_delivery_date || o.delivered_at || o.updated_at).getTime();
        return (delivered - created) / (1000 * 60 * 60); // Hours
      })
      .filter(t => t > 0 && t < 720); // Filter out invalid times (0 to 30 days)

    const avgFulfillmentTime = fulfillmentTimes.length > 0
      ? Math.round((fulfillmentTimes.reduce((a, b) => a + b, 0) / fulfillmentTimes.length) * 10) / 10
      : 0;

    // Delivery method distribution (from pharmacy orders)
    const deliveryMethodStats = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$delivery_method',
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Add specialist prescriptions as "Prescription" delivery type
    const specialistCount = deliveredSpecialistOrders.length;
    if (specialistCount > 0) {
      deliveryMethodStats.push({ _id: 'PRESCRIPTION', count: specialistCount });
    }

    // On-time delivery rate
    const ordersWithEstimate = allDeliveredOrders.filter(
      o => o.estimated_delivery_date && (o.actual_delivery_date || o.delivered_at)
    );
    const onTimeDeliveries = ordersWithEstimate.filter(o => {
      const estimated = new Date(o.estimated_delivery_date).getTime();
      const actual = new Date(o.actual_delivery_date || o.delivered_at).getTime();
      return actual <= estimated;
    });
    const onTimeRate = ordersWithEstimate.length > 0
      ? Math.round((onTimeDeliveries.length / ordersWithEstimate.length) * 100)
      : allDeliveredOrders.length > 0 ? 100 : 0; // 100% if no estimates but deliveries exist

    // Fulfillment time distribution
    const timeDistribution = {
      under6h: fulfillmentTimes.filter(t => t < 6).length,
      '6to12h': fulfillmentTimes.filter(t => t >= 6 && t < 12).length,
      '12to24h': fulfillmentTimes.filter(t => t >= 12 && t < 24).length,
      '24to48h': fulfillmentTimes.filter(t => t >= 24 && t < 48).length,
      over48h: fulfillmentTimes.filter(t => t >= 48).length,
    };

    // Daily delivery count - combine both collections
    const pharmacyDailyDeliveries = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
          status: { $in: ['DELIVERED', 'COMPLETED'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$actual_delivery_date', '$updated_at'] } } },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const specialistDailyDeliveries = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          created_at: { $gte: startDate, $lte: endDate },
          status: { $in: ['delivered', 'paid'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$delivered_at', '$updated_at'] } } },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Merge daily deliveries
    const dailyMap = new Map<string, number>();
    pharmacyDailyDeliveries.forEach(d => dailyMap.set(d._id, (dailyMap.get(d._id) || 0) + d.count));
    specialistDailyDeliveries.forEach(d => dailyMap.set(d._id, (dailyMap.get(d._id) || 0) + d.count));

    const dailyDeliveries = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      avgFulfillmentTimeHours: avgFulfillmentTime,
      onTimeDeliveryRate: onTimeRate,
      totalDelivered: allDeliveredOrders.length,
      deliveryMethodDistribution: deliveryMethodStats.map(d => ({
        method: d._id || 'DELIVERY',
        count: d.count,
      })),
      fulfillmentTimeDistribution: timeDistribution,
      dailyDeliveries,
    };
  }

  /**
   * Get pharmacy customer satisfaction metrics
   */
  private async getPharmacyCustomerSatisfaction(
    pharmacyId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    // Get all rated pharmacy orders for this pharmacy (uses 'pharmacy' field)
    const ratedPharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      rating: { $exists: true, $ne: null },
    }).sort({ rated_at: -1 }).toArray();

    // Get all rated specialist prescriptions for this pharmacy
    const ratedPrescriptions = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      rating: { $exists: true, $ne: null },
    }).sort({ rated_at: -1 }).toArray();

    // Combine all rated orders
    const allRatedOrders: any[] = [
      ...ratedPharmacyOrders.map(o => ({
        ...o,
        type: 'pharmacy_order',
        order_number: o.order_number,
        patient_id: o.patient_id,
      })),
      ...ratedPrescriptions.map(p => ({
        ...p,
        type: 'prescription',
        order_number: p.prescription_number,
        patient_id: p.patient_id,
      })),
    ];

    // Current period ratings
    const currentPeriodRatings = allRatedOrders.filter(o => {
      const ratedAt = new Date(o.rated_at || o.created_at);
      return ratedAt >= startDate && ratedAt <= endDate;
    });

    // Calculate metrics
    const allRatings = allRatedOrders.map(o => o.rating);
    const currentRatings = currentPeriodRatings.map(o => o.rating);

    const overallAvgRating = allRatings.length > 0
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
      : 0;

    const currentAvgRating = currentRatings.length > 0
      ? Math.round((currentRatings.reduce((a, b) => a + b, 0) / currentRatings.length) * 10) / 10
      : 0;

    // Rating distribution - frontend expects array with {_id: rating, count: X}
    const distribution = [
      { _id: 5, count: allRatings.filter(r => r === 5).length },
      { _id: 4, count: allRatings.filter(r => r === 4).length },
      { _id: 3, count: allRatings.filter(r => r === 3).length },
      { _id: 2, count: allRatings.filter(r => r === 2).length },
      { _id: 1, count: allRatings.filter(r => r === 1).length },
    ];

    // Rating trend over time (combine both collections)
    const pharmacyOrderTrend = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          rating: { $exists: true, $ne: null },
          rated_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$rated_at' } },
          totalRating: { $sum: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const prescriptionTrend = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          rating: { $exists: true, $ne: null },
          rated_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$rated_at' } },
          totalRating: { $sum: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    // Merge rating trends by date
    const trendMap = new Map<string, { totalRating: number; count: number }>();
    for (const t of pharmacyOrderTrend) {
      trendMap.set(t._id, { totalRating: t.totalRating, count: t.count });
    }
    for (const t of prescriptionTrend) {
      const existing = trendMap.get(t._id);
      if (existing) {
        existing.totalRating += t.totalRating;
        existing.count += t.count;
      } else {
        trendMap.set(t._id, { totalRating: t.totalRating, count: t.count });
      }
    }
    const ratingTrend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        avgRating: Math.round((data.totalRating / data.count) * 10) / 10,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get recent reviews from pharmacy orders (uses 'pharmacy' and 'patient' fields)
    const recentPharmacyReviews = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          rating: { $exists: true, $ne: null },
          review: { $exists: true, $nin: ['', null] },
        },
      },
      { $sort: { rated_at: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $project: {
          order_number: 1,
          rating: 1,
          review: 1,
          rated_at: 1,
          type: { $literal: 'pharmacy_order' },
          'patientData.profile.first_name': 1,
          'patientData.profile.last_name': 1,
        },
      },
    ]).toArray();

    // Get recent reviews from prescriptions for this pharmacy
    const recentPrescriptionReviews = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          rating: { $exists: true, $ne: null },
          review: { $exists: true, $nin: ['', null] },
        },
      },
      { $sort: { rated_at: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'patient_id',
          foreignField: '_id',
          as: 'patientData',
        },
      },
      {
        $project: {
          order_number: '$prescription_number',
          rating: 1,
          review: 1,
          rated_at: 1,
          type: { $literal: 'prescription' },
          'patientData.profile.first_name': 1,
          'patientData.profile.last_name': 1,
        },
      },
    ]).toArray();

    // Combine and sort recent reviews, take top 10
    const allRecentReviews = [...recentPharmacyReviews, ...recentPrescriptionReviews]
      .sort((a, b) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime())
      .slice(0, 10);

    return {
      overallAverageRating: overallAvgRating,
      averageRating: overallAvgRating, // Alias for frontend compatibility
      currentPeriodAverageRating: currentAvgRating,
      totalRatings: allRatings.length,
      currentPeriodRatings: currentRatings.length,
      ratingDistribution: distribution,
      ratingTrend,
      recentReviews: allRecentReviews.map(r => ({
        _id: r._id,
        order_number: r.order_number,
        pharmacy_rating: r.rating,
        pharmacy_review: r.review,
        rated_at: r.rated_at,
        type: r.type,
        patient: r.patientData?.[0]
          ? {
              profile: {
                first_name: r.patientData[0].profile?.first_name || '',
                last_name: r.patientData[0].profile?.last_name || '',
              },
            }
          : null,
      })),
    };
  }

  /**
   * Get pharmacy inventory health metrics
   */
  private async getPharmacyInventoryHealth(pharmacyId: Types.ObjectId): Promise<any> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Get stock data from drug entities (main inventory source)
    const drugStockData = await this.drugModel.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          is_active: true,
        },
      },
      {
        $group: {
          _id: null,
          totalDrugs: { $sum: 1 },
          drugsWithStock: { $sum: { $cond: [{ $gt: ['$quantity', 0] }, 1, 0] } },
          drugsOutOfStock: { $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] } },
          totalStockUnits: { $sum: { $ifNull: ['$quantity', 0] } },
          totalStockValue: { $sum: { $multiply: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$cost_price', 0] }] } },
        },
      },
    ]).exec();

    // Get additional stock from batch entities
    const batchStockData = await this.stockBatchModel.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          status: BatchStatus.ACTIVE,
          quantity_available: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          batchCount: { $sum: 1 },
          uniqueDrugs: { $addToSet: '$drug_id' },
          totalBatchUnits: { $sum: '$quantity_available' },
          totalBatchValue: { $sum: { $multiply: ['$quantity_available', '$cost_price'] } },
        },
      },
    ]).exec();

    const drugData = drugStockData[0] || { totalDrugs: 0, drugsWithStock: 0, drugsOutOfStock: 0, totalStockUnits: 0, totalStockValue: 0 };
    const batchData = batchStockData[0] || { batchCount: 0, uniqueDrugs: [], totalBatchUnits: 0, totalBatchValue: 0 };

    // Combined metrics
    const totalDrugs = drugData.totalDrugs;
    const totalActiveItems = drugData.drugsWithStock; // Drugs with stock > 0
    const outOfStockCount = drugData.drugsOutOfStock;

    // Low stock items from drug entities (where quantity < reorder_level)
    const lowStockItems = await this.drugModel.find({
      pharmacy_id: pharmacyId,
      is_active: true,
      $expr: { $lt: ['$quantity', { $ifNull: ['$reorder_level', 10] }] },
      quantity: { $gt: 0 }, // Only drugs that have some stock but below reorder level
    })
      .select('name quantity reorder_level')
      .limit(20)
      .lean();

    // Expiring soon (within 30 days) - from batch entities
    const expiringSoonBatches = await this.stockBatchModel.find({
      pharmacy_id: pharmacyId,
      status: BatchStatus.ACTIVE,
      expiry_date: { $gte: now, $lte: thirtyDaysFromNow },
      quantity_available: { $gt: 0 },
    })
      .populate('drug', 'name')
      .limit(20)
      .lean();

    // Count unique drugs expiring soon
    const expiringSoonDrugs = new Set(expiringSoonBatches.map((b: any) => b.drug_id?.toString())).size;

    // Expiring within 90 days - count unique drugs
    const expiringWithin90DaysBatches = await this.stockBatchModel.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          status: BatchStatus.ACTIVE,
          expiry_date: { $gte: now, $lte: ninetyDaysFromNow },
          quantity_available: { $gt: 0 },
        },
      },
      {
        $group: { _id: '$drug_id' },
      },
      {
        $count: 'count',
      },
    ]).exec();

    const expiringWithin90Days = expiringWithin90DaysBatches[0]?.count || 0;

    // Already expired - count unique drugs with expired batches
    const expiredBatches = await this.stockBatchModel.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          status: BatchStatus.ACTIVE,
          expiry_date: { $lt: now },
          quantity_available: { $gt: 0 },
        },
      },
      {
        $group: { _id: '$drug_id' },
      },
      {
        $count: 'count',
      },
    ]).exec();

    const expiredCount = expiredBatches[0]?.count || 0;

    // Combined stock value = drug entities stock + batch entities stock
    const combinedStockValue = drugData.totalStockValue + batchData.totalBatchValue;
    const combinedStockUnits = drugData.totalStockUnits + batchData.totalBatchUnits;

    // Category distribution from drug entities
    const categoryDistribution = await this.drugModel.aggregate([
      {
        $match: {
          pharmacy_id: pharmacyId,
          is_active: true,
          quantity: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'drugcategoryentities',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData',
        },
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$categoryData.name', 0] },
          count: { $sum: 1 },
          value: { $sum: { $multiply: ['$quantity', '$cost_price'] } },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 10 },
    ]).exec();

    return {
      totalActiveItems,        // Drugs with stock > 0
      totalDrugs,              // Total drugs in catalog
      lowStockCount: lowStockItems.length,
      outOfStockCount,         // Drugs with quantity = 0
      expiringSoonCount: expiringSoonDrugs,
      expiringWithin90Days,
      expiredCount,
      stockValue: combinedStockValue,           // Combined from drugs + batches
      totalStockUnits: combinedStockUnits,      // Combined units
      totalBatches: batchData.batchCount,       // Number of batch records
      lowStockItems: lowStockItems.map((i: any) => ({
        name: i.name,
        totalAvailable: i.quantity,
        reorderLevel: i.reorder_level || 10,
      })),
      expiringSoon: expiringSoonBatches.map((i: any) => ({
        name: i.drug?.name || 'Unknown',
        batchNumber: i.batch_number,
        expiryDate: i.expiry_date,
        available: i.quantity_available,
      })),
      categoryDistribution: categoryDistribution.map(c => ({
        category: c._id || 'Uncategorized',
        count: c.count,
        value: c.value,
      })),
    };
  }

  /**
   * Get pharmacy benchmarks compared to platform average
   * Includes both pharmacyorders and specialistprescriptions
   */
  private async getPharmacyBenchmarks(
    pharmacyId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const PharmacyOrdersCollection = this.connection.collection('pharmacyorders');
    const SpecialistPrescriptionsCollection = this.connection.collection('specialistprescriptions');

    // Helper to check if status is completed
    const isCompleted = (status: string) => {
      const s = status?.toLowerCase();
      return ['delivered', 'completed', 'paid'].includes(s);
    };

    // Get this pharmacy's stats from both collections
    const pharmacyOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
    }).toArray();

    const pharmacyPrescriptions = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      created_at: { $gte: startDate, $lte: endDate },
      status: { $ne: 'draft' },
    }).toArray();

    const allPharmacyOrders = [...pharmacyOrders, ...pharmacyPrescriptions];
    const pharmacyCompleted = allPharmacyOrders.filter(o => isCompleted(o.status));
    const pharmacyRevenue = pharmacyCompleted.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const pharmacyAvgOrderValue = pharmacyCompleted.length > 0 ? pharmacyRevenue / pharmacyCompleted.length : 0;
    const pharmacyCompletionRate = allPharmacyOrders.length > 0
      ? (pharmacyCompleted.length / allPharmacyOrders.length) * 100
      : 0;

    // Get all pharmacies' average stats from pharmacy orders
    const pharmacyOrderStats = await PharmacyOrdersCollection.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$pharmacy',
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['DELIVERED', 'COMPLETED', 'delivered', 'completed', 'paid']] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $in: ['$status', ['DELIVERED', 'COMPLETED', 'delivered', 'completed', 'paid']] }, '$total_amount', 0],
            },
          },
        },
      },
    ]).toArray();

    // Get specialist prescription stats
    const prescriptionStats = await SpecialistPrescriptionsCollection.aggregate([
      {
        $match: {
          pharmacy_id: { $exists: true },
          created_at: { $gte: startDate, $lte: endDate },
          status: { $ne: 'draft' },
        },
      },
      {
        $group: {
          _id: '$pharmacy_id',
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['delivered', 'completed', 'paid']] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $in: ['$status', ['delivered', 'completed', 'paid']] }, '$total_amount', 0],
            },
          },
        },
      },
    ]).toArray();

    // Merge stats by pharmacy
    const statsMap = new Map<string, { totalOrders: number; completedOrders: number; totalRevenue: number }>();
    for (const s of pharmacyOrderStats) {
      const key = s._id?.toString() || 'unknown';
      statsMap.set(key, { totalOrders: s.totalOrders, completedOrders: s.completedOrders, totalRevenue: s.totalRevenue });
    }
    for (const s of prescriptionStats) {
      const key = s._id?.toString() || 'unknown';
      const existing = statsMap.get(key);
      if (existing) {
        existing.totalOrders += s.totalOrders;
        existing.completedOrders += s.completedOrders;
        existing.totalRevenue += s.totalRevenue;
      } else {
        statsMap.set(key, { totalOrders: s.totalOrders, completedOrders: s.completedOrders, totalRevenue: s.totalRevenue });
      }
    }

    const allPharmacyStats = Array.from(statsMap.entries()).map(([id, data]) => ({ _id: id, ...data }));

    // Calculate platform averages
    const platformTotalOrders = allPharmacyStats.reduce((sum, p) => sum + p.totalOrders, 0);
    const platformCompletedOrders = allPharmacyStats.reduce((sum, p) => sum + p.completedOrders, 0);
    const platformTotalRevenue = allPharmacyStats.reduce((sum, p) => sum + p.totalRevenue, 0);

    const platformAvgOrdersPerPharmacy = allPharmacyStats.length > 0 ? platformTotalOrders / allPharmacyStats.length : 0;
    const platformAvgRevenuePerPharmacy = allPharmacyStats.length > 0 ? platformTotalRevenue / allPharmacyStats.length : 0;
    const platformAvgCompletionRate = platformTotalOrders > 0 ? (platformCompletedOrders / platformTotalOrders) * 100 : 0;
    const platformAvgOrderValue = platformCompletedOrders > 0 ? platformTotalRevenue / platformCompletedOrders : 0;

    // Get pharmacy ratings from both collections
    const pharmacyRatedOrders = await PharmacyOrdersCollection.find({
      pharmacy: pharmacyId,
      rating: { $exists: true, $ne: null },
    }).toArray();

    const pharmacyRatedPrescriptions = await SpecialistPrescriptionsCollection.find({
      pharmacy_id: pharmacyId,
      rating: { $exists: true, $ne: null },
    }).toArray();

    const allPharmacyRatings = [
      ...pharmacyRatedOrders.map(o => o.rating),
      ...pharmacyRatedPrescriptions.map(p => p.rating),
    ];

    const pharmacyAvgRating = allPharmacyRatings.length > 0
      ? allPharmacyRatings.reduce((sum, r) => sum + r, 0) / allPharmacyRatings.length
      : 0;

    // Get platform average rating from both collections
    const orderRatings = await PharmacyOrdersCollection.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, totalRating: { $sum: '$rating' }, count: { $sum: 1 } } },
    ]).toArray();

    const prescriptionRatings = await SpecialistPrescriptionsCollection.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, totalRating: { $sum: '$rating' }, count: { $sum: 1 } } },
    ]).toArray();

    const totalRatingSum = (orderRatings[0]?.totalRating || 0) + (prescriptionRatings[0]?.totalRating || 0);
    const totalRatingCount = (orderRatings[0]?.count || 0) + (prescriptionRatings[0]?.count || 0);
    const platformAvgRating = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0;

    // Calculate rankings
    const sortedByRevenue = [...allPharmacyStats].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const sortedByOrders = [...allPharmacyStats].sort((a, b) => b.totalOrders - a.totalOrders);

    const revenueRanking = sortedByRevenue.findIndex(p => p._id === pharmacyId.toString()) + 1;
    const ordersRanking = sortedByOrders.findIndex(p => p._id === pharmacyId.toString()) + 1;

    return {
      pharmacy: {
        orders: allPharmacyOrders.length,
        completedOrders: pharmacyCompleted.length,
        revenue: Math.round(pharmacyRevenue),
        avgOrderValue: Math.round(pharmacyAvgOrderValue),
        completionRate: Math.round(pharmacyCompletionRate),
        avgRating: Math.round(pharmacyAvgRating * 10) / 10,
      },
      platformAverage: {
        ordersPerPharmacy: Math.round(platformAvgOrdersPerPharmacy),
        revenuePerPharmacy: Math.round(platformAvgRevenuePerPharmacy),
        avgOrderValue: Math.round(platformAvgOrderValue),
        completionRate: Math.round(platformAvgCompletionRate),
        avgRating: Math.round(platformAvgRating * 10) / 10,
      },
      ranking: {
        byRevenue: revenueRanking > 0 ? revenueRanking : allPharmacyStats.length,
        byOrders: ordersRanking > 0 ? ordersRanking : allPharmacyStats.length,
        totalPharmacies: allPharmacyStats.length || 1,
      },
      comparison: {
        ordersVsAvg: platformAvgOrdersPerPharmacy > 0
          ? Math.round(((allPharmacyOrders.length - platformAvgOrdersPerPharmacy) / platformAvgOrdersPerPharmacy) * 100)
          : 0,
        revenueVsAvg: platformAvgRevenuePerPharmacy > 0
          ? Math.round(((pharmacyRevenue - platformAvgRevenuePerPharmacy) / platformAvgRevenuePerPharmacy) * 100)
          : 0,
        avgOrderValueVsAvg: platformAvgOrderValue > 0
          ? Math.round(((pharmacyAvgOrderValue - platformAvgOrderValue) / platformAvgOrderValue) * 100)
          : 0,
        ratingVsAvg: Math.round((pharmacyAvgRating - platformAvgRating) * 10) / 10,
      },
    };
  }

  // ============ SIMILAR DRUGS (Related Products) ============

  /**
   * Get similar drugs for admin view with categorized results
   */
  async getSimilarDrugs(
    drugId: string,
    limit: number | string = 20,
  ): Promise<{
    generic_matches: any[];
    category_matches: any[];
    manually_linked: any[];
    excluded: any[];
  }> {
    const limitInt = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const safeLimit = isNaN(limitInt) ? 20 : limitInt;

    // Get the source drug
    const sourceDrug = await this.drugModel.findById(drugId);
    if (!sourceDrug) {
      throw new NotFoundException(`Drug with ID ${drugId} not found`);
    }

    // Get excluded drug IDs
    const excludedIds = [
      new Types.ObjectId(drugId),
      ...(sourceDrug.excluded_similar_drugs || []).map((id: any) =>
        new Types.ObjectId(id.toString()),
      ),
    ];

    // Helper to enrich drug data
    const enrichDrug = async (drug: any) => {
      let dosageFormName = '';
      if (drug.dosage_form) {
        const df = await this.dosageFormModel.findById(drug.dosage_form);
        dosageFormName = df?.name || '';
      }

      let imageUrl = drug.images?.find((img: any) => img.is_primary)?.url ||
        drug.images?.[0]?.url || null;

      if (imageUrl && imageUrl.includes('s3.') && imageUrl.includes('amazonaws.com')) {
        try {
          imageUrl = await this.fileUploadHelper.getPresignedUrl(imageUrl, 3600);
        } catch (e) {
          // Ignore presigned URL errors
        }
      }

      // Get stock from batches
      const batches = await this.stockBatchModel.find({
        drug_id: drug._id,
        status: 'active',
        quantity_available: { $gt: 0 },
        $or: [
          { no_expiry: true },
          { expiry_date: { $gt: new Date() } },
        ],
      });

      let totalQuantity = 0;
      let lowestPrice = drug.selling_price;
      for (const batch of batches) {
        const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
        if (availableQty > 0) {
          totalQuantity += availableQty;
          const batchPrice = batch.selling_price_override || drug.selling_price;
          if (batchPrice < lowestPrice) {
            lowestPrice = batchPrice;
          }
        }
      }

      if (totalQuantity === 0 && drug.quantity > 0) {
        totalQuantity = drug.quantity;
      }

      return {
        _id: drug._id,
        name: drug.name,
        generic_name: drug.generic_name,
        brand_name: drug.brand_name,
        strength: drug.strength,
        dosage_form: dosageFormName,
        manufacturer: drug.manufacturer,
        selling_price: lowestPrice,
        quantity_in_stock: totalQuantity,
        image_url: imageUrl,
        is_available: totalQuantity > 0,
        requires_prescription: drug.requires_prescription || false,
      };
    };

    // 1. Find drugs with same generic name
    const genericMatches = sourceDrug.generic_name
      ? await this.drugModel.find({
          _id: { $nin: excludedIds },
          is_active: true,
          generic_name: { $regex: new RegExp(`^${sourceDrug.generic_name}$`, 'i') },
        }).limit(safeLimit)
      : [];

    // 2. Find drugs in same categories
    const categoryMatches = await this.drugModel.find({
      _id: { $nin: [...excludedIds, ...genericMatches.map((d) => d._id)] },
      is_active: true,
      categories: { $in: sourceDrug.categories || [] },
    }).limit(safeLimit);

    // 3. Get manually linked drugs
    const manuallyLinkedIds = (sourceDrug.manually_linked_drugs || [])
      .filter((id: any) => !excludedIds.some((exId) => exId.toString() === id.toString()))
      .map((id: any) => new Types.ObjectId(id.toString()));

    const manuallyLinked = manuallyLinkedIds.length > 0
      ? await this.drugModel.find({
          _id: { $in: manuallyLinkedIds },
          is_active: true,
        })
      : [];

    // 4. Get excluded drugs for admin view
    const excludedDrugIds = (sourceDrug.excluded_similar_drugs || [])
      .map((id: any) => new Types.ObjectId(id.toString()));

    const excludedDrugs = excludedDrugIds.length > 0
      ? await this.drugModel.find({
          _id: { $in: excludedDrugIds },
        })
      : [];

    // Enrich all results
    const [enrichedGeneric, enrichedCategory, enrichedManual, enrichedExcluded] = await Promise.all([
      Promise.all(genericMatches.map(enrichDrug)),
      Promise.all(categoryMatches.map(enrichDrug)),
      Promise.all(manuallyLinked.map(enrichDrug)),
      Promise.all(excludedDrugs.map(enrichDrug)),
    ]);

    return {
      generic_matches: enrichedGeneric.map(d => ({ ...d, match_type: 'generic' })),
      category_matches: enrichedCategory.map(d => ({ ...d, match_type: 'category' })),
      manually_linked: enrichedManual.map(d => ({ ...d, match_type: 'manual' })),
      excluded: enrichedExcluded,
    };
  }

  /**
   * Search drugs for linking (admin)
   */
  async searchDrugsForLinking(query: string, excludeDrugId: string, limit: number = 10): Promise<any[]> {
    // Build query filter
    const filter: any = {
      is_active: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { generic_name: { $regex: query, $options: 'i' } },
        { brand_name: { $regex: query, $options: 'i' } },
      ],
    };

    // Only exclude if valid ObjectId provided
    if (excludeDrugId && excludeDrugId.length === 24) {
      filter._id = { $ne: new Types.ObjectId(excludeDrugId) };
    }

    const drugs = await this.drugModel.find(filter).limit(limit);

    return drugs.map(drug => ({
      _id: drug._id,
      name: drug.name,
      generic_name: drug.generic_name,
      strength: drug.strength,
      manufacturer: drug.manufacturer,
    }));
  }

  /**
   * Manually link a drug as similar (bidirectional)
   */
  async linkSimilarDrug(drugId: string, targetDrugId: string): Promise<any> {
    const sourceId = new Types.ObjectId(drugId);
    const targetId = new Types.ObjectId(targetDrugId);

    // Add bidirectional links
    await this.drugModel.updateOne(
      { _id: sourceId },
      { $addToSet: { manually_linked_drugs: targetId } },
    );

    await this.drugModel.updateOne(
      { _id: targetId },
      { $addToSet: { manually_linked_drugs: sourceId } },
    );

    return this.drugModel.findById(drugId);
  }

  /**
   * Unlink a drug from similar (bidirectional)
   */
  async unlinkSimilarDrug(drugId: string, targetDrugId: string): Promise<any> {
    const sourceId = new Types.ObjectId(drugId);
    const targetId = new Types.ObjectId(targetDrugId);

    // Remove bidirectional links
    await this.drugModel.updateOne(
      { _id: sourceId },
      { $pull: { manually_linked_drugs: targetId } },
    );

    await this.drugModel.updateOne(
      { _id: targetId },
      { $pull: { manually_linked_drugs: sourceId } },
    );

    return this.drugModel.findById(drugId);
  }

  /**
   * Exclude a drug from auto-matching (one-directional)
   */
  async excludeSimilarDrug(drugId: string, targetDrugId: string): Promise<any> {
    const sourceId = new Types.ObjectId(drugId);
    const targetId = new Types.ObjectId(targetDrugId);

    await this.drugModel.updateOne(
      { _id: sourceId },
      { $addToSet: { excluded_similar_drugs: targetId } },
    );

    return this.drugModel.findById(drugId);
  }

  /**
   * Remove a drug from exclusion list
   */
  async removeExclusion(drugId: string, targetDrugId: string): Promise<any> {
    const sourceId = new Types.ObjectId(drugId);
    const targetId = new Types.ObjectId(targetDrugId);

    await this.drugModel.updateOne(
      { _id: sourceId },
      { $pull: { excluded_similar_drugs: targetId } },
    );

    return this.drugModel.findById(drugId);
  }

  // ============ PRESCRIPTION INVENTORY CHECK METHODS ============

  /**
   * Check inventory availability for all drugs in a patient prescription upload
   */
  async checkPrescriptionInventory(prescriptionId: string): Promise<{
    available: boolean;
    items: Array<{
      drug_id: string | null;
      drug_name: string;
      prescription_name: string;
      requested_quantity: number;
      available_quantity: number;
      is_available: boolean;
      price: number;
      batches: Array<{
        batch_number: string;
        available: number;
        expiry_date: Date | null;
      }>;
      alternatives?: Array<{
        drug_id: string;
        name: string;
        available_quantity: number;
        price: number;
      }>;
    }>;
    total_price: number;
    out_of_stock_items: number;
    partial_stock_items: number;
  }> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const DrugsCollection = this.connection.collection('drugentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');

    const prescription = await PatientUploadsCollection.findOne({
      _id: new Types.ObjectId(prescriptionId),
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Get verified medications from prescription
    const verifiedMedications = prescription.verified_medications || [];

    // If no verified medications, try OCR medications
    const medications = verifiedMedications.length > 0
      ? verifiedMedications
      : (prescription.ocr_data?.medications || []);

    if (medications.length === 0) {
      return {
        available: false,
        items: [],
        total_price: 0,
        out_of_stock_items: 0,
        partial_stock_items: 0,
      };
    }

    const inventoryResults = [];
    let totalPrice = 0;
    let outOfStockItems = 0;
    let partialStockItems = 0;

    for (const med of medications) {
      const drugId = med.matched_drug_id || null;
      const prescriptionName = med.prescription_medication_name || med.name || 'Unknown';

      // Parse quantity from string (e.g., "20", "2 boxes", etc.)
      let requestedQuantity = 1;
      const quantityStr = med.quantity || '1';
      const quantityMatch = quantityStr.match(/\d+/);
      if (quantityMatch) {
        requestedQuantity = parseInt(quantityMatch[0], 10);
      }

      let availableQuantity = 0;
      let price = 0;
      let drugName = med.matched_drug_name || prescriptionName;
      const batches: Array<{ batch_number: string; available: number; expiry_date: Date | null }> = [];
      const alternatives: Array<{ drug_id: string; name: string; available_quantity: number; price: number }> = [];

      if (drugId) {
        // Get drug details
        const drug = await DrugsCollection.findOne({
          _id: new Types.ObjectId(drugId),
        });

        if (drug) {
          drugName = drug.name;
          price = drug.price || drug.selling_price || drug.retail_price || drug.unit_price || 0;

          // Check stock batches first
          const stockBatches = await StockBatchCollection.find({
            drug_id: new Types.ObjectId(drugId),
            status: 'active',
            quantity_available: { $gt: 0 },
            $or: [
              { no_expiry: true },
              { expiry_date: { $gt: new Date() } },
            ],
          }).toArray();

          if (stockBatches.length > 0) {
            for (const batch of stockBatches) {
              const batchAvailable = batch.quantity_available - (batch.quantity_reserved || 0);
              if (batchAvailable > 0) {
                availableQuantity += batchAvailable;
                batches.push({
                  batch_number: batch.batch_number,
                  available: batchAvailable,
                  expiry_date: batch.expiry_date,
                });
              }
            }
          }

          // Fall back to drug quantity field if no batches
          if (availableQuantity === 0 && drug.quantity > 0) {
            availableQuantity = drug.quantity;
            batches.push({
              batch_number: 'LEGACY',
              available: drug.quantity,
              expiry_date: null,
            });
          }

          // If out of stock or partial, find alternatives
          if (availableQuantity < requestedQuantity && drug.generic_name) {
            const altDrugs = await DrugsCollection.find({
              _id: { $ne: new Types.ObjectId(drugId) },
              generic_name: { $regex: new RegExp(drug.generic_name, 'i') },
              status: { $ne: 'inactive' },
              quantity: { $gt: 0 },
            }).limit(3).toArray();

            for (const altDrug of altDrugs) {
              alternatives.push({
                drug_id: altDrug._id.toString(),
                name: altDrug.name,
                available_quantity: altDrug.quantity || 0,
                price: altDrug.price || altDrug.selling_price || altDrug.retail_price || altDrug.unit_price || 0,
              });
            }
          }
        }
      }

      const isAvailable = availableQuantity >= requestedQuantity;
      const isPartial = availableQuantity > 0 && availableQuantity < requestedQuantity;

      if (!isAvailable && availableQuantity === 0) {
        outOfStockItems++;
      } else if (isPartial) {
        partialStockItems++;
      }

      const itemTotal = Math.min(availableQuantity, requestedQuantity) * price;
      totalPrice += itemTotal;

      inventoryResults.push({
        drug_id: drugId ? drugId.toString() : null,
        drug_name: drugName,
        prescription_name: prescriptionName,
        requested_quantity: requestedQuantity,
        available_quantity: availableQuantity,
        is_available: isAvailable,
        price,
        batches,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
      });
    }

    return {
      available: outOfStockItems === 0 && partialStockItems === 0,
      items: inventoryResults,
      total_price: totalPrice,
      out_of_stock_items: outOfStockItems,
      partial_stock_items: partialStockItems,
    };
  }

  /**
   * Reserve stock for an approved prescription
   */
  async reserveStockForPrescription(
    prescriptionId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    reservations: Array<{
      drug_id: string;
      drug_name: string;
      quantity_reserved: number;
      batch_reservations: Array<{
        batch_id: string;
        batch_number: string;
        quantity: number;
      }>;
    }>;
    failed_items: Array<{
      drug_name: string;
      reason: string;
    }>;
  }> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const DrugsCollection = this.connection.collection('drugentities');

    const prescription = await PatientUploadsCollection.findOne({
      _id: new Types.ObjectId(prescriptionId),
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.verification_status !== 'APPROVED') {
      throw new BadRequestException('Can only reserve stock for approved prescriptions');
    }

    const verifiedMedications = prescription.verified_medications || [];
    const reservations = [];
    const failedItems = [];

    for (const med of verifiedMedications) {
      if (!med.matched_drug_id) {
        failedItems.push({
          drug_name: med.prescription_medication_name || 'Unknown',
          reason: 'No matched drug in database',
        });
        continue;
      }

      const drugId = new Types.ObjectId(med.matched_drug_id);

      // Parse quantity
      let requestedQuantity = 1;
      const quantityStr = med.quantity || '1';
      const quantityMatch = quantityStr.match(/\d+/);
      if (quantityMatch) {
        requestedQuantity = parseInt(quantityMatch[0], 10);
      }

      // Get available batches (FEFO - First Expiry First Out)
      const batches = await StockBatchCollection.find({
        drug_id: drugId,
        status: 'active',
        quantity_available: { $gt: 0 },
        $or: [
          { no_expiry: true },
          { expiry_date: { $gt: new Date() } },
        ],
      }).sort({ expiry_date: 1 }).toArray();

      let remainingToReserve = requestedQuantity;
      const batchReservations = [];

      for (const batch of batches) {
        if (remainingToReserve <= 0) break;

        const available = batch.quantity_available - (batch.quantity_reserved || 0);
        if (available <= 0) continue;

        const toReserve = Math.min(available, remainingToReserve);

        // Update batch reservation
        await StockBatchCollection.updateOne(
          { _id: batch._id },
          {
            $inc: { quantity_reserved: toReserve },
            $push: {
              reservations: {
                prescription_id: new Types.ObjectId(prescriptionId),
                quantity: toReserve,
                reserved_at: new Date(),
                reserved_by: new Types.ObjectId(userId),
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hour hold
              },
            },
          },
        );

        batchReservations.push({
          batch_id: batch._id.toString(),
          batch_number: batch.batch_number,
          quantity: toReserve,
        });

        remainingToReserve -= toReserve;
      }

      // If not enough in batches, try to reserve from legacy drug quantity
      if (remainingToReserve > 0) {
        const drug = await DrugsCollection.findOne({ _id: drugId });
        if (drug && (drug.quantity || 0) >= remainingToReserve) {
          await DrugsCollection.updateOne(
            { _id: drugId },
            {
              $inc: { quantity: -remainingToReserve, quantity_reserved: remainingToReserve },
            },
          );
          batchReservations.push({
            batch_id: 'LEGACY',
            batch_number: 'LEGACY',
            quantity: remainingToReserve,
          });
          remainingToReserve = 0;
        }
      }

      if (remainingToReserve > 0) {
        failedItems.push({
          drug_name: med.matched_drug_name || med.prescription_medication_name,
          reason: `Insufficient stock. Needed ${requestedQuantity}, could only reserve ${requestedQuantity - remainingToReserve}`,
        });
      }

      if (batchReservations.length > 0) {
        reservations.push({
          drug_id: drugId.toString(),
          drug_name: med.matched_drug_name || med.prescription_medication_name,
          quantity_reserved: requestedQuantity - remainingToReserve,
          batch_reservations: batchReservations,
        });
      }
    }

    // Store reservation info on the prescription
    await PatientUploadsCollection.updateOne(
      { _id: new Types.ObjectId(prescriptionId) },
      {
        $set: {
          stock_reservation: {
            reserved_at: new Date(),
            reserved_by: new Types.ObjectId(userId),
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
            reservations,
            failed_items: failedItems,
          },
          updated_at: new Date(),
        },
      },
    );

    return {
      success: failedItems.length === 0,
      reservations,
      failed_items: failedItems,
    };
  }

  /**
   * Release stock reservation for a prescription (when declined, expired, etc.)
   */
  async releaseStockReservation(prescriptionId: string): Promise<{ success: boolean; released_items: number }> {
    const PatientUploadsCollection = this.connection.collection('patient_prescription_uploads');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const DrugsCollection = this.connection.collection('drugentities');

    const prescription = await PatientUploadsCollection.findOne({
      _id: new Types.ObjectId(prescriptionId),
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const stockReservation = prescription.stock_reservation;
    if (!stockReservation || !stockReservation.reservations) {
      return { success: true, released_items: 0 };
    }

    let releasedItems = 0;

    for (const reservation of stockReservation.reservations) {
      for (const batchRes of reservation.batch_reservations || []) {
        if (batchRes.batch_id === 'LEGACY') {
          // Release from legacy drug quantity
          await DrugsCollection.updateOne(
            { _id: new Types.ObjectId(reservation.drug_id) },
            {
              $inc: { quantity: batchRes.quantity, quantity_reserved: -batchRes.quantity },
            },
          );
        } else {
          // Release from batch
          await StockBatchCollection.updateOne(
            { _id: new Types.ObjectId(batchRes.batch_id) },
            {
              $inc: { quantity_reserved: -batchRes.quantity },
              $pull: {
                reservations: { prescription_id: new Types.ObjectId(prescriptionId) },
              },
            },
          );
        }
        releasedItems++;
      }
    }

    // Clear reservation info on prescription
    await PatientUploadsCollection.updateOne(
      { _id: new Types.ObjectId(prescriptionId) },
      {
        $unset: { stock_reservation: '' },
        $set: { updated_at: new Date() },
      },
    );

    return { success: true, released_items: releasedItems };
  }

}
