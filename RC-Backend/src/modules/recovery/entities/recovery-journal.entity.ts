import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RecoveryJournalDocument = HydratedDocument<RecoveryJournal>;

export enum JournalEntryType {
  CHECK_IN = 'check_in',
  CRAVING = 'craving',
  MOOD = 'mood',
  GRATITUDE = 'gratitude',
  TRIGGER = 'trigger',
  COPING = 'coping',
  FREE_WRITE = 'free_write',
  COMPANION_CHAT = 'companion_chat',
}

export enum TherapeuticTechnique {
  CBT = 'cbt',
  DBT = 'dbt',
  MOTIVATIONAL_INTERVIEWING = 'motivational_interviewing',
  MINDFULNESS = 'mindfulness',
  URGE_SURFING = 'urge_surfing',
  GROUNDING = 'grounding',
}

@Schema({
  collection: 'recovery_journals',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RecoveryJournal {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: {
      values: [
        JournalEntryType.CHECK_IN,
        JournalEntryType.CRAVING,
        JournalEntryType.MOOD,
        JournalEntryType.GRATITUDE,
        JournalEntryType.TRIGGER,
        JournalEntryType.COPING,
        JournalEntryType.FREE_WRITE,
        JournalEntryType.COMPANION_CHAT,
      ],
    },
  })
  entry_type: JournalEntryType;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  structured_data: {
    mood_score?: number;
    energy_level?: number;
    sleep_quality?: number;
    craving_intensity?: number;
    substances_craved?: string[];
    triggers_today?: string[];
    coping_strategies_used?: string[];
    medications_taken?: boolean;
    meetings_attended?: number;

    craving_substance?: string;
    craving_trigger?: string;
    craving_location?: string;
    craving_time_of_day?: string;
    craving_duration_minutes?: number;
    craving_outcome?: string;

    conversation_messages?: Array<{
      role: string;
      content: string;
      timestamp: Date;
    }>;
    conversation_summary?: string;
    therapeutic_technique_used?: string;
    crisis_detected?: boolean;
    escalated_to_human?: boolean;
  };

  @Prop({ type: String })
  free_text: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  ai_response: {
    generated_at?: Date;
    content?: string;
    suggested_exercise?: string;
    affirmation?: string;
    risk_flags?: string[];
  };

  @Prop({
    type: String,
    enum: { values: ['low', 'moderate', 'high', 'crisis'] },
    default: 'low',
  })
  risk_level_at_entry: string;

  @Prop({ type: Date })
  deleted_at: Date;
}

export const RecoveryJournalSchema =
  SchemaFactory.createForClass(RecoveryJournal);
