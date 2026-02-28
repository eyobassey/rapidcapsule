import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Query DTOs ───────────────────────────────────────────────────

export class RiskHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of risk history entries to return',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  readonly limit?: number;

  @ApiPropertyOptional({
    description: 'Time period filter for risk history',
    enum: ['7d', '30d', '90d'],
    example: '30d',
  })
  @IsOptional()
  @IsString()
  readonly period?: '7d' | '30d' | '90d';
}

// ─── Response Interfaces ──────────────────────────────────────────

export interface SignalDetail {
  /** Individual signal name (e.g. "craving_score", "sleep_deterioration") */
  name: string;
  /** Raw signal value before category aggregation */
  value: number;
  /** Maximum possible value for this signal */
  max: number;
  /** Human-readable label */
  label: string;
}

export interface CategoryScore {
  /** Category sub-score (0-100) */
  score: number;
  /** Category weight in final RRS calculation */
  weight: number;
  /** Weighted contribution to final score (score × weight) */
  weighted: number;
  /** Breakdown of individual signals within this category */
  details: SignalDetail[];
}

export interface RiskTrend {
  /** Direction of risk change */
  direction: 'up' | 'down' | 'stable';
  /** Score change over last 7 days (positive = increased risk) */
  change_7d: number;
  /** Score change over last 30 days */
  change_30d: number;
}

export interface TopFactor {
  /** Signal name */
  signal: string;
  /** Human-readable label */
  label: string;
  /** Category this signal belongs to */
  category: string;
  /** How much this signal contributes to the total score */
  contribution: number;
  /** Actionable recommendation for this factor */
  recommendation: string;
}

export interface RiskHistoryEntry {
  score: number;
  level: string;
  calculated_at: Date;
  signals?: Record<string, any>;
}

// ─── Main Risk Calculation Result ─────────────────────────────────

export interface RiskCalculationResult {
  /** Composite Recovery Risk Score (0-100) */
  score: number;
  /** Risk level derived from score */
  level: string;
  /** Previous risk score (before this calculation) */
  previous_score: number;
  /** Previous risk level */
  previous_level: string;
  /** When this score was calculated */
  calculated_at: Date;
  /** Breakdown by the 5 signal categories */
  signals: {
    self_reported: CategoryScore;
    behavioral: CategoryScore;
    physiological: CategoryScore;
    clinical: CategoryScore;
    contextual: CategoryScore;
  };
  /** Whether the risk level crossed a threshold */
  threshold_crossed: boolean;
  /** Direction of change */
  direction: 'up' | 'down' | 'same';
}

// ─── Risk Breakdown Response (for API / Eka artifact) ─────────────

export interface RiskBreakdownResponse {
  /** Composite Recovery Risk Score (0-100) */
  score: number;
  /** Risk level */
  level: string;
  /** Previous score */
  previous_score: number;
  /** When last calculated */
  updated_at: Date;
  /** 5-category signal breakdown */
  signals: {
    self_reported: CategoryScore;
    behavioral: CategoryScore;
    physiological: CategoryScore;
    clinical: CategoryScore;
    contextual: CategoryScore;
  };
  /** Trend data */
  trend: RiskTrend;
  /** Top 5 contributing factors */
  top_factors: TopFactor[];
  /** Recent risk history (last 7 days by default) */
  risk_history: RiskHistoryEntry[];
}
