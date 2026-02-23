import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OWBaseProvider } from './ow-base.provider';
import { OWClientService } from './ow-client.service';
import { OWUserMapping, OWUserMappingDocument } from '../../schemas/ow-user-mapping.schema';

@Injectable()
export class WhoopProvider extends OWBaseProvider {
  readonly providerName = 'whoop';
  protected readonly logger = new Logger(WhoopProvider.name);

  protected readonly dataTypeMapping: Record<string, string> = {
    'heart_rate': 'heart_rate',
    'heart_rate_variability': 'heart_rate',
    'steps': 'steps',
    'calories_active': 'calories_burned',
    'distance': 'distance',
    'spo2': 'oxygen_saturation',
    'stress': 'stress_level',
    'respiration_rate': 'respiratory_rate',
    'body_temperature': 'body_temperature',
  };

  constructor(
    owClient: OWClientService,
    @InjectModel(OWUserMapping.name) owUserMappingModel: Model<OWUserMappingDocument>,
  ) {
    super(owClient, owUserMappingModel);
  }
}
