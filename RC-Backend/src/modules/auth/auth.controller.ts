import {
  Controller,
  Post,
  Request,
  Body,
  UseGuards,
  Get,
  HttpStatus,
  HttpCode,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Messages } from '../../core/messages/messages';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailOtpVerifyDto } from './dto/email-otp-verify.dto';
import { IsEmailVerified } from '../../core/guards/isEmailVerified.guards';
import { PhoneVerifyDto } from './dto/phone-verify.dto';
import { EmailVerificationTokenDto } from './dto/email-verification-token.dto';
import { PhoneTokenDto } from './dto/phone-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TwoFACodeDto } from './dto/twoFA-code.dto';
import { ResendEmailOtpDto } from './dto/resend-email-otp.dto';
import { PhoneOtpVerifyDto } from './dto/phone-otp-verify.dto';
import { ResendPhoneOtpDto } from './dto/resend-phone-otp.dto';
import { IsAuthorized } from '../../core/guards/isAuthorized.guards';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AppleLoginDto } from './dto/apple-login.dto';
import { ChangePhoneNumberDto } from './dto/change-phone-number.dto';
import { IsUserActive } from '../../core/guards/isUserActive.guards';
import { ChangeEmailAddressDto } from './dto/change-email-address.dto';
import { VerifyPhoneNumberChangeDto } from './dto/verify-phone-number-change.dto';
import { VerifyEmailChangeDto } from './dto/verify-email-change.dto';
import { BiometricService } from './biometric.service';
import {
  BiometricRegisterVerifyDto,
  BiometricLoginOptionsDto,
  BiometricLoginVerifyDto,
  DeleteBiometricDto,
} from './dto/biometric.dto';
import { SessionService } from './session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly biometricService: BiometricService,
    private readonly sessionService: SessionService,
  ) {}
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @UseGuards(IsAuthorized)
  @UseGuards(IsEmailVerified)
  @UseGuards(IsUserActive)
  @HttpCode(HttpStatus.OK)
  async loginWithEmail(@Request() req) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const { message, result } = await this.authService.login(req.user, userAgent, ipAddress);
    return sendSuccessResponse(message, result);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleLogin(@Body() appleLoginDto: AppleLoginDto, @Request() req): Promise<any> {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.appleLogin(appleLoginDto, userAgent, ipAddress);
    return sendSuccessResponse(Messages.USER_AUTHENTICATED, result);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Request() req,
  ) {
    await this.authService.forgotPassword(forgotPasswordDto, req.get('origin'));
    return sendSuccessResponse(Messages.PASSWORD_RESET_SENT, null);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return sendSuccessResponse(Messages.PASSWORD_RESET, null);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    await this.authService.changePassword(
      req.user.sub,
      changePasswordDto.current_password,
      changePasswordDto.new_password,
    );
    return sendSuccessResponse('Password changed successfully', null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google/alt-login')
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto, @Request() req) {
    const { token, user_type } = googleLoginDto;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.googleAltLogin(token, user_type, userAgent, ipAddress);
    return sendSuccessResponse(Messages.USER_AUTHENTICATED, result);
  }

  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async verifyEmailOTP(@Body() otpVerifyDto: EmailOtpVerifyDto, @Request() req) {
    const { token, email } = otpVerifyDto;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.verifyEmailOTP(email, token, userAgent, ipAddress);
    return sendSuccessResponse(Messages.LOGIN_VERIFIED, result);
  }

  @HttpCode(HttpStatus.OK)
  @Post('otp/phone/verify')
  async verifyPhoneOTP(@Body() phoneOtpVerifyDto: PhoneOtpVerifyDto, @Request() req) {
    const { code, email } = phoneOtpVerifyDto;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.verifyPhoneOTP(email, code, userAgent, ipAddress);
    return sendSuccessResponse(Messages.LOGIN_VERIFIED, result);
  }

  @Get('email/:userId/verify/:token')
  async emailVerify(@Param() params) {
    const { userId, token } = params;
    await this.authService.verifyEmail(userId, token);
    return sendSuccessResponse(Messages.EMAIL_VERIFIED, null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('phone/verify')
  async phoneVerify(@Body() phoneVerify: PhoneVerifyDto) {
    const { code, phone } = phoneVerify;
    await this.authService.verifyPhone(phone, code);
    return sendSuccessResponse(Messages.PHONE_VERIFIED, null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-email-token')
  async resendEmailToken(
    @Body() emailVerificationTokenDto: EmailVerificationTokenDto,
    @Request() req,
  ) {
    const { userId } = emailVerificationTokenDto;
    await this.authService.resendEmailToken(userId, req.get('origin'));
    return sendSuccessResponse(Messages.EMAIL_VERIFICATION_SENT, null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-phone-token')
  async resendPhoneToken(@Body() phoneToken: PhoneTokenDto) {
    await this.authService.resendSMSToken(phoneToken);
    return sendSuccessResponse(Messages.PHONE_VERIFICATION_SENT, null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-email-otp')
  async resendEmailOtp(@Body() resendEmailOtpDto: ResendEmailOtpDto) {
    await this.authService.resendEmailOTP(resendEmailOtpDto);
    return sendSuccessResponse(Messages.EMAIL_OTP_SENT, null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-phone-otp')
  async resendPhoneOtp(@Body() resendPhoneOtpDto: ResendPhoneOtpDto) {
    await this.authService.resendPhoneOTP(resendPhoneOtpDto);
    return sendSuccessResponse(Messages.PHONE_OTP_SENT, null);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2FA(@Request() req) {
    const { otpAuthUrl, secret } =
      await this.authService.generateTwoFactorAuthSecret(req.user.sub);
    const dataUrl = await this.authService.pipeQrCodeStream(otpAuthUrl);
    return sendSuccessResponse(Messages.RETRIEVED, { secret, dataUrl });
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/turn-on')
  async turnOn2FAAuthentication(
    @Body() twoFACodeDto: TwoFACodeDto,
    @Request() req,
  ) {
    await this.authService.turnOn2FAAuthentication(twoFACodeDto, req.user.sub);
    return sendSuccessResponse(Messages.TWO_FA_TURNED_ON, null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  async verify2FACode(@Body() twoFACodeDto: TwoFACodeDto, @Body() body, @Request() req) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.verify2FACode(
      body.email,
      twoFACodeDto,
      userAgent,
      ipAddress,
    );
    return sendSuccessResponse(Messages.LOGIN_VERIFIED, result);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('change-phone-number')
  async changePhoneNumber(
    @Body() changePhoneNumberDto: ChangePhoneNumberDto,
    @Request() req,
  ) {
    await this.authService.changePhoneNumber(
      req.user.sub,
      changePhoneNumberDto,
    );
    return sendSuccessResponse(Messages.PHONE_VERIFICATION_SENT, null);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('verify-phone-number-change')
  async verifyPhoneNumberChange(
    @Body() verifyPhoneNumberChangeDto: VerifyPhoneNumberChangeDto,
    @Request() req,
  ) {
    await this.authService.verifyPhoneNumberChange(
      req.user.sub,
      verifyPhoneNumberChangeDto,
    );
    return sendSuccessResponse(Messages.PHONE_NUMBER_CHANGED, null);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('change-email-address')
  async changeEmailAddress(
    @Body() changeEmailAddressDto: ChangeEmailAddressDto,
    @Request() req,
  ) {
    await this.authService.changeEmailAddress(
      req.user.sub,
      changeEmailAddressDto,
    );
    return sendSuccessResponse(Messages.EMAIL_VERIFICATION_SENT, null);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('verify-email-address-change')
  async verifyEmailAddressChange(
    @Body() verifyEmailChangeDto: VerifyEmailChangeDto,
    @Request() req,
  ) {
    await this.authService.verifyEmailAddressChange(
      req.user.sub,
      verifyEmailChangeDto,
    );
    return sendSuccessResponse(Messages.EMAIL_CHANGED, null);
  }

  // ==================== BIOMETRIC AUTHENTICATION ====================

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('biometric/register/options')
  async getBiometricRegistrationOptions(@Request() req) {
    const options = await this.biometricService.generateRegistrationOptions(req.user.sub);
    return sendSuccessResponse('Registration options generated', options);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('biometric/register/verify')
  async verifyBiometricRegistration(
    @Body() body: BiometricRegisterVerifyDto,
    @Request() req,
  ) {
    const result = await this.biometricService.verifyRegistration(
      req.user.sub,
      body.credential,
      body.deviceName,
    );
    return sendSuccessResponse('Biometric credential registered successfully', {
      verified: result.verified,
      credentialId: result.credential?.credentialId,
      deviceName: result.credential?.deviceName,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('biometric/login/options')
  async getBiometricLoginOptions(@Body() body: BiometricLoginOptionsDto) {
    const options = await this.biometricService.generateAuthenticationOptions(body.email);
    return sendSuccessResponse('Authentication options generated', options);
  }

  @HttpCode(HttpStatus.OK)
  @Post('biometric/login/verify')
  async verifyBiometricLogin(@Body() body: BiometricLoginVerifyDto, @Request() req) {
    const { verified, user } = await this.biometricService.verifyAuthentication(
      body.email,
      body.credential,
    );

    if (verified && user) {
      // Generate JWT token directly - skip 2FA since biometric is already a strong auth factor
      const payload = {
        sub: user._id,
        email: user.profile?.contact?.email,
        first_name: user.profile?.first_name,
        user_type: user.user_type,
        is_email_verified: user.is_email_verified,
        is_phone_verified: user.is_phone_verified,
      };
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = this.sessionService.getClientIP(req);
      const token = await this.authService.generateTokenWithSession(payload, userAgent, ipAddress);
      return sendSuccessResponse('User authenticated successfully', token);
    }

    return sendSuccessResponse('Biometric authentication failed', { verified: false });
  }

  // ============ DISCOVERABLE CREDENTIALS (PASSKEY) ENDPOINTS ============

  @HttpCode(HttpStatus.OK)
  @Post('biometric/passkey/options')
  async getPasskeyLoginOptions() {
    // No email required - browser discovers available passkeys
    const options = await this.biometricService.generateDiscoverableAuthOptions();
    return sendSuccessResponse('Passkey options generated', options);
  }

  @HttpCode(HttpStatus.OK)
  @Post('biometric/passkey/verify')
  async verifyPasskeyLogin(@Body() body: { credential: any }, @Request() req) {
    const { verified, user } = await this.biometricService.verifyDiscoverableAuth(
      body.credential,
    );

    if (verified && user) {
      // Generate JWT token directly
      const payload = {
        sub: user._id,
        email: user.profile?.contact?.email,
        first_name: user.profile?.first_name,
        user_type: user.user_type,
        is_email_verified: user.is_email_verified,
        is_phone_verified: user.is_phone_verified,
      };
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = this.sessionService.getClientIP(req);
      const token = await this.authService.generateTokenWithSession(payload, userAgent, ipAddress);
      return sendSuccessResponse('User authenticated successfully', token);
    }

    return sendSuccessResponse('Passkey authentication failed', { verified: false });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('biometric/credentials')
  async getBiometricCredentials(@Request() req) {
    const credentials = await this.biometricService.getUserCredentials(req.user.sub);
    return sendSuccessResponse('Credentials retrieved', credentials);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('biometric/delete')
  async deleteBiometricCredential(
    @Body() body: DeleteBiometricDto,
    @Request() req,
  ) {
    await this.biometricService.deleteCredential(req.user.sub, body.credentialId);
    return sendSuccessResponse('Biometric credential deleted', null);
  }

  @HttpCode(HttpStatus.OK)
  @Post('biometric/check')
  async checkBiometricEnabled(@Body() body: BiometricLoginOptionsDto) {
    const hasCredentials = await this.biometricService.hasBiometricCredentials(body.email);
    return sendSuccessResponse('Biometric status checked', { enabled: hasCredentials });
  }

  // ==================== SESSION MANAGEMENT ====================

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('sessions')
  async getUserSessions(@Request() req) {
    const currentTokenId = req.user?.tokenId;
    const sessions = await this.sessionService.getUserSessions(req.user.sub, currentTokenId);
    return sendSuccessResponse('Sessions retrieved', sessions);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('sessions/:sessionId')
  async revokeSession(@Param('sessionId') sessionId: string, @Request() req) {
    const revoked = await this.sessionService.revokeSession(req.user.sub, sessionId);
    if (!revoked) {
      return sendSuccessResponse('Session not found or already revoked', { revoked: false });
    }
    return sendSuccessResponse('Session revoked successfully', { revoked: true });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('sessions/revoke-all-other')
  async revokeAllOtherSessions(@Request() req) {
    const currentTokenId = req.user?.tokenId;
    if (!currentTokenId) {
      return sendSuccessResponse('No active session found', { count: 0 });
    }
    const count = await this.sessionService.revokeAllOtherSessions(req.user.sub, currentTokenId);
    return sendSuccessResponse(`${count} session(s) revoked`, { count });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('sessions/count')
  async getActiveSessionCount(@Request() req) {
    const count = await this.sessionService.countActiveSessions(req.user.sub);
    return sendSuccessResponse('Session count retrieved', { count });
  }
}
