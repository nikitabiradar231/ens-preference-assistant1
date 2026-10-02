import { NextRequest, NextResponse } from 'next/server';
import { validateEnsPreferences, DEFAULT_PREFERENCES } from '@/validation/preferences';
import { buildSystemPrompt } from '@/ai/instructions';
import { generatePersonalizedResponse } from '@/ai/model';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, rawPreferences } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question cannot be empty.' },
        { status: 400 }
      );
    }

    // Step 2 & 3: Validate preferences against allowlists & apply explicit defaults
    const preferences = rawPreferences
      ? validateEnsPreferences(rawPreferences)
      : DEFAULT_PREFERENCES;

    // Step 1: Build system prompt strictly from application-authored instructions (Requirement 1)
    const { systemPrompt, appliedInstructions } = buildSystemPrompt(preferences);

    // Step 5: Execute model request with explicit AbortController timeout (Requirement 5)
    const result = await generatePersonalizedResponse({
      systemPrompt,
      userQuestion: question.trim(),
      preferences,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'LLM execution failed.',
          executionTimeMs: result.executionTimeMs,
        },
        { status: 504 }
      );
    }

    return NextResponse.json({
      success: true,
      answer: result.content,
      appliedInstructions,
      modelUsed: result.modelUsed,
      executionTimeMs: result.executionTimeMs,
      isMocked: result.isMocked,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
