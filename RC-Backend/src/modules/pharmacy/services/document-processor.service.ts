import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as mammoth from 'mammoth';
import * as sharp from 'sharp';

/**
 * Supported document types
 */
export enum DocumentType {
  PDF = 'PDF',
  JPEG = 'JPEG',
  PNG = 'PNG',
  WEBP = 'WEBP',
  GIF = 'GIF',
  DOCX = 'DOCX',
  DOC = 'DOC',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Document processing result
 */
export interface ProcessedDocument {
  success: boolean;
  originalType: DocumentType;
  processedBuffer: Buffer;
  processedMimeType: string;
  extractedText: string | null;
  metadata: {
    pageCount?: number;
    width?: number;
    height?: number;
    wordCount?: number;
  };
  error?: string;
}

/**
 * MIME type mappings
 */
const MIME_TO_TYPE: Record<string, DocumentType> = {
  'application/pdf': DocumentType.PDF,
  'image/jpeg': DocumentType.JPEG,
  'image/jpg': DocumentType.JPEG,
  'image/png': DocumentType.PNG,
  'image/webp': DocumentType.WEBP,
  'image/gif': DocumentType.GIF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocumentType.DOCX,
  'application/msword': DocumentType.DOC,
};

/**
 * Allowed MIME types for prescription upload
 */
export const ALLOWED_PRESCRIPTION_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });
  }

  /**
   * Get document type from MIME type
   */
  getDocumentType(mimetype: string): DocumentType {
    return MIME_TO_TYPE[mimetype] || DocumentType.UNKNOWN;
  }

  /**
   * Check if document type is supported
   */
  isSupportedType(mimetype: string): boolean {
    return ALLOWED_PRESCRIPTION_MIMES.includes(mimetype);
  }

  /**
   * Process any supported document for OCR
   * - Converts DOCX/DOC to text
   * - Extracts text from PDF as fallback
   * - Returns original for images
   */
  async processDocument(
    buffer: Buffer,
    mimetype: string,
    filename: string,
  ): Promise<ProcessedDocument> {
    const docType = this.getDocumentType(mimetype);
    this.logger.log(`Processing document: ${filename} (${docType})`);

    try {
      switch (docType) {
        case DocumentType.DOCX:
          return await this.processDocx(buffer, filename);

        case DocumentType.DOC:
          return await this.processDoc(buffer, filename);

        case DocumentType.PDF:
          return await this.processPdf(buffer, filename);

        case DocumentType.JPEG:
        case DocumentType.PNG:
        case DocumentType.WEBP:
        case DocumentType.GIF:
          return await this.processImage(buffer, mimetype, filename);

        default:
          throw new BadRequestException(`Unsupported document type: ${mimetype}`);
      }
    } catch (error) {
      this.logger.error(`Document processing failed: ${error.message}`);
      return {
        success: false,
        originalType: docType,
        processedBuffer: buffer,
        processedMimeType: mimetype,
        extractedText: null,
        metadata: {},
        error: error.message,
      };
    }
  }

  /**
   * Process DOCX document
   */
  private async processDocx(buffer: Buffer, filename: string): Promise<ProcessedDocument> {
    this.logger.log(`Processing DOCX: ${filename}`);

    try {
      // Extract text and HTML from DOCX
      const result = await mammoth.extractRawText({ buffer });
      const htmlResult = await mammoth.convertToHtml({ buffer });

      const text = result.value;
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

      this.logger.log(`DOCX extracted: ${wordCount} words`);

      // For DOCX, we return the original buffer but include extracted text
      // AWS Textract doesn't support DOCX, so we'll use our extracted text
      return {
        success: true,
        originalType: DocumentType.DOCX,
        processedBuffer: buffer,
        processedMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extractedText: text,
        metadata: {
          wordCount,
        },
      };
    } catch (error) {
      this.logger.error(`DOCX processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process DOC document (older Word format)
   */
  private async processDoc(buffer: Buffer, filename: string): Promise<ProcessedDocument> {
    this.logger.log(`Processing DOC: ${filename}`);

    // mammoth doesn't support old .doc format well
    // For now, return error suggesting DOCX
    throw new BadRequestException(
      'Old .doc format is not fully supported. Please convert to .docx or PDF.',
    );
  }

  /**
   * Process PDF document using pdfjs-dist for text extraction
   */
  private async processPdf(buffer: Buffer, filename: string): Promise<ProcessedDocument> {
    this.logger.log(`Processing PDF: ${filename}`);

    let extractedText: string | null = null;
    let pageCount = 1;

    try {
      // Use dynamic import for pdfjs-dist ESM module
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

      const data = new Uint8Array(buffer);
      const doc = await pdfjsLib.getDocument({ data }).promise;
      pageCount = doc.numPages;

      let fullText = '';
      for (let i = 1; i <= pageCount; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      extractedText = fullText.trim();
      this.logger.log(`PDF extracted: ${pageCount} pages, ${extractedText?.length || 0} chars`);

      // Log a snippet for debugging
      if (extractedText) {
        const snippet = extractedText.substring(0, 500);
        this.logger.log(`PDF text snippet: ${snippet}...`);
      }
    } catch (error) {
      this.logger.warn(`PDF text extraction failed: ${error.message}`);
      // Continue without extracted text - Textract will still try
    }

    return {
      success: true,
      originalType: DocumentType.PDF,
      processedBuffer: buffer,
      processedMimeType: 'application/pdf',
      extractedText,
      metadata: {
        pageCount,
        wordCount: extractedText ? extractedText.split(/\s+/).filter((w) => w.length > 0).length : 0,
      },
    };
  }

  /**
   * Process image (JPEG/PNG/WebP/GIF)
   */
  private async processImage(
    buffer: Buffer,
    mimetype: string,
    filename: string,
  ): Promise<ProcessedDocument> {
    this.logger.log(`Processing image: ${filename}`);

    // Determine document type from mimetype
    const getDocType = (mime: string): DocumentType => {
      if (mime.includes('png')) return DocumentType.PNG;
      if (mime.includes('webp')) return DocumentType.WEBP;
      if (mime.includes('gif')) return DocumentType.GIF;
      return DocumentType.JPEG;
    };

    try {
      // Get image metadata using sharp
      const metadata = await sharp(buffer).metadata();

      this.logger.log(`Image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      return {
        success: true,
        originalType: getDocType(mimetype),
        processedBuffer: buffer,
        processedMimeType: mimetype,
        extractedText: null, // Images need OCR
        metadata: {
          width: metadata.width,
          height: metadata.height,
        },
      };
    } catch (error) {
      this.logger.warn(`Image metadata extraction failed: ${error.message}`);
      return {
        success: true,
        originalType: getDocType(mimetype),
        processedBuffer: buffer,
        processedMimeType: mimetype,
        extractedText: null,
        metadata: {},
      };
    }
  }

  /**
   * Get document from S3
   */
  async getDocumentFromS3(bucket: string, key: string): Promise<Buffer> {
    const response = await this.s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();

    return response.Body as Buffer;
  }

  /**
   * Enhanced text extraction - combines Textract output with direct extraction
   */
  combineTextExtractions(
    textractText: string | null,
    directText: string | null,
  ): string {
    if (!textractText && !directText) {
      return '';
    }

    if (!textractText) {
      return directText || '';
    }

    if (!directText) {
      return textractText;
    }

    // If both available, prefer Textract but supplement with direct extraction
    // if Textract seems incomplete
    const textractLength = textractText.length;
    const directLength = directText.length;

    // If direct extraction found significantly more text, it might have
    // captured content that Textract missed (like tables)
    if (directLength > textractLength * 1.5) {
      this.logger.log('Direct extraction found more content, using combined approach');
      return `${textractText}\n\n--- Additional extracted content ---\n${directText}`;
    }

    return textractText;
  }

  /**
   * Parse medications from raw text using multiple strategies
   */
  extractMedicationsFromText(text: string): Array<{
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

    this.logger.log(`Extracting medications from ${text.length} chars of text`);

    // Strategy 1: Look for structured medication format (multi-line)
    // Pattern: Drug Name followed by Strength, Quantity, Directions
    const structuredRegex = /([A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)*)\s*[\n\r]+(?:.*?Manufacturer[:\s]*[^\n]*[\n\r]+)?.*?Strength[:\s]*(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|units?))\s*.*?(?:Form[:\s]*\w+\s*.*?)?(?:Route[:\s]*\w+\s*.*?)?Quantity[:\s]*(\d+\s*\w*)\s*.*?(?:Refills?[:\s]*\d+\s*.*?)?Directions?[:\s]*([^\n]+)/gis;

    let match;
    while ((match = structuredRegex.exec(text)) !== null) {
      const name = match[1]?.trim();
      if (name && !this.isFormFieldWord(name)) {
        medications.push({
          name,
          dosage: match[2]?.trim() || '',
          quantity: match[3]?.trim() || '',
          instructions: match[4]?.trim() || '',
          confidence: 95,
        });
      }
    }

    // Strategy 2: Look for inline format from PDF text extraction
    // Format: "PRESCRIBED MEDICATION DrugName ... Strength: Xmg ... Quantity: X tablets ... Directions: ..."
    if (medications.length === 0) {
      const inlineRegex =
        /(?:PRESCRIBED\s+MEDICATION|MEDICATION)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:.*?)?Strength[:\s]+(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu))\s+(?:.*?)?(?:Quantity[:\s]+(\d+\s*\w+))?\s*(?:.*?)?(?:Directions?[:\s]+([^.]+(?:\.[^A-Z]+)?))?/gi;

      while ((match = inlineRegex.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (name && !this.isFormFieldWord(name) && !this.isDuplicate(medications, name)) {
          medications.push({
            name,
            dosage: match[2]?.trim() || '',
            quantity: match[3]?.trim() || '',
            instructions: match[4]?.trim() || '',
            confidence: 95,
          });
          this.logger.log(`Found medication (inline): ${name}, ${match[2]?.trim()}`);
        }
      }
    }

    // Strategy 3: Look for common medication patterns
    // Pattern: Tab./Cap./etc. DrugName Dose
    const commonPatterns = [
      /(?:Tab(?:let)?\.?|Cap(?:sule)?\.?|Syrup|Inj(?:ection)?\.?|Cream|Ointment|Drops?)\s+([A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu))/gi,
      /(?:^|\n)\s*\d+[.)\]]\s*([A-Za-z][a-zA-Z]+(?:\s+[A-Za-z][a-zA-Z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|ml))\s*[-–]?\s*([^\n]*)/gim,
    ];

    if (medications.length === 0) {
      for (const pattern of commonPatterns) {
        while ((match = pattern.exec(text)) !== null) {
          const name = match[1]?.trim();
          if (name && !this.isFormFieldWord(name) && !this.isDuplicate(medications, name)) {
            medications.push({
              name,
              dosage: match[2]?.trim() || '',
              quantity: '',
              instructions: match[3]?.trim() || '',
              confidence: 80,
            });
          }
        }
      }
    }

    // Strategy 4: Look in MEDICATION/PRESCRIBED section for drug name near Strength field
    if (medications.length === 0) {
      const medicationSectionMatch = text.match(
        /(?:MEDICATIONS?|PRESCRIBED\s+(?:DRUGS?|MEDICATIONS?)|Rx|TREATMENT)[:\s]*([\s\S]*?)(?:SIGNATURE|INSTRUCTIONS|NOTES|DIGITAL\s+VERIFICATION|SHA|$)/i,
      );

      if (medicationSectionMatch) {
        const section = medicationSectionMatch[1];
        this.logger.log(`Found medication section: ${section.substring(0, 200)}...`);

        // Look for drug name followed by strength pattern (handles space-separated format)
        // e.g., "Warfarin Sodium  Manufacturer: Pfizer Inc.  Strength:   5mg"
        const drugPattern =
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:Manufacturer[:\s]*[^S]*)?Strength[:\s]*(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu))/gi;

        while ((match = drugPattern.exec(section)) !== null) {
          const name = match[1]?.trim();
          if (name && !this.isFormFieldWord(name) && !this.isDuplicate(medications, name)) {
            // Try to extract more details from section
            const quantityMatch = section.match(/Quantity[:\s]*(\d+\s*\w+)/i);
            const directionsMatch = section.match(/Directions?[:\s]*([^.]+(?:\.[^A-Z]+)?)/i);

            medications.push({
              name,
              dosage: match[2]?.trim() || '',
              quantity: quantityMatch?.[1]?.trim() || '',
              instructions: directionsMatch?.[1]?.trim() || '',
              confidence: 90,
            });
            this.logger.log(`Found medication (section): ${name}, ${match[2]?.trim()}`);
          }
        }
      }
    }

    // Strategy 5: Simple fallback - look for drug name + mg/ml pattern anywhere
    if (medications.length === 0) {
      // Common drug name patterns with dosage
      const simpleDrugRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:[^0-9]*?)(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg))/gi;

      while ((match = simpleDrugRegex.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (
          name &&
          !this.isFormFieldWord(name) &&
          !this.isDuplicate(medications, name) &&
          name.length > 3 // Filter out very short matches
        ) {
          medications.push({
            name,
            dosage: match[2]?.trim() || '',
            quantity: '',
            instructions: '',
            confidence: 70,
          });
          this.logger.log(`Found medication (fallback): ${name}, ${match[2]?.trim()}`);
        }
      }
    }

    this.logger.log(`Extracted ${medications.length} medications from text`);
    return medications;
  }

  /**
   * Check if word is a form field label (not a medication name)
   */
  private isFormFieldWord(word: string): boolean {
    const formWords = [
      'patient', 'name', 'date', 'birth', 'doctor', 'physician', 'prescriber',
      'clinic', 'hospital', 'address', 'phone', 'email', 'reference', 'valid',
      'status', 'license', 'signature', 'digital', 'verification', 'issued',
    ];
    const lower = word.toLowerCase();
    return formWords.some((fw) => lower.includes(fw));
  }

  /**
   * Check if medication already exists in list
   */
  private isDuplicate(
    medications: Array<{ name: string }>,
    name: string,
  ): boolean {
    return medications.some(
      (m) => m.name.toLowerCase() === name.toLowerCase(),
    );
  }

  /**
   * Parse prescription date from text
   */
  extractPrescriptionDate(text: string): Date | null {
    // Priority 1: Look for "Date Issued" specifically
    const issuedPatterns = [
      /(?:Date\s+Issued|Issued\s+(?:On|Date)|Prescription\s+Date)[:\s]*(\d{1,2}[\s\/\-](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2})[\s\/\-]\d{2,4})/i,
      /(?:Date\s+Issued|Issued\s+(?:On|Date)|Prescription\s+Date)[:\s]*(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/i,
    ];

    for (const pattern of issuedPatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsed = this.parseDate(match[1]);
        if (parsed) {
          this.logger.log(`Found Date Issued: ${match[1]} -> ${parsed.toISOString()}`);
          return parsed;
        }
      }
    }

    // Priority 2: Generic date patterns (excluding DOB)
    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      // Skip lines that look like DOB
      if (lower.includes('birth') || lower.includes('dob')) {
        continue;
      }

      // Check for date on this line
      const dateMatch = line.match(/(\d{1,2}[\s\/\-](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\/\-]\d{2,4})/i);
      if (dateMatch) {
        const parsed = this.parseDate(dateMatch[1]);
        if (parsed) {
          return parsed;
        }
      }
    }

    return null;
  }

  /**
   * Parse date from various string formats
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Clean up the string
    const cleaned = dateStr.trim().replace(/\s+/g, ' ');

    // Month name format: "15 December 2025"
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ];
    const monthAbbr = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ];

    // Pattern: DD Month YYYY
    const monthNameMatch = cleaned.match(/(\d{1,2})\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{2,4})/i);
    if (monthNameMatch) {
      const day = parseInt(monthNameMatch[1], 10);
      const monthStr = monthNameMatch[2].toLowerCase();
      let year = parseInt(monthNameMatch[3], 10);
      if (year < 100) year += 2000;

      const monthIdx = monthNames.findIndex((m) => m.startsWith(monthStr.substring(0, 3)));
      if (monthIdx >= 0) {
        return new Date(year, monthIdx, day);
      }
    }

    // Pattern: DD/MM/YYYY or DD-MM-YYYY
    const numericMatch = cleaned.match(/(\d{1,2})[\s\/\-](\d{1,2})[\s\/\-](\d{2,4})/);
    if (numericMatch) {
      const day = parseInt(numericMatch[1], 10);
      const month = parseInt(numericMatch[2], 10) - 1;
      let year = parseInt(numericMatch[3], 10);
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }

    return null;
  }
}
