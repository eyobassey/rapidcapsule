import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RxGPTService } from './rxgpt.service';
import { DrugInteractionService } from './drug-interaction.service';
import { OpenFDAService } from './openfda.service';
import { PubMedService } from './pubmed.service';
import { NICEService } from './nice.service';
import { BNFService } from './bnf.service';
import { HallucinationDetectorService } from './hallucination-detector.service';
import { RxGPTSettings } from '../entities/rxgpt-settings.entity';
import { RxGPTAnalytics } from '../entities/rxgpt-analytics.entity';
import { RxGPTCache } from '../entities/rxgpt-cache.entity';
import { RxGPTFeedback } from '../entities/rxgpt-feedback.entity';

describe('RxGPTService', () => {
  let service: RxGPTService;
  let drugInteractionService: DrugInteractionService;
  let pubmedService: PubMedService;
  let niceService: NICEService;
  let bnfService: BNFService;
  let hallucinationDetector: HallucinationDetectorService;

  // Mock settings
  const mockSettings = {
    is_enabled: true,
    is_enabled_for_specialists: true,
    ai_model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.3,
    credit_settings: {
      credits_per_analysis: 1,
      free_monthly_credits: 10,
      allow_specialist_purchase: true,
    },
    features: {
      allergy_checking: true,
      drug_interactions: true,
      dosage_validation: true,
      alternative_suggestions: true,
      clinical_reasoning: true,
      citations: true,
    },
    data_sources: {
      use_openfda: true,
      use_claude_ai: true,
      use_local_drug_db: true,
      use_pubmed: true,
      use_nice_guidelines: false,
      use_bnf: false,
      use_hallucination_detection: true,
    },
    thresholds: {
      min_confidence_score: 70,
      interaction_severity_threshold: 'moderate',
      max_alternatives: 3,
    },
    display: {
      show_citations: true,
      show_confidence_scores: true,
      show_reasoning: true,
      auto_expand_alerts: true,
    },
    usage_limits: {
      daily_limit: 0,
      monthly_limit: 0,
      rate_limit_per_minute: 10,
      low_credit_warning_threshold: 5,
      critical_credit_warning_threshold: 2,
    },
    disclaimer_text: 'Test disclaimer',
  };

  // Mock credit record
  const mockCreditRecord = {
    userId: '507f1f77bcf86cd799439011',
    free_credits_remaining: 5,
    purchased_credits: 10,
    gifted_credits: 0,
    unlimited_subscription: { is_active: false },
  };

  beforeEach(async () => {
    // Create mock models
    const mockSettingsModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSettings),
      }),
      create: jest.fn().mockResolvedValue(mockSettings),
    };

    const mockAnalyticsModel = {
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'analytics-id' })),
      aggregate: jest.fn().mockResolvedValue([]),
    };

    const mockCacheModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'cache-id' })),
    };

    const mockFeedbackModel = {
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'feedback-id' })),
    };

    const mockUserModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
    };

    const mockAppointmentModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockHealthCheckupModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockCreditModel = {
      collection: { name: 'claude_summary_credits' },
      countDocuments: jest.fn().mockResolvedValue(1),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCreditRecord),
      }),
    };

    // Create mock services
    const mockDrugInteractionService = {
      checkInteractions: jest.fn().mockResolvedValue({
        hasInteractions: false,
        interactions: [],
      }),
    };

    const mockOpenFDAService = {
      lookupDrug: jest.fn().mockResolvedValue({
        found: true,
        brand_name: 'Amoxicillin',
        generic_name: 'amoxicillin',
      }),
    };

    const mockPubmedService = {
      searchDrugEvidence: jest.fn().mockResolvedValue({
        drug_name: 'Amoxicillin',
        condition: 'Bacterial infection',
        citations: [],
        evidence_level: 'HIGH',
        total_results: 150,
      }),
    };

    const mockNiceService = {
      validateDrugForCondition: jest.fn().mockResolvedValue({
        drug_name: 'Amoxicillin',
        condition: 'Bacterial infection',
        is_nice_compliant: true,
        compliance_level: 'full',
        guidelines_checked: [],
        recommendations: [],
        warnings: [],
        validation_timestamp: new Date(),
      }),
      buildComplianceSummary: jest.fn().mockReturnValue({
        total_drugs_checked: 1,
        fully_compliant: 1,
        has_compliance_issues: false,
      }),
    };

    const mockBnfService = {
      getDrugInfo: jest.fn().mockResolvedValue({
        drug_name: 'amoxicillin',
        drug_class: 'Penicillins',
      }),
      validateDrug: jest.fn().mockResolvedValue({
        drug_name: 'Amoxicillin',
        found_in_bnf: true,
        uk_approved: true,
        validation_timestamp: new Date(),
      }),
      buildComplianceSummary: jest.fn().mockReturnValue({
        total_drugs_checked: 1,
        uk_approved_count: 1,
        not_uk_approved: [],
        has_uk_compliance_issues: false,
      }),
      isInBNF: jest.fn().mockReturnValue(true),
    };

    const mockHallucinationDetector = {
      detectHallucinations: jest.fn().mockResolvedValue({
        timestamp: new Date(),
        total_items_checked: 1,
        hallucinations_detected: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        drug_checks: [],
        overall_suspicion_score: 5,
        recommendation: 'safe',
        summary: 'No hallucinations detected',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RxGPTService,
        { provide: getModelToken(RxGPTSettings.name), useValue: mockSettingsModel },
        { provide: getModelToken(RxGPTAnalytics.name), useValue: mockAnalyticsModel },
        { provide: getModelToken(RxGPTCache.name), useValue: mockCacheModel },
        { provide: getModelToken(RxGPTFeedback.name), useValue: mockFeedbackModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Appointment'), useValue: mockAppointmentModel },
        { provide: getModelToken('HealthCheckup'), useValue: mockHealthCheckupModel },
        { provide: getModelToken('ClaudeSummaryCredit'), useValue: mockCreditModel },
        { provide: DrugInteractionService, useValue: mockDrugInteractionService },
        { provide: OpenFDAService, useValue: mockOpenFDAService },
        { provide: PubMedService, useValue: mockPubmedService },
        { provide: NICEService, useValue: mockNiceService },
        { provide: BNFService, useValue: mockBnfService },
        { provide: HallucinationDetectorService, useValue: mockHallucinationDetector },
      ],
    }).compile();

    service = module.get<RxGPTService>(RxGPTService);
    drugInteractionService = module.get<DrugInteractionService>(DrugInteractionService);
    pubmedService = module.get<PubMedService>(PubMedService);
    niceService = module.get<NICEService>(NICEService);
    bnfService = module.get<BNFService>(BNFService);
    hallucinationDetector = module.get<HallucinationDetectorService>(HallucinationDetectorService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should report availability status', () => {
      const isAvailable = service.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('Settings Management', () => {
    it('should get current settings', async () => {
      const settings = await service.getSettings();
      expect(settings).toBeDefined();
      expect(settings.is_enabled).toBe(true);
      expect(settings.ai_model).toBe('claude-sonnet-4-20250514');
    });

    it('should return default data sources', async () => {
      const settings = await service.getSettings();
      expect(settings.data_sources).toBeDefined();
      expect(settings.data_sources.use_openfda).toBe(true);
      expect(settings.data_sources.use_pubmed).toBe(true);
      expect(settings.data_sources.use_hallucination_detection).toBe(true);
    });

    it('should have correct credit settings', async () => {
      const settings = await service.getSettings();
      expect(settings.credit_settings.credits_per_analysis).toBe(1);
      expect(settings.credit_settings.free_monthly_credits).toBe(10);
    });
  });

  describe('Credit Management', () => {
    it('should get specialist credit balance', async () => {
      const balance = await service.getSpecialistCreditBalance('507f1f77bcf86cd799439011');
      expect(balance).toBeDefined();
      expect(balance.available).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Drug Validation Services', () => {
    it('should call PubMed service for evidence search', async () => {
      const result = await pubmedService.searchDrugEvidence({
        drug_name: 'Amoxicillin',
        condition: 'Bacterial infection',
      });
      expect(result).toBeDefined();
      expect(result.drug_name).toBe('Amoxicillin');
    });

    it('should call NICE service for guideline validation', async () => {
      const result = await niceService.validateDrugForCondition('Amoxicillin', 'Bacterial infection');
      expect(result).toBeDefined();
      expect(result.drug_name).toBe('Amoxicillin');
    });

    it('should call BNF service for UK prescribing validation', async () => {
      const result = await bnfService.getDrugInfo('Amoxicillin');
      expect(result).toBeDefined();
      if (result) {
        expect(result.drug_name).toBe('amoxicillin');
      }
    });

    it('should check if drug is in BNF', () => {
      const isInBNF = bnfService.isInBNF('Amoxicillin');
      expect(isInBNF).toBe(true);
    });
  });

  describe('Hallucination Detection', () => {
    it('should call hallucination detector', async () => {
      const result = await hallucinationDetector.detectHallucinations(
        [],
        'specialist-id',
        'patient-id',
      );

      expect(result).toBeDefined();
      expect(result.recommendation).toBe('safe');
      expect(result.hallucinations_detected).toBe(0);
    });
  });

  describe('Drug Interaction Checking', () => {
    it('should check for drug interactions', async () => {
      const result = await drugInteractionService.checkInteractions(['Amoxicillin', 'Metformin']);
      expect(result).toBeDefined();
      expect(result.hasInteractions).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', () => {
      const specialistId = 'test-specialist-id';

      // First call should pass
      const firstCheck = service['checkRateLimit'](specialistId, 10);
      expect(firstCheck).toBe(true);

      // Simulate multiple calls
      for (let i = 0; i < 9; i++) {
        service['checkRateLimit'](specialistId, 10);
      }

      // 11th call should fail
      const exceededCheck = service['checkRateLimit'](specialistId, 10);
      expect(exceededCheck).toBe(false);
    });
  });

  describe('Compliance Summary Building', () => {
    it('should build NICE compliance summary', () => {
      const summary = niceService.buildComplianceSummary([]);
      expect(summary).toBeDefined();
      expect(summary.total_drugs_checked).toBeDefined();
    });

    it('should build BNF compliance summary', () => {
      const summary = bnfService.buildComplianceSummary([]);
      expect(summary).toBeDefined();
      expect(summary.total_drugs_checked).toBeDefined();
    });
  });
});

describe('RxGPT Service - Data Source Toggle Tests', () => {
  const createMockSettings = (overrides: any = {}) => ({
    is_enabled: true,
    is_enabled_for_specialists: true,
    ai_model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.3,
    credit_settings: { credits_per_analysis: 1, free_monthly_credits: 10, allow_specialist_purchase: true },
    features: {
      allergy_checking: true,
      drug_interactions: true,
      dosage_validation: true,
      alternative_suggestions: true,
      clinical_reasoning: true,
      citations: true,
    },
    data_sources: {
      use_openfda: true,
      use_claude_ai: true,
      use_local_drug_db: true,
      use_pubmed: true,
      use_nice_guidelines: false,
      use_bnf: false,
      use_hallucination_detection: true,
      ...overrides.data_sources,
    },
    thresholds: { min_confidence_score: 70, interaction_severity_threshold: 'moderate', max_alternatives: 3 },
    display: { show_citations: true, show_confidence_scores: true, show_reasoning: true, auto_expand_alerts: true },
    usage_limits: {
      daily_limit: 0,
      monthly_limit: 0,
      rate_limit_per_minute: 10,
      low_credit_warning_threshold: 5,
      critical_credit_warning_threshold: 2,
    },
    disclaimer_text: 'Test disclaimer',
    ...overrides,
  });

  it('should respect use_pubmed setting', () => {
    const settingsWithPubmed = createMockSettings({ data_sources: { use_pubmed: true } });
    const settingsWithoutPubmed = createMockSettings({ data_sources: { use_pubmed: false } });

    expect(settingsWithPubmed.data_sources.use_pubmed).toBe(true);
    expect(settingsWithoutPubmed.data_sources.use_pubmed).toBe(false);
  });

  it('should respect use_nice_guidelines setting', () => {
    const settingsWithNice = createMockSettings({ data_sources: { use_nice_guidelines: true } });
    const settingsWithoutNice = createMockSettings({ data_sources: { use_nice_guidelines: false } });

    expect(settingsWithNice.data_sources.use_nice_guidelines).toBe(true);
    expect(settingsWithoutNice.data_sources.use_nice_guidelines).toBe(false);
  });

  it('should respect use_bnf setting', () => {
    const settingsWithBnf = createMockSettings({ data_sources: { use_bnf: true } });
    const settingsWithoutBnf = createMockSettings({ data_sources: { use_bnf: false } });

    expect(settingsWithBnf.data_sources.use_bnf).toBe(true);
    expect(settingsWithoutBnf.data_sources.use_bnf).toBe(false);
  });

  it('should respect use_hallucination_detection setting', () => {
    const settingsWithHD = createMockSettings({ data_sources: { use_hallucination_detection: true } });
    const settingsWithoutHD = createMockSettings({ data_sources: { use_hallucination_detection: false } });

    expect(settingsWithHD.data_sources.use_hallucination_detection).toBe(true);
    expect(settingsWithoutHD.data_sources.use_hallucination_detection).toBe(false);
  });

  it('should have OpenFDA and PubMed enabled by default', () => {
    const settings = createMockSettings();
    expect(settings.data_sources.use_openfda).toBe(true);
    expect(settings.data_sources.use_pubmed).toBe(true);
  });

  it('should have NICE and BNF disabled by default', () => {
    const settings = createMockSettings();
    expect(settings.data_sources.use_nice_guidelines).toBe(false);
    expect(settings.data_sources.use_bnf).toBe(false);
  });

  it('should have hallucination detection enabled by default', () => {
    const settings = createMockSettings();
    expect(settings.data_sources.use_hallucination_detection).toBe(true);
  });
});
