import { Types } from "mongoose";

export enum PaymentProvider {
  PAYSTACK = 'Paystack',
  FLUTTERWAVE = 'Flutterwave',
  STRIPE = 'Stripe',
}

export class Rate {
  number: number;
  unit: string;
}

export class SpecialistRate {
  _id?: Types.ObjectId;
  category: string;
  specialization: string;
  rate: Rate;
}

export class AdminDefaultSettingsTypes {
  payment_provider: PaymentProvider;
}

export class AdminSetting {
  defaults: AdminDefaultSettingsTypes;
  specialist_rates: SpecialistRate[];
}

export class SplitRatio {
  display_name: string;
  percentage: number;
}

export enum DrugInteractionDataSource {
  RXNAV = 'rxnav',           // DrugBank + ONCHigh via RxNav API
  CLAUDE_AI = 'claude_ai',   // Claude AI analysis
  OPENFDA = 'openfda',       // FDA drug label data
}

export class DrugInteractionSettings {
  enabled_for_patients: boolean;
  enabled_for_specialists: boolean;
  show_severity_levels: boolean;
  disclaimer_text: string;
  data_sources: DrugInteractionDataSource[];  // Which sources to use (in priority order)
}