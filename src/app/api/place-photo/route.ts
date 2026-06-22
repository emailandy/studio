import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const photoReference = searchParams.get('photo_reference');
  const maxwidth = searchParams.get('maxwidth') || '800';
  const maxheight = searchParams.get('maxheight') || '600';

  if (!photoReference) {
    return new NextResponse('Missing photo_reference', { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new NextResponse('Missing API Key on server', { status: 500 });
  }

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&maxheight=${maxheight}&photoreference=${photoReference}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse('Failed to fetch image from Google', { status: response.status });
    }

    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for a day
      },
    });
  } catch (error) {
    console.error('Error proxying place photo:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
