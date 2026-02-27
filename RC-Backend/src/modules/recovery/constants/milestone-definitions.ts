/**
 * Recovery milestone definitions for the gamified sobriety tracking system.
 * Milestones are auto-checked by the milestone scheduler and awarded when thresholds are met.
 */

export interface MilestoneDefinition {
  type: string;
  value: number;
  name: string;
  points: number;
  message: string;
  icon: string;
}

export const SOBRIETY_MILESTONES: MilestoneDefinition[] = [
  {
    type: 'sobriety_days',
    value: 1,
    name: '24 Hours',
    points: 10,
    message: 'The hardest day is day one. You did it.',
    icon: 'sunrise',
  },
  {
    type: 'sobriety_days',
    value: 3,
    name: '72 Hours',
    points: 20,
    message:
      'Three days strong. The worst of acute withdrawal is often behind you.',
    icon: 'shield',
  },
  {
    type: 'sobriety_days',
    value: 7,
    name: 'One Week',
    points: 50,
    message: 'A full week. Your body is already beginning to heal.',
    icon: 'star',
  },
  {
    type: 'sobriety_days',
    value: 14,
    name: 'Two Weeks',
    points: 75,
    message:
      'Two weeks strong. Sleep and appetite are starting to normalise.',
    icon: 'moon',
  },
  {
    type: 'sobriety_days',
    value: 30,
    name: 'One Month',
    points: 150,
    message:
      'One month. Your brain chemistry is beginning to rebalance. This is a major achievement.',
    icon: 'award',
  },
  {
    type: 'sobriety_days',
    value: 60,
    name: 'Two Months',
    points: 200,
    message:
      'Sixty days. You\'re building new neural pathways and healthier habits.',
    icon: 'trending-up',
  },
  {
    type: 'sobriety_days',
    value: 90,
    name: 'Three Months',
    points: 300,
    message:
      'Ninety days. A cornerstone milestone in any recovery programme. Be proud.',
    icon: 'trophy',
  },
  {
    type: 'sobriety_days',
    value: 180,
    name: 'Six Months',
    points: 500,
    message:
      'Half a year. Relapse risk decreases significantly from this point.',
    icon: 'heart',
  },
  {
    type: 'sobriety_days',
    value: 365,
    name: 'One Year',
    points: 1000,
    message:
      'One full year. Through every season, every trigger, every hard day — you made it.',
    icon: 'crown',
  },
  {
    type: 'sobriety_days',
    value: 730,
    name: 'Two Years',
    points: 2000,
    message: 'Two years. Recovery is becoming your way of life.',
    icon: 'gem',
  },
  {
    type: 'sobriety_days',
    value: 1825,
    name: 'Five Years',
    points: 5000,
    message:
      'Five years. You have transformed your life. You are an inspiration.',
    icon: 'diamond',
  },
];

export const ENGAGEMENT_MILESTONES: MilestoneDefinition[] = [
  {
    type: 'journal_streak',
    value: 3,
    name: '3-Day Journal Streak',
    points: 10,
    message: 'Consistency is key. Three days of reflection.',
    icon: 'edit',
  },
  {
    type: 'journal_streak',
    value: 7,
    name: '7-Day Journal Streak',
    points: 25,
    message: 'A full week of self-reflection. Keep writing.',
    icon: 'book-open',
  },
  {
    type: 'journal_streak',
    value: 30,
    name: '30-Day Journal Streak',
    points: 100,
    message:
      'A month of daily journaling. You\'re building powerful self-awareness.',
    icon: 'bookmark',
  },
  {
    type: 'appointment_streak',
    value: 4,
    name: '4 Consecutive Appointments',
    points: 50,
    message: 'Showing up is half the battle. Four in a row.',
    icon: 'calendar-check',
  },
  {
    type: 'appointment_streak',
    value: 12,
    name: '12 Consecutive Appointments',
    points: 150,
    message: 'Twelve sessions. Your commitment is remarkable.',
    icon: 'calendar-star',
  },
  {
    type: 'companion_sessions',
    value: 5,
    name: '5 Companion Sessions',
    points: 15,
    message:
      'Five conversations with your recovery companion. You\'re using your tools.',
    icon: 'message-circle',
  },
  {
    type: 'companion_sessions',
    value: 25,
    name: '25 Companion Sessions',
    points: 50,
    message:
      'Twenty-five sessions. The companion is part of your recovery toolkit.',
    icon: 'message-square',
  },
  {
    type: 'exercise_streak',
    value: 7,
    name: '7-Day Exercise Streak',
    points: 40,
    message:
      'Seven days of movement. Exercise is one of the most powerful recovery tools.',
    icon: 'activity',
  },
  {
    type: 'screening_improvement',
    value: 5,
    name: 'Screening Score Improved by 5+',
    points: 75,
    message:
      'Your screening scores are improving. The numbers confirm what you already feel.',
    icon: 'trending-down',
  },
  {
    type: 'screening_improvement',
    value: 10,
    name: 'Screening Score Improved by 10+',
    points: 150,
    message: 'Significant clinical improvement. Your hard work is paying off.',
    icon: 'bar-chart',
  },
];

export const ALL_MILESTONES: MilestoneDefinition[] = [
  ...SOBRIETY_MILESTONES,
  ...ENGAGEMENT_MILESTONES,
];

export const findSobrietyMilestone = (
  days: number,
): MilestoneDefinition | undefined =>
  SOBRIETY_MILESTONES.find((m) => m.value === days);

export const getNextSobrietyMilestone = (
  currentDays: number,
): MilestoneDefinition | undefined =>
  SOBRIETY_MILESTONES.find((m) => m.value > currentDays);
