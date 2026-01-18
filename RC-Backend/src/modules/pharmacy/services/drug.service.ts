import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Drug, DrugDocument } from '../entities/drug.entity';
import { CreateDrugDto, UpdateDrugDto, SearchDrugsDto } from '../dto/drug.dto';
import {
  create,
  findOne,
  find,
  updateOneAndReturn,
  deleteOne,
  countDocuments,
  findAndCountAll,
} from '../../../common/crud/crud';
import { PurchaseType } from '../enums';
import { FileUploadHelper } from '../../../common/helpers/file-upload.helpers';
import { DrugInteractionService, InteractionCheckResult, DataSource } from './drug-interaction.service';

@Injectable()
export class DrugService {
  private readonly logger = new Logger(DrugService.name);

  constructor(
    @InjectModel(Drug.name)
    private readonly drugModel: Model<DrugDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly fileUploadHelper: FileUploadHelper,
    private readonly drugInteractionService: DrugInteractionService,
  ) {}

  /**
   * Create a new drug
   */
  async create(
    createDrugDto: CreateDrugDto,
    userId?: Types.ObjectId,
  ): Promise<DrugDocument> {
    // Check for duplicate by name + strength + dosage_form
    const existing = await findOne(this.drugModel, {
      name: createDrugDto.name,
      strength: createDrugDto.strength,
      dosage_form: createDrugDto.dosage_form,
    });

    if (existing) {
      throw new ConflictException(
        `Drug ${createDrugDto.name} ${createDrugDto.strength} ${createDrugDto.dosage_form} already exists`,
      );
    }

    // Set requires_prescription based on purchase_type
    const purchaseType = createDrugDto.purchase_type || PurchaseType.PRESCRIPTION_ONLY;
    const requiresPrescription = ![
      PurchaseType.OTC_GENERAL,
      PurchaseType.OTC_RESTRICTED,
      PurchaseType.PHARMACY_ONLY,
    ].includes(purchaseType);

    const drugData = {
      ...createDrugDto,
      requires_prescription:
        createDrugDto.requires_prescription ?? requiresPrescription,
      created_by: userId,
      updated_by: userId,
    };

    this.logger.log(`Creating drug: ${createDrugDto.name}`);
    return await create(this.drugModel, drugData);
  }

