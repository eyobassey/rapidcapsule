import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

/**
 * Extracted text block from Textract
 */
export interface TextBlock {
  text: string;
  confidence: number;
  blockType: string;
  geometry?: {
    boundingBox: {
      width: number;
      height: number;
      left: number;
      top: number;
    };
  };
}

/**
 * Key-value pair extracted from form
 */
export interface ExtractedKeyValue {
  key: string;
  value: string;
  confidence: number;
}

/**
 * Extracted prescription data
 */
export interface ExtractedPrescriptionData {
  rawText: string;
  confidence: number;
  doctorName: string | null;
  patientName: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  prescriptionDate: Date | null;
  doctorLicense: string | null;
  validityPeriod: number | null;
  medications: Array<{
    name: string;
    dosage: string;
    quantity: string;
    instructions: string;
    confidence: number;
  }>;
  keyValuePairs: ExtractedKeyValue[];
  tables: string[][];
}

/**
 * OCR processing result
 */
export interface OcrResult {
  success: boolean;
  data: ExtractedPrescriptionData | null;
  error: string | null;
  processingTimeMs: number;
}

@Injectable()
export class TextractService {
  private readonly logger = new Logger(TextractService.name);
  private textract: AWS.Textract;

  constructor() {
    this.textract = new AWS.Textract({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: process.env.AWS_TEXTRACT_REGION || 'us-east-2',
    });
  }

  /**
   * Analyze a document from S3 for text extraction
   */
  async analyzeDocumentFromS3(
    bucket: string,
    key: string,
  ): Promise<OcrResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting Textract analysis for s3://${bucket}/${key}`);

      // Use AnalyzeDocument for form and table extraction
      const response = await this.textract
        .analyzeDocument({
          Document: {
            S3Object: {
              Bucket: bucket,
              Name: key,
            },
          },
          FeatureTypes: ['FORMS', 'TABLES'],
        })
        .promise();

      const extractedData = this.processTextractResponse(response);
      const processingTime = Date.now() - startTime;

      this.logger.log(`Textract analysis completed in ${processingTime}ms`);

      return {
        success: true,
        data: extractedData,
        error: null,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Textract analysis failed: ${error.message}`);

      return {
        success: false,
        data: null,
        error: error.message,
        processingTimeMs: processingTime,
      };
    }
  }

  /**
   * Analyze a document from a buffer (for direct upload)
   */
  async analyzeDocumentFromBuffer(
    buffer: Buffer,
  ): Promise<OcrResult> {
    const startTime = Date.now();

    try {
      this.logger.log('Starting Textract analysis from buffer');

      const response = await this.textract
        .analyzeDocument({
          Document: {
            Bytes: buffer,
          },
          FeatureTypes: ['FORMS', 'TABLES'],
        })
        .promise();

      const extractedData = this.processTextractResponse(response);
      const processingTime = Date.now() - startTime;

      this.logger.log(`Textract analysis completed in ${processingTime}ms`);

      return {
        success: true,
        data: extractedData,
        error: null,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Textract analysis failed: ${error.message}`);

