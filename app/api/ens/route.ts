import { NextRequest, NextResponse } from 'next/server';
import { fetchEnsPreferences } from '@/ens/preferences';
import { validateEnsPreferences } from '@/validation/preferences';
import { buildSystemPrompt } from '@/ai/instructions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawEnsName = searchParams.get('name');

    if (!rawEnsName) {
      return NextResponse.json(
        { error: 'Missing "name" query parameter.' },
        { status: 400 }
      );
    }

    // Step 1: Normalize ENS name using ENSIP-15 before resolution (Requirement 4)
    // Step 2: Read ENS text records from Sepolia
    const { normalizedEnsName, rawRecords, isMockProfile } = await fetchEnsPreferences(rawEnsName);

    // Step 3 & 2: Validate against allowlists & apply explicit defaults (Requirement 2 & 3)
    const validatedPreferences = validateEnsPreferences(rawRecords);

    // Step 1: Map validated values to application-authored instructions only (Requirement 1)
    const { systemPrompt, appliedInstructions } = buildSystemPrompt(validatedPreferences);

    return NextResponse.json({
      success: true,
      rawEnsName,
      normalizedEnsName,
      rawRecords,
      validatedPreferences,
      appliedInstructions,
      systemPrompt,
      isMockProfile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve ENS preferences.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