  /**
   * Find a drug by ID
   * Uses native MongoDB collection to bypass Mongoose schema type mismatch
   * Resolves references and includes batch information
   */
  async findById(id: Types.ObjectId | string): Promise<any> {
    const DrugsCollection = this.connection.collection('drugentities');
    const DosageFormsCollection = this.connection.collection('dosageformentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const ManufacturersCollection = this.connection.collection('manufacturerentities');
    const CategoriesCollection = this.connection.collection('drugcategoryentities');
    const RoutesCollection = this.connection.collection('drugrouteentities');

    const drug = await DrugsCollection.findOne({
      _id: new Types.ObjectId(id.toString()),
    });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    // Resolve dosage form name
    let dosageFormName = '';
    if (drug.dosage_form) {
      const df = await DosageFormsCollection.findOne({ _id: drug.dosage_form });
      dosageFormName = df?.name || '';
    }

    // Resolve route information
    let routeName = '';
    let routeAbbreviation = '';
    if (drug.route) {
      const routeDoc = await RoutesCollection.findOne({ _id: drug.route });
      if (routeDoc) {
        routeName = routeDoc.name || '';
        routeAbbreviation = routeDoc.abbreviation || '';
      }
    }

    // Resolve category names
    const categoryNames: string[] = [];
    if (drug.categories && drug.categories.length > 0) {
      for (const catId of drug.categories) {
        const cat = await CategoriesCollection.findOne({ _id: catId });
        if (cat?.name) categoryNames.push(cat.name);
      }
    }

    // Get available batches with manufacturer info
    const batches = await StockBatchCollection.find({
      drug_id: drug._id,
      status: 'active',
      quantity_available: { $gt: 0 },
      $or: [
        { no_expiry: true },
        { expiry_date: { $gt: new Date() } },
      ],
    })
      .sort({ expiry_date: 1 })
      .toArray();

    // Calculate total available quantity and find best price
    let totalQuantity = 0;
    let lowestPrice = drug.selling_price;
    let primaryManufacturer = drug.manufacturer;
    const batchList: any[] = [];

    for (const batch of batches) {
      const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
      if (availableQty > 0) {
        totalQuantity += availableQty;
        const batchPrice = batch.selling_price_override || drug.selling_price;
        if (batchPrice < lowestPrice) {
          lowestPrice = batchPrice;
        }
        // Use first batch's manufacturer if drug doesn't have one
        if (!primaryManufacturer && batch.manufacturer) {
          primaryManufacturer = batch.manufacturer;
        }
        batchList.push({
          batch_id: batch._id,
          batch_number: batch.batch_number,
          manufacturer: batch.manufacturer,
          quantity: availableQty,
          price: batchPrice,
          expiry_date: batch.expiry_date,
        });
      }
    }

    // If no batches, use drug's legacy quantity
    if (totalQuantity === 0 && drug.quantity > 0) {
      totalQuantity = drug.quantity;
    }

    // Resolve manufacturer name if it's an ObjectId
    let manufacturerName = primaryManufacturer;
    if (primaryManufacturer && typeof primaryManufacturer === 'object') {
      const mfr = await ManufacturersCollection.findOne({ _id: primaryManufacturer });
      manufacturerName = mfr?.name || null;
    }

    // Get primary image with pre-signed URL
    let imageUrl = drug.images?.find((img) => img.is_primary)?.url ||
      drug.images?.[0]?.url || null;

    if (imageUrl && imageUrl.includes('s3.') && imageUrl.includes('amazonaws.com')) {
      try {
        imageUrl = await this.fileUploadHelper.getPresignedUrl(imageUrl, 3600);
      } catch (e) {
        this.logger.warn(`Failed to generate presigned URL for drug ${drug._id}: ${e.message}`);
      }
    }

    return {
      ...drug,
      dosage_form: dosageFormName,
      dosage_form_id: drug.dosage_form,
      route: routeName,
      route_abbreviation: routeAbbreviation,
      category_names: categoryNames,
      manufacturer: manufacturerName,
      image_url: imageUrl,
      // Stock and pricing info from batches
      quantity_in_stock: totalQuantity,
      selling_price: lowestPrice,
      original_price: drug.selling_price !== lowestPrice ? drug.selling_price : null,
      is_available: totalQuantity > 0,
      batches: batchList,
    };
  }

  /**
   * Find a drug by name and strength
   */
  async findByNameAndStrength(
    name: string,
    strength: string,
  ): Promise<DrugDocument | null> {
    return await findOne(this.drugModel, { name, strength });
  }

  /**
   * Update a drug
   */
  async update(
    id: Types.ObjectId | string,
    updateDrugDto: UpdateDrugDto,
    userId?: Types.ObjectId,
  ): Promise<DrugDocument> {
    const drug = await this.findById(id);

    const updatedDrug = await updateOneAndReturn(
      this.drugModel,
      { _id: drug._id },
      { ...updateDrugDto, updated_by: userId },
    );

    this.logger.log(`Updated drug: ${id}`);
    return updatedDrug;
  }

  /**
   * Delete a drug (soft delete by setting is_active = false)
   */
  async softDelete(
    id: Types.ObjectId | string,
    userId?: Types.ObjectId,
  ): Promise<DrugDocument> {
    const drug = await this.findById(id);

    const deletedDrug = await updateOneAndReturn(
      this.drugModel,
      { _id: drug._id },
      { is_active: false, updated_by: userId },
    );

    this.logger.log(`Soft deleted drug: ${id}`);
    return deletedDrug;
  }

  /**
   * Hard delete a drug (use with caution)
   */
  async hardDelete(id: Types.ObjectId | string): Promise<void> {
    const drug = await this.findById(id);
    await deleteOne(this.drugModel, { _id: drug._id });
    this.logger.log(`Hard deleted drug: ${id}`);
  }

  /**
   * Search and filter drugs with pagination
   * Returns batch-level items - each batch from different manufacturers appears as a separate item
   */
  async search(searchDto: SearchDrugsDto): Promise<{
    drugs: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      query,
      purchase_type,
      category,
      manufacturer,
      is_otc,
      requires_prescription,
      min_price,
      max_price,
      is_available,
      is_featured,
      page = 1,
      limit = 20,
      sort_by = 'name',
      sort_order = 'asc',
    } = searchDto;

    const DrugsCollection = this.connection.collection('drugentities');
    const DosageFormsCollection = this.connection.collection('dosageformentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const RoutesCollection = this.connection.collection('drugrouteentities');

    // Build query
    const filter: any = { is_active: true };

    // Text search
    if (query) {
      // Escape special regex characters to prevent search failures
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { generic_name: { $regex: escapedQuery, $options: 'i' } },
        { brand_name: { $regex: escapedQuery, $options: 'i' } },
        { description: { $regex: escapedQuery, $options: 'i' } },
      ];
    }

    // Filters
    if (purchase_type) {
      filter.purchase_type = purchase_type;
    }

    if (category) {
      // Check if category is ObjectId or slug
      const CategoriesCollection = this.connection.collection('drugcategoryentities');
      let categoryId: Types.ObjectId | null = null;

      // Check if it's a valid ObjectId format
      if (/^[a-f0-9]{24}$/i.test(category)) {
        categoryId = new Types.ObjectId(category);
      } else {
        // It's a slug - convert to code and lookup
        const categoryCode = category.toUpperCase().replace(/-/g, '_');
        const categoryDoc = await CategoriesCollection.findOne({
          $or: [
            { code: categoryCode },
            { slug: category },
          ],
          is_active: true,
        });
        if (categoryDoc) {
          categoryId = new Types.ObjectId(categoryDoc._id.toString());
        }
      }

      if (categoryId) {
        filter.categories = categoryId;
      }
    }

    if (is_otc !== undefined) {
      if (is_otc) {
        filter.purchase_type = {
          $in: [PurchaseType.OTC_GENERAL, PurchaseType.OTC_RESTRICTED],
        };
      } else {
        filter.purchase_type = {
          $nin: [PurchaseType.OTC_GENERAL, PurchaseType.OTC_RESTRICTED],
        };
      }
    }

    if (requires_prescription !== undefined) {
      filter.requires_prescription = requires_prescription;
    }

    if (is_featured !== undefined) {
      filter.is_featured = is_featured;
    }

    // Get all matching drugs (without pagination - we'll paginate the batch results)
    const drugs = await DrugsCollection.find(filter)
      .sort({ name: 1 })
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

      // Get route information
      let routeName = '';
      let routeAbbreviation = '';
      if (drug.route) {
        const routeDoc = await RoutesCollection.findOne({ _id: drug.route });
        if (routeDoc) {
          routeName = routeDoc.name || '';
          routeAbbreviation = routeDoc.abbreviation || '';
        }
      }

      // Get primary image with pre-signed URL
      let primaryImage = drug.images?.find((img) => img.is_primary)?.url ||
        drug.images?.[0]?.url || null;

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
        .sort({ expiry_date: 1 })
        .toArray();

      if (batches.length > 0) {
        // Add each batch as a separate selectable item
        for (const batch of batches) {
          const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
          if (availableQty <= 0) continue;

          const batchPrice = batch.selling_price_override || drug.selling_price;

          // Apply price filter at batch level
          if (min_price !== undefined && batchPrice < min_price) continue;
          if (max_price !== undefined && batchPrice > max_price) continue;

          // Apply manufacturer filter at batch level
          if (manufacturer) {
            const mfrRegex = new RegExp(manufacturer, 'i');
            if (!batch.manufacturer || !mfrRegex.test(batch.manufacturer)) continue;
          }

          // Apply availability filter
          if (is_available === true && availableQty <= 0) continue;
          if (is_available === false && availableQty > 0) continue;

          batchResults.push({
            _id: drug._id,
            batch_id: batch._id,
            batch_number: batch.batch_number,
            name: drug.name,
            generic_name: drug.generic_name,
            brand_name: drug.brand_name,
            strength: drug.strength,
            dosage_form: dosageFormName,
            dosage_form_id: drug.dosage_form,
            route: routeName,
            route_abbreviation: routeAbbreviation,
            manufacturer: batch.manufacturer || null,
            selling_price: batchPrice,
            quantity: availableQty,
            quantity_in_stock: availableQty,
            expiry_date: batch.expiry_date,
            no_expiry: batch.no_expiry,
            image_url: primaryImage,
            primary_image: primaryImage,
            requires_prescription: drug.requires_prescription,
            purchase_type: drug.purchase_type,
            description: drug.description || drug.short_description,
            is_available: availableQty > 0,
            is_batch: true,
          });
        }
      } else {
        // No batches - use drug's legacy quantity (for seeded data)
        if (drug.quantity > 0 || is_available === false) {
          // Apply availability filter for legacy drugs
          if (is_available === true && drug.quantity <= 0) continue;
          if (is_available === false && drug.quantity > 0) continue;

          // Apply price filter
          if (min_price !== undefined && drug.selling_price < min_price) continue;
          if (max_price !== undefined && drug.selling_price > max_price) continue;

          // Apply manufacturer filter
          if (manufacturer) {
            const mfrRegex = new RegExp(manufacturer, 'i');
            if (!drug.manufacturer || !mfrRegex.test(drug.manufacturer)) continue;
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
            dosage_form_id: drug.dosage_form,
            route: routeName,
            route_abbreviation: routeAbbreviation,
            manufacturer: drug.manufacturer || null,
            selling_price: drug.selling_price,
            quantity: drug.quantity,
            quantity_in_stock: drug.quantity,
            expiry_date: null,
            no_expiry: true,
            image_url: primaryImage,
            primary_image: primaryImage,
            requires_prescription: drug.requires_prescription,
            purchase_type: drug.purchase_type,
            description: drug.description || drug.short_description,
            is_available: drug.quantity > 0,
            is_batch: false,
          });
        }
      }
    }

    // Sort results
    batchResults.sort((a, b) => {
      if (sort_by === 'name') {
        const cmp = (a.name || '').localeCompare(b.name || '');
        return sort_order === 'asc' ? cmp : -cmp;
      }
      if (sort_by === 'selling_price') {
        const diff = (a.selling_price || 0) - (b.selling_price || 0);
        return sort_order === 'asc' ? diff : -diff;
      }
      if (sort_by === 'created_at') {
        const diff = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        return sort_order === 'asc' ? diff : -diff;
      }
      return 0;
    });

    // Paginate
    const total = batchResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = batchResults.slice(startIndex, startIndex + limit);

    return {
      drugs: paginatedResults,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all active drugs (without pagination)
   */
  async findAll(filters?: Partial<Drug>): Promise<DrugDocument[]> {
    return (await find(this.drugModel, { is_active: true, ...filters })) as DrugDocument[];
  }

  /**
   * Get OTC drugs for direct purchase
   */
  async getOTCDrugs(
    page = 1,
    limit = 20,
  ): Promise<{ drugs: any[]; total: number }> {
    const DrugsCollection = this.connection.collection('drugentities');
    const DosageFormsCollection = this.connection.collection('dosageformentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const ManufacturersCollection = this.connection.collection('manufacturerentities');

    const filter = {
      is_active: true,
      is_available: true,
      purchase_type: {
        $in: [
          PurchaseType.OTC_GENERAL,
          PurchaseType.OTC_RESTRICTED,
          PurchaseType.PHARMACY_ONLY,
        ],
      },
    };

    const offset = (page - 1) * limit;
    const total = await DrugsCollection.countDocuments(filter);
    const drugs = await DrugsCollection.find(filter)
      .skip(offset)
      .limit(limit)
      .sort({ name: 1 })
      .toArray();

    // Resolve dosage forms and add batch info
    const resolvedDrugs = await Promise.all(
      drugs.map(async (drug) => {
        // Resolve dosage form name
        let dosageFormName = '';
        if (drug.dosage_form) {
          const df = await DosageFormsCollection.findOne({ _id: drug.dosage_form });
          dosageFormName = df?.name || '';
        }

        // Get primary image with pre-signed URL
        let imageUrl = drug.images?.find((img) => img.is_primary)?.url ||
          drug.images?.[0]?.url || null;

        if (imageUrl && imageUrl.includes('s3.') && imageUrl.includes('amazonaws.com')) {
          try {
            imageUrl = await this.fileUploadHelper.getPresignedUrl(imageUrl, 3600);
          } catch (e) {
            this.logger.warn(`Failed to generate presigned URL for drug ${drug._id}: ${e.message}`);
          }
        }

        // Get total quantity from batches
        const batches = await StockBatchCollection.find({
          drug_id: drug._id,
          status: 'active',
          quantity_available: { $gt: 0 },
          $or: [
            { no_expiry: true },
            { expiry_date: { $gt: new Date() } },
          ],
        }).toArray();

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

        // Use legacy quantity if no batches
        if (totalQuantity === 0 && drug.quantity > 0) {
          totalQuantity = drug.quantity;
        }

        // Resolve manufacturer name if it's an ObjectId
        let manufacturerName = drug.manufacturer;
        if (drug.manufacturer && typeof drug.manufacturer === 'object') {
          const mfr = await ManufacturersCollection.findOne({ _id: drug.manufacturer });
          manufacturerName = mfr?.name || null;
        }

        return {
          ...drug,
          dosage_form: dosageFormName,
          dosage_form_id: drug.dosage_form,
          manufacturer: manufacturerName,
          image_url: imageUrl,
          quantity_in_stock: totalQuantity,
          selling_price: lowestPrice,
          is_available: totalQuantity > 0,
        };
      }),
    );

    return { drugs: resolvedDrugs, total };
  }

  /**
   * Get drugs by category
   * Uses native MongoDB collection and shows batch-level items like specialist endpoint
   */
  async getByCategory(
    category: string,
    page = 1,
    limit = 20,
    sort = 'name',
    availableOnly = false,
    filters?: {
      search?: string;
      otcOnly?: boolean;
      prescriptionOnly?: boolean;
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<{ drugs: any[]; total: number; categoryName: string }> {
    // Convert slug to category code (e.g., "cardiovascular" -> "CARDIOVASCULAR")
    const categoryCode = category.toUpperCase().replace(/-/g, '_');

    // Look up collections
    const CategoriesCollection = this.connection.collection('drugcategoryentities');
    const DrugsCollection = this.connection.collection('drugentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const DosageFormsCollection = this.connection.collection('dosageformentities');
    const ManufacturersCollection = this.connection.collection('manufacturerentities');
    const RoutesCollection = this.connection.collection('drugrouteentities');

    const categoryDoc = await CategoriesCollection.findOne({
      code: categoryCode,
      is_active: true,
    });

    if (!categoryDoc) {
      this.logger.log(`Category not found for code: ${categoryCode}`);
      return { drugs: [], total: 0, categoryName: 'Category' };
    }

    const filter: any = {
      is_active: true,
      is_available: true,
      categories: categoryDoc._id,
    };

    // Apply search filter
    if (filters?.search) {
      filter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { generic_name: { $regex: filters.search, $options: 'i' } },
        { brand_name: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Apply OTC/Prescription filters
    if (filters?.otcOnly) {
      filter.purchase_type = {
        $in: [PurchaseType.OTC_GENERAL, PurchaseType.OTC_RESTRICTED, PurchaseType.PHARMACY_ONLY],
      };
      filter.requires_prescription = false;
    } else if (filters?.prescriptionOnly) {
      filter.requires_prescription = true;
    }

    // Get all drugs in this category
    const drugs = await DrugsCollection.find(filter)
      .sort({ name: 1 })
      .toArray();

    // Build batch-level results (same as specialist endpoint)
    const batchResults: any[] = [];

    for (const drug of drugs) {
      // Get dosage form name
      let dosageFormName = '';
      if (drug.dosage_form) {
        const df = await DosageFormsCollection.findOne({ _id: drug.dosage_form });
        dosageFormName = df?.name || '';
      }

      // Get route information
      let routeName = '';
      let routeAbbreviation = '';
      if (drug.route) {
        const routeDoc = await RoutesCollection.findOne({ _id: drug.route });
        if (routeDoc) {
          routeName = routeDoc.name || '';
          routeAbbreviation = routeDoc.abbreviation || '';
        }
      }

      // Get primary image with pre-signed URL
      let primaryImage = drug.images?.find((img) => img.is_primary)?.url ||
        drug.images?.[0]?.url || null;

      // Generate pre-signed URL for S3 images
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
        .sort({ expiry_date: 1 })
        .toArray();

      if (batches.length > 0) {
        // Add each batch as a separate selectable item
        for (const batch of batches) {
          const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
          if (availableQty <= 0) continue;

          batchResults.push({
            _id: drug._id,
            batch_id: batch._id,
            batch_number: batch.batch_number,
            name: drug.name,
            generic_name: drug.generic_name,
            brand_name: drug.brand_name,
            strength: drug.strength,
            dosage_form: dosageFormName,
            route: routeName,
            route_abbreviation: routeAbbreviation,
            manufacturer: batch.manufacturer || null,
            selling_price: batch.selling_price_override || drug.selling_price,
            quantity: availableQty,
            expiry_date: batch.expiry_date,
            image_url: primaryImage,
            primary_image: primaryImage,
            requires_prescription: drug.requires_prescription,
            purchase_type: drug.purchase_type,
            description: drug.description || drug.short_description,
            is_available: availableQty > 0,
            is_batch: true,
          });
        }
      } else {
        // No batches - use drug's legacy quantity
        if (drug.quantity > 0) {
          // Get manufacturer name if it's an ObjectId
          let drugManufacturer = drug.manufacturer;
          if (drug.manufacturer && typeof drug.manufacturer === 'object') {
            const mfr = await ManufacturersCollection.findOne({ _id: drug.manufacturer });
            drugManufacturer = mfr?.name || null;
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
            route: routeName,
            route_abbreviation: routeAbbreviation,
            manufacturer: drugManufacturer,
            selling_price: drug.selling_price,
            quantity: drug.quantity,
            expiry_date: null,
            image_url: primaryImage,
            primary_image: primaryImage,
            requires_prescription: drug.requires_prescription,
            purchase_type: drug.purchase_type,
            description: drug.description || drug.short_description,
            is_available: drug.quantity > 0,
            is_batch: false,
          });
        }
      }
    }

    // Filter by availability if requested
    let filteredResults = batchResults;
    if (availableOnly) {
      filteredResults = filteredResults.filter(
        (drug) => drug.is_available && drug.quantity > 0,
      );
    }

    // Apply price filters
    if (filters?.minPrice !== undefined) {
      const minPrice = filters.minPrice;
      filteredResults = filteredResults.filter(
        (drug) => drug.selling_price >= minPrice,
      );
    }
    if (filters?.maxPrice !== undefined) {
      const maxPrice = filters.maxPrice;
      filteredResults = filteredResults.filter(
        (drug) => drug.selling_price <= maxPrice,
      );
    }

    // Apply sorting
    filteredResults.sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return (a.selling_price || 0) - (b.selling_price || 0);
        case 'price_desc':
          return (b.selling_price || 0) - (a.selling_price || 0);
        case 'popular':
          // For now, sort by quantity as a proxy for popularity
          return (b.quantity || 0) - (a.quantity || 0);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    // Apply pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const paginatedDrugs = filteredResults.slice(offset, offset + limitNum);

    return {
      drugs: paginatedDrugs,
      total: filteredResults.length,
      categoryName: categoryDoc.name,
    };
  }

  /**
   * Get featured drugs
   */
  async getFeaturedDrugs(limit = 10): Promise<DrugDocument[]> {
    return (await find(this.drugModel, {
      is_active: true,
      is_available: true,
      is_featured: true,
    })) as DrugDocument[];
  }

  /**
   * Search drugs by symptoms
   */
  async searchBySymptoms(
    symptoms: string[],
    page = 1,
    limit = 20,
  ): Promise<{ drugs: DrugDocument[]; total: number }> {
    const filter = {
      is_active: true,
      is_available: true,
      symptoms_treated: { $in: symptoms },
    };

    const offset = (page - 1) * limit;
    const total = await countDocuments(this.drugModel, filter);
    const drugs = (await findAndCountAll({
      model: this.drugModel,
      query: filter,
      limit,
      offset,
    })) as DrugDocument[];

    return { drugs, total };
  }

  /**
   * Check drug interactions using configured data sources
   * Supports Claude AI, OpenFDA, and RxNav (when available)
   * Falls back to local database interactions if APIs fail
   */
  async checkInteractions(
    drugIds: string[],
    dataSources: DataSource[] = ['claude_ai', 'openfda'],
  ): Promise<InteractionCheckResult> {
    const drugs = await find(this.drugModel, {
      _id: { $in: drugIds.map((id) => new Types.ObjectId(id)) },
    });

    if (drugs.length < 2) {
      return {
        hasInteractions: false,
        interactions: [],
        disclaimer: 'At least two drugs are required to check for interactions.',
        checkedAt: new Date(),
        sourcesUsed: [],
      };
    }

    // Get drug names for API lookup
    // Prefer generic_name, fall back to name, then active_ingredients
    const drugNames = drugs.map((drug) => {
      if (drug.generic_name) return drug.generic_name;
      if (drug.name) return drug.name.split(' ')[0]; // Use first word of brand name
      if (drug.active_ingredients?.length > 0) return drug.active_ingredients[0];
      return drug.name;
    }).filter(Boolean);

    // Check interactions using configured data sources
    const apiResult = await this.drugInteractionService.checkInteractions(drugNames, dataSources);

    // If API returned results, use them
    if (apiResult.hasInteractions || apiResult.interactions.length === 0) {
      return apiResult;
    }

    // Fallback: also check local database interactions
    const localInteractions: {
      severity: 'high' | 'moderate' | 'low';
      drug1: string;
      drug2: string;
      description: string;
      source: string;
    }[] = [];
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const drug1 = drugs[i];
        const drug2 = drugs[j];

        if (
          drug1.drug_interactions?.some(
            (id) => id.toString() === drug2._id.toString(),
          )
        ) {
          localInteractions.push({
            severity: 'moderate' as const,
            drug1: drug1.name,
            drug2: drug2.name,
            description: `${drug1.name} may interact with ${drug2.name}. Please consult a pharmacist.`,
            source: 'Local Database',
          });
        }
      }
    }

    // Merge local with API results (avoiding duplicates)
    const allInteractions = [...apiResult.interactions];
    const sourcesUsed = [...(apiResult.sourcesUsed || [])];
    for (const local of localInteractions) {
      const exists = allInteractions.some(
        (i) =>
          (i.drug1 === local.drug1 && i.drug2 === local.drug2) ||
          (i.drug1 === local.drug2 && i.drug2 === local.drug1),
      );
      if (!exists) {
        allInteractions.push(local);
        if (!sourcesUsed.includes('Local Database')) {
          sourcesUsed.push('Local Database');
        }
      }
    }

    return {
      hasInteractions: allInteractions.length > 0,
      interactions: allInteractions,
      disclaimer: apiResult.disclaimer,
      checkedAt: new Date(),
      sourcesUsed,
    };
  }

  /**
   * Get drug statistics
   */
  async getStatistics(): Promise<{
    total: number;
    activeCount: number;
    otcCount: number;
    prescriptionCount: number;
    byCategory: { category: string; count: number }[];
  }> {
    const total = await countDocuments(this.drugModel, {});
    const activeCount = await countDocuments(this.drugModel, { is_active: true });
    const otcCount = await countDocuments(this.drugModel, {
      is_active: true,
      purchase_type: { $in: [PurchaseType.OTC_GENERAL, PurchaseType.OTC_RESTRICTED] },
    });
    const prescriptionCount = await countDocuments(this.drugModel, {
      is_active: true,
      requires_prescription: true,
    });

    // Aggregate by category
    const byCategory = await this.drugModel.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    return {
      total,
      activeCount,
      otcCount,
      prescriptionCount,
      byCategory,
    };
  }

  /**
   * Get all available drug categories
   */
  async getCategories(): Promise<any[]> {
    const CategoriesCollection = this.connection.collection('drugcategoryentities');

    const categories = await CategoriesCollection.find({ is_active: true })
      .sort({ display_order: 1, name: 1 })
      .toArray();

    // Generate presigned URLs for category images
    const categoriesWithUrls = await Promise.all(
      categories.map(async (cat) => {
        let imageUrl = '';
        if (cat.image_url) {
          try {
            imageUrl = await this.fileUploadHelper.getPresignedUrl(cat.image_url, 86400); // 24 hours
          } catch (error) {
            this.logger.error(`Error generating presigned URL for category ${cat.code}:`, error);
            imageUrl = cat.image_url; // Fallback to original URL
          }
        }
        return {
          _id: cat._id,
          name: cat.name,
          code: cat.code,
          slug: cat.code?.toLowerCase().replace(/_/g, '-'),
          description: cat.description || '',
          icon: cat.icon || '',
          image_url: imageUrl,
          display_order: cat.display_order || 0,
        };
      })
    );

    return categoriesWithUrls;
  }

  /**
   * Update a drug category (admin only)
   */
  async updateCategory(
    categoryId: string,
    updateData: { description?: string; icon?: string; image_url?: string; display_order?: number },
  ): Promise<any> {
    const CategoriesCollection = this.connection.collection('drugcategoryentities');
    const { ObjectId } = require('mongodb');

    const result = await CategoriesCollection.findOneAndUpdate(
      { _id: new ObjectId(categoryId) },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { returnDocument: 'after' },
    );

    const doc = result as any;
    if (!doc) {
      throw new Error('Category not found');
    }

    return {
      _id: doc._id,
      name: doc.name,
      code: doc.code,
      slug: doc.code?.toLowerCase().replace(/_/g, '-'),
      description: doc.description || '',
      icon: doc.icon || '',
      image_url: doc.image_url || '',
      display_order: doc.display_order || 0,
    };
  }

  /**
   * Get all unique manufacturers
   */
  async getManufacturers(): Promise<any[]> {
    const ManufacturersCollection = this.connection.collection('manufacturerentities');

    const manufacturers = await ManufacturersCollection.find({ is_active: true })
      .sort({ name: 1 })
      .toArray();

    return manufacturers.map((m) => ({
      _id: m._id,
      name: m.name,
      code: m.code,
    }));
  }

  /**
   * Get similar drugs for a drug
   * Returns drugs that match by:
   * 1. Same generic name (different brands/manufacturers)
   * 2. Same category (therapeutic class)
   * 3. Manually linked by admin
   * Excludes: the drug itself and any admin-excluded drugs
   */
  async getSimilarDrugs(
    drugId: string,
    limit: number | string = 10,
  ): Promise<{
    generic_matches: any[];
    category_matches: any[];
    manually_linked: any[];
  }> {
    // Ensure limit is an integer
    const limitInt = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const safeLimit = isNaN(limitInt) ? 10 : limitInt;
    const DrugsCollection = this.connection.collection('drugentities');
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const DosageFormsCollection = this.connection.collection('dosageformentities');

    // Get the source drug
    const sourceDrug = await DrugsCollection.findOne({
      _id: new Types.ObjectId(drugId),
    });

    if (!sourceDrug) {
      throw new NotFoundException(`Drug with ID ${drugId} not found`);
    }

    // Get excluded drug IDs
    const excludedIds = [
      new Types.ObjectId(drugId), // Exclude itself
      ...(sourceDrug.excluded_similar_drugs || []).map((id: any) =>
        new Types.ObjectId(id.toString()),
      ),
    ];

    // Helper to enrich drug data
    const enrichDrug = async (drug: any) => {
      // Get dosage form name
      let dosageFormName = '';
      if (drug.dosage_form) {
        const df = await DosageFormsCollection.findOne({ _id: drug.dosage_form });
        dosageFormName = df?.name || '';
      }

      // Get primary image with pre-signed URL
      let imageUrl = drug.images?.find((img: any) => img.is_primary)?.url ||
        drug.images?.[0]?.url || null;

      if (imageUrl && imageUrl.includes('s3.') && imageUrl.includes('amazonaws.com')) {
        try {
          imageUrl = await this.fileUploadHelper.getPresignedUrl(imageUrl, 3600);
        } catch (e) {
          this.logger.warn(`Failed to generate presigned URL for drug ${drug._id}: ${e.message}`);
        }
      }

      // Get available quantity from batches
      const batches = await StockBatchCollection.find({
        drug_id: drug._id,
        status: 'active',
        quantity_available: { $gt: 0 },
        $or: [
          { no_expiry: true },
          { expiry_date: { $gt: new Date() } },
        ],
      }).toArray();

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

      // Use legacy quantity if no batches
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

    // 1. Find drugs with same generic name (different brands/manufacturers)
    const genericMatches = await DrugsCollection.find({
      _id: { $nin: excludedIds },
      is_active: true,
      generic_name: { $regex: new RegExp(`^${sourceDrug.generic_name}$`, 'i') },
    })
      .limit(safeLimit)
      .toArray();

    // 2. Find drugs in same categories
    const categoryMatches = await DrugsCollection.find({
      _id: { $nin: [...excludedIds, ...genericMatches.map((d) => d._id)] }, // Exclude generic matches too
      is_active: true,
      categories: { $in: sourceDrug.categories || [] },
    })
      .limit(safeLimit)
      .toArray();

    // 3. Get manually linked drugs
    const manuallyLinkedIds = (sourceDrug.manually_linked_drugs || [])
      .filter((id: any) => !excludedIds.some((exId) => exId.toString() === id.toString()))
      .map((id: any) => new Types.ObjectId(id.toString()));

    const manuallyLinked = manuallyLinkedIds.length > 0
      ? await DrugsCollection.find({
          _id: { $in: manuallyLinkedIds },
          is_active: true,
        }).toArray()
      : [];

    // Enrich all results
    const [enrichedGeneric, enrichedCategory, enrichedManual] = await Promise.all([
      Promise.all(genericMatches.map(enrichDrug)),
      Promise.all(categoryMatches.map(enrichDrug)),
      Promise.all(manuallyLinked.map(enrichDrug)),
    ]);

    return {
      generic_matches: enrichedGeneric,
      category_matches: enrichedCategory,
      manually_linked: enrichedManual,
    };
  }

  /**
   * Get all similar drugs combined (for patient display)
   * Returns a flat list of similar drugs with type indicators
   */
  async getSimilarDrugsFlat(drugId: string, limit: number | string = 8): Promise<any[]> {
    // Ensure limit is an integer
    const limitInt = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const safeLimit = isNaN(limitInt) ? 8 : limitInt;

    const result = await this.getSimilarDrugs(drugId, safeLimit);

    // Combine and deduplicate, prioritizing: manual > generic > category
    const seenIds = new Set<string>();
    const combined: any[] = [];

    // Add manually linked first
    for (const drug of result.manually_linked) {
      if (!seenIds.has(drug._id.toString())) {
        seenIds.add(drug._id.toString());
        combined.push({ ...drug, match_type: 'manual' });
      }
    }

    // Add generic matches
    for (const drug of result.generic_matches) {
      if (!seenIds.has(drug._id.toString())) {
        seenIds.add(drug._id.toString());
        combined.push({ ...drug, match_type: 'generic' });
      }
    }

    // Add category matches
    for (const drug of result.category_matches) {
      if (!seenIds.has(drug._id.toString())) {
        seenIds.add(drug._id.toString());
        combined.push({ ...drug, match_type: 'category' });
      }
    }

    return combined.slice(0, safeLimit);
  }

  /**
   * Manually link a drug as similar (bidirectional)
   */
  async linkSimilarDrug(drugId: string, targetDrugId: string): Promise<any> {
    const DrugsCollection = this.connection.collection('drugentities');

    const drugOid = new Types.ObjectId(drugId);
    const targetOid = new Types.ObjectId(targetDrugId);

    // Verify both drugs exist
    const [drug, targetDrug] = await Promise.all([
      DrugsCollection.findOne({ _id: drugOid }),
      DrugsCollection.findOne({ _id: targetOid }),
    ]);

    if (!drug) throw new NotFoundException(`Drug ${drugId} not found`);
    if (!targetDrug) throw new NotFoundException(`Target drug ${targetDrugId} not found`);

    // Add to manually_linked_drugs (bidirectional)
    await Promise.all([
      DrugsCollection.updateOne(
        { _id: drugOid },
        { $addToSet: { manually_linked_drugs: targetOid } },
      ),
      DrugsCollection.updateOne(
        { _id: targetOid },
        { $addToSet: { manually_linked_drugs: drugOid } },
      ),
    ]);

    this.logger.log(`Linked drugs: ${drugId} <-> ${targetDrugId}`);
    return { linked: true, drug_id: drugId, target_drug_id: targetDrugId };
  }

  /**
   * Unlink a drug from similar (bidirectional)
   */
  async unlinkSimilarDrug(drugId: string, targetDrugId: string): Promise<any> {
    const DrugsCollection = this.connection.collection('drugentities');

    const drugOid = new Types.ObjectId(drugId);
    const targetOid = new Types.ObjectId(targetDrugId);

    // Remove from manually_linked_drugs (bidirectional)
    await Promise.all([
      DrugsCollection.updateOne(
        { _id: drugOid },
        { $pull: { manually_linked_drugs: targetOid } },
      ),
      DrugsCollection.updateOne(
        { _id: targetOid },
        { $pull: { manually_linked_drugs: drugOid } },
      ),
    ]);

    this.logger.log(`Unlinked drugs: ${drugId} <-> ${targetDrugId}`);
    return { unlinked: true, drug_id: drugId, target_drug_id: targetDrugId };
  }

  /**
   * Exclude a drug from auto-matching
   * This is one-directional - only hides targetDrug from drugId's similar list
   */
  async excludeSimilarDrug(drugId: string, targetDrugId: string): Promise<any> {
    const DrugsCollection = this.connection.collection('drugentities');

    const drugOid = new Types.ObjectId(drugId);
    const targetOid = new Types.ObjectId(targetDrugId);

    // Add to excluded_similar_drugs
    await DrugsCollection.updateOne(
      { _id: drugOid },
      { $addToSet: { excluded_similar_drugs: targetOid } },
    );

    // Also remove from manually_linked_drugs if present
    await DrugsCollection.updateOne(
      { _id: drugOid },
      { $pull: { manually_linked_drugs: targetOid } },
    );

    this.logger.log(`Excluded drug ${targetDrugId} from ${drugId}'s similar list`);
    return { excluded: true, drug_id: drugId, target_drug_id: targetDrugId };
  }

  /**
   * Remove a drug from exclusion list
   */
  async removeExclusion(drugId: string, targetDrugId: string): Promise<any> {
    const DrugsCollection = this.connection.collection('drugentities');

    const drugOid = new Types.ObjectId(drugId);
    const targetOid = new Types.ObjectId(targetDrugId);

    // Remove from excluded_similar_drugs
    await DrugsCollection.updateOne(
      { _id: drugOid },
      { $pull: { excluded_similar_drugs: targetOid } },
    );

    this.logger.log(`Removed exclusion: ${targetDrugId} from ${drugId}'s exclusion list`);
    return { removed: true, drug_id: drugId, target_drug_id: targetDrugId };
  }
}