      return {
        success: false,
        data: null,
        error: error.message,
        processingTimeMs: processingTime,
      };
    }
  }

  /**
   * Simple text detection (faster, no form/table extraction)
   */
  async detectText(bucket: string, key: string): Promise<OcrResult> {
    const startTime = Date.now();

    try {
      const response = await this.textract
        .detectDocumentText({
          Document: {
            S3Object: {
              Bucket: bucket,
              Name: key,
            },
          },
        })
        .promise();

      const blocks = response.Blocks || [];
      const lineBlocks = blocks.filter((b) => b.BlockType === 'LINE');
      const rawText = lineBlocks.map((b) => b.Text).join('\n');
      const avgConfidence =
        lineBlocks.length > 0
          ? lineBlocks.reduce((sum, b) => sum + (b.Confidence || 0), 0) /
            lineBlocks.length
          : 0;

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          rawText,
          confidence: avgConfidence,
          doctorName: null,
          patientName: null,
          clinicName: null,
          clinicAddress: null,
          prescriptionDate: null,
          doctorLicense: null,
          validityPeriod: null,
          medications: [],
          keyValuePairs: [],
          tables: [],
        },
        error: null,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        data: null,
        error: error.message,
        processingTimeMs: processingTime,
      };
    }
  }

  /**
   * Process Textract response and extract structured data
   */
  private processTextractResponse(
    response: AWS.Textract.AnalyzeDocumentResponse,
  ): ExtractedPrescriptionData {
    const blocks = response.Blocks || [];

    // Extract raw text from LINE blocks
    const lineBlocks = blocks.filter((b) => b.BlockType === 'LINE');
    const rawText = lineBlocks.map((b) => b.Text).join('\n');
    const avgConfidence =
      lineBlocks.length > 0
        ? lineBlocks.reduce((sum, b) => sum + (b.Confidence || 0), 0) /
          lineBlocks.length
        : 0;

    // Extract key-value pairs from forms
    const keyValuePairs = this.extractKeyValuePairs(blocks);

    // Extract tables
    const tables = this.extractTables(blocks);

    // Parse prescription-specific fields
    const parsedData = this.parsePrescriptionFields(rawText, keyValuePairs);

    // Extract medications from text and tables
    const medications = this.extractMedications(rawText, tables);

    return {
      rawText,
      confidence: avgConfidence,
      ...parsedData,
      medications,
      keyValuePairs,
      tables,
    };
  }

  /**
   * Extract key-value pairs from form blocks
   */
  private extractKeyValuePairs(
    blocks: AWS.Textract.BlockList,
  ): ExtractedKeyValue[] {
    const keyValuePairs: ExtractedKeyValue[] = [];
    const blockMap = new Map<string, AWS.Textract.Block>();

    // Build block map
    blocks.forEach((block) => {
      if (block.Id) {
        blockMap.set(block.Id, block);
      }
    });

    // Find KEY_VALUE_SET blocks
    const keyBlocks = blocks.filter(
      (b) =>
        b.BlockType === 'KEY_VALUE_SET' &&
        b.EntityTypes?.includes('KEY'),
    );

    keyBlocks.forEach((keyBlock) => {
      const keyText = this.getTextFromRelationships(
        keyBlock,
        blockMap,
        'CHILD',
      );
      const valueBlock = this.getValueBlock(keyBlock, blockMap);

      if (valueBlock) {
        const valueText = this.getTextFromRelationships(
          valueBlock,
          blockMap,
          'CHILD',
        );
        const confidence =
          ((keyBlock.Confidence || 0) + (valueBlock.Confidence || 0)) / 2;

        if (keyText) {
          keyValuePairs.push({
            key: keyText.trim(),
            value: valueText?.trim() || '',
            confidence,
          });
        }
      }
    });

    return keyValuePairs;
  }

  /**
   * Get VALUE block associated with a KEY block
   */
  private getValueBlock(
    keyBlock: AWS.Textract.Block,
    blockMap: Map<string, AWS.Textract.Block>,
  ): AWS.Textract.Block | null {
    if (!keyBlock.Relationships) return null;

    const valueRelation = keyBlock.Relationships.find(
      (r) => r.Type === 'VALUE',
    );
    if (!valueRelation || !valueRelation.Ids) return null;

    for (const id of valueRelation.Ids) {
      const block = blockMap.get(id);
      if (block && block.BlockType === 'KEY_VALUE_SET') {
        return block;
      }
    }

    return null;
  }

  /**
   * Get text from child relationships
   */
  private getTextFromRelationships(
    block: AWS.Textract.Block,
    blockMap: Map<string, AWS.Textract.Block>,
    relationshipType: string,
  ): string | null {
    if (!block.Relationships) return null;

    const relationship = block.Relationships.find(
      (r) => r.Type === relationshipType,
    );
    if (!relationship || !relationship.Ids) return null;

    const textParts: string[] = [];
    for (const id of relationship.Ids) {
      const childBlock = blockMap.get(id);
      if (childBlock && childBlock.Text) {
        textParts.push(childBlock.Text);
      }
    }

    return textParts.join(' ');
  }

  /**
   * Extract tables from table blocks
   */
  private extractTables(blocks: AWS.Textract.BlockList): string[][] {
    const tables: string[][] = [];
    const blockMap = new Map<string, AWS.Textract.Block>();

    // Build block map
    blocks.forEach((block) => {
      if (block.Id) {
        blockMap.set(block.Id, block);
      }
    });

    // Find TABLE blocks
    const tableBlocks = blocks.filter((b) => b.BlockType === 'TABLE');

    tableBlocks.forEach((tableBlock) => {
      const table: string[][] = [];
      const cellBlocks: AWS.Textract.Block[] = [];

      // Get all CELL blocks for this table
      if (tableBlock.Relationships) {
        const childRelation = tableBlock.Relationships.find(
          (r) => r.Type === 'CHILD',
        );
        if (childRelation && childRelation.Ids) {
          childRelation.Ids.forEach((id) => {
            const cellBlock = blockMap.get(id);
            if (cellBlock && cellBlock.BlockType === 'CELL') {
              cellBlocks.push(cellBlock);
            }
          });
        }
      }

      // Organize cells into rows
      cellBlocks.sort((a, b) => {
        const rowDiff = (a.RowIndex || 0) - (b.RowIndex || 0);
        if (rowDiff !== 0) return rowDiff;
        return (a.ColumnIndex || 0) - (b.ColumnIndex || 0);
      });

      let currentRow = 0;
      let row: string[] = [];

      cellBlocks.forEach((cell) => {
        if (cell.RowIndex !== currentRow) {
          if (row.length > 0) {
            table.push(row);
          }
          row = [];
          currentRow = cell.RowIndex || 0;
        }

        const cellText = this.getTextFromRelationships(
          cell,
          blockMap,
          'CHILD',
        );
        row.push(cellText || '');
      });

      if (row.length > 0) {
        table.push(row);
      }

      if (table.length > 0) {
        tables.push(...table);
      }
    });

    return tables;
  }

  /**
   * Parse prescription-specific fields from text and key-value pairs
   */
  private parsePrescriptionFields(
    rawText: string,
    keyValuePairs: ExtractedKeyValue[],
  ): {
    doctorName: string | null;
    patientName: string | null;
    clinicName: string | null;
    clinicAddress: string | null;
    prescriptionDate: Date | null;
    doctorLicense: string | null;
    validityPeriod: number | null;
  } {
    const result = {
      doctorName: null as string | null,
      patientName: null as string | null,
      clinicName: null as string | null,
      clinicAddress: null as string | null,
      prescriptionDate: null as Date | null,
      doctorLicense: null as string | null,
      validityPeriod: null as number | null,
    };

    // Try to extract from key-value pairs first
    for (const kv of keyValuePairs) {
      const keyLower = kv.key.toLowerCase();

      if (
        keyLower.includes('doctor') ||
        keyLower.includes('physician') ||
        keyLower.includes('dr.')
      ) {
        result.doctorName = kv.value;
      } else if (
        keyLower.includes('patient') ||
        keyLower.includes('name')
      ) {
        if (!keyLower.includes('doctor')) {
          result.patientName = kv.value;
        }
      } else if (keyLower.includes('clinic') || keyLower.includes('hospital')) {
        result.clinicName = kv.value;
      } else if (keyLower.includes('address')) {
        result.clinicAddress = kv.value;
      } else if (
        keyLower.includes('date issued') ||
        keyLower.includes('issued date') ||
        keyLower.includes('prescription date')
      ) {
        // Prioritize explicit "Date Issued" fields
        const parsedDate = this.parseDate(kv.value);
        if (parsedDate) {
          result.prescriptionDate = parsedDate;
        }
      } else if (
        (keyLower.includes('date') || keyLower.includes('issued')) &&
        !keyLower.includes('birth') &&
        !keyLower.includes('dob') &&
        !keyLower.includes('valid') &&
        !result.prescriptionDate // Don't overwrite if already set by "Date Issued"
      ) {
        // Fallback: generic date fields but exclude DOB and validity dates
        const parsedDate = this.parseDate(kv.value);
        if (parsedDate) {
          result.prescriptionDate = parsedDate;
        }
      } else if (
        keyLower.includes('license') ||
        keyLower.includes('reg') ||
        keyLower.includes('mdcn')
      ) {
        result.doctorLicense = kv.value;
      } else if (keyLower.includes('valid')) {
        const days = parseInt(kv.value.replace(/\D/g, ''), 10);
        if (!isNaN(days)) {
          result.validityPeriod = days;
        }
      }
    }

    // Fallback: Try to extract from raw text using patterns
    if (!result.doctorName) {
      const drMatch = rawText.match(/(?:Dr\.?|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
      if (drMatch) {
        result.doctorName = drMatch[1];
      }
    }

    if (!result.prescriptionDate) {
      // Try common date formats
      const datePatterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
        /(\d{1,2})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/i,
      ];

      for (const pattern of datePatterns) {
        const match = rawText.match(pattern);
        if (match) {
          const parsedDate = this.parseDate(match[0]);
          if (parsedDate) {
            result.prescriptionDate = parsedDate;
            break;
          }
        }
      }
    }

    if (!result.doctorLicense) {
      // Look for license number patterns (e.g., MDCN/2010/12345)
      const licenseMatch = rawText.match(
        /(?:MDCN|License|Reg\.?\s*No\.?)[:\s]*([A-Z0-9\/\-]+)/i,
      );
      if (licenseMatch) {
        result.doctorLicense = licenseMatch[1];
      }
    }

    return result;
  }

  /**
   * Extract medications from text and tables
   */
  private extractMedications(
    rawText: string,
    tables: string[][],
  ): Array<{
    name: string;
    dosage: string;
    quantity: string;
    instructions: string;
    confidence: number;
  }> {
    const medications: Array<{
      name: string;
      dosage: string;
      quantity: string;
      instructions: string;
      confidence: number;
    }> = [];

    // Keywords that indicate a row is a form field, NOT a medication
    const formFieldKeywords = [
      'patient', 'name:', 'date', 'birth', 'email', 'address', 'phone',
      'doctor', 'physician', 'prescriber', 'clinic', 'hospital',
      'reference', 'valid', 'status', 'id:', 'gmc', 'license',
      'prescription reference', 'valid until', 'date issued',
    ];

    // Common medication names/prefixes to help identify real medications
    const medicationIndicators = [
      'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment',
      'mg', 'ml', 'mcg', 'iu', 'g ', 'dose', 'refill', 'quantity',
      'directions', 'take ', 'apply ', 'daily', 'twice', 'once',
    ];

    // Helper function to check if a row looks like a form field
    const isFormField = (row: string[]): boolean => {
      const rowText = row.join(' ').toLowerCase();
      return formFieldKeywords.some(keyword => rowText.includes(keyword));
    };

    // Helper function to check if a row looks like a medication
    const isMedicationRow = (row: string[]): boolean => {
      const rowText = row.join(' ').toLowerCase();
      return medicationIndicators.some(indicator => rowText.includes(indicator));
    };

    // Try to extract from tables - but filter out form fields
    if (tables.length > 0) {
      // Skip header row if detected
      const startRow = this.isHeaderRow(tables[0]) ? 1 : 0;

      for (let i = startRow; i < tables.length; i++) {
        const row = tables[i];
        if (row && row.length >= 2) {
          // Skip rows that look like form fields (Patient Name:, Date of Birth:, etc.)
          if (isFormField(row)) {
            continue;
          }

          // Only include if it looks like a medication row
          if (isMedicationRow(row)) {
            medications.push({
              name: row[0] || '',
              dosage: row[1] || '',
              quantity: row[2] || '',
              instructions: row.slice(3).join(' ') || '',
              confidence: 80,
            });
          }
        }
      }
    }

    // Pattern matching on raw text for medications
    // Common prescription patterns
    const rxPatterns = [
      // Pattern: "Warfarin Sodium" followed by dosage info
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:Manufacturer[:\s]+[^\n]+)?\s*Strength[:\s]*(\d+(?:\.\d+)?(?:mg|g|ml|mcg|iu))\s*Form[:\s]*(\w+)\s*(?:Route[:\s]*\w+)?\s*Quantity[:\s]*(\d+\s*\w*)\s*(?:Refills[:\s]*\d+)?\s*Directions[:\s]*([^\n]+)/gi,
      // Pattern: "Tab. Paracetamol 500mg - Take 1..."
      /(?:Tab\.?|Cap\.?|Syp\.?|Inj\.?|Cream|Ointment)?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+(?:\.\d+)?(?:mg|g|ml|mcg|iu))\s*[-–]\s*([^,\n]+)/gi,
      // Pattern: numbered list "1. Amoxicillin 500mg..."
      /(\d+)\.\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+(?:\.\d+)?(?:mg|g|ml))\s*([^,\n]+)?/gi,
      // Pattern: Drug name with strength inline "Warfarin Sodium 5mg"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu))\b/gi,
    ];

    // First, try the structured format (like sample prescription with Strength/Quantity/Directions)
    // More flexible regex that handles various OCR outputs
    const structuredPatterns = [
      // Pattern 1: Drug name followed by Strength, Form, Quantity, Directions
      /([A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)*)\s*(?:Manufacturer[:\s]*[^\n]*[\r\n]+)?.*?Strength[:\s]*(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu)).*?(?:Form[:\s]*\w+.*?)?Quantity[:\s]*(\d+\s*\w*).*?Directions[:\s]*([^\n]+)/gis,
      // Pattern 2: Just drug name with strength inline and directions
      /(?:^|\n)([A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)*)\s+(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu)).*?(?:Quantity[:\s]*(\d+\s*\w*))?.*?(?:Directions?|Take|Apply)[:\s]*([^\n]+)/gim,
    ];

    for (const pattern of structuredPatterns) {
      let match;
      while ((match = pattern.exec(rawText)) !== null) {
        const drugName = match[1]?.trim();

        // Skip if it looks like a form field
        if (!drugName || formFieldKeywords.some(kw => drugName.toLowerCase().includes(kw))) {
          continue;
        }

        // Skip if already added
        const exists = medications.some(
          (m) => m.name.toLowerCase() === drugName.toLowerCase(),
        );

        if (!exists && drugName.length > 2) {
          medications.push({
            name: drugName,
            dosage: (match[2] || '').trim(),
            quantity: (match[3] || '').trim(),
            instructions: (match[4] || '').trim(),
            confidence: 90,
          });
        }
      }
    }

    // Also look for medication sections with clear labels
    const medicationSectionMatch = rawText.match(/(?:MEDICATIONS?|PRESCRIBED\s+DRUGS?|Rx)[:\s]*([\s\S]*?)(?:SIGNATURE|DOCTOR|PRESCRIBER|SHA256|$)/i);
    if (medicationSectionMatch && medications.length === 0) {
      const medSection = medicationSectionMatch[1];
      // Try to find drug name with strength in the medication section
      const drugWithStrength = medSection.match(/([A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)*)\s*[\n\r].*?Strength[:\s]*(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu))/i);
      if (drugWithStrength) {
        const drugName = drugWithStrength[1].trim();
        if (!formFieldKeywords.some(kw => drugName.toLowerCase().includes(kw))) {
          // Extract other details from the section
          const quantityMatch = medSection.match(/Quantity[:\s]*(\d+\s*\w*)/i);
          const directionsMatch = medSection.match(/Directions?[:\s]*([^\n]+)/i);

          medications.push({
            name: drugName,
            dosage: drugWithStrength[2].trim(),
            quantity: quantityMatch ? quantityMatch[1].trim() : '',
            instructions: directionsMatch ? directionsMatch[1].trim() : '',
            confidence: 85,
          });
        }
      }
    }

    // If no structured match, try other patterns
    if (medications.length === 0) {
      for (const pattern of rxPatterns) {
        let match;
        while ((match = pattern.exec(rawText)) !== null) {
          const drugName = match[1] || match[2];

          // Skip if it's a form field word
          if (formFieldKeywords.some(kw => drugName.toLowerCase().includes(kw))) {
            continue;
          }

          // Avoid duplicates
          const exists = medications.some(
            (m) => m.name.toLowerCase() === drugName.toLowerCase(),
          );

          if (!exists && drugName.length > 2) {
            medications.push({
              name: drugName.trim(),
              dosage: (match[2] || match[3] || '').trim(),
              quantity: '',
              instructions: (match[3] || match[4] || '').trim(),
              confidence: 70,
            });
          }
        }
      }
    }

    return medications;
  }

  /**
   * Check if a row is likely a header row
   */
  private isHeaderRow(row: string[] | undefined): boolean {
    if (!row) return false;

    const headerKeywords = [
      'drug',
      'medication',
      'medicine',
      'name',
      'dosage',
      'dose',
      'quantity',
      'qty',
      'instructions',
      'directions',
    ];

    return row.some((cell) =>
      headerKeywords.some((keyword) =>
        cell.toLowerCase().includes(keyword),
      ),
    );
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Try various date formats
    const formats = [
      // DD/MM/YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // DD/MM/YY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
      // YYYY-MM-DD (ISO)
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year = parseInt(match[3], 10);
        let month = parseInt(match[2], 10) - 1;
        let day = parseInt(match[1], 10);

        // Handle ISO format (YYYY-MM-DD)
        if (match[1].length === 4) {
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1;
          day = parseInt(match[3], 10);
        }

        // Handle 2-digit year
        if (year < 100) {
          year += year > 50 ? 1900 : 2000;
        }

        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try parsing month names
    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ];

    const monthMatch = dateString.match(
      /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{2,4})/i,
    );

    if (monthMatch) {
      const day = parseInt(monthMatch[1], 10);
      const month = monthNames.indexOf(monthMatch[2].toLowerCase());
      let year = parseInt(monthMatch[3], 10);

      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  /**
   * Calculate overall OCR quality score
   */
  calculateOcrQualityScore(result: OcrResult): number {
    if (!result.success || !result.data) {
      return 0;
    }

    let score = 0;
    const data = result.data;

    // Base confidence score (0-40 points)
    score += (data.confidence / 100) * 40;

    // Field extraction scoring (0-30 points)
    if (data.doctorName) score += 5;
    if (data.patientName) score += 5;
    if (data.prescriptionDate) score += 5;
    if (data.doctorLicense) score += 5;
    if (data.medications.length > 0) score += 10;

    // Text quality scoring (0-30 points)
    const textLength = data.rawText.length;
    if (textLength > 100) score += 10;
    if (textLength > 300) score += 10;
    if (textLength > 500) score += 10;

    return Math.min(100, score);
  }
}
