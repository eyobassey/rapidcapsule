import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pharmacy, PharmacyDocument } from '../entities/pharmacy.entity';
import {
  CreatePharmacyDto,
  UpdatePharmacyDto,
  SearchPharmaciesDto,
  VerifyPharmacyDto,
  SuspendPharmacyDto,
} from '../dto/pharmacy.dto';
import {
  create,
  findOne,
  find,
  updateOneAndReturn,
  deleteOne,
  countDocuments,
  findAndCountAll,
} from '../../../common/crud/crud';
import { PharmacyVerificationStatus } from '../enums';

@Injectable()
export class PharmacyService {
  private readonly logger = new Logger(PharmacyService.name);

  constructor(
    @InjectModel(Pharmacy.name)
    private readonly pharmacyModel: Model<PharmacyDocument>,
  ) {}

  /**
   * Create a new pharmacy
   */
  async create(
    createPharmacyDto: CreatePharmacyDto,
    userId?: Types.ObjectId,
  ): Promise<PharmacyDocument> {
    // Check for duplicate registration number
    const existingByReg = await findOne(this.pharmacyModel, {
      registration_number: createPharmacyDto.registration_number,
    });

    if (existingByReg) {
      throw new ConflictException(
        `Pharmacy with registration number ${createPharmacyDto.registration_number} already exists`,
      );
    }

    // Check for duplicate email
    const existingByEmail = await findOne(this.pharmacyModel, {
      email: createPharmacyDto.email,
    });

    if (existingByEmail) {
      throw new ConflictException(
        `Pharmacy with email ${createPharmacyDto.email} already exists`,
      );
    }

    const pharmacyData = {
      ...createPharmacyDto,
      verification_status: PharmacyVerificationStatus.PENDING,
      created_by: userId,
      updated_by: userId,
      owner: userId,
    };

    this.logger.log(`Creating pharmacy: ${createPharmacyDto.name}`);
    return await create(this.pharmacyModel, pharmacyData);
  }

  /**
   * Find a pharmacy by ID
   */
  async findById(id: Types.ObjectId | string): Promise<PharmacyDocument> {
    const pharmacy = await findOne(this.pharmacyModel, {
      _id: new Types.ObjectId(id),
    });

    if (!pharmacy) {
      throw new NotFoundException(`Pharmacy with ID ${id} not found`);
    }

    return pharmacy;
  }

  /**
   * Find a pharmacy by registration number
   */
  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<PharmacyDocument | null> {
    return await findOne(this.pharmacyModel, {
      registration_number: registrationNumber,
    });
  }

  /**
   * Find a pharmacy by email
   */
  async findByEmail(email: string): Promise<PharmacyDocument | null> {
    return await findOne(this.pharmacyModel, { email });
  }

  /**
   * Update a pharmacy
   */
  async update(
    id: Types.ObjectId | string,
    updatePharmacyDto: UpdatePharmacyDto,
    userId?: Types.ObjectId,
  ): Promise<PharmacyDocument> {
    const pharmacy = await this.findById(id);

    // If email is being changed, check for duplicates
    if (
      updatePharmacyDto.email &&
      updatePharmacyDto.email !== pharmacy.email
    ) {
      const existingByEmail = await this.findByEmail(updatePharmacyDto.email);
      if (existingByEmail) {
        throw new ConflictException(
          `Pharmacy with email ${updatePharmacyDto.email} already exists`,
        );
      }
    }

    const updatedPharmacy = await updateOneAndReturn(
      this.pharmacyModel,
      { _id: pharmacy._id },
      { ...updatePharmacyDto, updated_by: userId },
    );

    this.logger.log(`Updated pharmacy: ${id}`);
    return updatedPharmacy;
  }

  /**
   * Verify a pharmacy (admin action)
   */
  async verify(
    id: Types.ObjectId | string,
    verifyDto: VerifyPharmacyDto,
    adminUserId: Types.ObjectId,
  ): Promise<PharmacyDocument> {
    const pharmacy = await this.findById(id);

    const updateData: any = {
      verification_status: verifyDto.verification_status,
      verification_notes: verifyDto.verification_notes,
      updated_by: adminUserId,
    };

    if (verifyDto.verification_status === PharmacyVerificationStatus.VERIFIED) {
      updateData.verified_at = new Date();
      updateData.verified_by = adminUserId;
    }

    const updatedPharmacy = await updateOneAndReturn(
      this.pharmacyModel,
      { _id: pharmacy._id },
      updateData,
    );

    this.logger.log(
      `Pharmacy ${id} verification status changed to ${verifyDto.verification_status}`,
    );
    return updatedPharmacy;
  }

