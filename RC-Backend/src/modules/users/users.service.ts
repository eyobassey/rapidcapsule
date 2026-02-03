import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  RegMedium,
  User,
  UserDocument,
  UserType,
} from './entities/user.entity';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as mime from 'mime-types';
import {
  countDocuments,
  create,
  deleteOne,
  find,
  findAndCountAll,
  findById,
  findOne,
  updateOne,
  upsert,
} from '../../common/crud/crud';
import { SocialMediaUserType } from '../auth/types/social-media.type';
import { ProfileSetupDto } from './dto/profile-setup.dto';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { Messages } from '../../core/messages/messages';
import { TokenType } from '../tokens/entities/token.entity';
import { TokensService } from '../tokens/tokens.service';
import { verificationEmail } from '../../core/emails/mails/verificationEmail';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { UserSettingsService } from '../user-settings/user-settings.service';
import { TaskScheduler } from '../../core/worker/task.scheduler';
import { File } from './entities/pre-existing-condition.entity';
import { QueryDto } from '../../common/helpers/url-query.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ProfessionalPracticeSetupDto } from './dto/professional-practice-setup.dto';
import { Documents } from './types/profile.types';
import { IJwtPayload } from '../auth/types/jwt-payload.type';
import { SpecialistAvailabilityDto } from './dto/specialist-availability.dto';
import {
  SpecialistPreferences,
  SpecialistPreferencesDocument,
} from './entities/specialist-preferences.entity';
import { SpecialistPreferencesDto } from './dto/specialist-preferences.dto';
import { CreateAwardDto } from './dto/create-award.dto';
import { CreateCertificationsDto } from './dto/create-certifications.dto';
import { ReferralsService } from '../referrals/referrals.service';
import { WalletsService } from '../wallets/wallets.service';

