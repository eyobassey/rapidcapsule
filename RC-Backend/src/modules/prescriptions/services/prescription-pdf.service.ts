import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import { FileUploadHelper } from '../../../common/helpers/file-upload.helpers';

export interface PdfPrescriptionData {
  prescription_number: string;
  created_at: Date;
  expires_at?: Date;
  valid_until?: Date;
  status: string;
  patient: {
    full_name: string;
    date_of_birth?: string;
    patient_id: string;
    email?: string;
    phone?: string;
  };
  prescriber: {
    full_name: string;
    license_number?: string;
    specialization?: string;
    facility?: string;
    location?: string;
  };
  items: Array<{
    drug_name: string;
    generic_name?: string;
    strength?: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
  notes?: string;
}

@Injectable()
export class PrescriptionPdfService {
  private readonly logger = new Logger(PrescriptionPdfService.name);
  private logoBase64: string | null = null;

  constructor(private readonly fileUploadHelper: FileUploadHelper) {
    this.loadLogo();
  }

  /**
   * Load logo from file and convert to base64
   */
  private loadLogo(): void {
    try {
      // Try multiple possible locations for the logo
      const possiblePaths = [
        path.join(process.cwd(), 'RapidCapsule_Logo.png'),
        path.join(__dirname, '../../../../RapidCapsule_Logo.png'),
        path.join(__dirname, '../../../../../RapidCapsule_Logo.png'),
      ];

      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          this.logoBase64 = fs.readFileSync(logoPath).toString('base64');
          this.logger.log(`Logo loaded successfully from: ${logoPath}`);
          return;
        }
      }