  /**
   * Suspend a pharmacy
   */
  async suspend(
    id: Types.ObjectId | string,
    suspendDto: SuspendPharmacyDto,
    adminUserId: Types.ObjectId,
  ): Promise<PharmacyDocument> {
    const pharmacy = await this.findById(id);

    if (pharmacy.is_suspended) {
      throw new BadRequestException('Pharmacy is already suspended');
    }

    const updatedPharmacy = await updateOneAndReturn(
      this.pharmacyModel,
      { _id: pharmacy._id },
      {
        is_suspended: true,
        is_online: false,
        suspension_reason: suspendDto.suspension_reason,
        suspended_at: new Date(),
        suspended_by: adminUserId,
        verification_status: PharmacyVerificationStatus.SUSPENDED,
        updated_by: adminUserId,
      },
    );

    this.logger.log(`Pharmacy ${id} suspended: ${suspendDto.suspension_reason}`);
    return updatedPharmacy;
  }

  /**
   * Reactivate a suspended pharmacy
   */
  async reactivate(
    id: Types.ObjectId | string,
    adminUserId: Types.ObjectId,
  ): Promise<PharmacyDocument> {
    const pharmacy = await this.findById(id);

    if (!pharmacy.is_suspended) {
      throw new BadRequestException('Pharmacy is not suspended');
    }

    const updatedPharmacy = await updateOneAndReturn(
      this.pharmacyModel,
      { _id: pharmacy._id },
      {
        is_suspended: false,
        suspension_reason: null,
        suspended_at: null,
        suspended_by: null,
        verification_status: PharmacyVerificationStatus.VERIFIED,
        updated_by: adminUserId,
      },
    );

    this.logger.log(`Pharmacy ${id} reactivated`);
    return updatedPharmacy;
  }

  /**
   * Set pharmacy online status
   */
  async setOnlineStatus(
    id: Types.ObjectId | string,
    isOnline: boolean,
    reason?: string,
  ): Promise<PharmacyDocument> {
    const pharmacy = await this.findById(id);

    if (pharmacy.is_suspended) {
      throw new BadRequestException('Cannot change online status of suspended pharmacy');
    }

    const updateData: any = { is_online: isOnline };
    if (!isOnline && reason) {
      updateData.offline_reason = reason;
    } else if (isOnline) {
      updateData.offline_reason = null;
      updateData.last_online_at = new Date();
    }

    return await updateOneAndReturn(
      this.pharmacyModel,
      { _id: pharmacy._id },
      updateData,
    );
  }

  /**
   * Delete a pharmacy (soft delete)
   */
  async softDelete(
    id: Types.ObjectId | string,
    userId?: Types.ObjectId,
  ): Promise<PharmacyDocument> {
    const pharmacy = await this.findById(id);

    const deletedPharmacy = await updateOneAndReturn(
      this.pharmacyModel,
      { _id: pharmacy._id },
      { is_active: false, is_online: false, updated_by: userId },
    );

    this.logger.log(`Soft deleted pharmacy: ${id}`);
    return deletedPharmacy;
  }

  /**
   * Search and filter pharmacies with pagination
   */
  async search(searchDto: SearchPharmaciesDto): Promise<{
    pharmacies: PharmacyDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      query,
      city,
      state,
      delivery_zone,
      is_online,
      is_verified,
      offers_delivery,
      is_24_hours,
      latitude,
      longitude,
      radius_km,
      page = 1,
      limit = 20,
      sort_by = 'name',
      sort_order = 'asc',
    } = searchDto;

