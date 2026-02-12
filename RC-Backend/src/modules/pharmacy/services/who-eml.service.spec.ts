import { Test, TestingModule } from '@nestjs/testing';
import { WHOEMLService } from './who-eml.service';

describe('WHOEMLService', () => {
  let service: WHOEMLService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WHOEMLService],
    }).compile();

    service = module.get<WHOEMLService>(WHOEMLService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load EML data with correct count', () => {
      expect(service.getTotalMedicines()).toBeGreaterThan(600);
    });

    it('should report version info', () => {
      const version = service.getVersion();
      expect(version).toContain('EML');
    });
  });

  describe('getMedicineInfo', () => {
    it('should return info for known drugs by INN', () => {
      const drugs = ['amoxicillin', 'paracetamol', 'metformin', 'amlodipine', 'salbutamol'];
      for (const drug of drugs) {
        const result = service.getMedicineInfo(drug);
        expect(result).not.toBeNull();
        expect(result!.inn).toBe(drug);
        expect(result!.atc_code).toBeDefined();
      }
    });

    it('should return null for unknown drugs', () => {
      const result = service.getMedicineInfo('UnknownDrug123XYZ');
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const result1 = service.getMedicineInfo('AMOXICILLIN');
      const result2 = service.getMedicineInfo('amoxicillin');
      const result3 = service.getMedicineInfo('Amoxicillin');

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result3).not.toBeNull();
      expect(result1!.inn).toBe(result2!.inn);
      expect(result2!.inn).toBe(result3!.inn);
    });

    it('should resolve brand name synonyms', () => {
      // Ventolin → salbutamol
      const result = service.getMedicineInfo('ventolin');
      expect(result).not.toBeNull();
      expect(result!.inn).toBe('salbutamol');
    });

    it('should resolve common alternative names', () => {
      // acetaminophen → paracetamol
      const result = service.getMedicineInfo('acetaminophen');
      expect(result).not.toBeNull();
      expect(result!.inn).toBe('paracetamol');
    });

    it('should resolve brand names for antimalarials', () => {
      // coartem → artemether + lumefantrine
      const result = service.getMedicineInfo('coartem');
      expect(result).not.toBeNull();
      expect(result!.inn).toBe('artemether + lumefantrine');
    });

    it('should handle partial matches', () => {
      const result = service.getMedicineInfo('amoxicillin trihydrate');
      expect(result).not.toBeNull();
      expect(result!.inn).toBe('amoxicillin');
    });

    it('should handle combination drugs with separators', () => {
      const result = service.getMedicineInfo('amoxicillin/clavulanate');
      expect(result).not.toBeNull();
    });

    it('should return null for empty input', () => {
      expect(service.getMedicineInfo('')).toBeNull();
      expect(service.getMedicineInfo(null as any)).toBeNull();
    });
  });

  describe('isInEML', () => {
    it('should return true for essential medicines', () => {
      const essentialDrugs = ['amoxicillin', 'metformin', 'salbutamol', 'artemether + lumefantrine'];
      for (const drug of essentialDrugs) {
        expect(service.isInEML(drug)).toBe(true);
      }
    });

    it('should return false for non-essential drugs', () => {
      expect(service.isInEML('FakeDrugXYZ123ABC')).toBe(false);
    });

    it('should resolve synonyms', () => {
      expect(service.isInEML('acetaminophen')).toBe(true);
      expect(service.isInEML('ventolin')).toBe(true);
      expect(service.isInEML('glucophage')).toBe(true);
    });
  });

  describe('validateDrug', () => {
    it('should validate a known essential medicine', () => {
      const result = service.validateDrug('amoxicillin', 'Pneumonia');
      expect(result.drug_name).toBe('amoxicillin');
      expect(result.found_in_eml).toBe(true);
      expect(result.list_type).toBe('core');
      expect(result.atc_code).toBe('J01CA04');
      expect(result.validation_timestamp).toBeInstanceOf(Date);
    });

    it('should find matching indications', () => {
      const result = service.validateDrug('amoxicillin', 'Pneumonia');
      expect(result.matching_indications.length).toBeGreaterThan(0);
    });

    it('should return formulations', () => {
      const result = service.validateDrug('amoxicillin');
      expect(result.formulations.length).toBeGreaterThan(0);
      expect(result.formulations[0]).toHaveProperty('route');
      expect(result.formulations[0]).toHaveProperty('form');
      expect(result.formulations[0]).toHaveProperty('strength');
    });

    it('should flag drugs not in EML', () => {
      const result = service.validateDrug('UnknownDrug123');
      expect(result.found_in_eml).toBe(false);
      expect(result.list_type).toBeUndefined();
      expect(result.atc_code).toBeUndefined();
      expect(result.matching_indications).toEqual([]);
      expect(result.formulations).toEqual([]);
    });

    it('should identify core vs complementary', () => {
      const core = service.validateDrug('amoxicillin');
      expect(core.list_type).toBe('core');

      // Find a complementary drug
      const comp = service.validateDrug('vancomycin');
      expect(comp.list_type).toBe('complementary');
    });

    it('should handle age group validation', () => {
      const result = service.validateDrug('amoxicillin', 'Pneumonia', 'child');
      expect(result.age_group_appropriate).toBeDefined();
      expect(typeof result.age_group_appropriate).toBe('boolean');
    });

    it('should validate antimalarials relevant to Nigerian context', () => {
      const act = service.validateDrug('artemether + lumefantrine', 'Malaria');
      expect(act.found_in_eml).toBe(true);
      expect(act.list_type).toBe('core');
      expect(act.matching_indications.length).toBeGreaterThan(0);

      const artesunate = service.validateDrug('artesunate', 'Severe malaria');
      expect(artesunate.found_in_eml).toBe(true);
    });

    it('should validate HIV medicines', () => {
      const result = service.validateDrug('dolutegravir', 'HIV');
      expect(result.found_in_eml).toBe(true);
      expect(result.list_type).toBe('core');
    });

    it('should validate TB medicines', () => {
      const result = service.validateDrug('rifampicin', 'Tuberculosis');
      expect(result.found_in_eml).toBe(true);
      expect(result.matching_indications.length).toBeGreaterThan(0);
    });
  });

  describe('buildComplianceSummary', () => {
    it('should build summary for empty results', () => {
      const summary = service.buildComplianceSummary([]);
      expect(summary.total_drugs_checked).toBe(0);
      expect(summary.eml_listed_count).toBe(0);
      expect(summary.core_count).toBe(0);
      expect(summary.complementary_count).toBe(0);
      expect(summary.not_in_eml).toEqual([]);
      expect(summary.has_eml_issues).toBe(false);
    });

    it('should correctly summarize mixed results', () => {
      const results = [
        service.validateDrug('amoxicillin', 'Pneumonia'),
        service.validateDrug('vancomycin', 'MRSA'),
        service.validateDrug('FakeDrug123'),
      ];

      const summary = service.buildComplianceSummary(results);
      expect(summary.total_drugs_checked).toBe(3);
      expect(summary.eml_listed_count).toBe(2);
      expect(summary.core_count).toBe(1);
      expect(summary.complementary_count).toBe(1);
      expect(summary.not_in_eml).toContain('FakeDrug123');
      expect(summary.has_eml_issues).toBe(true);
      expect(summary.warning).toContain('not in WHO');
    });

    it('should report no issues when all drugs are in EML', () => {
      const results = [
        service.validateDrug('amoxicillin'),
        service.validateDrug('paracetamol'),
        service.validateDrug('metformin'),
      ];

      const summary = service.buildComplianceSummary(results);
      expect(summary.has_eml_issues).toBe(false);
      expect(summary.warning).toBeUndefined();
      expect(summary.not_in_eml).toEqual([]);
    });

    it('should handle null/undefined input', () => {
      const summary = service.buildComplianceSummary(null as any);
      expect(summary.total_drugs_checked).toBe(0);
    });
  });

  describe('getMedicinesByATCCode', () => {
    it('should find medicines by ATC code', () => {
      const results = service.getMedicinesByATCCode('J01CA04');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].inn).toBe('amoxicillin');
    });

    it('should return empty array for unknown ATC code', () => {
      const results = service.getMedicinesByATCCode('Z99ZZ99');
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const r1 = service.getMedicinesByATCCode('j01ca04');
      const r2 = service.getMedicinesByATCCode('J01CA04');
      expect(r1.length).toBe(r2.length);
    });
  });

  describe('getAvailableDrugs', () => {
    it('should return all drug names', () => {
      const drugs = service.getAvailableDrugs();
      expect(drugs.length).toBeGreaterThan(600);
      expect(drugs).toContain('amoxicillin');
      expect(drugs).toContain('paracetamol');
    });
  });
});
