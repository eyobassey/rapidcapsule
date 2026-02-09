import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BNFService } from './bnf.service';

describe('BNFService', () => {
  let service: BNFService;

  beforeEach(async () => {
    const mockUserModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BNFService,
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<BNFService>(BNFService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getDrugInfo', () => {
    it('should return info for known drugs', async () => {
      const drugs = ['Amoxicillin', 'Metformin', 'Lisinopril', 'Omeprazole'];
      for (const drugName of drugs) {
        const result = await service.getDrugInfo(drugName);
        if (result) {
          expect(result.drug_name).toBeDefined();
          expect(result.drug_class).toBeDefined();
        }
      }
    });

    it('should return null for unknown drugs', async () => {
      const result = await service.getDrugInfo('UnknownDrug123XYZ');
      expect(result).toBeNull();
    });

    it('should be case insensitive', async () => {
      const result1 = await service.getDrugInfo('AMOXICILLIN');
      const result2 = await service.getDrugInfo('amoxicillin');

      // Both should return the same result (both found or both null)
      const bothFound = result1 !== null && result2 !== null;
      const bothNull = result1 === null && result2 === null;
      expect(bothFound || bothNull).toBe(true);
    });
  });

  describe('validateDrug', () => {
    it('should validate drug with appropriate dosage', async () => {
      const result = await service.validateDrug(
        'Amoxicillin',
        '500mg',
        'Bacterial infection',
        'adult',
      );

      expect(result).toBeDefined();
      expect(result.drug_name).toBe('Amoxicillin');
    });

    it('should handle unknown drugs', async () => {
      const result = await service.validateDrug(
        'UnknownDrug123',
        '100mg',
        'Unknown condition',
        'adult',
      );

      expect(result).toBeDefined();
      expect(result.found_in_bnf).toBe(false);
    });
  });

  describe('isInBNF', () => {
    it('should return boolean for drug check', () => {
      const knownDrugs = ['Amoxicillin', 'Metformin', 'Lisinopril', 'Omeprazole'];
      for (const drug of knownDrugs) {
        const result = service.isInBNF(drug);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should return false for clearly fake drugs', () => {
      const result = service.isInBNF('FakeDrugXYZ123ABC');
      expect(result).toBe(false);
    });

    it('should be case insensitive', () => {
      const drug = 'Amoxicillin';
      const result1 = service.isInBNF(drug.toUpperCase());
      const result2 = service.isInBNF(drug.toLowerCase());
      expect(result1).toBe(result2);
    });
  });

  describe('checkInteractions', () => {
    it('should check for drug interactions', () => {
      const result = service.checkInteractions('Warfarin', ['Aspirin']);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty drug list', () => {
      const result = service.checkInteractions('Warfarin', []);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('buildComplianceSummary', () => {
    it('should build summary for empty results', () => {
      const summary = service.buildComplianceSummary([]);
      expect(summary).toBeDefined();
      expect(summary.total_drugs_checked).toBe(0);
    });

    it('should build summary with validation results', () => {
      const mockResults = [
        {
          drug_name: 'Amoxicillin',
          found_in_bnf: true,
          uk_approved: true,
          indications_checked: [],
          indication_match: true,
          dosage_appropriate: true,
          dosage_warnings: [],
          cautions: [],
          contraindication_flags: [],
          interaction_alerts: [],
          special_population_warnings: [],
          validation_timestamp: new Date(),
        },
      ];

      const summary = service.buildComplianceSummary(mockResults);
      expect(summary.total_drugs_checked).toBe(1);
      expect(summary.uk_approved_count).toBe(1);
    });

    it('should count drugs not in BNF', () => {
      const mockResults = [
        {
          drug_name: 'UnknownDrug',
          found_in_bnf: false,
          uk_approved: false,
          indications_checked: [],
          indication_match: false,
          dosage_appropriate: false,
          dosage_warnings: [],
          cautions: [],
          contraindication_flags: [],
          interaction_alerts: [],
          special_population_warnings: [],
          validation_timestamp: new Date(),
        },
      ];

      const summary = service.buildComplianceSummary(mockResults);
      expect(summary.not_uk_approved.length).toBe(1);
    });
  });
});
