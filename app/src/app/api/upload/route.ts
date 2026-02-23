import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Auth check: verify beta cookie
        const cookie = request.headers.get('cookie') || '';
        const authorized = cookie.includes('beta_authorized=true');
        if (!authorized) {
          throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
        };
      },
      onUploadCompleted: async () => {
        // Could track uploads here if needed
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
