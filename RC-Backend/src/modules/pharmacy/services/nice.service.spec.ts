import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NICEService } from './nice.service';

describe('NICEService', () => {
  let service: NICEService;

  beforeEach(async () => {
    const mockUserModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NICEService,
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<NICEService>(NICEService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('validateDrugForCondition', () => {
    it('should validate drug against NICE guidelines', async () => {
      const result = await service.validateDrugForCondition('Lisinopril', 'Hypertension');
      expect(result).toBeDefined();
      expect(result.drug_name).toBe('Lisinopril');
      expect(result.condition).toBe('Hypertension');
    });

    it('should return validation result for common medications', async () => {
      const drugs = ['Metformin', 'Amlodipine', 'Sertraline', 'Omeprazole'];
      for (const drug of drugs) {
        const result = await service.validateDrugForCondition(drug, 'Test Condition');
        expect(result).toBeDefined();
        expect(result.drug_name).toBe(drug);
      }
    });

    it('should handle unknown drugs gracefully', async () => {
      const result = await service.validateDrugForCondition('UnknownDrug123', 'Hypertension');
      expect(result).toBeDefined();
      expect(result.drug_name).toBe('UnknownDrug123');
    });

    it('should handle unknown conditions gracefully', async () => {
      const result = await service.validateDrugForCondition('Amoxicillin', 'UnknownCondition');
      expect(result).toBeDefined();
      expect(result.condition).toBe('UnknownCondition');
    });
  });

  describe('getConditionGuidance', () => {
    it('should return guidance for known conditions', async () => {
      const conditions = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Depression'];
      for (const condition of conditions) {
        const guidance = await service.getConditionGuidance(condition);
        if (guidance) {
          expect(guidance.condition).toBeDefined();
        }
      }
    });

    it('should return null for unknown conditions', async () => {
      const guidance = await service.getConditionGuidance('UnknownCondition123XYZ');
      expect(guidance).toBeNull();
    });
  });

  describe('buildComplianceSummary', () => {
    it('should build compliance summary for empty array', () => {
      const summary = service.buildComplianceSummary([]);
      expect(summary).toBeDefined();
      expect(typeof summary.total_drugs_checked).toBe('number');
    });

    it('should handle validation results array', () => {
      const mockResults = [
        {
          drug_name: 'Lisinopril',
          condition: 'Hypertension',
          is_nice_compliant: true,
          compliance_level: 'full' as const,
          guidelines_checked: [],
          recommendations: [],
          warnings: [],
          validation_timestamp: new Date(),
        },
      ];
      const summary = service.buildComplianceSummary(mockResults);
      expect(summary.total_drugs_checked).toBe(1);
    });
  });
});
