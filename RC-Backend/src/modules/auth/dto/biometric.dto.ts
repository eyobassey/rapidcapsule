import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BiometricRegisterOptionsDto {
  @ApiPropertyOptional({ description: 'Friendly name for the device being registered', example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class BiometricRegisterVerifyDto {
  @ApiProperty({
    description: 'WebAuthn credential response from the authenticator',
    example: {
      id: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop',
      rawId: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop',
      response: {
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiLi4uIn0',
        attestationObject: 'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YQ...',
        transports: ['internal'],
      },
      type: 'public-key',
      clientExtensionResults: {},
      authenticatorAttachment: 'platform',
    },
  })
  @IsNotEmpty()
  @IsObject()
  credential: {
    id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      attestationObject: string;
      transports?: string[];
    };
    type: string;
    clientExtensionResults: Record<string, unknown>;
    authenticatorAttachment?: string;
  };

  @ApiPropertyOptional({ description: 'Friendly name for the device', example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class BiometricLoginOptionsDto {
  @ApiProperty({ description: 'Email address of the account to authenticate', example: 'patient@example.com' })
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class BiometricLoginVerifyDto {
  @ApiProperty({ description: 'Email address of the account', example: 'patient@example.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'WebAuthn assertion credential from the authenticator',
    example: {
      id: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop',
      rawId: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop',
      response: {
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiLi4uIn0',
        authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MBAAAABg',
        signature: 'MEUCIQDKg...',
        userHandle: 'NTA3ZjFmNzdiY2Y4NmNkNzk5NDM5MDEx',
      },
      type: 'public-key',
      clientExtensionResults: {},
      authenticatorAttachment: 'platform',
    },
  })
  @IsNotEmpty()
  @IsObject()
  credential: {
    id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      authenticatorData: string;
      signature: string;
      userHandle?: string;
    };
    type: string;
    clientExtensionResults: Record<string, unknown>;
    authenticatorAttachment?: string;
  };
}

export class DeleteBiometricDto {
  @ApiPropertyOptional({ description: 'Credential ID to delete. If omitted, all credentials for the user are deleted.', example: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop' })
  @IsOptional()
  @IsString()
  credentialId?: string;
}