const { ObjectId } = Types;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SpecialistPreferences.name)
    private specialistPreferencesModel: Model<SpecialistPreferencesDocument>,
    private readonly fileUpload: FileUploadHelper,
    private readonly generalHelpers: GeneralHelpers,
    private readonly tokensService: TokensService,
    private readonly userSettingsService: UserSettingsService,
    private readonly referralsService: ReferralsService,
    private taskCron: TaskScheduler,
    private readonly walletsService: WalletsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { country_code, phone, terms, marketing, email, password } =
      createUserDto;
    return await create(this.userModel, {
      profile: {
        ...createUserDto,
        password: await this.hashPassword(password),
        contact: {
          phone: {
            country_code,
            number: phone,
          },
          email,
        },
      },
      ...createUserDto,
      terms,
      marketing,
    });
  }

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async createSocialMediaUser(
    socialMediaUserType: SocialMediaUserType,
  ): Promise<UserDocument> {
    return await create(this.userModel, {
      profile: {
        ...socialMediaUserType,
        contact: {
          email: socialMediaUserType.email,
        },
      },
      ...socialMediaUserType,
    });
  }

  async register(createUserDto: CreateUserDto, originUrl: string) {
    //TODO: Wrap in transactions
    const user = await this.create(createUserDto);
    const token = await this.tokensService.create(TokenType.EMAIL, user._id);
    await this.userSettingsService.create(user._id);
    await this.referralsService.createReferral(user._id);
    const link = `${
      originUrl || process.env.BASE_URL
    }/email-verification?token=${token.token}&userId=${user._id}`;
    this.generalHelpers.generateEmailAndSend({
      email: user.profile.contact.email,
      subject: Messages.EMAIL_VERIFICATION,
      emailBody: verificationEmail({
        firstname: user.profile.first_name,
        link,
      }),
    });
    return UsersService.excludeFields(user);
  }

  async findById(id: Types.ObjectId): Promise<UserDocument> {
    return await findById(this.userModel, id);
  }

  async findOne(query: any): Promise<UserDocument> {
    const user = await findOne(this.userModel, query, {
      selectFields: ['-profile.password', '-profile.twoFA_secret', '-security'],
    });
    if (!user) throw new NotFoundException(Messages.NO_USER_FOUND);
    return user;
  }

  async findOneByEmail(email: string): Promise<UserDocument> {
    return await findOne(this.userModel, { 'profile.contact.email': email });
  }

  async findOneByEmailAndUserType(
    email: string,
    user_type: UserType,
  ): Promise<UserDocument> {
    return await findOne(this.userModel, {
      'profile.contact.email': email,
      user_type,
    });
  }

  async findOneByPhone(phone: string): Promise<UserDocument> {
    return await findOne(this.userModel, {
      'profile.contact.phone.number': phone,
    });
  }

  async findOneByEmailOrPhone(email: string, phone: string): Promise<User> {
    return await findOne(this.userModel, {
      $or: [
        {
          'profile.contact.email': email || '',
        },
        {
          'profile.contact.phone.number': phone || '',
        },
      ],
    });
  }

  async findByNameSearch(searchTerm: string): Promise<UserDocument[]> {
    const searchRegex = new RegExp(searchTerm, 'i');
    return await this.userModel
      .find({
        $or: [
          { 'profile.first_name': searchRegex },
          { 'profile.last_name': searchRegex },
        ],
      })
      .select('_id')
      .limit(100)
      .lean();
  }

  async removeOne(id: string) {
    return await deleteOne(this.userModel, { _id: id });
  }

  async updateOne(userId: Types.ObjectId, fieldsToUpdate: object) {
    return await updateOne(this.userModel, { _id: userId }, fieldsToUpdate);
  }

  async profileSetup(userId: Types.ObjectId, profileSetupDto: ProfileSetupDto) {
    const existingUser = await this.findById(userId);
    const { profile: existingProfile, reg_medium, allergies: existingAllergies, medical_history: existingMedicalHistory, device_integration: existingDeviceIntegration } = existingUser;

    // Extract optional fields from DTO
    const { profile: profileDto, emergency_contacts, pre_existing_conditions, dependants, security, allergies, medical_history, device_integration } = profileSetupDto;

    // Build update object dynamically based on what's provided
    const updateFields: any = {};

    // Handle profile updates if profile data is provided
    if (profileDto) {
      const contact = profileDto.contact || {};
      const { address1, address2, country, zip_code, state, city, phone } = contact;
      const {
        profile_photo,
        basic_health_info,
        health_risk_factors,
        gender,
        marital_status,
        first_name,
        last_name,
        date_of_birth,
        blood_type,
        genotype,
        occupation,
      } = profileDto as any;

      updateFields.profile = {
        ...existingProfile,
        ...(first_name !== undefined && { first_name }),
        ...(last_name !== undefined && { last_name }),
        ...(date_of_birth !== undefined && { date_of_birth }),
        ...(blood_type !== undefined && { blood_type }),
        ...(genotype !== undefined && { genotype }),
        ...(occupation !== undefined && { occupation }),
        ...(basic_health_info !== undefined && { basic_health_info }),
        ...(health_risk_factors !== undefined && { health_risk_factors }),
        ...(marital_status !== undefined && { marital_status }),
        ...(gender !== undefined && { gender }),
        contact: {
          ...existingProfile?.contact,
          ...(address1 !== undefined && { address1 }),
          ...(address2 !== undefined && { address2 }),
          ...(city !== undefined && { city }),
          ...(country !== undefined && { country }),
          ...(zip_code !== undefined && { zip_code }),
          ...(state !== undefined && { state }),
          ...(phone && {
            phone: {
              country_code: phone.country_code || existingProfile?.contact?.phone?.country_code,
              number: phone.number || existingProfile?.contact?.phone?.number,
            },
          }),
        },
      };

      // Handle profile photo upload
      if (profile_photo) {
        await this.taskCron.addCron(
          this.uploadProfilePhoto(userId, profile_photo),
          `${Date.now()}-${userId}-uploadProfilePhoto`,
        );
      }
    }

    // Handle emergency contacts
    if (emergency_contacts !== undefined) {
      updateFields.emergency_contacts = emergency_contacts;
    }

    // Handle dependants
    if (dependants !== undefined) {
      updateFields.dependants = dependants;
    }

    // Handle security
    if (security !== undefined) {
      updateFields.security = security;
    }

    // Handle pre_existing_conditions
    if (pre_existing_conditions !== undefined) {
      updateFields.pre_existing_conditions = pre_existing_conditions?.map((condition) => ({
        ...condition,
        file:
          condition?.file?.map(({ file_type, original_name }) => ({
            file_type,
            original_name,
            url: '',
          })) || [],
      })) || [];

      const files = pre_existing_conditions
        ?.map(({ file }) => file)
        .filter((file) => file && file?.length) || [];

      if (files?.length) {
        await this.hasFilesAndUpload(
          <File[][]>files,
          pre_existing_conditions,
          this.uploadProfileFiles(files, userId, 'pre_existing_conditions'),
          `${Date.now()}-${userId}-uploadFiles`,
        );
      }
    }

    // Handle allergies
    if (allergies !== undefined) {
      updateFields.allergies = {
        ...(existingAllergies || {}),
        ...allergies,
      };
    }

    // Handle medical_history
    if (medical_history !== undefined) {
      updateFields.medical_history = {
        ...(existingMedicalHistory || {}),
        ...medical_history,
      };
    }

    // Handle device_integration
    if (device_integration !== undefined) {
      updateFields.device_integration = {
        ...(existingDeviceIntegration || {}),
        ...device_integration,
      };
    }

    // Only update if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return existingUser;
    }

    const user = await updateOne(
      this.userModel,
      { _id: userId },
      updateFields,
    );

    return user;
  }

  mapContacts(dbEmergencyContacts, emergency_contacts) {
    const idMap = new Map(
      emergency_contacts.map((fContact) => [fContact._id, fContact]),
    );

    const updatedEmergencyContacts: any = [];

    const mappedEmergencyContacts = dbEmergencyContacts?.map((contact) => {
      const foundContact = idMap.get(contact._id.toString());
      if (foundContact) return { ...contact, ...foundContact };
      return contact;
    });

    emergency_contacts?.forEach((contact) => {
      if (!contact._id) {
        updatedEmergencyContacts.push({ ...contact, _id: new ObjectId() });
      }
    });

    return updatedEmergencyContacts.length
      ? [...mappedEmergencyContacts, ...updatedEmergencyContacts]
      : mappedEmergencyContacts;
  }

  mapDependants(dbDependants, dependants) {
    const idMap = new Map(
      dependants.map((fDependant) => [fDependant._id, fDependant]),
    );

    const updatedDependants: any = [];

    const mappedDependants = dbDependants?.map((dependant) => {
      const foundCondition = idMap.get(dependant._id.toString());
      if (foundCondition) return { ...dependant, ...foundCondition };
      return dependant;
    });

    dependants?.forEach((dependant) => {
      if (!dependant._id) {
        updatedDependants.push({ ...dependant, _id: new ObjectId() });
      }
    });

    return updatedDependants.length
      ? [...mappedDependants, ...updatedDependants]
      : mappedDependants;
  }

  mapPreConditions(dbPreConditions, pre_existing_conditions) {
    const idMap = new Map<string, any>(
      pre_existing_conditions.map((cond) => [cond._id, cond]),
    );
    const updatedConditions: any = [];
    const filesToUpload: any = [];

    const mappedConditions = dbPreConditions?.map((cond) => {
      const foundCondition = idMap.get(cond._id.toString());
      if (foundCondition) {
        // Check if there are new files (base64 data URLs) to upload
        if (foundCondition.file?.length) {
          const hasNewFiles = foundCondition.file.some(
            (f: any) => f.url && f.url.startsWith('data:'),
          );
          if (hasNewFiles) {
            filesToUpload.push(foundCondition.file);
            return {
              ...cond,
              ...foundCondition,
              file: foundCondition.file.map(({ file_type, original_name }: any) => ({
                file_type,
                original_name,
                url: '',
              })),
            };
          }
        }
        return { ...cond, ...foundCondition };
      }
      return cond;
    });

    pre_existing_conditions?.forEach((cond) => {
      if (!cond._id) {
        updatedConditions.push({
          ...cond,
          _id: new ObjectId(),
          file:
            cond.file?.map(({ file_type, original_name }) => ({
              file_type,
              original_name,
              url: '',
            })) || [],
        });
        if (cond.file?.length) filesToUpload.push(cond.file);
      }
    });

    return {
      conditions: updatedConditions.length
        ? [...mappedConditions, ...updatedConditions]
        : mappedConditions,
      filesToUpload,
    };
  }

  async updateUserProfile(
    updateUserProfileDto: UpdateUserProfileDto,
    userId: Types.ObjectId,
  ) {
    const {
      profile,
      pre_existing_conditions,
      dependants,
      emergency_contacts,
      security,
      languages,
      specialist_categories,
      professional_practice,
      medical_history,
      allergies,
    } = updateUserProfileDto || {};

    const user = await this.findById(userId);
    const {
      profile: dbUser,
      security: dbSecurity,
      pre_existing_conditions: dbPreConditions = [],
      dependants: dbDependants = [],
      emergency_contacts: dbEmergencyContacts = [],
    } = user.toJSON();

    // Process pre-existing conditions and collect files to upload
    let conditionFilesToUpload: any[] = [];
    let mappedConditions = null;
    if (pre_existing_conditions?.length) {
      const result = this.mapPreConditions(dbPreConditions, pre_existing_conditions);
      mappedConditions = result.conditions;
      conditionFilesToUpload = result.filesToUpload;
    }

    const fieldsToUpdate = {
      profile: {
        ...dbUser,
        ...(profile?.contact && {
          contact: {
            ...dbUser.contact,
            ...profile.contact,
          },
        }),
        ...(profile?.gender && { gender: profile.gender }),
        ...(profile?.marital_status && { marital_status: profile.marital_status }),
        basic_health_info: {
          ...(dbUser.basic_health_info || {}),
          ...(profile?.basic_health_info || {}),
        },
        health_risk_factors: {
          ...(dbUser.health_risk_factors || {}),
          ...(profile?.health_risk_factors || {}),
        },
      },
      ...(security && {
        security: {
          ...(dbSecurity || {}),
          ...(security || {}),
        },
      }),
      ...(mappedConditions !== null && {
        pre_existing_conditions: mappedConditions,
      }),
      ...(dependants?.length && {
        dependants: this.mapDependants(dbDependants, dependants),
      }),
      ...(emergency_contacts?.length && {
        emergency_contacts: this.mapContacts(
          dbEmergencyContacts,
          emergency_contacts,
        ),
      }),
      ...(languages?.length && { languages }),
      ...(specialist_categories?.length && { specialist_categories }),
      ...(professional_practice && {
        professional_practice: {
          ...(user.professional_practice || {}),
          ...professional_practice,
        },
      }),
      ...(medical_history && {
        medical_history: {
          ...(user.medical_history || {}),
          ...medical_history,
        },
      }),
      ...(allergies && {
        allergies: {
          ...(user.allergies || {}),
          ...allergies,
        },
      }),
    };

    const updatedUser = await updateOne(
      this.userModel,
      { _id: userId },
      {
        ...fieldsToUpdate,
      },
    );

    // Handle profile photo upload synchronously so it's complete before response
    if (profile?.profile_photo) {
      await this.uploadProfilePhoto(userId, profile.profile_photo);
    }

    // Upload condition files AFTER main update completes
    if (conditionFilesToUpload.length) {
      await this.uploadProfileFiles(
        conditionFilesToUpload,
        userId,
        'pre_existing_conditions',
      );
    }

    return updatedUser;
  }

  async findAllUsers(query, fieldsToSelect: string | string[] | null = null) {
    return (await find(
      this.userModel,
      { ...query },
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
    )) as UserDocument[];
  }

  async getUsers(query: QueryDto) {
    const { currentPage, pageLimit, filterBy, search } = query;
    const { limit, offset } = this.generalHelpers.calcLimitAndOffset(
      +currentPage,
      pageLimit,
    );
    let result: { users: UserDocument[]; count: number };

    if (search) {
      result = await this.searchUsers(filterBy, limit, offset, search);
    } else {
      result = await this.queryUsers(filterBy, limit, offset);
    }

    return this.generalHelpers.paginate(
      result.users,
      +currentPage,
      limit,
      result.count,
    );
  }

  async searchUsers(
    filterBy: string | undefined,
    limit: number,
    offset: number,
    search: string,
  ): Promise<{ users: UserDocument[]; count: number }> {
    const query = {
      ...(filterBy && { user_type: filterBy }),
      $text: { $search: search },
    };
    const users = (await findAndCountAll({
      model: this.userModel,
      query,
      limit,
      offset,
      options: {
        selectFields: [
          '-profile.password',
          '-profile.twoFA_secret',
          '-security',
        ],
      },
      displayScore: true,
    })) as UserDocument[];
    return { users, count: await countDocuments(this.userModel, { ...query }) };
  }

  async queryUsers(
    filterBy: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ users: UserDocument[]; count: number }> {
    const query = { ...(filterBy && { user_type: filterBy }) };
    const users = (await findAndCountAll({
      model: this.userModel,
      query,
      limit,
      offset,
      options: {
        selectFields: [
          '-profile.password',
          '-profile.twoFA_secret',
          '-security',
        ],
      },
    })) as UserDocument[];
    return { users, count: await countDocuments(this.userModel, { ...query }) };
  }

  private async hasFilesAndUpload(
    files: File[][],
    fields: any[] | undefined,
    funcToRun,
    jobName,
  ) {
    if (!files || !files?.length) return;
    if (!fields || !fields?.length) return;
    await this.taskCron.addCron(funcToRun, jobName);
  }

  async getProfile(payload: IJwtPayload) {
    const user = await this.userModel
      .findOne({ _id: payload.sub })
      .select(this.getSelectedFields(payload.user_type))
      .populate('languages', 'name code native_name')
      .populate('specialist_categories', 'name slug icon')
      .exec();
    if (!user) throw new NotFoundException(Messages.NO_USER_FOUND);

    // Generate presigned URL for profile photo if it exists
    if (user.profile?.profile_photo) {
      try {
        const presignedUrl = await this.fileUpload.resolveProfileImage(
          user.profile.profile_photo,
        );
        // Only update if we got a valid URL back
        if (presignedUrl) {
          user.profile.profile_photo = presignedUrl;
        }
      } catch (e) {
        this.logger.error(`Error generating presigned URL for profile photo: ${e}`);
        // Clear the photo if presigning fails so frontend shows fallback avatar
        (user.profile as any).profile_photo = undefined;
      }
    }

    // Generate presigned URLs for pre-existing condition documents
    if (user.pre_existing_conditions?.length) {
      for (const condition of user.pre_existing_conditions) {
        if (condition.file?.length) {
          for (const file of condition.file) {
            if (file.url && file.url.startsWith('http')) {
              try {
                file.url = await this.fileUpload.getPresignedUrl(
                  file.url,
                  604800, // 7 days expiration
                );
              } catch (e) {
                this.logger.error(`Error generating presigned URL for condition document: ${e}`);
              }
            }
          }
        }
      }
    }

    return user;
  }

  getSelectedFields(user_type: UserType | string) {
    if (user_type === UserType.SPECIALIST) {
      return [
        '-profile.password',
        '-profile.twoFA_secret',
        '-emergency_contacts',
        '-pre_existing_conditions',
        '-dependants',
        '-security',
      ];
    }
    return [
      '-profile.password',
      '-profile.twoFA_secret',
      '-documents',
      '-professional_practice',
      '-earnings',
      '-average_rating',
      '-verification_status',
      '-awards',
      '-payment_structure',
      '-security',
    ];
  }

  async specialistProfileSetup(
    professionalPracticeSetupDto: ProfessionalPracticeSetupDto,
    userId: Types.ObjectId,
  ) {
    const user = await this.findById(userId);
    if (user.user_type !== UserType.SPECIALIST)
      throw new BadRequestException(Messages.UNAUTHORIZED);
    const {
      documents,
      professional_practice,
      payment_structure,
      profile: {
        contact: { phone, country, zip_code, state, address1, address2 },
        marital_status,
        profile_photo,
        gender,
      },
      security,
    } = professionalPracticeSetupDto;
    const { profile, reg_medium } = user.toJSON();

    const updatedUser = await updateOne(
      this.userModel,
      { _id: userId },
      {
        profile: {
          ...profile,
          marital_status,
          gender,
          contact: {
            ...profile.contact,
            ...(reg_medium !== RegMedium.LOCAL && {
              phone: { country_code: phone.country_code, number: phone.number },
            }),
            address1,
            address2,
            country,
            zip_code,
            state,
          },
        },
        professional_practice,
        payment_structure,
        security,
        documents:
          documents?.map(({ file_type, original_name, type_of_document }) => ({
            file_type,
            original_name,
            type_of_document,
            url: '',
          })) || [],
      },
    );
    if (profile_photo) {
      await this.taskCron.addCron(
        this.uploadProfilePhoto(userId, profile_photo),
        `${Date.now()}-${userId}-uploadProfilePhoto`,
      );
    }

    if (documents?.length) {
      await this.taskCron.addCron(
        this.uploadSpecialistDocuments(documents, user),
        `${Date.now()}-${userId}-uploadDocuments`,
      );
    }
    return updatedUser;
  }

  async addAward(createAwardDto: CreateAwardDto, userId: Types.ObjectId) {
    const { awards } = createAwardDto;
    const files =
      awards?.map(({ file }) => file).filter((file) => file && file?.length) ||
      [];

    const user = await updateOne(
      this.userModel,
      { _id: userId },
      {
        awards:
          awards?.map((condition) => ({
            ...condition,
            file:
              condition?.file?.map(({ file_type, original_name }) => ({
                file_type,
                original_name,
                url: '',
              })) || [],
          })) || [],
      },
    );
    if (files?.length) {
      await this.hasFilesAndUpload(
        files,
        awards,
        this.uploadProfileFiles(files, userId, 'awards'),
        `${Date.now()}-uploadAwards`,
      );
    }
    return user;
  }

  async addCertifications(
    createCertificationsDto: CreateCertificationsDto,
    userId: Types.ObjectId,
  ) {
    const { documents } = createCertificationsDto;
    const user = await this.findById(userId);
    const updatedUser = await updateOne(
      this.userModel,
      { _id: userId },
      {
        documents:
          documents?.map(({ file_type, original_name, type_of_document }) => ({
            file_type,
            original_name,
            type_of_document,
            url: '',
          })) || [],
      },
    );
    if (documents?.length) {
      await this.taskCron.addCron(
        this.uploadSpecialistDocuments(documents, user),
        `${Date.now()}-${user._id}-uploadDocuments`,
      );
    }
    return updatedUser;
  }

  private static excludeFields(user: UserDocument) {
    const serializedUser = user.toJSON() as Partial<User>;
    delete serializedUser.profile?.password;
    delete serializedUser.profile?.twoFA_secret;
    return serializedUser;
  }

  private async uploadProfileFiles(
    files: File[][],
    userId: Types.ObjectId,
    fieldToUpdate: string,
  ) {
    try {
      this.logger.log(`Uploading ${files.length} file group(s) for ${fieldToUpdate}`);

      // Flatten files and upload all to S3
      const uploadPromises: Promise<{ fileName: string; s3Url: string }>[] = [];

      for (const fileGroup of files) {
        for (const { url, original_name: fileName } of fileGroup) {
          if (!url || !url.startsWith('data:')) {
            this.logger.log(`Skipping file ${fileName} - no base64 data`);
            continue;
          }

          const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches?.length !== 3) {
            this.logger.error(`Invalid base64 for file ${fileName}`);
            continue;
          }

          const buffer = Buffer.from(matches[2], 'base64');
          const extension = mime.extension(matches[1]) || 'bin';

          uploadPromises.push(
            this.fileUpload
              .uploadToS3(buffer, `${userId}-${fileName}.${extension}`)
              .then((s3Url) => {
                this.logger.log(`Uploaded ${fileName} to S3: ${s3Url}`);
                return { fileName, s3Url };
              }),
          );
        }
      }

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);

      // Update each file URL in the database by finding exact indices
      const user = await this.findById(userId);
      const conditions = user[fieldToUpdate] || [];

      for (const { fileName, s3Url } of uploadResults) {
        // Find the condition and file indices
        for (let condIdx = 0; condIdx < conditions.length; condIdx++) {
          const condition = conditions[condIdx];
          if (condition.file?.length) {
            for (let fileIdx = 0; fileIdx < condition.file.length; fileIdx++) {
              if (condition.file[fileIdx].original_name === fileName) {
                // Update using direct positional path
                const updatePath = `${fieldToUpdate}.${condIdx}.file.${fileIdx}.url`;
                const result = await this.userModel.updateOne(
                  { _id: userId },
                  { $set: { [updatePath]: s3Url } },
                );
                this.logger.log(
                  `Updated ${updatePath} for ${fileName}: matched=${result.matchedCount}, modified=${result.modifiedCount}`,
                );
              }
            }
          }
        }
      }

      this.logger.log(`Updated ${uploadResults.length} file URLs for ${fieldToUpdate}`);
    } catch (e) {
      this.logger.error(`Error uploading files: ${e}`);
      throw new InternalServerErrorException('Error occurred', e);
    }
  }

  private async uploadProfilePhoto(userId: Types.ObjectId, base64: string) {
    try {
      // Handle both data URL format and pure base64
      let buffer: Buffer;
      let extension = 'jpg';

      // Log input for debugging (first 100 chars to avoid huge logs)
      this.logger.log(`Profile photo input length: ${base64?.length || 0}, preview: ${base64?.substring(0, 100)}...`);

      // Check if it's a data URL (e.g., data:image/jpeg;base64,...)
      // Use [\s\S]+ instead of .+ to match any character including newlines
      const matches = base64.match(/^data:([A-Za-z0-9-+\/]+);base64,([\s\S]+)$/);
      if (matches?.length === 3) {
        // Extract the base64 part and determine extension
        const base64Data = matches[2].replace(/\s/g, ''); // Remove any whitespace
        buffer = Buffer.from(base64Data, 'base64');
        const mimeExt = mime.extension(matches[1]);
        if (mimeExt) extension = mimeExt;
        this.logger.log(`Parsed data URL: mime=${matches[1]}, extension=${extension}, buffer size=${buffer.length}`);
      } else {
        // Assume it's pure base64
        this.logger.warn(`Profile photo does not match data URL format, treating as raw base64`);
        buffer = Buffer.from(base64, 'base64');
      }

      // Validate buffer has reasonable size (at least 1KB for a real image)
      if (buffer.length < 1024) {
        this.logger.error(`Profile photo buffer too small (${buffer.length} bytes), likely corrupted input`);
        throw new Error(`Invalid image data: buffer size ${buffer.length} bytes is too small`);
      }

      this.logger.log('Uploading profile photo to S3 bucket');
      const s3Url = await this.fileUpload.uploadToS3(
        buffer,
        `${userId}-profilePhoto.${extension}`,
      );
      this.logger.log(`Finished uploading profile photo to S3: ${s3Url}`);

      // Use updateOne for atomic field update (more efficient than load-modify-save)
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { 'profile.profile_photo': s3Url } },
      );
      this.logger.log(`Updated user profile photo`);
    } catch (e) {
      this.logger.error(`Error occurred uploading profile photo, ${e}`);
      throw new InternalServerErrorException('Error', e);
    }
  }

  private async uploadSpecialistDocuments(
    documents: Documents[],
    user: UserDocument,
  ) {
    try {
      const promises = await Promise.all(
        documents.map(({ url, original_name }) => {
          this.logger.log(`Uploading ${original_name} document`);
          const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches?.length !== 3)
            throw new BadRequestException(Messages.INVALID_BASE64);

          const buffer = Buffer.from(matches[2], 'base64');
          const extension = mime.extension(matches[1]);
          return this.fileUpload.uploadToS3(
            buffer,
            `${user._id}-document.${extension}`,
          );
        }),
      );
      user.documents.map((doc, index) => {
        doc.url = promises[index];
      });
      await user.save();
      this.logger.log(`Saved ${user.full_name} professional documents`);
    } catch (e) {
      this.logger.error(`Error occurred uploading documents, ${e}`);
      throw new InternalServerErrorException(e);
    }
  }

  async removePreExistingCondition(
    conditionId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    return this.userModel.updateOne(
      { _id: userId },
      { $pull: { pre_existing_conditions: { _id: conditionId } } },
    );
  }

  async removeDependants(dependantId: Types.ObjectId, userId: Types.ObjectId) {
    return this.userModel.updateOne(
      { _id: userId },
      { $pull: { dependants: { _id: dependantId } } },
    );
  }

  async removeEmergencyContacts(
    emergencyContactId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    return this.userModel.updateOne(
      { _id: userId },
      { $pull: { emergency_contacts: { _id: emergencyContactId } } },
    );
  }

  async createTimeAvailability(
    userId: Types.ObjectId,
    specialistAvailabilityDto: SpecialistAvailabilityDto,
  ) {
    return await upsert(
      this.specialistPreferencesModel,
      { userId },
      { $set: { ...specialistAvailabilityDto } },
    );
  }

  async createPatientPreferences(
    userId: Types.ObjectId,
    specialistPreferencesDto: SpecialistPreferencesDto,
  ) {
    return await upsert(
      this.specialistPreferencesModel,
      { userId },
      { $set: { ...specialistPreferencesDto } },
    );
  }

  async getUserAvailabilityAndPreferences(userId: Types.ObjectId) {
    return await findOne(this.specialistPreferencesModel, { userId });
  }

  async getPreferences(query: any) {
    return (await find(this.specialistPreferencesModel, {
      ...query,
    })) as SpecialistPreferences[];
  }

  async getUserSecurityQuestion(userId: Types.ObjectId) {
    const user = await this.findById(userId);
    if (user?.security?.question) {
      return user.security.question;
    }
    return null;
  }

  async getUserEarning(userId: Types.ObjectId) {
    return this.walletsService.getUserEarnings(userId);
  }

  // Identity Verification Methods
  async getIdentityVerification(userId: Types.ObjectId) {
    const user = await findOne(this.userModel, { _id: userId }, {
      selectFields: ['identity_verification', 'documents', 'professional_practice'],
    });
    if (!user) throw new NotFoundException(Messages.NO_USER_FOUND);

    // Generate presigned URLs for verification documents if they exist
    const verification = user.identity_verification || {};

    if (verification.government_id?.document_url) {
      try {
        verification.government_id.document_url = await this.fileUpload.getPresignedUrl(
          verification.government_id.document_url,
          3600, // 1 hour expiry
        );
      } catch (e) {
        this.logger.error(`Error generating presigned URL for government ID: ${e}`);
      }
    }

    if (verification.medical_license?.document_url) {
      try {
        verification.medical_license.document_url = await this.fileUpload.getPresignedUrl(
          verification.medical_license.document_url,
          3600,
        );
      } catch (e) {
        this.logger.error(`Error generating presigned URL for medical license: ${e}`);
      }
    }

    return {
      identity_verification: verification,
      professional_practice: user.professional_practice,
      documents: user.documents,
    };
  }

  async updateIdentityVerification(
    userId: Types.ObjectId,
    updateDto: any,
  ) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException(Messages.NO_USER_FOUND);
    if (user.user_type !== UserType.SPECIALIST) {
      throw new BadRequestException('Only specialists can update identity verification');
    }

    const existingVerification = user.identity_verification || {};

    // Merge the updates with existing data
    const updatedVerification = {
      government_id: {
        ...(existingVerification.government_id || {}),
        ...(updateDto.government_id || {}),
      },
      medical_license: {
        ...(existingVerification.medical_license || {}),
        ...(updateDto.medical_license || {}),
      },
      registry_check: {
        ...(existingVerification.registry_check || {}),
        ...(updateDto.registry_check || {}),
      },
      credential_hash: updateDto.credential_hash || existingVerification.credential_hash,
      overall_status: this.calculateOverallVerificationStatus(updateDto, existingVerification),
      submitted_at: existingVerification.submitted_at || new Date(),
    };

    // Handle document uploads if base64 data is provided
    if (updateDto.government_id?.document_url?.startsWith('data:')) {
      const s3Url = await this.uploadVerificationDocument(
        userId,
        updateDto.government_id.document_url,
        'government_id',
      );
      updatedVerification.government_id.document_url = s3Url;
    }

    if (updateDto.medical_license?.document_url?.startsWith('data:')) {
      const s3Url = await this.uploadVerificationDocument(
        userId,
        updateDto.medical_license.document_url,
        'medical_license',
      );
      updatedVerification.medical_license.document_url = s3Url;
    }

    return await updateOne(
      this.userModel,
      { _id: userId },
      { identity_verification: updatedVerification },
    );
  }

  private calculateOverallVerificationStatus(updateDto: any, existing: any): string {
    const govStatus = updateDto.government_id?.status || existing.government_id?.status || 'pending';
    const licenseStatus = updateDto.medical_license?.status || existing.medical_license?.status || 'pending';
    const registryStatus = updateDto.registry_check?.status || existing.registry_check?.status || 'pending';

    if (govStatus === 'verified' && licenseStatus === 'verified' && registryStatus === 'verified') {
      return 'verified';
    }
    if (govStatus === 'rejected' || licenseStatus === 'rejected') {
      return 'rejected';
    }
    return 'pending';
  }

  private async uploadVerificationDocument(
    userId: Types.ObjectId,
    base64: string,
    docType: string,
  ): Promise<string> {
    try {
      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new BadRequestException('Invalid base64 document format');
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const extension = mime.extension(matches[1]) || 'pdf';
      const fileName = `${userId}-${docType}-${Date.now()}.${extension}`;

      this.logger.log(`Uploading ${docType} verification document: ${fileName}`);
      const s3Url = await this.fileUpload.uploadToS3(buffer, fileName);
      this.logger.log(`Uploaded ${docType} verification document: ${s3Url}`);

      return s3Url;
    } catch (e) {
      this.logger.error(`Error uploading ${docType} verification document: ${e}`);
      throw new InternalServerErrorException(`Failed to upload ${docType} document`);
    }
  }
}
