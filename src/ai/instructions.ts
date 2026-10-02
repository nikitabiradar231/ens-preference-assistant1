import {
  PreferenceLanguage,
  PreferenceAnswerLength,
  PreferenceReadingLevel,
  PreferenceSentenceStyle,
  PreferenceTopicAvoidance,
  ValidatedPreferences,
} from '../validation/preferences';

// =========================================================================
// APPLICATION-AUTHORED TRUSTED INSTRUCTION MAPPINGS (Requirement 1)
//
// Critical Security Rule:
// Raw ENS text values are NEVER inserted into system prompts.
// Only predefined, static, application-authored strings in these dictionaries
// are used to form instructions.
// =========================================================================

export const LANGUAGE_INSTRUCTIONS: Record<PreferenceLanguage, string> = {
  english: 'Respond strictly in English.',
  portuguese: 'Respond strictly in Portuguese (Português).',
};

export const LENGTH_INSTRUCTIONS: Record<PreferenceAnswerLength, string> = {
  short: 'Keep your answer brief, clear, and direct (maximum 2-3 sentences).',
  medium: 'Provide a balanced response with moderate length and structured explanation.',
  long: 'Provide a comprehensive, detailed, and visually structured in-depth explanation.',
};

export const READING_LEVEL_INSTRUCTIONS: Record<PreferenceReadingLevel, string> = {
  simple: 'Use simple vocabulary, accessible language, and clear analogies suitable for beginners.',
  standard: 'Use standard terminology, clear reasoning, and professional standard explanations.',
};

export const SENTENCE_STYLE_INSTRUCTIONS: Record<PreferenceSentenceStyle, string> = {
  short_sentences: 'Use short, succinct sentences. Avoid long, complex multi-clause sentence structures.',
  normal_sentences: 'Use natural sentence structure with standard variety and flow.',
};

export const TOPIC_AVOIDANCE_INSTRUCTIONS: Record<PreferenceTopicAvoidance, string> = {
  none: 'No topic avoidance restrictions specified.',
  politics: 'Do not discuss political opinions, political parties, or partisan topics. Respectfully decline if asked.',
  medical: 'Do not provide medical advice or health diagnosis. Remind the user to consult a healthcare professional.',
  finance: 'Do not provide financial, investment, or trading advice.',
};

export interface SystemPromptResult {
  systemPrompt: string;
  appliedInstructions: {
    language: string;
    answerLength: string;
    readingLevel: string;
    sentenceStyle: string;
    topicAvoidance: string;
  };
}

/**
 * Builds the system prompt ONLY from trusted application-authored instruction strings.
 *
 * Security Guarantee:
 * - NO raw ENS strings are ever interpolated into the output.
 * - System instructions are cleanly separated from user content.
 *
 * @param preferences ValidatedPreferences object containing allowlisted enum values
 * @returns SystemPromptResult with full prompt and breakdown of application instructions
 */
export function buildSystemPrompt(preferences: ValidatedPreferences): SystemPromptResult {
  const langInst = LANGUAGE_INSTRUCTIONS[preferences.language];
  const lenInst = LENGTH_INSTRUCTIONS[preferences.answerLength];
  const readInst = READING_LEVEL_INSTRUCTIONS[preferences.readingLevel];
  const sentInst = SENTENCE_STYLE_INSTRUCTIONS[preferences.sentenceStyle];
  const topicInst = TOPIC_AVOIDANCE_INSTRUCTIONS[preferences.topicAvoidance];

  const lines = [
    'You are a helpful, accurate, and safe AI assistant.',
    'Follow these trusted application-authored persona directives when responding to the user:',
    `- Language Directive: ${langInst}`,
    `- Response Length Directive: ${lenInst}`,
    `- Reading Level Directive: ${readInst}`,
    `- Sentence Style Directive: ${sentInst}`,
  ];

  if (preferences.topicAvoidance !== 'none') {
    lines.push(`- Topic Avoidance Directive: ${topicInst}`);
  }

  const systemPrompt = lines.join('\n');

  return {
    systemPrompt,
    appliedInstructions: {
      language: langInst,
      answerLength: lenInst,
      readingLevel: readInst,
      sentenceStyle: sentInst,
      topicAvoidance: topicInst,
    },
  };
}
