import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const config = {
  dataDir: process.env.DATA_DIR || './data'
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }
    
    const imagePath = join(config.dataDir, 'images', filename);
    
    try {
      const imageBuffer = await fs.readFile(imagePath);
      
      // Determine content type based on file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      let contentType = 'image/jpeg';
      
      if (extension === 'png') {
        contentType = 'image/png';
      } else if (extension === 'gif') {
        contentType = 'image/gif';
      } else if (extension === 'webp') {
        contentType = 'image/webp';
      }
      
      return new NextResponse(imageBuffer as any, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        },
      });
    } catch (error) {
      console.error(`Failed to read image ${filename}:`, error);
      return new NextResponse('Image not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
