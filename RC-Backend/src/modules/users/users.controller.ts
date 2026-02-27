import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
  Req,
  Post,
  Query,
  Param,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileSetupDto } from './dto/profile-setup.dto';
import { DoesUserExist } from '../../core/guards/doesUserExist.guards';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryDto } from '../../common/helpers/url-query.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { Types } from 'mongoose';
import { ProfessionalPracticeSetupDto } from './dto/professional-practice-setup.dto';
import { SpecialistAvailabilityDto } from './dto/specialist-availability.dto';
import { SpecialistPreferencesDto } from './dto/specialist-preferences.dto';
import { CreateAwardDto } from './dto/create-award.dto';
import { CreateCertificationsDto } from './dto/create-certifications.dto';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { BasicHealthScoreService } from '../basic-health-score/basic-health-score.service';
import { ScoreChangeTrigger } from '../basic-health-score/entities/basic-health-score-history.entity';
import { UpdateIdentityVerificationDto } from './dto/update-identity-verification.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadHelper: FileUploadHelper,
    @Inject(forwardRef(() => BasicHealthScoreService))
    private readonly basicHealthScoreService: BasicHealthScoreService,
  ) {}

  @ApiOperation({ summary: 'Register new user', description: 'Create a new patient or specialist account. Sends email and phone verification OTPs.' })
  @ApiResponse({ status: 201, description: 'Account created successfully. Verification OTPs sent.' })
  @ApiResponse({ status: 400, description: 'Validation error or passwords do not match' })
  @ApiResponse({ status: 409, description: 'User with this email or phone already exists' })
  @UseGuards(DoesUserExist)
  @Post()
  async register(@Body() createUserDto: CreateUserDto, @Request() req) {
    const result = await this.usersService.register(
      createUserDto,
      req.get('origin'),
    );
    return sendSuccessResponse(Messages.ACCOUNT_CREATED, result);
  }

  @ApiOperation({ summary: 'Get current user profile', description: 'Retrieve the full profile of the currently authenticated user including profile, preferences, and settings.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized – invalid or expired token' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findCurrentUser(@Request() req) {
    const result = await this.usersService.getProfile(req.user);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specialist availability and preferences', description: 'Retrieve the time availability slots and consultation preferences for the authenticated specialist.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Availability and preferences retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('availability')
  async getTimeAvailabilityAndPreferences(@Request() req) {
    const result = await this.usersService.getUserAvailabilityAndPreferences(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Update user profile', description: 'Update profile details, medical history, allergies, emergency contacts, dependants, and other settings. Also triggers health score recalculation if health-related fields are updated.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Patch()
  async profileSetup(@Body() profileSetupDto: ProfileSetupDto, @Request() req) {
    const result = await this.usersService.profileSetup(
      req.user.sub,
      profileSetupDto,
    );

    // Check if any health-affecting fields were updated and trigger score recalculation
    const healthAffectingFields = ['basic_health_info', 'health_risk_factors', 'date_of_birth', 'pre_existing_conditions'];
    const updatedFields = Object.keys(profileSetupDto);
    const hasHealthUpdates = updatedFields.some(field => healthAffectingFields.includes(field));

    if (hasHealthUpdates) {
      const changedFields = updatedFields.filter(f => healthAffectingFields.includes(f)).join(', ');
      this.basicHealthScoreService
        .calculateAndStoreScore(req.user.sub, ScoreChangeTrigger.PROFILE_UPDATED, `Profile updated: ${changedFields}`)
        .catch(err => console.error('Error updating basic health score:', err));
    }

    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'List users', description: 'Retrieve a paginated list of users with optional search and filters.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Users list retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(@Query() queryDto: QueryDto) {
    const result = await this.usersService.getUsers(queryDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Set up specialist professional profile', description: 'Configure professional practice details, qualifications, documents, payment structure, and security settings for a specialist account.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Specialist profile set up successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Patch('specialist-profile-setup')
  async specialistProfileSetup(
    @Body() professionalPracticeSetupDto: ProfessionalPracticeSetupDto,
    @Request() req,
  ) {
    const result = await this.usersService.specialistProfileSetup(
      professionalPracticeSetupDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Add specialist awards', description: 'Add professional awards and recognitions to the specialist profile.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Awards added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Patch('awards')
  async addAward(@Body() createAwardDto: CreateAwardDto, @Request() req) {
    const result = await this.usersService.addAward(
      createAwardDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Add specialist certifications', description: 'Upload professional certification documents to the specialist profile.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Certifications added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Patch('certifications')
  async addCertifications(
    @Body() createCertificationsDto: CreateCertificationsDto,
    @Request() req,
  ) {
    const result = await this.usersService.addCertifications(
      createCertificationsDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Detect currency from IP', description: 'Public endpoint that detects the user\'s preferred currency based on their IP geolocation. No authentication required.' })
  @ApiResponse({ status: 200, description: 'Currency detected successfully (e.g., NGN, USD, GBP)' })
  // Public endpoint - detect currency from IP (no auth required)
  @Get('detect-currency')
  async detectCurrency(@Req() req) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip;
    const result = this.usersService.detectCurrency(ip);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Update identity verification', description: 'Submit or update identity verification documents including government ID, medical license, and registry check results.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Identity verification updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // Identity Verification PATCH - MUST be before :id route
  @UseGuards(JwtAuthGuard)
  @Patch('identity-verification')
  async updateIdentityVerification(
    @Body() updateIdentityVerificationDto: UpdateIdentityVerificationDto,
    @Request() req,
  ) {
    const result = await this.usersService.updateIdentityVerification(
      req.user.sub,
      updateIdentityVerificationDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Update user by ID', description: 'Update any user profile fields by user ID. Triggers health score recalculation if health-related fields are changed.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @Param('id') id: Types.ObjectId,
  ) {
    const result = await this.usersService.updateUserProfile(
      updateUserProfileDto,
      id,
    );

    // Check if any health-affecting fields were updated and trigger score recalculation
    const healthAffectingFields = ['basic_health_info', 'health_risk_factors', 'date_of_birth', 'pre_existing_conditions'];
    const updatedFields = Object.keys(updateUserProfileDto);
    const hasHealthUpdates = updatedFields.some(field => healthAffectingFields.includes(field));

    if (hasHealthUpdates) {
      const changedFields = updatedFields.filter(f => healthAffectingFields.includes(f)).join(', ');
      this.basicHealthScoreService
        .calculateAndStoreScore(id, ScoreChangeTrigger.PROFILE_UPDATED, `Profile updated: ${changedFields}`)
        .catch(err => console.error('Error updating basic health score:', err));
    }

    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Get security question', description: 'Retrieve the authenticated user\'s security question (answer is not returned).' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Security question retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('security-question')
  async getUserSecurityQuestion(@Request() req) {
    const result = await this.usersService.getUserSecurityQuestion(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specialist earnings', description: 'Retrieve total earnings and earnings breakdown for the authenticated specialist.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Earnings data retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('earnings')
  async getUserEarnings(@Request() req) {
    const result = await this.usersService.getUserEarning(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get identity verification status', description: 'Retrieve the current identity verification status and submitted documents for the authenticated user.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Identity verification details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // Identity Verification GET - MUST be before :id route
  @UseGuards(JwtAuthGuard)
  @Get('identity-verification')
  async getIdentityVerification(@Request() req) {
    const result = await this.usersService.getIdentityVerification(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieve a user\'s full profile by their ID. Profile photos are returned as pre-signed S3 URLs.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: Types.ObjectId) {
    const result: any = await this.usersService.findOne({ _id: id });
    // Presign profile photo if stored as S3 URL/key
    if (result?.profile?.profile_photo) {
      try {
        result.profile.profile_photo = await this.fileUploadHelper.resolveProfileImage(result.profile.profile_photo);
      } catch (e) {}
    }
    if (result?.profile?.profile_image) {
      try {
        result.profile.profile_image = await this.fileUploadHelper.resolveProfileImage(result.profile.profile_image);
      } catch (e) {}
    }
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Remove pre-existing condition', description: 'Delete a specific pre-existing condition from the patient\'s profile.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Condition removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Condition not found' })
  @UseGuards(JwtAuthGuard)
  @Delete('pre-existing-conditions/:id')
  async removePreExistingCondition(
    @Param('id') conditionId: Types.ObjectId,
    @Request() req,
  ) {
    const result = await this.usersService.removePreExistingCondition(
      conditionId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @ApiOperation({ summary: 'Remove emergency contact', description: 'Delete a specific emergency contact from the patient\'s profile.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Emergency contact removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Emergency contact not found' })
  @UseGuards(JwtAuthGuard)
  @Delete('emergency-contacts/:id')
  async removeEmergencyContact(
    @Param('id') emergencyContactId: Types.ObjectId,
    @Request() req,
  ) {
    const result = await this.usersService.removeEmergencyContacts(
      emergencyContactId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @ApiOperation({ summary: 'Remove dependant', description: 'Delete a specific dependant from the patient\'s profile.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Dependant removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Dependant not found' })
  @UseGuards(JwtAuthGuard)
  @Delete('dependants/:id')
  async removeDependants(
    @Param('id') dependantId: Types.ObjectId,
    @Request() req,
  ) {
    const result = await this.usersService.removeDependants(
      dependantId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @ApiOperation({ summary: 'Set specialist time availability', description: 'Create or update weekly time availability slots for the specialist. Patients can only book during available times.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Availability slots saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('availability')
  async timeAvailability(
    @Body() specialistAvailabilityDto: SpecialistAvailabilityDto,
    @Request() req,
  ) {
    const result = await this.usersService.createTimeAvailability(
      req.user.sub,
      specialistAvailabilityDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Set specialist/patient preferences', description: 'Save consultation preferences, rate cards, service rates, notification settings, channel integrations, and privacy consents.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Preferences saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('preferences')
  async patientPreferences(
    @Body() specialistPreferencesDto: SpecialistPreferencesDto,
    @Request() req,
  ) {
    const result = await this.usersService.createPatientPreferences(
      req.user.sub,
      specialistPreferencesDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Get pre-signed file URL', description: 'Generate a temporary pre-signed S3 URL (1 hour expiry) for accessing a private file. Pass the original S3 URL as a query parameter.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Pre-signed URL generated' })
  @ApiResponse({ status: 400, description: 'File URL is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('file/presigned-url')
  async getPresignedUrl(@Query('url') fileUrl: string) {
    if (!fileUrl) {
      return sendSuccessResponse('File URL is required', null);
    }
    const presignedUrl = await this.fileUploadHelper.getPresignedUrl(fileUrl, 3600); // 1 hour expiry
    return sendSuccessResponse('Presigned URL generated', { url: presignedUrl });
  }
}
