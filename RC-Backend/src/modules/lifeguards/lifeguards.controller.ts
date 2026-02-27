import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LifeguardsService } from './lifeguards.service';
import { CreateLifeguardDto } from './dto/create-lifeguard.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { LifeguardLoginDto } from './dto/lifeguard-login.dto';
import { AppleLoginDto } from '../auth/dto/apple-login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { SetPreferencesDto } from './dto/set-preferences.dto';
import { DoesUserExist } from './guards/does-user-exists.guards';
import { EmailOtpVerifyDto } from '../auth/dto/email-otp-verify.dto';
import { ResendEmailOtpDto } from '../auth/dto/resend-email-otp.dto';
import { IsEmailVerified } from './guards/is-email-verified.guards';
import { FinishAddPaymentMethodDto } from './dto/finish-add-payment-method.dto';
import { LifeguardJwtAuthGuard } from './guards/jwt-auth.guards';

@ApiTags('Lifeguards')
@Controller('lifeguards')
export class LifeguardsController {
  constructor(private readonly lifeguardsService: LifeguardsService) {}

  @ApiOperation({
    summary: 'Register a new lifeguard',
    description: 'Creates a new lifeguard account and sends an email verification OTP. The email must not already be registered.',
  })
  @ApiResponse({ status: 201, description: 'Lifeguard account created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or passwords do not match' })
  @ApiResponse({ status: 409, description: 'A user with this email already exists' })
  @UseGuards(DoesUserExist)
  @Post()
  async createLifeguard(@Body() createLifeguardDto: CreateLifeguardDto) {
    const result = await this.lifeguardsService.localRegistration(
      createLifeguardDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({
    summary: 'Lifeguard email/password login',
    description: 'Authenticates a lifeguard using email and password. The email must be verified before login is allowed.',
  })
  @ApiResponse({ status: 200, description: 'Lifeguard authenticated successfully with JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 403, description: 'Email not yet verified' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(IsEmailVerified)
  @Post('login')
  async login(@Body() lifeguardLoginDto: LifeguardLoginDto) {
    const result = await this.lifeguardsService.login(lifeguardLoginDto);
    return sendSuccessResponse(Messages.USER_AUTHENTICATED, result);
  }

  @ApiOperation({
    summary: 'Apple Sign-In for lifeguards',
    description: 'Authenticates or registers a lifeguard using an Apple identity token. Creates a new account on first sign-in.',
  })
  @ApiResponse({ status: 200, description: 'Lifeguard authenticated via Apple successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired Apple identity token' })
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleLogin(@Body() appleLoginDto: AppleLoginDto): Promise<any> {
    const result = await this.lifeguardsService.appleLogin(appleLoginDto);
    return sendSuccessResponse(Messages.USER_AUTHENTICATED, result);
  }

  @ApiOperation({
    summary: 'Google Sign-In for lifeguards',
    description: 'Authenticates or registers a lifeguard using a Google OAuth token. Creates a new account on first sign-in.',
  })
  @ApiResponse({ status: 200, description: 'Lifeguard authenticated via Google successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired Google OAuth token' })
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    const { token } = googleLoginDto;
    const result = await this.lifeguardsService.googleLogin(token);
    return sendSuccessResponse(Messages.USER_AUTHENTICATED, result);
  }

  @ApiOperation({
    summary: 'Set lifeguard donation preferences',
    description: 'Updates the lifeguard donation preferences including age range, gender, location, treatment class, donation type, and payment card.',
  })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(LifeguardJwtAuthGuard)
  @Patch('preference')
  async setPreference(
    @Body() setPreferencesDto: SetPreferencesDto,
    @Request() req,
  ) {
    const result = await this.lifeguardsService.setPreference(
      req.user.sub,
      setPreferencesDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({
    summary: 'Get current lifeguard profile',
    description: 'Returns the authenticated lifeguard profile including personal info, preferences, and payment methods.',
  })
  @ApiResponse({ status: 200, description: 'Lifeguard profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(LifeguardJwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const result = await this.lifeguardsService.getLifeguardProfile(
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Initiate adding a payment method',
    description: 'Begins the Paystack card tokenisation flow. Returns a transaction reference and authorisation URL for the lifeguard to complete payment method setup.',
  })
  @ApiResponse({ status: 200, description: 'Payment method initialisation data returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LifeguardJwtAuthGuard)
  @Post('add-payment-method')
  async beginAddPaymentMethod(@Request() req) {
    const result = await this.lifeguardsService.beginAddPaymentMethod(req.user);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Verify and save a payment method',
    description: 'Completes the card tokenisation flow by verifying the Paystack transaction reference and saving the payment method to the lifeguard account.',
  })
  @ApiResponse({ status: 200, description: 'Payment method verified and saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or already used transaction reference' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LifeguardJwtAuthGuard)
  @Post('verify-payment-method')
  async finishAddPaymentMethod(
    @Body() finishAddPaymentMethodDto: FinishAddPaymentMethodDto,
    @Request() req,
  ) {
    const result = await this.lifeguardsService.finishAddPaymentMethod(
      finishAddPaymentMethodDto.reference,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Resend email verification OTP',
    description: 'Sends a new OTP to the specified email address for account verification purposes.',
  })
  @ApiResponse({ status: 200, description: 'Verification OTP resent successfully' })
  @ApiResponse({ status: 404, description: 'No account found with the provided email' })
  @HttpCode(HttpStatus.OK)
  @Post('resend-email-token')
  async resendEmailOtp(@Body() resendEmailOtpDto: ResendEmailOtpDto) {
    await this.lifeguardsService.resendEmailToken(resendEmailOtpDto);
    return sendSuccessResponse(Messages.EMAIL_OTP_SENT, null);
  }

  @ApiOperation({
    summary: 'Verify lifeguard email address',
    description: 'Verifies the lifeguard email using the OTP token sent to their email address. Required before the lifeguard can log in.',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP token' })
  @HttpCode(HttpStatus.OK)
  @Post('email/verify')
  async verifyPhoneOTP(@Body() phoneOtpVerifyDto: EmailOtpVerifyDto) {
    const { token, email } = phoneOtpVerifyDto;
    await this.lifeguardsService.verifyEmail(email, token);
    return sendSuccessResponse(Messages.EMAIL_VERIFIED, null);
  }
}
