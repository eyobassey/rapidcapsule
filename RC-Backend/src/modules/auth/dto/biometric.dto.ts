import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class BiometricRegisterOptionsDto {
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class BiometricRegisterVerifyDto {
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

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class BiometricLoginOptionsDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class BiometricLoginVerifyDto {
  @IsNotEmpty()
  @IsString()
  email: string;

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
  @IsOptional()
  @IsString()
  credentialId?: string; // If not provided, delete all credentials for user
}
