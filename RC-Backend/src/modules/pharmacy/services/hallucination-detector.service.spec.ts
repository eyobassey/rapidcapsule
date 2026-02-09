import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HallucinationDetectorService } from './hallucination-detector.service';
import { BNFService } from './bnf.service';
import { HallucinationType, HallucinationSeverity } from '../dto/hallucination.dto';

describe('HallucinationDetectorService', () => {
  let service: HallucinationDetectorService;
  let bnfService: BNFService;

  beforeEach(async () => {
    const mockUserModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
    };

    const mockBnfService = {
      isInBNF: jest.fn().mockImplementation((drugName: string) => {
        const knownDrugs = [
          'amoxicillin', 'metformin', 'lisinopril', 'amlodipine',
          'omeprazole', 'atorvastatin', 'paracetamol', 'ibuprofen',
        ];
        return knownDrugs.includes(drugName.toLowerCase());
      }),
      getDrugInfo: jest.fn().mockResolvedValue({
        drug_name: 'amoxicillin',
        drug_class: 'Penicillins',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HallucinationDetectorService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: BNFService, useValue: mockBnfService },
      ],
    }).compile();

    service = module.get<HallucinationDetectorService>(HallucinationDetectorService);
    bnfService = module.get<BNFService>(BNFService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('detectHallucinations', () => {
    it('should return safe for empty suggestions', async () => {
      const result = await service.detectHallucinations([], 'specialist-id', 'patient-id');

      expect(result.recommendation).toBe('safe');
      expect(result.total_items_checked).toBe(0);
      expect(result.hallucinations_detected).toBe(0);
    });

    it('should return report with required fields', async () => {
      const suggestions = [
        {
          drug_name: 'Amoxicillin',
          generic_name: 'amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          drug_class: 'Penicillins',
          confidence_score: 85,
        },
      ];

      const result = await service.detectHallucinations(
        suggestions as any,
        'specialist-id',
        'patient-id',
      );

      expect(result.timestamp).toBeDefined();
      expect(result.total_items_checked).toBeDefined();
      expect(result.hallucinations_detected).toBeDefined();
      expect(result.critical_count).toBeDefined();
      expect(result.high_count).toBeDefined();
      expect(result.medium_count).toBeDefined();
      expect(result.low_count).toBeDefined();
      expect(result.drug_checks).toBeDefined();
      expect(result.overall_suspicion_score).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should check multiple medications', async () => {
      const suggestions = [
        {
          drug_name: 'Amoxicillin',
          generic_name: 'amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          drug_class: 'Penicillins',
          confidence_score: 85,
        },
        {
          drug_name: 'Metformin',
          generic_name: 'metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          drug_class: 'Biguanides',
          confidence_score: 90,
        },
      ];

      const result = await service.detectHallucinations(
        suggestions as any,
        'specialist-id',
        'patient-id',
      );

      expect(result.total_items_checked).toBe(2);
      expect(result.drug_checks.length).toBe(2);
    });
  });

  describe('Hallucination Types', () => {
    it('should have correct hallucination types defined', () => {
      expect(HallucinationType.UNKNOWN_DRUG).toBe('unknown_drug');
      expect(HallucinationType.IMPLAUSIBLE_DOSAGE).toBe('implausible_dosage');
      expect(HallucinationType.INVENTED_DRUG_CLASS).toBe('invented_drug_class');
      expect(HallucinationType.FAKE_INTERACTION).toBe('fake_interaction');
      expect(HallucinationType.INVENTED_INDICATION).toBe('invented_indication');
      expect(HallucinationType.IMPLAUSIBLE_FREQUENCY).toBe('implausible_frequency');
    });
  });

  describe('Severity Levels', () => {
    it('should have correct severity levels defined', () => {
      expect(HallucinationSeverity.CRITICAL).toBe('critical');
      expect(HallucinationSeverity.HIGH).toBe('high');
      expect(HallucinationSeverity.MEDIUM).toBe('medium');
      expect(HallucinationSeverity.LOW).toBe('low');
    });
  });

  describe('Report Structure', () => {
    it('should include counts for all severity levels', async () => {
      const result = await service.detectHallucinations([], 'specialist-id', 'patient-id');

      expect(typeof result.critical_count).toBe('number');
      expect(typeof result.high_count).toBe('number');
      expect(typeof result.medium_count).toBe('number');
      expect(typeof result.low_count).toBe('number');
    });

    it('should include summary text', async () => {
      const result = await service.detectHallucinations([], 'specialist-id', 'patient-id');
      expect(typeof result.summary).toBe('string');
    });

    it('should have valid recommendation value', async () => {
      const result = await service.detectHallucinations([], 'specialist-id', 'patient-id');
      expect(['safe', 'review_required', 'reject']).toContain(result.recommendation);
    });
  });
});