      this.logger.warn('Logo file not found in any expected location');
    } catch (e) {
      this.logger.error('Failed to load logo file', e);
    }
  }

  /**
   * Get logo as base64, loading it if not already loaded
   */
  private getLogoBase64(): string {
    if (!this.logoBase64) {
      this.loadLogo();
    }
    return this.logoBase64 || '';
  }

  /**
   * Generate prescription PDF and upload to S3
   */
  async generateAndUploadPdf(data: PdfPrescriptionData): Promise<{
    pdf_url: string;
    pdf_hash: string;
    pdf_buffer: Buffer;
  }> {
    try {
      // Generate PDF buffer
      const pdfBuffer = await this.generatePdfBuffer(data);

      // Calculate hash for verification
      const pdfHash = this.generateHash(pdfBuffer, data);

      // Upload to S3
      const fileName = `prescriptions/${data.prescription_number}_${Date.now()}.pdf`;
      const pdfUrl = await this.fileUploadHelper.uploadToS3(
        pdfBuffer,
        fileName,
      );

      return {
        pdf_url: pdfUrl,
        pdf_hash: pdfHash,
        pdf_buffer: pdfBuffer,
      };
    } catch (error) {
      this.logger.error('Failed to generate prescription PDF', error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for downloading the PDF
   */
  async getPresignedPdfUrl(pdfUrl: string, expiresIn: number = 86400): Promise<string> {
    return this.fileUploadHelper.getPresignedUrl(pdfUrl, expiresIn);
  }

  /**
   * Generate PDF buffer from prescription data
   */
  async generatePdfBuffer(data: PdfPrescriptionData): Promise<Buffer> {
    const html = await this.generateHtml(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate hash for prescription verification
   */
  private generateHash(pdfBuffer: Buffer, data: PdfPrescriptionData): string {
    const hashData = `${data.prescription_number}|${data.patient.patient_id}|${data.created_at}|${data.total_amount}`;
    return crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 32);
  }

  /**
   * Generate hash from prescription data for validation
   */
  generateValidationHash(
    prescriptionNumber: string,
    patientId: string,
    createdAt: Date,
    totalAmount: number,
  ): string {
    const hashData = `${prescriptionNumber}|${patientId}|${createdAt}|${totalAmount}`;
    return crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 32);
  }

  /**
   * Generate QR code as base64 data URL
   */
  private async generateQrCode(data: PdfPrescriptionData, hash: string): Promise<string> {
    // Use just the verification URL for easier scanning
    const qrData = `https://rapidcapsule.com/verify/${data.prescription_number}?h=${hash}`;

    return QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'H', // Highest error correction for better scanning
      color: {
        dark: '#000000', // Black for maximum contrast
        light: '#ffffff',
      },
    });
  }

  /**
   * Generate HTML template for the prescription PDF
   */
  private async generateHtml(data: PdfPrescriptionData): Promise<string> {
    const hash = this.generateHash(Buffer.from(''), data);
    const qrCodeDataUrl = await this.generateQrCode(data, hash);

    const createdDate = moment(data.created_at).format('DD MMM YYYY');
    const createdTime = moment(data.created_at).format('h:mm A');
    const validUntil = data.valid_until
      ? moment(data.valid_until).format('DD MMM YYYY')
      : moment(data.created_at).add(28, 'days').format('DD MMM YYYY');

    const statusColors: Record<string, { bg: string; text: string }> = {
      pending_acceptance: { bg: '#fff3e0', text: '#e65100' },
      accepted: { bg: '#e8f5e9', text: '#2e7d32' },
      pending_payment: { bg: '#e3f2fd', text: '#1565c0' },
      paid: { bg: '#e8f5e9', text: '#2e7d32' },
      processing: { bg: '#fff9c4', text: '#f57f17' },
      dispensed: { bg: '#e0f2f1', text: '#00695c' },
      shipped: { bg: '#fff3e0', text: '#e65100' },
      delivered: { bg: '#e8f5e9', text: '#2e7d32' },
      cancelled: { bg: '#ffebee', text: '#c62828' },
      expired: { bg: '#eceff1', text: '#546e7a' },
    };

    const statusStyle = statusColors[data.status.toLowerCase()] || statusColors.pending_acceptance;
    const statusDisplay = data.status.replace(/_/g, ' ').toUpperCase();

    const itemsHtml = data.items
      .map(
        (item, index) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">${index + 1}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0;">
          <strong style="color: #1a237e; font-size: 13px;">${item.drug_name}</strong>
          ${item.generic_name ? `<br><span style="color: #78909c; font-size: 11px;">${item.generic_name}</span>` : ''}
          ${item.strength ? `<br><span style="color: #78909c; font-size: 11px;">${item.strength}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; font-size: 12px;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">
          <strong>${item.dosage}</strong><br>
          <span style="color: #546e7a; font-size: 11px;">${item.frequency}</span><br>
          <span style="color: #78909c; font-size: 11px;">Duration: ${item.duration}</span>
          ${item.instructions ? `<br><span style="color: #1565c0; font-size: 10px; font-style: italic;">${item.instructions}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 12px;">${data.currency} ${item.unit_price.toLocaleString()}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600; font-size: 12px;">${data.currency} ${item.total_price.toLocaleString()}</td>
      </tr>
    `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      background: #fff;
    }
    .container {
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #1a73e8;
      margin-bottom: 20px;
    }
    .logo-section {
      display: flex;
      align-items: center;
    }
    .logo {
      width: 60px;
      height: auto;
      margin-right: 15px;
    }
    .logo img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }
    .logo-fallback {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #1a73e8;
    }
    .company-tagline {
      font-size: 12px;
      color: #546e7a;
    }
    .company-contact {
      text-align: right;
      font-size: 11px;
      color: #78909c;
    }
    .company-contact a {
      color: #1a73e8;
      text-decoration: none;
    }
    .title-section {
      text-align: center;
      margin: 25px 0;
      padding: 15px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 8px;
    }
    .title-section h1 {
      font-size: 22px;
      color: #1565c0;
      margin-bottom: 5px;
      letter-spacing: 2px;
    }
    .title-section p {
      font-size: 11px;
      color: #1976d2;
    }
    .reference-section {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
      padding: 15px;
      background: #f5f7fa;
      border-radius: 8px;
    }
    .reference-item {
      text-align: center;
    }
    .reference-label {
      font-size: 10px;
      color: #78909c;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .reference-value {
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      background: ${statusStyle.bg};
      color: ${statusStyle.text};
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 25px 0;
    }
    .info-card {
      padding: 15px;
      background: #fafafa;
      border-radius: 8px;
      border-left: 4px solid #1a73e8;
    }
    .info-card h3 {
      font-size: 12px;
      color: #1a73e8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-card p {
      margin: 5px 0;
      font-size: 12px;
      color: #546e7a;
    }
    .info-card p strong {
      color: #2c3e50;
    }
    .medications-section {
      margin: 25px 0;
    }
    .medications-section h2 {
      font-size: 14px;
      color: #1a73e8;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    .medications-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .medications-table th {
      background: #1a73e8;
      color: white;
      padding: 12px 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .medications-table th:first-child {
      border-radius: 6px 0 0 0;
    }
    .medications-table th:last-child {
      border-radius: 0 6px 0 0;
    }
    .totals-section {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 250px;
      padding: 15px;
      background: #f5f7fa;
      border-radius: 8px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #546e7a;
    }
    .totals-row.total {
      border-top: 2px solid #1a73e8;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #1a73e8;
    }
    .notes-section {
      margin: 25px 0;
      padding: 15px;
      background: #fff9e6;
      border-left: 4px solid #ffc107;
      border-radius: 8px;
    }
    .notes-section h3 {
      font-size: 12px;
      color: #f57c00;
      margin-bottom: 8px;
    }
    .notes-section p {
      font-size: 12px;
      color: #546e7a;
      white-space: pre-wrap;
    }
    .verification-section {
      margin-top: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #eceff1 100%);
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .verification-info {
      flex: 1;
    }
    .verification-info h3 {
      font-size: 12px;
      color: #546e7a;
      margin-bottom: 10px;
    }
    .verification-info p {
      font-size: 10px;
      color: #78909c;
      margin: 4px 0;
    }
    .verification-info .hash {
      font-family: monospace;
      font-size: 10px;
      color: #1a73e8;
      word-break: break-all;
    }
    .qr-code {
      margin-left: 20px;
    }
    .qr-code img {
      width: 130px;
      height: 130px;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 4px;
      background: white;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 10px;
      color: #78909c;
    }
    .footer p {
      margin: 3px 0;
    }
    .footer a {
      color: #1a73e8;
      text-decoration: none;
    }
    .disclaimer {
      margin-top: 15px;
      padding: 10px;
      background: #ffebee;
      border-radius: 6px;
      font-size: 9px;
      color: #c62828;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">
          ${this.getLogoBase64()
            ? `<img src="data:image/png;base64,${this.getLogoBase64()}" alt="Rapid Capsules Logo" />`
            : '<div class="logo-fallback">RC</div>'
          }
        </div>
        <div>
          <div class="company-name">RAPID CAPSULES</div>
          <div class="company-tagline">Digital Healthcare Platform</div>
        </div>
      </div>
      <div class="company-contact">
        <p><a href="https://rapidcapsule.com">www.rapidcapsule.com</a></p>
        <p>support@rapidcapsule.com</p>
        <p>Lagos, Nigeria</p>
      </div>
    </div>

    <div class="title-section">
      <h1>ELECTRONIC PRESCRIPTION</h1>
      <p>This is a digitally generated prescription document</p>
    </div>

    <div class="reference-section">
      <div class="reference-item">
        <div class="reference-label">Prescription Reference</div>
        <div class="reference-value">${data.prescription_number}</div>
      </div>
      <div class="reference-item">
        <div class="reference-label">Date Issued</div>
        <div class="reference-value">${createdDate} at ${createdTime}</div>
      </div>
      <div class="reference-item">
        <div class="reference-label">Valid Until</div>
        <div class="reference-value">${validUntil}</div>
      </div>
      <div class="reference-item">
        <div class="reference-label">Status</div>
        <div class="reference-value"><span class="status-badge">${statusDisplay}</span></div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>Patient Information</h3>
        <p><strong>${data.patient.full_name}</strong></p>
        ${data.patient.date_of_birth ? `<p>DOB: ${data.patient.date_of_birth}</p>` : ''}
        <p>ID: ${data.patient.patient_id}</p>
        ${data.patient.email ? `<p>Email: ${data.patient.email}</p>` : ''}
        ${data.patient.phone ? `<p>Phone: ${data.patient.phone}</p>` : ''}
      </div>
      <div class="info-card">
        <h3>Prescriber Information</h3>
        <p><strong>${data.prescriber.full_name}</strong></p>
        ${data.prescriber.license_number ? `<p>License: ${data.prescriber.license_number}</p>` : ''}
        ${data.prescriber.specialization ? `<p>Specialization: ${data.prescriber.specialization}</p>` : ''}
        ${data.prescriber.facility ? `<p>${data.prescriber.facility}</p>` : ''}
        ${data.prescriber.location ? `<p>${data.prescriber.location}</p>` : ''}
      </div>
    </div>

    <div class="medications-section">
      <h2>Prescribed Medications</h2>
      <table class="medications-table">
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th style="width: 180px;">Medication</th>
            <th style="width: 50px; text-align: center;">Qty</th>
            <th>Dosage & Instructions</th>
            <th style="width: 80px; text-align: right;">Unit Price</th>
            <th style="width: 90px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${data.currency} ${data.subtotal.toLocaleString()}</span>
          </div>
          ${data.delivery_fee > 0 ? `
            <div class="totals-row">
              <span>Delivery Fee</span>
              <span>${data.currency} ${data.delivery_fee.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total</span>
            <span>${data.currency} ${data.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>

    ${data.notes ? `
      <div class="notes-section">
        <h3>Clinical Notes</h3>
        <p>${data.notes}</p>
      </div>
    ` : ''}

    <div class="verification-section">
      <div class="verification-info">
        <h3>Digital Verification</h3>
        <p>This prescription has been digitally signed and verified.</p>
        <p><strong>Document Hash:</strong></p>
        <p class="hash">SHA256-${hash.toUpperCase()}</p>
        <p><strong>Generated:</strong> ${moment(data.created_at).format('YYYY-MM-DD HH:mm:ss')} UTC</p>
        <p><strong>Verify at:</strong> <a href="https://rapidcapsule.com/verify/${data.prescription_number}">rapidcapsule.com/verify/${data.prescription_number}</a></p>
      </div>
      <div class="qr-code">
        <img src="${qrCodeDataUrl}" alt="QR Code for verification" />
      </div>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsules</strong> - Your healthcare, delivered.</p>
      <p>This prescription was generated electronically through the Rapid Capsules platform.</p>
      <p>For questions or concerns, contact us at support@rapidcapsule.com</p>
      <div class="disclaimer">
        <strong>Important:</strong> Take medications as prescribed. Read all instructions carefully.
        Store medications properly. If you experience any adverse effects, discontinue use and consult your healthcare provider immediately.
        This prescription is valid only when dispensed by a licensed pharmacy.
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
