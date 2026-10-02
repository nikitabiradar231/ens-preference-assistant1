import { z } from 'zod';
import { ENS_KEYS, type RawPreferences } from '../ens/preferences';

// ==========================================
// 1. ALLOWLIST DEFINITIONS (Requirement 2)
// ==========================================
export const LANGUAGE_VALUES = ['english', 'portuguese'] as const;
export const LENGTH_VALUES = ['short', 'medium', 'long'] as const;
export const READING_LEVEL_VALUES = ['simple', 'standard'] as const;
export const SENTENCE_STYLE_VALUES = ['short_sentences', 'normal_sentences'] as const;
export const TOPIC_VALUES = ['none', 'politics', 'medical', 'finance'] as const;

// TypeScript Union Types derived strictly from Allowlists
export type PreferenceLanguage = (typeof LANGUAGE_VALUES)[number];
export type PreferenceAnswerLength = (typeof LENGTH_VALUES)[number];
export type PreferenceReadingLevel = (typeof READING_LEVEL_VALUES)[number];
export type PreferenceSentenceStyle = (typeof SENTENCE_STYLE_VALUES)[number];
export type PreferenceTopicAvoidance = (typeof TOPIC_VALUES)[number];

export interface ValidatedPreferences {
  language: PreferenceLanguage;
  answerLength: PreferenceAnswerLength;
  readingLevel: PreferenceReadingLevel;
  sentenceStyle: PreferenceSentenceStyle;
  topicAvoidance: PreferenceTopicAvoidance;
}

// ==========================================
// 2. EXPLICIT NAMED DEFAULTS (Requirement 3)
// ==========================================
export const DEFAULT_PREFERENCES: ValidatedPreferences = {
  language: 'english',
  answerLength: 'medium',
  readingLevel: 'standard',
  sentenceStyle: 'normal_sentences',
  topicAvoidance: 'none',
} as const;

// ==========================================
// 3. ZOD BOUNDED VALIDATION SCHEMAS
// ==========================================
export const LanguageSchema = z.enum(LANGUAGE_VALUES);
export const LengthSchema = z.enum(LENGTH_VALUES);
export const ReadingLevelSchema = z.enum(READING_LEVEL_VALUES);
export const SentenceStyleSchema = z.enum(SENTENCE_STYLE_VALUES);
export const TopicSchema = z.enum(TOPIC_VALUES);

/**
 * Safely validates a single raw preference value against a Zod schema allowlist.
 * If the value is missing, null, undefined, unallowed, or malicious,
 * it returns the explicit named default value.
 */
export function validateSinglePreference<T>(
  schema: z.ZodSchema<T>,
  rawValue: string | null | undefined,
  defaultValue: T
): T {
  if (!rawValue || typeof rawValue !== 'string') {
    return defaultValue;
  }

  const trimmed = rawValue.trim().toLowerCase();
  const parsed = schema.safeParse(trimmed);

  if (parsed.success) {
    return parsed.data;
  }

  // Discard invalid / malicious value and return named default
  return defaultValue;
}

/**
 * Validates all raw ENS text records against explicit allowlists.
 * Any missing, empty, or unallowed raw ENS value is safely discarded and replaced with its default.
 *
 * @param raw ENS text records key-value map
 * @returns ValidatedPreferences containing only trusted allowlisted enum values
 */
export function validateEnsPreferences(raw: RawPreferences): ValidatedPreferences {
  return {
    language: validateSinglePreference(
      LanguageSchema,
      raw[ENS_KEYS.LANGUAGE],
      DEFAULT_PREFERENCES.language
    ),
    answerLength: validateSinglePreference(
      LengthSchema,
      raw[ENS_KEYS.ANSWER_LENGTH],
      DEFAULT_PREFERENCES.answerLength
    ),
    readingLevel: validateSinglePreference(
      ReadingLevelSchema,
      raw[ENS_KEYS.READING_LEVEL],
      DEFAULT_PREFERENCES.readingLevel
    ),
    sentenceStyle: validateSinglePreference(
      SentenceStyleSchema,
      raw[ENS_KEYS.SENTENCE_STYLE],
      DEFAULT_PREFERENCES.sentenceStyle
    ),
    topicAvoidance: validateSinglePreference(
      TopicSchema,
      raw[ENS_KEYS.TOPIC_AVOIDANCE],
      DEFAULT_PREFERENCES.topicAvoidance
    ),
  };
}
