import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SettingsSchema } from '../../../domain/settings/schema';
import { getSettings, setSettings } from '../../../domain/settings/util';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings format', details: parsed.error.errors }, { status: 400 });
    }
    await setSettings(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
