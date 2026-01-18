import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import { FileUploadHelper } from '../../../common/helpers/file-upload.helpers';

export interface OrderConfirmationPdfData {
  order_number: string;
  order_type: string;
  created_at: Date;
  status: string;
  patient: {
    full_name: string;
    email?: string;
    phone?: string;
  };
  pharmacy: {
    name: string;
    address?: string;
    phone?: string;
  };
  items: Array<{
    drug_name: string;
    generic_name?: string;
    strength?: string;
    dosage_form?: string;
    manufacturer?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    requires_prescription: boolean;
    dosage_instructions?: string;
  }>;
  // Pricing
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
  // Payment
  payment_method: string;
  wallet_amount_paid?: number;
  card_amount_paid?: number;
  paid_at?: Date;
  // Delivery
  delivery_method: string;
  delivery_address?: {
    recipient_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    phone: string;
  };
  estimated_delivery_date?: Date;
  pickup_code?: string;
  // Prescription verification
  verification_score?: number;
  requires_pharmacist_review?: boolean;
  pharmacist_review_reason?: string;
  // Drug interactions
  drug_interactions?: Array<{
    drug1_name: string;
    drug2_name: string;
    severity: string;
    description: string;
    recommendation?: string;
  }>;
  has_interaction_warnings?: boolean;
  // Drug safety info
  drug_safety_info?: Array<{
    drug_name: string;
    ai_summary?: {
      key_points?: string[];
      common_side_effects?: string[];
      serious_warnings?: string[];
    };
    boxed_warning?: string;
  }>;
}

@Injectable()
export class OrderConfirmationPdfService {
  private readonly logger = new Logger(OrderConfirmationPdfService.name);
  private logoBase64: string | null = null;

  constructor(private readonly fileUploadHelper: FileUploadHelper) {
    this.loadLogo();
  }

  private loadLogo(): void {
    try {
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
      this.logger.warn('Logo file not found');
    } catch (e) {
      this.logger.error('Failed to load logo file', e);
    }
  }

  private getLogoBase64(): string {
    if (!this.logoBase64) {
      this.loadLogo();
    }
    return this.logoBase64 || '';
  }

  async generateAndUploadPdf(data: OrderConfirmationPdfData): Promise<{
    pdf_url: string;
    pdf_presigned_url: string;
    pdf_hash: string;
    pdf_buffer: Buffer;
  }> {
    try {
      const pdfBuffer = await this.generatePdfBuffer(data);
      const pdfHash = this.generateHash(pdfBuffer, data);
      const fileName = `orders/${data.order_number}_confirmation_${Date.now()}.pdf`;
      const pdfUrl = await this.fileUploadHelper.uploadToS3(pdfBuffer, fileName);

      // Generate presigned URL valid for 7 days (604800 seconds) for email links
      const pdfPresignedUrl = await this.fileUploadHelper.getPresignedUrl(pdfUrl, 604800);

      return { pdf_url: pdfUrl, pdf_presigned_url: pdfPresignedUrl, pdf_hash: pdfHash, pdf_buffer: pdfBuffer };
    } catch (error) {
      this.logger.error('Failed to generate order confirmation PDF', error);
      throw error;
    }
  }

  async generatePdfBuffer(data: OrderConfirmationPdfData): Promise<Buffer> {
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
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private generateHash(pdfBuffer: Buffer, data: OrderConfirmationPdfData): string {
    const hashData = `${data.order_number}|${data.patient.full_name}|${data.created_at}|${data.total_amount}`;
    return crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 32);
  }

