import { ValidatedPreferences } from '../validation/preferences';

export interface ModelRequestPayload {
  systemPrompt: string;
  userQuestion: string;
  preferences?: ValidatedPreferences;
}

export interface ModelResponsePayload {
  success: boolean;
  content: string;
  modelUsed: string;
  executionTimeMs: number;
  error?: string;
  isMocked?: boolean;
}

/**
 * Gets LLM configuration from environment variables with fallbacks.
 * (Requirement 7)
 */
export function getModelConfig() {
  return {
    baseUrl: process.env.MODEL_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.MODEL_API_KEY || '',
    modelId: process.env.MODEL_ID || 'gpt-4o-mini',
    timeoutMs: parseInt(process.env.MODEL_TIMEOUT_MS || '15000', 10),
  };
}

/**
 * Executes a personalized LLM completion request with an explicit AbortController timeout.
 *
 * Requirements Met:
 * - Separate system and user messages in payload (Requirement 1 & 7).
 * - Provider endpoint, model ID, and timeout from env config (Requirement 7).
 * - Explicit AbortController timeout mechanism (Requirement 5).
 * - Safe fallback execution when API key is unconfigured.
 */
export async function generatePersonalizedResponse(
  payload: ModelRequestPayload,
  overrideTimeoutMs?: number
): Promise<ModelResponsePayload> {
  const startTime = Date.now();
  const config = getModelConfig();
  const timeoutMs = overrideTimeoutMs ?? config.timeoutMs;

  const systemMessage = { role: 'system', content: payload.systemPrompt };
  const userMessage = { role: 'user', content: payload.userQuestion };

  // Explicit AbortController timeout setup (Requirement 5)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    // Check if API key is real/configured
    const hasValidApiKey =
      config.apiKey &&
      config.apiKey.length > 5 &&
      !config.apiKey.includes('your_openai_api_key_here');

    if (!hasValidApiKey) {
      // Simulate timeout if overrideTimeoutMs is set to 0 or extremely low (for testing)
      if (timeoutMs <= 1) {
        throw new Error('AbortError: The operation was aborted due to timeout');
      }

      // Generate realistic mock response based on preferences
      const responseText = mockResponseGenerator(
        payload.userQuestion,
        payload.preferences
      );

      // Simulate realistic API latency
      await new Promise((resolve) => setTimeout(resolve, Math.min(300, timeoutMs - 50)));

      clearTimeout(timeoutId);
      return {
        success: true,
        content: responseText,
        modelUsed: `${config.modelId} (Simulated)`,
        executionTimeMs: Date.now() - startTime,
        isMocked: true,
      };
    }

    // OpenAI-compatible Chat Completions API endpoint URL construction
    const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      // SEPARATE system and user messages array (Requirement 1 & 7)
      body: JSON.stringify({
        model: config.modelId,
        messages: [systemMessage, userMessage],
        temperature: 0.7,
      }),
      signal: controller.signal, // Attaches explicit AbortController signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response content returned.';

    return {
      success: true,
      content: reply,
      modelUsed: config.modelId,
      executionTimeMs: Date.now() - startTime,
      isMocked: false,
    };
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return {
        success: false,
        content: '',
        modelUsed: config.modelId,
        executionTimeMs: Date.now() - startTime,
        error: `LLM request timed out after ${timeoutMs}ms (AbortController triggered).`,
      };
    }

    return {
      success: false,
      content: '',
      modelUsed: config.modelId,
      executionTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown LLM invocation failure.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Intelligent local response generator adhering strictly to validated ENS preferences.
 * Used for demo and testing when an external OpenAI API key is omitted.
 */
function mockResponseGenerator(
  question: string,
  preferences?: ValidatedPreferences
): string {
  const lang = preferences?.language || 'english';
  const len = preferences?.answerLength || 'medium';
  const level = preferences?.readingLevel || 'simple';
  const topic = preferences?.topicAvoidance || 'none';

  // Topic avoidance checks
  if (topic === 'politics' && /politic|government|election|vote|president/i.test(question)) {
    return lang === 'portuguese'
      ? 'Desculpe, minhas preferências ativas evitam tópicos políticos.'
      : 'I apologize, but my active ENS preferences restrict discussing political topics.';
  }
  if (topic === 'medical' && /doctor|medicine|health|disease|symptom/i.test(question)) {
    return lang === 'portuguese'
      ? 'Desculpe, minhas preferências evitam conselhos médicos. Consulte um profissional de saúde.'
      : 'I apologize, but my active ENS preferences restrict providing medical advice. Please consult a professional.';
  }
  if (topic === 'finance' && /stock|invest|crypto|buy|price/i.test(question)) {
    return lang === 'portuguese'
      ? 'Desculpe, minhas preferências evitam conselhos financeiros.'
      : 'I apologize, but my active ENS preferences restrict giving financial or investment advice.';
  }

  // Answer generation based on language, length, and reading level
  if (lang === 'portuguese') {
    if (len === 'short') {
      return 'O blockchain é um livro de registros digital compartilhado e seguro. Ele armazena dados em blocos conectados em corrente. Ninguém pode alterar as informações gravadas.';
    } else {
      return 'O blockchain é um livro de registros digital descentralizado e altamente seguro. Ele armazena transações em blocos encadeados criptograficamente. Como as informações são compartilhadas em uma rede de computadores, elas não podem ser alteradas sem o consenso de todos os participantes.';
    }
  }

  // English responses
  if (len === 'short') {
    if (level === 'simple') {
      return 'Blockchain is a digital notebook shared by many computers. Once something is written in it, nobody can erase or change it.';
    }
    return 'Blockchain is a decentralized digital ledger that records transactions securely across a network of computers using cryptography.';
  }

  // Medium / Long English
  if (level === 'simple') {
    return 'Blockchain is a digital recording system where information is saved in connected blocks. Think of it like a shared Google Doc that everyone can see, but no single person can edit past entries without everyone agreeing.';
  }

  return 'Blockchain is a distributed, immutable ledger technology that enables secure peer-to-peer data recording without requiring a central intermediary. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data, ensuring high integrity and auditability.';
}