    // Build query
    const filter: any = { is_active: true };

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Location filters
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      filter['address.state'] = { $regex: state, $options: 'i' };
    }

    if (delivery_zone) {
      filter.delivery_zones = delivery_zone;
    }

    // Status filters
    if (is_online !== undefined) {
      filter.is_online = is_online;
    }

    if (is_verified !== undefined) {
      filter.verification_status = is_verified
        ? PharmacyVerificationStatus.VERIFIED
        : { $ne: PharmacyVerificationStatus.VERIFIED };
    }

    // Feature filters
    if (offers_delivery !== undefined) {
      filter.offers_delivery = offers_delivery;
    }

    if (is_24_hours !== undefined) {
      filter.is_24_hours = is_24_hours;
    }

    // Geospatial query
    if (latitude && longitude && radius_km) {
      filter['address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius_km * 1000, // Convert to meters
        },
      };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const total = await countDocuments(this.pharmacyModel, filter);

    // Get pharmacies with pagination
    const pharmacies = (await findAndCountAll({
      model: this.pharmacyModel,
      query: filter,
      limit,
      offset,
      displayScore: !!query,
    })) as PharmacyDocument[];

    // Sort if not using geospatial or text search
    if (!query && !(latitude && longitude)) {
      pharmacies.sort((a, b) => {
        const aVal = a[sort_by];
        const bVal = b[sort_by];
        if (sort_order === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    }

    return {
      pharmacies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all active pharmacies
   */
  async findAll(filters?: Partial<Pharmacy>): Promise<PharmacyDocument[]> {
    return (await find(this.pharmacyModel, { is_active: true, ...filters })) as PharmacyDocument[];
  }

  /**
   * Get verified pharmacies accepting orders
   */
  async getAcceptingOrders(
    page = 1,
    limit = 20,
  ): Promise<{ pharmacies: PharmacyDocument[]; total: number }> {
    const filter = {
      is_active: true,
      is_online: true,
      is_suspended: false,
      verification_status: PharmacyVerificationStatus.VERIFIED,
    };

    const offset = (page - 1) * limit;
    const total = await countDocuments(this.pharmacyModel, filter);
    const pharmacies = (await findAndCountAll({
      model: this.pharmacyModel,
      query: filter,
      limit,
      offset,
    })) as PharmacyDocument[];

    return { pharmacies, total };
  }

  /**
   * Get pharmacies by delivery zone
   */
  async getByDeliveryZone(
    zone: string,
    page = 1,
    limit = 20,
  ): Promise<{ pharmacies: PharmacyDocument[]; total: number }> {
    const filter = {
      is_active: true,
      is_online: true,
      is_suspended: false,
      verification_status: PharmacyVerificationStatus.VERIFIED,
      offers_delivery: true,
      delivery_zones: zone,
    };

    const offset = (page - 1) * limit;
    const total = await countDocuments(this.pharmacyModel, filter);
    const pharmacies = (await findAndCountAll({
      model: this.pharmacyModel,
      query: filter,
      limit,
      offset,
    })) as PharmacyDocument[];

    return { pharmacies, total };
  }

  /**
   * Get nearby pharmacies
   */
  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm = 10,
    limit = 10,
  ): Promise<PharmacyDocument[]> {
    return this.pharmacyModel
      .find({
        is_active: true,
        is_online: true,
        is_suspended: false,
        verification_status: PharmacyVerificationStatus.VERIFIED,
        'address.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusKm * 1000,
          },
        },
      })
      .limit(limit)
      .exec();
  }

  /**
   * Get pharmacy statistics
   */
  async getStatistics(): Promise<{
    total: number;
    activeCount: number;
    verifiedCount: number;
    onlineCount: number;
    suspendedCount: number;
    pendingVerification: number;
    byState: { state: string; count: number }[];
  }> {
    const total = await countDocuments(this.pharmacyModel, {});
    const activeCount = await countDocuments(this.pharmacyModel, {
      is_active: true,
    });
    const verifiedCount = await countDocuments(this.pharmacyModel, {
      verification_status: PharmacyVerificationStatus.VERIFIED,
    });
    const onlineCount = await countDocuments(this.pharmacyModel, {
      is_active: true,
      is_online: true,
    });
    const suspendedCount = await countDocuments(this.pharmacyModel, {
      is_suspended: true,
    });
    const pendingVerification = await countDocuments(this.pharmacyModel, {
      verification_status: PharmacyVerificationStatus.PENDING,
    });

    // Aggregate by state
    const byState = await this.pharmacyModel.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$address.state', count: { $sum: 1 } } },
      { $project: { state: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    return {
      total,
      activeCount,
      verifiedCount,
      onlineCount,
      suspendedCount,
      pendingVerification,
      byState,
    };
  }

  /**
   * Update pharmacy rating
   */
  async updateRating(
    id: Types.ObjectId | string,
    newRating: number,
  ): Promise<PharmacyDocument> {
    const pharmacy = await this.findById(id);

    // Calculate new average rating
    const totalRatings = pharmacy.total_ratings + 1;
    const currentTotal = pharmacy.average_rating * pharmacy.total_ratings;
    const newAverage = (currentTotal + newRating) / totalRatings;

    return await updateOneAndReturn(
      this.pharmacyModel,
      { _id: pharmacy._id },
      {
        average_rating: Math.round(newAverage * 10) / 10, // Round to 1 decimal
        total_ratings: totalRatings,
      },
    );
  }

  /**
   * Increment order count
   */
  async incrementOrderCount(id: Types.ObjectId | string): Promise<void> {
    await this.pharmacyModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $inc: { total_orders: 1 } },
    );
  }

  /**
   * Get available pickup centers
   * Returns pharmacies that can serve as pickup locations for orders from other pharmacies
   */
  async getPickupCenters(options: {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    state?: string;
    city?: string;
    limit?: number;
    page?: number;
    accepts_refrigerated?: boolean;
  }): Promise<{
    pickup_centers: PharmacyDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      latitude,
      longitude,
      radiusKm = 20,
      state,
      city,
      limit = 20,
      page = 1,
      accepts_refrigerated,
    } = options;

    // Base filter for pickup centers
    const filter: any = {
      is_active: true,
      is_suspended: false,
      is_pickup_center: true,
      verification_status: PharmacyVerificationStatus.VERIFIED,
      'pickup_center_settings.accepts_external_orders': { $ne: false },
    };

    // Location filters
    if (state) {
      filter['address.state'] = { $regex: state, $options: 'i' };
    }

    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    // Filter by refrigeration capability
    if (accepts_refrigerated !== undefined) {
      filter['pickup_center_settings.accepts_refrigerated'] = accepts_refrigerated;
    }

    const offset = (page - 1) * limit;

    // If coordinates provided, use geospatial query
    if (latitude && longitude) {
      // Use aggregation with $geoNear for distance calculation
      const pipeline: any[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distance',
            maxDistance: radiusKm * 1000, // Convert to meters
            spherical: true,
            query: filter,
          },
        },
        {
          $addFields: {
            distance_km: { $divide: ['$distance', 1000] },
          },
        },
        { $sort: { distance: 1 } },
      ];

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.pharmacyModel.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Get paginated results
      pipeline.push({ $skip: offset }, { $limit: limit });
      const pickup_centers = await this.pharmacyModel.aggregate(pipeline);

      return {
        pickup_centers: pickup_centers as PharmacyDocument[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Without coordinates, use standard query
    const total = await countDocuments(this.pharmacyModel, filter);
    const pickup_centers = (await findAndCountAll({
      model: this.pharmacyModel,
      query: filter,
      limit,
      offset,
    })) as PharmacyDocument[];

    return {
      pickup_centers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific pickup center by ID
   */
  async getPickupCenterById(id: Types.ObjectId | string): Promise<PharmacyDocument> {
    const pharmacy = await findOne(this.pharmacyModel, {
      _id: new Types.ObjectId(id),
      is_active: true,
      is_pickup_center: true,
      verification_status: PharmacyVerificationStatus.VERIFIED,
    });

    if (!pharmacy) {
      throw new NotFoundException(`Pickup center with ID ${id} not found or not available`);
    }

    return pharmacy;
  }

  /**
   * Recommend pickup centers based on patient location and order requirements
   */
  async recommendPickupCenters(options: {
    latitude: number;
    longitude: number;
    needs_refrigeration?: boolean;
    limit?: number;
  }): Promise<PharmacyDocument[]> {
    const { latitude, longitude, needs_refrigeration = false, limit = 5 } = options;

    const filter: any = {
      is_active: true,
      is_suspended: false,
      is_pickup_center: true,
      verification_status: PharmacyVerificationStatus.VERIFIED,
      'pickup_center_settings.accepts_external_orders': { $ne: false },
    };

    // If refrigeration needed, filter for pharmacies that accept it
    if (needs_refrigeration) {
      filter['pickup_center_settings.accepts_refrigerated'] = true;
    }

    // Use aggregation to get nearest pickup centers with additional scoring
    const pipeline: any[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distance',
          maxDistance: 50000, // 50km max for recommendations
          spherical: true,
          query: filter,
        },
      },
      {
        $addFields: {
          distance_km: { $divide: ['$distance', 1000] },
          // Score based on rating, handling fee, and distance
          recommendation_score: {
            $add: [
              { $multiply: ['$average_rating', 2] }, // Rating weight
              { $subtract: [10, { $divide: ['$distance', 5000] }] }, // Distance weight (closer = better)
              {
                $cond: [
                  { $eq: ['$pickup_center_settings.handling_fee', 0] },
                  2, // Bonus for free handling
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { recommendation_score: -1, distance: 1 } },
      { $limit: limit },
    ];

    return this.pharmacyModel.aggregate(pipeline);
  }
}