  private async generateQrCode(data: OrderConfirmationPdfData, hash: string): Promise<string> {
    const qrData = `https://rapidcapsule.com/app/patient/pharmacy/orders/${data.order_number}`;
    return QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    });
  }

  private getSeverityColor(severity: string): { bg: string; text: string; border: string } {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      critical: { bg: '#ffebee', text: '#c62828', border: '#ef5350' },
      severe: { bg: '#ffebee', text: '#c62828', border: '#ef5350' },
      moderate: { bg: '#fff3e0', text: '#e65100', border: '#ff9800' },
      mild: { bg: '#e3f2fd', text: '#1565c0', border: '#42a5f5' },
    };
    return colors[severity.toLowerCase()] || colors.mild;
  }

  private async generateHtml(data: OrderConfirmationPdfData): Promise<string> {
    const hash = this.generateHash(Buffer.from(''), data);
    const qrCodeDataUrl = await this.generateQrCode(data, hash);
    const createdDate = moment(data.created_at).format('DD MMM YYYY');
    const createdTime = moment(data.created_at).format('h:mm A');

    // Generate items HTML
    const itemsHtml = data.items.map((item, index) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px;">${index + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">
          <strong style="color: #1a237e; font-size: 12px;">${item.drug_name}</strong>
          ${item.generic_name ? `<br><span style="color: #78909c; font-size: 10px;">${item.generic_name}</span>` : ''}
          ${item.strength ? `<br><span style="color: #78909c; font-size: 10px;">${item.strength}</span>` : ''}
          ${item.requires_prescription ? '<br><span style="background: #e3f2fd; color: #1565c0; font-size: 9px; padding: 2px 6px; border-radius: 10px;">Rx</span>' : ''}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-size: 10px; color: #546e7a;">
          ${item.dosage_instructions || '-'}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-size: 11px;">${data.currency} ${item.unit_price.toLocaleString()}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600; font-size: 11px;">${data.currency} ${item.total_price.toLocaleString()}</td>
      </tr>
    `).join('');

    // Generate drug interactions HTML
    let interactionsHtml = '';
    if (data.has_interaction_warnings && data.drug_interactions && data.drug_interactions.length > 0) {
      const interactionItems = data.drug_interactions.map(interaction => {
        const colors = this.getSeverityColor(interaction.severity);
        return `
          <div style="padding: 12px; margin-bottom: 10px; background: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: ${colors.text}; font-size: 12px;">${interaction.drug1_name} + ${interaction.drug2_name}</strong>
              <span style="background: ${colors.border}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; text-transform: uppercase;">${interaction.severity}</span>
            </div>
            <p style="font-size: 11px; color: #333; margin: 4px 0;">${interaction.description}</p>
            ${interaction.recommendation ? `<p style="font-size: 10px; color: #546e7a; margin-top: 6px;"><strong>Recommendation:</strong> ${interaction.recommendation}</p>` : ''}
          </div>
        `;
      }).join('');

      interactionsHtml = `
        <div style="margin: 20px 0; padding: 15px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px;">
          <h3 style="font-size: 14px; color: #e65100; margin-bottom: 12px; display: flex; align-items: center;">
            <span style="font-size: 18px; margin-right: 8px;">&#9888;</span> Drug Interaction Warnings
          </h3>
          <p style="font-size: 11px; color: #795548; margin-bottom: 12px;">
            The following potential drug interactions were detected. Please consult with your pharmacist or healthcare provider.
          </p>
          ${interactionItems}
        </div>
      `;
    }

    // Generate drug safety info HTML
    let safetyHtml = '';
    if (data.drug_safety_info && data.drug_safety_info.length > 0) {
      const safetyItems = data.drug_safety_info.map(drug => {
        let content = '';

        if (drug.boxed_warning) {
          content += `
            <div style="background: #ffebee; border: 2px solid #ef5350; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <strong style="color: #c62828; font-size: 11px;">&#9888; BOXED WARNING</strong>
              <p style="font-size: 10px; color: #c62828; margin-top: 5px;">${drug.boxed_warning}</p>
            </div>
          `;
        }

        if (drug.ai_summary) {
          if (drug.ai_summary.key_points && drug.ai_summary.key_points.length > 0) {
            content += `
              <div style="margin-bottom: 8px;">
                <strong style="font-size: 10px; color: #1565c0;">Key Points:</strong>
                <ul style="margin: 4px 0 0 15px; padding: 0; font-size: 10px; color: #333;">
                  ${drug.ai_summary.key_points.slice(0, 3).map(p => `<li style="margin-bottom: 3px;">${p}</li>`).join('')}
                </ul>
              </div>
            `;
          }

          if (drug.ai_summary.common_side_effects && drug.ai_summary.common_side_effects.length > 0) {
            content += `
              <div style="margin-bottom: 8px;">
                <strong style="font-size: 10px; color: #e65100;">Common Side Effects:</strong>
                <p style="font-size: 10px; color: #546e7a; margin-top: 3px;">${drug.ai_summary.common_side_effects.slice(0, 5).join(', ')}</p>
              </div>
            `;
          }

          if (drug.ai_summary.serious_warnings && drug.ai_summary.serious_warnings.length > 0) {
            content += `
              <div style="background: #fff3e0; padding: 8px; border-radius: 4px;">
                <strong style="font-size: 10px; color: #e65100;">&#9888; Warnings:</strong>
                <ul style="margin: 4px 0 0 15px; padding: 0; font-size: 10px; color: #795548;">
                  ${drug.ai_summary.serious_warnings.slice(0, 2).map(w => `<li style="margin-bottom: 3px;">${w}</li>`).join('')}
                </ul>
              </div>
            `;
          }
        }

        return content ? `
          <div style="padding: 12px; margin-bottom: 10px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px;">
            <h4 style="font-size: 12px; color: #1a237e; margin-bottom: 8px;">${drug.drug_name}</h4>
            ${content}
          </div>
        ` : '';
      }).filter(Boolean).join('');

      if (safetyItems) {
        safetyHtml = `
          <div style="margin: 20px 0; page-break-inside: avoid;">
            <h3 style="font-size: 14px; color: #1a73e8; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;">
              Medication Safety Information
            </h3>
            ${safetyItems}
          </div>
        `;
      }
    }

    // Verification notice HTML
    let verificationNoticeHtml = '';
    if (data.requires_pharmacist_review || (data.verification_score && data.verification_score < 90)) {
      verificationNoticeHtml = `
        <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px;">
          <h3 style="font-size: 12px; color: #1565c0; margin-bottom: 8px;">&#9432; Verification Notice</h3>
          <p style="font-size: 11px; color: #1976d2; margin-bottom: 8px;">
            Your prescription is subject to secondary verification by our licensed Pharmacist before processing.
            ${data.verification_score ? `<br><strong>Verification Score:</strong> ${data.verification_score}%` : ''}
          </p>
          <p style="font-size: 10px; color: #1976d2;">
            You or your prescriber may be contacted if any clarification is needed. This is a standard safety measure to ensure your medications are appropriate and safe.
          </p>
        </div>
      `;
    }

    // Payment details HTML
    let paymentHtml = '';
    if (data.payment_method) {
      const paymentDetails: string[] = [];
      if (data.wallet_amount_paid && data.wallet_amount_paid > 0) {
        paymentDetails.push(`Wallet: ${data.currency} ${data.wallet_amount_paid.toLocaleString()}`);
      }
      if (data.card_amount_paid && data.card_amount_paid > 0) {
        paymentDetails.push(`Card: ${data.currency} ${data.card_amount_paid.toLocaleString()}`);
      }

      paymentHtml = `
        <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; margin-top: 15px;">
          <h4 style="font-size: 12px; color: #2e7d32; margin-bottom: 8px;">&#10003; Payment Confirmed</h4>
          <p style="font-size: 11px; color: #388e3c;">
            <strong>Method:</strong> ${data.payment_method.replace('_', ' + ').toUpperCase()}
            ${paymentDetails.length > 0 ? `<br>${paymentDetails.join(' | ')}` : ''}
            ${data.paid_at ? `<br><strong>Paid:</strong> ${moment(data.paid_at).format('DD MMM YYYY, h:mm A')}` : ''}
          </p>
        </div>
      `;
    }

    // Delivery/Pickup HTML
    let deliveryHtml = '';
    if (data.delivery_method === 'DELIVERY' && data.delivery_address) {
      deliveryHtml = `
        <div class="info-card">
          <h3>Delivery Information</h3>
          <p><strong>${data.delivery_address.recipient_name}</strong></p>
          <p>${data.delivery_address.address_line1}</p>
          ${data.delivery_address.address_line2 ? `<p>${data.delivery_address.address_line2}</p>` : ''}
          <p>${data.delivery_address.city}, ${data.delivery_address.state}</p>
          <p>Phone: ${data.delivery_address.phone}</p>
          ${data.estimated_delivery_date ? `<p style="margin-top: 10px;"><strong>Est. Delivery:</strong> ${moment(data.estimated_delivery_date).format('DD MMM YYYY')}</p>` : ''}
        </div>
      `;
    } else if (data.delivery_method === 'PICKUP') {
      deliveryHtml = `
        <div class="info-card">
          <h3>Pickup Information</h3>
          <p><strong>${data.pharmacy.name}</strong></p>
          ${data.pharmacy.address ? `<p>${data.pharmacy.address}</p>` : ''}
          ${data.pharmacy.phone ? `<p>Phone: ${data.pharmacy.phone}</p>` : ''}
          ${data.pickup_code ? `
            <div style="margin-top: 12px; padding: 10px; background: #e3f2fd; border-radius: 6px; text-align: center;">
              <p style="font-size: 10px; color: #1565c0; margin-bottom: 4px;">PICKUP CODE</p>
              <p style="font-size: 24px; font-weight: 700; color: #1a73e8; letter-spacing: 4px;">${data.pickup_code}</p>
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      background: #fff;
    }
    .container { padding: 25px; max-width: 800px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      border-bottom: 3px solid #4caf50;
      margin-bottom: 15px;
    }
    .logo-section { display: flex; align-items: center; }
    .logo { width: 50px; height: auto; margin-right: 12px; }
    .logo img { width: 100%; height: auto; }
    .logo-fallback {
      width: 45px; height: 45px;
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 20px; font-weight: bold;
    }
    .company-name { font-size: 20px; font-weight: 700; color: #4caf50; }
    .company-tagline { font-size: 10px; color: #546e7a; }
    .company-contact { text-align: right; font-size: 10px; color: #78909c; }
    .company-contact a { color: #4caf50; text-decoration: none; }
    .title-section {
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-radius: 8px;
    }
    .title-section h1 { font-size: 20px; color: #2e7d32; margin-bottom: 5px; }
    .title-section p { font-size: 10px; color: #388e3c; }
    .order-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #4caf50;
      color: white;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 8px;
    }
    .reference-section {
      display: flex;
      justify-content: space-between;
      margin: 15px 0;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
    }
    .reference-item { text-align: center; }
    .reference-label { font-size: 9px; color: #78909c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .reference-value { font-size: 12px; font-weight: 600; color: #2c3e50; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-card {
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }
    .info-card h3 {
      font-size: 11px; color: #4caf50; text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 8px; padding-bottom: 6px;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-card p { margin: 4px 0; font-size: 11px; color: #546e7a; }
    .info-card p strong { color: #2c3e50; }
    .medications-section { margin: 20px 0; }
    .medications-section h2 {
      font-size: 13px; color: #4caf50; margin-bottom: 12px;
      padding-bottom: 6px; border-bottom: 2px solid #e0e0e0;
    }
    .medications-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .medications-table th {
      background: #4caf50; color: white; padding: 10px 8px;
      text-align: left; font-size: 10px; text-transform: uppercase;
    }
    .medications-table th:first-child { border-radius: 6px 0 0 0; }
    .medications-table th:last-child { border-radius: 0 6px 0 0; }
    .totals-section { margin-top: 15px; display: flex; justify-content: flex-end; }
    .totals-box { width: 220px; padding: 12px; background: #f5f7fa; border-radius: 8px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #546e7a; }
    .totals-row.total {
      border-top: 2px solid #4caf50; margin-top: 8px; padding-top: 10px;
      font-size: 14px; font-weight: 700; color: #4caf50;
    }
    .verification-section {
      margin-top: 25px; padding: 15px;
      background: linear-gradient(135deg, #f5f7fa 0%, #eceff1 100%);
      border-radius: 8px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .verification-info { flex: 1; }
    .verification-info h3 { font-size: 11px; color: #546e7a; margin-bottom: 8px; }
    .verification-info p { font-size: 9px; color: #78909c; margin: 3px 0; }
    .qr-code { margin-left: 15px; }
    .qr-code img { width: 100px; height: 100px; border: 2px solid #333; border-radius: 6px; padding: 3px; background: white; }
    .footer {
      margin-top: 25px; padding-top: 15px;
      border-top: 1px solid #e0e0e0;
      text-align: center; font-size: 9px; color: #78909c;
    }
    .footer p { margin: 2px 0; }
    .footer a { color: #4caf50; text-decoration: none; }
    .disclaimer {
      margin-top: 12px; padding: 10px;
      background: #e8f5e9; border-radius: 6px;
      font-size: 9px; color: #2e7d32; text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">
          ${this.getLogoBase64()
            ? `<img src="data:image/png;base64,${this.getLogoBase64()}" alt="Logo" />`
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
      <h1>ORDER CONFIRMATION</h1>
      <p>Thank you for your order!</p>
      <span class="order-badge">&#10003; Order Placed Successfully</span>
    </div>

    <div class="reference-section">
      <div class="reference-item">
        <div class="reference-label">Order Number</div>
        <div class="reference-value">${data.order_number}</div>
      </div>
      <div class="reference-item">
        <div class="reference-label">Order Date</div>
        <div class="reference-value">${createdDate}</div>
      </div>
      <div class="reference-item">
        <div class="reference-label">Order Type</div>
        <div class="reference-value">${data.order_type}</div>
      </div>
      <div class="reference-item">
        <div class="reference-label">Status</div>
        <div class="reference-value">${data.status.replace(/_/g, ' ')}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>Patient Information</h3>
        <p><strong>${data.patient.full_name}</strong></p>
        ${data.patient.email ? `<p>Email: ${data.patient.email}</p>` : ''}
        ${data.patient.phone ? `<p>Phone: ${data.patient.phone}</p>` : ''}
      </div>
      ${deliveryHtml || `
        <div class="info-card">
          <h3>Fulfillment Pharmacy</h3>
          <p><strong>${data.pharmacy.name}</strong></p>
          ${data.pharmacy.address ? `<p>${data.pharmacy.address}</p>` : ''}
          ${data.pharmacy.phone ? `<p>Phone: ${data.pharmacy.phone}</p>` : ''}
        </div>
      `}
    </div>

    ${verificationNoticeHtml}

    ${interactionsHtml}

    <div class="medications-section">
      <h2>Order Items</h2>
      <table class="medications-table">
        <thead>
          <tr>
            <th style="width: 25px;">#</th>
            <th style="width: 160px;">Medication</th>
            <th style="width: 40px; text-align: center;">Qty</th>
            <th>Instructions</th>
            <th style="width: 70px; text-align: right;">Unit Price</th>
            <th style="width: 80px; text-align: right;">Total</th>
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
          ${data.discount_amount > 0 ? `
            <div class="totals-row">
              <span>Discount</span>
              <span style="color: #4caf50;">-${data.currency} ${data.discount_amount.toLocaleString()}</span>
            </div>
          ` : ''}
          ${data.delivery_fee > 0 ? `
            <div class="totals-row">
              <span>Delivery Fee</span>
              <span>${data.currency} ${data.delivery_fee.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total Paid</span>
            <span>${data.currency} ${data.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      ${paymentHtml}
    </div>

    ${safetyHtml}

    <div class="verification-section">
      <div class="verification-info">
        <h3>Order Verification</h3>
        <p><strong>Order Hash:</strong> ${hash.toUpperCase()}</p>
        <p><strong>Generated:</strong> ${moment(data.created_at).format('YYYY-MM-DD HH:mm:ss')} UTC</p>
        <p><strong>Track your order at:</strong> rapidcapsule.com/orders/${data.order_number}</p>
      </div>
      <div class="qr-code">
        <img src="${qrCodeDataUrl}" alt="QR Code" />
      </div>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsules</strong> - Your healthcare, delivered.</p>
      <p>For questions or concerns, contact us at support@rapidcapsule.com</p>
      <div class="disclaimer">
        <strong>Important:</strong> Take medications as prescribed. Store properly. If you experience adverse effects, discontinue use and consult your healthcare provider.
        ${data.requires_pharmacist_review ? '<br><strong>Note:</strong> Your prescription may undergo additional verification before dispensing.' : ''}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
