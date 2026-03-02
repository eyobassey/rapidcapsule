import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HarmReductionService } from '../services/harm-reduction.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - Harm Reduction')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/harm-reduction')
export class HarmReductionController {
  constructor(private readonly harmReductionService: HarmReductionService) {}

  @ApiOperation({
    summary: 'List available substance guidance topics',
    description:
      'Returns all substances for which harm reduction guidance is available.',
  })
  @ApiResponse({ status: 200, description: 'Substance list returned' })
  @Get('substances')
  getSubstances() {
    const result = this.harmReductionService.getAvailableSubstances();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get safer use guidance for a substance',
    description:
      'Returns evidence-based harm reduction guidance including safer use tips, overdose signs, mixing dangers, and withdrawal warnings.',
  })
  @ApiParam({
    name: 'substance',
    description:
      'Substance key (alcohol, opioids, stimulants, cannabis, benzodiazepines, tobacco)',
  })
  @ApiResponse({ status: 200, description: 'Substance guidance returned' })
  @ApiResponse({ status: 404, description: 'Substance not found' })
  @Get('guidance/:substance')
  getGuidance(@Param('substance') substance: string) {
    const result = this.harmReductionService.getSafeUseGuidance(substance);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get comprehensive harm reduction guide for a substance',
    description:
      'Returns all harm reduction information for a substance in a single response: guidance, overdose response, emergency resources, and relevant services.',
  })
  @ApiParam({ name: 'substance', description: 'Substance key' })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive guide returned',
  })
  @Get('guide/:substance')
  getComprehensiveGuide(@Param('substance') substance: string) {
    const result = this.harmReductionService.getComprehensiveGuide(substance);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get overdose response guide',
    description:
      'Returns step-by-step first responder overdose response instructions for a substance.',
  })
  @ApiParam({ name: 'substance', description: 'Substance type' })
  @ApiResponse({ status: 200, description: 'Overdose response guide returned' })
  @Get('overdose-response/:substance')
  getOverdoseResponse(@Param('substance') substance: string) {
    const result =
      this.harmReductionService.getOverdoseResponseGuide(substance);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get UK emergency resources',
    description:
      'Returns UK helplines and emergency resources including NHS, FRANK, Samaritans, and specialist services.',
  })
  @ApiResponse({ status: 200, description: 'Emergency resources returned' })
  @Get('emergency-resources')
  getEmergencyResources() {
    const result = this.harmReductionService.getEmergencyResources();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get fentanyl test strip information',
    description:
      'Returns information about fentanyl test strips: what they are, how to use them, and where to get them.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fentanyl test strip info returned',
  })
  @Get('fentanyl-testing')
  getFentanylTesting() {
    const result = this.harmReductionService.getFentanylTestStripInfo();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get needle exchange information',
    description:
      'Returns information about UK needle and syringe programmes: services offered, how to access, and legal status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Needle exchange info returned',
  })
  @Get('needle-exchange')
  getNeedleExchange() {
    const result = this.harmReductionService.getNeedleExchangeInfo();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get drug checking service information',
    description:
      'Returns information about UK drug checking services including The Loop and WEDINOS.',
  })
  @ApiResponse({
    status: 200,
    description: 'Drug checking info returned',
  })
  @Get('drug-checking')
  getDrugChecking() {
    const result = this.harmReductionService.getDrugCheckingInfo();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
