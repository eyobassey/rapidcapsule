import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { PubMedService } from './pubmed.service';
import { EvidenceLevel } from '../dto/pubmed.dto';

describe('PubMedService', () => {
  let service: PubMedService;
  let httpService: HttpService;

  // Mock PubMed search response
  const mockSearchResponse = {
    data: {
      esearchresult: {
        count: '150',
        idlist: ['12345678', '23456789', '34567890'],
      },
    },
  };

  // Mock PubMed summary response
  const mockSummaryResponse = {
    data: {
      result: {
        uids: ['12345678'],
        '12345678': {
          uid: '12345678',
          title: 'Efficacy of Amoxicillin in Treating Bacterial Infections',
          authors: [{ name: 'Smith J' }, { name: 'Jones M' }],
          source: 'J Antimicrob Chemother',
          pubdate: '2023 Jan',
          pubtype: ['Meta-Analysis', 'Journal Article'],
          fulljournalname: 'Journal of Antimicrobial Chemotherapy',
          articleids: [{ idtype: 'doi', value: '10.1234/test' }],
          sortpubdate: '2023/01/01',
        },
      },
    },
  };

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockUserModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubMedService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<PubMedService>(PubMedService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('searchDrugEvidence', () => {
    it('should search PubMed for drug evidence', async () => {
      jest.spyOn(httpService, 'get')
        .mockReturnValueOnce(of(mockSearchResponse) as any)
        .mockReturnValueOnce(of(mockSummaryResponse) as any);

      const result = await service.searchDrugEvidence({
        drug_name: 'Amoxicillin',
        condition: 'Bacterial infection',
      });

      expect(result).toBeDefined();
      expect(result.drug_name).toBe('Amoxicillin');
      expect(result.condition).toBe('Bacterial infection');
    });

    it('should return evidence summary structure', async () => {
      jest.spyOn(httpService, 'get')
        .mockReturnValueOnce(of(mockSearchResponse) as any)
        .mockReturnValueOnce(of(mockSummaryResponse) as any);

      const result = await service.searchDrugEvidence({
        drug_name: 'Amoxicillin',
        condition: 'Bacterial infection',
      });

      expect(result.drug_name).toBeDefined();
      expect(result.condition).toBeDefined();
      expect(result.citations).toBeDefined();
      expect(result.total_articles_found).toBeDefined();
      expect(result.evidence_summary).toBeDefined();
    });

    it('should handle empty search results', async () => {
      const emptyResponse = {
        data: {
          esearchresult: {
            count: '0',
            idlist: [],
          },
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(emptyResponse) as any);

      const result = await service.searchDrugEvidence({
        drug_name: 'NonexistentDrug',
        condition: 'Unknown condition',
      });

      expect(result.citations).toEqual([]);
      expect(result.total_articles_found).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        throwError(() => new Error('API Error')) as any,
      );

      // Use unique drug name to avoid cache
      const result = await service.searchDrugEvidence({
        drug_name: 'UniqueDrugForErrorTest' + Date.now(),
        condition: 'Test condition',
      });

      expect(result.citations).toEqual([]);
      expect(result.total_articles_found).toBe(0);
    });
  });

  describe('Evidence Level', () => {
    it('should have correct evidence levels defined', () => {
      expect(EvidenceLevel.HIGH).toBe('high');
      expect(EvidenceLevel.MODERATE).toBe('moderate');
      expect(EvidenceLevel.LOW).toBe('low');
      expect(EvidenceLevel.UNKNOWN).toBe('unknown');
    });
  });

  describe('Citation Structure', () => {
    it('should return citations array', async () => {
      jest.spyOn(httpService, 'get')
        .mockReturnValueOnce(of(mockSearchResponse) as any)
        .mockReturnValueOnce(of(mockSummaryResponse) as any);

      const result = await service.searchDrugEvidence({
        drug_name: 'Amoxicillin',
        condition: 'Bacterial infection',
      });

      expect(Array.isArray(result.citations)).toBe(true);
      if (result.citations.length > 0) {
        expect(result.citations[0].pmid).toBeDefined();
        expect(result.citations[0].title).toBeDefined();
      }
    });
  });
});
