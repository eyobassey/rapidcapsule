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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly biometricService: BiometricService,
    private readonly sessionService: SessionService,
  ) {}

  @ApiOperation({ summary: 'Login with email and password', description: 'Authenticates a user with email/password credentials and returns a JWT token. Requires verified email and active account.' })
  @ApiResponse({ status: 200, description: 'Login successful — returns JWT token and user profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified or account suspended' })
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

  @ApiOperation({ summary: 'Login with Apple ID', description: 'Authenticates or registers a user using Apple Sign In. Returns JWT token.' })
  @ApiResponse({ status: 200, description: 'Apple authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid Apple identity token' })
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleLogin(@Body() appleLoginDto: AppleLoginDto, @Request() req): Promise<any> {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.appleLogin(appleLoginDto, userAgent, ipAddress);
    return sendSuccessResponse(Messages.USER_AUTHENTICATED, result);
  }

  @ApiOperation({ summary: 'Request password reset', description: 'Sends a password reset email with a token link to the provided email address.' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'Email address not found' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Request() req,
  ) {
    await this.authService.forgotPassword(forgotPasswordDto, req.get('origin'));
    return sendSuccessResponse(Messages.PASSWORD_RESET_SENT, null);
  }

  @ApiOperation({ summary: 'Reset password with token', description: 'Resets the user password using the token received via the forgot-password email.' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return sendSuccessResponse(Messages.PASSWORD_RESET, null);
  }

  @ApiOperation({ summary: 'Change password', description: 'Changes the authenticated user\'s password. Requires current password for verification.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
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

  @ApiOperation({ summary: 'Login with Google', description: 'Authenticates or registers a user using Google OAuth ID token. Returns JWT token.' })
  @ApiResponse({ status: 200, description: 'Google authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid Google token' })
  @HttpCode(HttpStatus.OK)
  @Post('google/alt-login')
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto, @Request() req) {
    const { token, user_type } = googleLoginDto;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.googleAltLogin(token, user_type, userAgent, ipAddress);
    return sendSuccessResponse(Messages.USER_AUTHENTICATED, result);
  }

  @ApiOperation({ summary: 'Verify email OTP', description: 'Verifies the 6-digit OTP code sent to the user\'s email during login. Returns JWT token on success.' })
  @ApiResponse({ status: 200, description: 'OTP verified — returns JWT token and user profile' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async verifyEmailOTP(@Body() otpVerifyDto: EmailOtpVerifyDto, @Request() req) {
    const { token, email } = otpVerifyDto;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.verifyEmailOTP(email, token, userAgent, ipAddress);
    return sendSuccessResponse(Messages.LOGIN_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Verify phone OTP', description: 'Verifies the 6-digit OTP code sent via SMS during login. Returns JWT token on success.' })
  @ApiResponse({ status: 200, description: 'Phone OTP verified — returns JWT token and user profile' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  @HttpCode(HttpStatus.OK)
  @Post('otp/phone/verify')
  async verifyPhoneOTP(@Body() phoneOtpVerifyDto: PhoneOtpVerifyDto, @Request() req) {
    const { code, email } = phoneOtpVerifyDto;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.sessionService.getClientIP(req);
    const result = await this.authService.verifyPhoneOTP(email, code, userAgent, ipAddress);
    return sendSuccessResponse(Messages.LOGIN_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Verify email via link', description: 'Verifies the user\'s email address using the verification link sent during registration.' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification token' })
  @Get('email/:userId/verify/:token')
  async emailVerify(@Param() params) {
    const { userId, token } = params;
    await this.authService.verifyEmail(userId, token);
    return sendSuccessResponse(Messages.EMAIL_VERIFIED, null);
  }

  @ApiOperation({ summary: 'Verify phone number', description: 'Verifies the user\'s phone number using a 6-digit SMS code.' })
  @ApiResponse({ status: 200, description: 'Phone number verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  @HttpCode(HttpStatus.OK)
  @Post('phone/verify')
  async phoneVerify(@Body() phoneVerify: PhoneVerifyDto) {
    const { code, phone } = phoneVerify;
    await this.authService.verifyPhone(phone, code);
    return sendSuccessResponse(Messages.PHONE_VERIFIED, null);
  }

  @ApiOperation({ summary: 'Resend email verification token', description: 'Resends the email verification link to the specified user.' })
  @ApiResponse({ status: 200, description: 'Verification email resent' })
  @ApiResponse({ status: 404, description: 'User not found' })
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

  @ApiOperation({ summary: 'Resend phone verification SMS', description: 'Resends the SMS verification code to the user\'s phone number.' })
  @ApiResponse({ status: 200, description: 'SMS verification code resent' })
  @HttpCode(HttpStatus.OK)
  @Post('resend-phone-token')
  async resendPhoneToken(@Body() phoneToken: PhoneTokenDto) {
    await this.authService.resendSMSToken(phoneToken);
    return sendSuccessResponse(Messages.PHONE_VERIFICATION_SENT, null);
  }

  @ApiOperation({ summary: 'Resend email OTP', description: 'Resends the login OTP code to the user\'s email address.' })
  @ApiResponse({ status: 200, description: 'Email OTP resent' })
  @HttpCode(HttpStatus.OK)
  @Post('resend-email-otp')
  async resendEmailOtp(@Body() resendEmailOtpDto: ResendEmailOtpDto) {
    await this.authService.resendEmailOTP(resendEmailOtpDto);
    return sendSuccessResponse(Messages.EMAIL_OTP_SENT, null);
  }

  @ApiOperation({ summary: 'Resend phone OTP', description: 'Resends the login OTP code via SMS.' })
  @ApiResponse({ status: 200, description: 'Phone OTP resent' })
  @HttpCode(HttpStatus.OK)
  @Post('resend-phone-otp')
  async resendPhoneOtp(@Body() resendPhoneOtpDto: ResendPhoneOtpDto) {
    await this.authService.resendPhoneOTP(resendPhoneOtpDto);
    return sendSuccessResponse(Messages.PHONE_OTP_SENT, null);
  }

  @ApiOperation({ summary: 'Generate 2FA secret', description: 'Generates a TOTP secret and QR code for setting up two-factor authentication.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Returns TOTP secret and QR code data URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async generate2FA(@Request() req) {
    const { otpAuthUrl, secret } =
      await this.authService.generateTwoFactorAuthSecret(req.user.sub);
    const dataUrl = await this.authService.pipeQrCodeStream(otpAuthUrl);
    return sendSuccessResponse(Messages.RETRIEVED, { secret, dataUrl });
  }

  @ApiOperation({ summary: 'Enable 2FA', description: 'Enables two-factor authentication after verifying the TOTP code from the authenticator app.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Verify 2FA code on login', description: 'Verifies the TOTP code during login when 2FA is enabled. Returns JWT token on success.' })
  @ApiResponse({ status: 200, description: '2FA verified — returns JWT token' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
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

  @ApiOperation({ summary: 'Initiate phone number change', description: 'Sends a verification OTP to the new phone number. Requires security answer.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Verification OTP sent to new phone number' })
  @ApiResponse({ status: 400, description: 'Invalid security answer or phone number' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Confirm phone number change', description: 'Verifies the OTP sent to the new phone number and completes the change.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Phone number changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Initiate email address change', description: 'Sends a verification OTP to the new email address. Requires security answer.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Verification OTP sent to new email' })
  @ApiResponse({ status: 400, description: 'Invalid security answer or email already in use' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Confirm email address change', description: 'Verifies the OTP sent to the new email address and completes the change.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Email address changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Get biometric registration options', description: 'Generates WebAuthn registration challenge for setting up biometric/passkey authentication.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Returns WebAuthn PublicKeyCredentialCreationOptions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('biometric/register/options')
  async getBiometricRegistrationOptions(@Request() req) {
    const options = await this.biometricService.generateRegistrationOptions(req.user.sub);
    return sendSuccessResponse('Registration options generated', options);
  }

  @ApiOperation({ summary: 'Complete biometric registration', description: 'Verifies the WebAuthn attestation response and stores the credential for future authentication.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Biometric credential registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credential response' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Get biometric login options', description: 'Generates WebAuthn authentication challenge for a specific user\'s email.' })
  @ApiResponse({ status: 200, description: 'Returns WebAuthn PublicKeyCredentialRequestOptions' })
  @ApiResponse({ status: 404, description: 'No biometric credentials found for this email' })
  @HttpCode(HttpStatus.OK)
  @Post('biometric/login/options')
  async getBiometricLoginOptions(@Body() body: BiometricLoginOptionsDto) {
    const options = await this.biometricService.generateAuthenticationOptions(body.email);
    return sendSuccessResponse('Authentication options generated', options);
  }

  @ApiOperation({ summary: 'Complete biometric login', description: 'Verifies the WebAuthn assertion response and returns a JWT token. Bypasses 2FA since biometric is a strong factor.' })
  @ApiResponse({ status: 200, description: 'Authentication successful — returns JWT token' })
  @ApiResponse({ status: 400, description: 'Biometric authentication failed' })
  @HttpCode(HttpStatus.OK)
  @Post('biometric/login/verify')
  async verifyBiometricLogin(@Body() body: BiometricLoginVerifyDto, @Request() req) {
    const { verified, user } = await this.biometricService.verifyAuthentication(
      body.email,
      body.credential,
    );

    if (verified && user) {
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

  @ApiOperation({ summary: 'Get passkey login options', description: 'Generates discoverable credential options for passwordless passkey login. No email required — the browser discovers available passkeys.' })
  @ApiResponse({ status: 200, description: 'Returns WebAuthn discoverable credential options' })
  @HttpCode(HttpStatus.OK)
  @Post('biometric/passkey/options')
  async getPasskeyLoginOptions() {
    const options = await this.biometricService.generateDiscoverableAuthOptions();
    return sendSuccessResponse('Passkey options generated', options);
  }

  @ApiOperation({ summary: 'Complete passkey login', description: 'Verifies the discoverable credential assertion and returns a JWT token.' })
  @ApiResponse({ status: 200, description: 'Passkey authentication successful — returns JWT token' })
  @ApiResponse({ status: 400, description: 'Passkey authentication failed' })
  @HttpCode(HttpStatus.OK)
  @Post('biometric/passkey/verify')
  async verifyPasskeyLogin(@Body() body: { credential: any }, @Request() req) {
    const { verified, user } = await this.biometricService.verifyDiscoverableAuth(
      body.credential,
    );

    if (verified && user) {
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

  @ApiOperation({ summary: 'List biometric credentials', description: 'Returns all registered biometric/passkey credentials for the authenticated user.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'List of registered credentials with device names and creation dates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('biometric/credentials')
  async getBiometricCredentials(@Request() req) {
    const credentials = await this.biometricService.getUserCredentials(req.user.sub);
    return sendSuccessResponse('Credentials retrieved', credentials);
  }

  @ApiOperation({ summary: 'Delete biometric credential', description: 'Deletes a specific biometric credential by ID, or all credentials if no ID is provided.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Credential deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Check if biometric is enabled', description: 'Checks whether a user has any registered biometric credentials.' })
  @ApiResponse({ status: 200, description: 'Returns { enabled: true/false }' })
  @HttpCode(HttpStatus.OK)
  @Post('biometric/check')
  async checkBiometricEnabled(@Body() body: BiometricLoginOptionsDto) {
    const hasCredentials = await this.biometricService.hasBiometricCredentials(body.email);
    return sendSuccessResponse('Biometric status checked', { enabled: hasCredentials });
  }

  // ==================== SESSION MANAGEMENT ====================

  @ApiOperation({ summary: 'List active sessions', description: 'Returns all active login sessions for the authenticated user, including device info, IP, and location.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'List of active sessions with device, browser, OS, location, and timestamps' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('sessions')
  async getUserSessions(@Request() req) {
    const currentTokenId = req.user?.tokenId;
    const sessions = await this.sessionService.getUserSessions(req.user.sub, currentTokenId);
    return sendSuccessResponse('Sessions retrieved', sessions);
  }

  @ApiOperation({ summary: 'Revoke a session', description: 'Revokes a specific login session by session ID, logging out that device.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found or already revoked' })
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

  @ApiOperation({ summary: 'Revoke all other sessions', description: 'Revokes all active sessions except the current one, logging out all other devices.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Returns count of revoked sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Get active session count', description: 'Returns the total number of active login sessions for the authenticated user.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Returns { count: number }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('sessions/count')
  async getActiveSessionCount(@Request() req) {
    const count = await this.sessionService.countActiveSessions(req.user.sub);
    return sendSuccessResponse('Session count retrieved', { count });
  }
}
