import { Injectable, Logger } from '@nestjs/common';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';

@Injectable()
export class DrEkaEmailService {
  private readonly logger = new Logger(DrEkaEmailService.name);

  constructor(private readonly generalHelpers: GeneralHelpers) {}

  /**
   * Send the weekly report as a beautiful HTML email
   */
  async sendWeeklyReportEmail(
    email: string,
    firstName: string,
    report: any,
  ): Promise<boolean> {
    try {
      const html = this.buildWeeklyReportEmail(firstName, report);
      await this.generalHelpers.sendEmail(
        email,
        `Your Weekly Health Report from Dr. Eka — ${this.formatDateRange(report.week_start, report.week_end)}`,
        html,
      );
      this.logger.log(`Weekly report email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send weekly report email to ${email}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send daily digest email (for users who opt in)
   */
  async sendDailyDigestEmail(
    email: string,
    firstName: string,
    digest: any,
  ): Promise<boolean> {
    try {
      const html = this.buildDailyDigestEmail(firstName, digest);
      await this.generalHelpers.sendEmail(
        email,
        `Good Morning ${firstName} — Dr. Eka's Daily Health Update`,
        html,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send daily digest email to ${email}: ${error.message}`);
      return false;
    }
  }

  private formatDateRange(start: Date, end: Date): string {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} — ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#0ea5e9';
    if (score >= 40) return '#f59e0b';
    return '#f43f5e';
  }

  private getTrendArrow(trend: string): string {
    if (trend === 'improving' || trend === 'up') return '↑';
    if (trend === 'declining' || trend === 'down') return '↓';
    return '→';
  }

  private getTrendColor(trend: string): string {
    if (trend === 'improving' || trend === 'up') return '#10b981';
    if (trend === 'declining' || trend === 'down') return '#f43f5e';
    return '#94a3b8';
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WEEKLY REPORT EMAIL TEMPLATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private buildWeeklyReportEmail(firstName: string, report: any): string {
    const score = report.health_score?.current;
    const scoreChange = report.health_score?.change;
    const scoreTrend = report.health_score?.trend;
    const scoreColor = score ? this.getScoreColor(score) : '#94a3b8';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Health Report — Dr. Eka</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <img src="https://rapidcapsule.com/RapidCapsule_Logo.png" alt="RapidCapsule" height="32" style="height:32px;" />
              </td>
              <td align="right">
                <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Weekly Health Report</span>
              </td>
            </tr>
          </table>
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
            <tr>
              <td>
                <div style="width:56px;height:56px;border-radius:28px;background:linear-gradient(135deg,#0ea5e9,#6366f1);display:inline-block;text-align:center;line-height:56px;">
                  <span style="font-size:24px;">🩺</span>
                </div>
              </td>
              <td style="padding-left:16px;">
                <div style="color:#f8fafc;font-size:20px;font-weight:700;">Dr. Eka</div>
                <div style="color:#94a3b8;font-size:13px;margin-top:2px;">Your Personal AI Physician</div>
              </td>
            </tr>
          </table>
          <div style="color:#e2e8f0;font-size:15px;margin-top:20px;line-height:1.5;">
            Good morning, ${firstName}! Here's your comprehensive health review for the week of ${this.formatDateRange(report.week_start, report.week_end)}.
          </div>
        </td></tr>

        ${score != null ? `
        <!-- Health Score -->
        <tr><td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:12px;">Health Score</div>
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="80">
                <div style="width:72px;height:72px;border-radius:36px;border:4px solid ${scoreColor};display:flex;align-items:center;justify-content:center;text-align:center;line-height:72px;">
                  <span style="font-size:28px;font-weight:800;color:#0f172a;">${score}</span>
                </div>
              </td>
              <td style="padding-left:16px;">
                <div style="font-size:16px;font-weight:600;color:#0f172a;">${score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention'}</div>
                ${scoreChange != null ? `<div style="font-size:13px;color:${this.getTrendColor(scoreTrend)};margin-top:4px;">${this.getTrendArrow(scoreTrend)} ${scoreChange > 0 ? '+' : ''}${scoreChange} from last week</div>` : ''}
              </td>
            </tr>
          </table>
        </td></tr>` : ''}

        <!-- Summary -->
        <tr><td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:12px;">Week in Review</div>
          <div style="font-size:14px;color:#334155;line-height:1.7;">${report.summary || ''}</div>
        </td></tr>

        ${report.medications?.length > 0 ? `
        <!-- Medications -->
        <tr><td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:12px;">💊 Medications</div>
          ${(report.medications || []).map((m: any) => `
            <div style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
              <div style="font-size:14px;font-weight:600;color:#0f172a;">${m.name || m.drug_name}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">${m.dose || ''} ${m.adherence_note ? '— ' + m.adherence_note : ''}</div>
            </div>
          `).join('')}
        </td></tr>` : ''}

        ${report.recommendations?.length > 0 ? `
        <!-- Recommendations -->
        <tr><td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:12px;">📋 Dr. Eka's Recommendations</div>
          ${(report.recommendations || []).map((r: any, i: number) => `
            <div style="padding:12px 0;${i < report.recommendations.length - 1 ? 'border-bottom:1px solid #f1f5f9;' : ''}">
              <div style="font-size:14px;font-weight:600;color:#0f172a;">${r.title}</div>
              <div style="font-size:13px;color:#475569;margin-top:4px;line-height:1.5;">${r.content}</div>
              ${r.action_url ? `<a href="https://rapidcapsule.com/app/patient${r.action_url}" style="display:inline-block;margin-top:8px;padding:6px 16px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;">Take Action →</a>` : ''}
            </div>
          `).join('')}
        </td></tr>` : ''}

        ${report.health_news?.length > 0 ? `
        <!-- Health News -->
        <tr><td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:12px;">📰 Health News for You</div>
          ${(report.health_news || []).map((n: any) => `
            <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
              <div style="font-size:14px;font-weight:600;color:#0f172a;">${n.title}</div>
              <div style="font-size:13px;color:#475569;margin-top:4px;line-height:1.5;">${n.summary}</div>
              ${n.relevance_note ? `<div style="font-size:12px;color:#0ea5e9;margin-top:4px;font-style:italic;">Why this matters for you: ${n.relevance_note}</div>` : ''}
            </div>
          `).join('')}
        </td></tr>` : ''}

        <!-- Doctor's Note -->
        <tr><td style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);padding:24px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:12px;">📝 Doctor's Note</div>
          <div style="font-size:14px;color:#1e40af;line-height:1.7;font-style:italic;">${report.doctors_note || ''}</div>
          <div style="margin-top:16px;font-size:13px;font-weight:600;color:#1e40af;">— Dr. Eka, Your AI Physician</div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#ffffff;padding:24px 32px;text-align:center;">
          <a href="https://rapidcapsule.com/app/patient/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;">View Full Report in App</a>
        </td></tr>

        <!-- Disclaimer -->
        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 32px;">
          <div style="font-size:11px;color:#94a3b8;line-height:1.6;text-align:center;">
            This report is generated by Dr. Eka, an AI health assistant, and is for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional for medical decisions.<br/><br/>
            <a href="https://rapidcapsule.com/app/patient/notification-settings" style="color:#64748b;text-decoration:underline;">Manage email preferences</a> · <a href="https://rapidcapsule.com/privacy-policy" style="color:#64748b;text-decoration:underline;">Privacy Policy</a><br/>
            © ${new Date().getFullYear()} RapidCapsule · All rights reserved
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAILY DIGEST EMAIL TEMPLATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private buildDailyDigestEmail(firstName: string, digest: any): string {
    const items = digest.items || [];
    const priorityColors: Record<string, string> = {
      urgent: '#f43f5e',
      high: '#f59e0b',
      medium: '#0ea5e9',
      low: '#10b981',
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dr. Eka's Daily Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:24px 32px;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <img src="https://rapidcapsule.com/RapidCapsule_Logo.png" alt="RapidCapsule" height="28" style="height:28px;" />
              </td>
              <td align="right">
                <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">${this.formatDate(digest.date || new Date())}</span>
              </td>
            </tr>
          </table>
          <div style="margin-top:20px;color:#e2e8f0;font-size:15px;line-height:1.5;">
            ${digest.summary || `Good morning, ${firstName}! Here's what Dr. Eka noticed during your morning health review.`}
          </div>
        </td></tr>

        <!-- Items -->
        ${items.map((item: any) => `
        <tr><td style="background:#ffffff;padding:20px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="display:flex;align-items:center;margin-bottom:8px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:${priorityColors[item.priority] || '#94a3b8'};margin-right:8px;"></span>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${priorityColors[item.priority] || '#94a3b8'};font-weight:700;">${item.type?.replace(/_/g, ' ') || 'Update'}</span>
          </div>
          <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:6px;">${item.title}</div>
          <div style="font-size:13px;color:#475569;line-height:1.6;">${item.content}</div>
          ${item.action_text && item.action_url ? `
            <a href="https://rapidcapsule.com/app/patient${item.action_url}" style="display:inline-block;margin-top:10px;padding:8px 20px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;">${item.action_text} →</a>
          ` : ''}
        </td></tr>
        `).join('')}

        ${digest.health_joke ? `
        <!-- Health Joke -->
        <tr><td style="background:#fffbeb;padding:16px 32px;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:13px;color:#92400e;line-height:1.5;">😄 <strong>Health Humor:</strong> ${digest.health_joke}</div>
        </td></tr>
        ` : ''}

        <!-- CTA -->
        <tr><td style="background:#ffffff;padding:20px 32px;text-align:center;">
          <a href="https://rapidcapsule.com/app/patient/dashboard" style="display:inline-block;padding:10px 28px;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#ffffff;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;">Open RapidCapsule</a>
        </td></tr>

        <!-- Disclaimer -->
        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:16px 32px;">
          <div style="font-size:10px;color:#94a3b8;line-height:1.5;text-align:center;">
            Dr. Eka is an AI health assistant. This is not medical advice. Always consult a healthcare professional.<br/>
            <a href="https://rapidcapsule.com/app/patient/notification-settings" style="color:#64748b;text-decoration:underline;">Manage preferences</a> · © ${new Date().getFullYear()} RapidCapsule
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
