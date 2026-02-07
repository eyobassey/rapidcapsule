import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import { BiometricCredential, BiometricCredentialDocument } from './entities/biometric-credential.entity';
import { UsersService } from '../users/users.service';
import { UserSettingsService } from '../user-settings/user-settings.service';
import { ConfigService } from '@nestjs/config';

// Base64URL encoding/decoding utilities
function uint8ArrayToBase64URL(uint8Array: Uint8Array): string {
  return Buffer.from(uint8Array)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64URLToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

@Injectable()
export class BiometricService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;

  // In-memory challenge store (in production, use Redis)
  private challengeStore: Map<string, { challenge: string; expiresAt: number }> = new Map();

  constructor(
    @InjectModel(BiometricCredential.name)
    private biometricCredentialModel: Model<BiometricCredentialDocument>,
    private usersService: UsersService,
    private userSettingsService: UserSettingsService,
    private configService: ConfigService,
  ) {
    // Configure for your domain
    this.rpName = 'Rapid Capsule';
    this.rpID = this.configService.get('WEBAUTHN_RP_ID') || 'rapidcapsule.com';
    this.origin = this.configService.get('WEBAUTHN_ORIGIN') || 'https://rapidcapsule.com';
  }

  private setChallenge(userId: string, challenge: string): void {
    // Challenge expires in 5 minutes
    this.challengeStore.set(userId, {
      challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
  }

  private getChallenge(userId: string): string | null {
    const stored = this.challengeStore.get(userId);
    if (!stored) return null;
    if (Date.now() > stored.expiresAt) {
      this.challengeStore.delete(userId);
      return null;
    }
    return stored.challenge;
  }

  private clearChallenge(userId: string): void {
    this.challengeStore.delete(userId);
  }

  async generateRegistrationOptions(
    userId: Types.ObjectId,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get existing credentials to exclude
    const existingCredentials = await this.biometricCredentialModel.find({ userId });
    const excludeCredentials = existingCredentials.map((cred) => ({
      id: cred.credentialId,
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransportFuture[],
    }));

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: new TextEncoder().encode(userId.toString()),
      userName: user.profile?.contact?.email || userId.toString(),
      userDisplayName: `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim() || 'User',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred', // Prefer discoverable credentials (passkeys) but don't require
      },
      timeout: 60000,
    });

    this.setChallenge(userId.toString(), options.challenge);

    return options;
  }

  async verifyRegistration(
    userId: Types.ObjectId | string,
    credential: any,
    deviceName?: string,
  ): Promise<{ verified: boolean; credential?: BiometricCredentialDocument }> {
    // Ensure userId is an ObjectId
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const expectedChallenge = this.getChallenge(userObjectId.toString());
    if (!expectedChallenge) {
      throw new BadRequestException('Registration challenge expired or not found');
    }

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
      });
    } catch (error) {
      this.clearChallenge(userObjectId.toString());
      throw new BadRequestException(`Registration verification failed: ${error.message}`);
    }

    this.clearChallenge(userObjectId.toString());

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Registration verification failed');
    }

    const { credential: regCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // The credential ID and public key are Uint8Arrays, convert to base64url for storage
    const credentialIdB64 = typeof regCredential.id === 'string'
      ? regCredential.id
      : uint8ArrayToBase64URL(regCredential.id as unknown as Uint8Array);
    const publicKeyB64 = typeof regCredential.publicKey === 'string'
      ? regCredential.publicKey
      : uint8ArrayToBase64URL(regCredential.publicKey as unknown as Uint8Array);

    // Check if credential already exists
    const existingCred = await this.biometricCredentialModel.findOne({
      credentialId: credentialIdB64,
    });

    if (existingCred) {
      throw new BadRequestException('This biometric credential is already registered');
    }

    // Save the credential
    const savedCredential = await this.biometricCredentialModel.create({
      userId: userObjectId,
      credentialId: credentialIdB64,
      publicKey: publicKeyB64,
      counter: regCredential.counter,
      credentialDeviceType,
      credentialBackedUp,
      transports: credential.response?.transports || [],
      deviceName: deviceName || this.getDefaultDeviceName(),
    });

    // Update user's biometric status
    await this.userSettingsService.updateSetting(
      { defaults: { biometric_enabled: true } },
      userObjectId,
    );

    return { verified: true, credential: savedCredential };
  }

  async generateAuthenticationOptions(
    email: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON & { userId: string }> {
    const user = await this.usersService.findOneByEmail(email.toLowerCase());
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Query for both ObjectId and string userId (backwards compatibility)
    const credentials = await this.biometricCredentialModel.find({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
    });
    if (credentials.length === 0) {
      throw new BadRequestException('No biometric credentials registered for this account');
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.credentialId,
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransportFuture[],
    }));

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'required',
      timeout: 60000,
    });

    this.setChallenge(user._id.toString(), options.challenge);

    return { ...options, userId: user._id.toString() };
  }

  async verifyAuthentication(
    email: string,
    credential: any,
  ): Promise<{ verified: boolean; user: any }> {
    const user = await this.usersService.findOneByEmail(email.toLowerCase());
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expectedChallenge = this.getChallenge(user._id.toString());
    if (!expectedChallenge) {
      throw new BadRequestException('Authentication challenge expired or not found');
    }

    // Find the credential being used (query for both ObjectId and string userId)
    const storedCredential = await this.biometricCredentialModel.findOne({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
      credentialId: credential.id,
    });

    if (!storedCredential) {
      this.clearChallenge(user._id.toString());
      throw new UnauthorizedException('Biometric credential not found');
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: storedCredential.credentialId,
          publicKey: base64URLToUint8Array(storedCredential.publicKey),
          counter: storedCredential.counter,
          transports: storedCredential.transports as AuthenticatorTransportFuture[],
        },
        requireUserVerification: true,
      });
    } catch (error) {
      this.clearChallenge(user._id.toString());
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }

    this.clearChallenge(user._id.toString());

    if (!verification.verified) {
      throw new UnauthorizedException('Biometric authentication failed');
    }

    // Update counter to prevent replay attacks
    storedCredential.counter = verification.authenticationInfo.newCounter;
    storedCredential.lastUsedAt = new Date();
    await storedCredential.save();

    return { verified: true, user };
  }

  // ============ DISCOVERABLE CREDENTIALS (PASSKEY) FLOW ============

  /**
   * Generate authentication options for discoverable credentials (no email required)
   * The browser will show all available passkeys for this site
   */
  async generateDiscoverableAuthOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'required',
      timeout: 60000,
      // No allowCredentials - browser discovers available passkeys
    });

    // Store challenge with a generic key since we don't know the user yet
    this.setChallenge('discoverable_auth', options.challenge);

    return options;
  }

  /**
   * Verify discoverable credential authentication
   * Extracts userId from the credential's userHandle
   */
  async verifyDiscoverableAuth(
    credential: any,
  ): Promise<{ verified: boolean; user: any }> {
    const expectedChallenge = this.getChallenge('discoverable_auth');
    if (!expectedChallenge) {
      throw new BadRequestException('Authentication challenge expired or not found');
    }

    // Extract userId from userHandle (base64url encoded)
    const userHandle = credential.response?.userHandle;
    if (!userHandle) {
      this.clearChallenge('discoverable_auth');
      throw new BadRequestException('No user handle in credential - this passkey may not support discoverable login');
    }

    // Decode userHandle to get the userId (it's base64url encoded)
    // Convert base64url to regular base64 first
    const base64 = userHandle.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const userIdString = Buffer.from(base64 + padding, 'base64').toString('utf-8');

    // Find the user
    let user;
    try {
      user = await this.usersService.findById(new Types.ObjectId(userIdString));
    } catch (e) {
      this.clearChallenge('discoverable_auth');
      throw new UnauthorizedException('Invalid user handle');
    }

    if (!user) {
      this.clearChallenge('discoverable_auth');
      throw new UnauthorizedException('User not found');
    }

    // Find the credential
    const storedCredential = await this.biometricCredentialModel.findOne({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
      credentialId: credential.id,
    });

    if (!storedCredential) {
      this.clearChallenge('discoverable_auth');
      throw new UnauthorizedException('Biometric credential not found');
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: storedCredential.credentialId,
          publicKey: base64URLToUint8Array(storedCredential.publicKey),
          counter: storedCredential.counter,
          transports: storedCredential.transports as AuthenticatorTransportFuture[],
        },
        requireUserVerification: true,
      });
    } catch (error) {
      this.clearChallenge('discoverable_auth');
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }

    this.clearChallenge('discoverable_auth');

    if (!verification.verified) {
      throw new UnauthorizedException('Biometric authentication failed');
    }

    // Update counter to prevent replay attacks
    storedCredential.counter = verification.authenticationInfo.newCounter;
    storedCredential.lastUsedAt = new Date();
    await storedCredential.save();

    return { verified: true, user };
  }

  async getUserCredentials(userId: Types.ObjectId | string): Promise<BiometricCredentialDocument[]> {
    // Ensure userId is an ObjectId for proper querying
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    // Query for both ObjectId and string userId for backwards compatibility
    return this.biometricCredentialModel
      .find({ $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }] })
      .select('credentialId deviceName transports created_at lastUsedAt')
      .sort({ created_at: -1 });
  }

  async deleteCredential(userId: Types.ObjectId | string, credentialId?: string): Promise<void> {
    // Ensure userId is an ObjectId for proper querying
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    // Query for both ObjectId and string userId for backwards compatibility
    const userIdQuery = { $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }] };

    if (credentialId) {
      const result = await this.biometricCredentialModel.deleteOne({
        ...userIdQuery,
        credentialId,
      });
      if (result.deletedCount === 0) {
        throw new NotFoundException('Credential not found');
      }
    } else {
      await this.biometricCredentialModel.deleteMany(userIdQuery);
    }

    const remainingCount = await this.biometricCredentialModel.countDocuments(userIdQuery);
    if (remainingCount === 0) {
      await this.userSettingsService.updateSetting(
        { defaults: { biometric_enabled: false } },
        userObjectId,
      );
    }
  }

  async isBiometricEnabled(userId: Types.ObjectId | string): Promise<boolean> {
    // Ensure userId is an ObjectId for proper querying
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    // Query for both ObjectId and string userId for backwards compatibility
    const count = await this.biometricCredentialModel.countDocuments({
      $or: [{ userId: userObjectId }, { userId: userObjectId.toString() }],
    });
    return count > 0;
  }

  async hasBiometricCredentials(email: string): Promise<boolean> {
    const user = await this.usersService.findOneByEmail(email.toLowerCase());
    if (!user) return false;
    // Check for both ObjectId and string userId (for backwards compatibility)
    const count = await this.biometricCredentialModel.countDocuments({
      $or: [
        { userId: user._id },
        { userId: user._id.toString() },
      ],
    });
    return count > 0;
  }

  private getDefaultDeviceName(): string {
    return `Device registered on ${new Date().toLocaleDateString()}`;
  }
}
