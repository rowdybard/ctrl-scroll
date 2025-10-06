import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { config } from './config';
import { atomicWrite } from './atomicWrite';

interface ImageGenerationResult {
  url: string;
  prompt: string;
  localPath: string;
}

interface ArticleImages {
  hero: ImageGenerationResult;
  context?: ImageGenerationResult;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateArticleImages(
  title: string,
  content: string,
  topic: string
): Promise<ArticleImages> {
  try {
    // Generate hero image prompt
    const heroPrompt = await generateImagePrompt(title, content, 'hero');
    
    // Generate context image prompt
    const contextPrompt = await generateImagePrompt(title, content, 'context');
    
    // Generate both images
    const [heroImage, contextImage] = await Promise.all([
      generateImage(heroPrompt, `${title}-hero`),
      generateImage(contextPrompt, `${title}-context`)
    ]);
    
    return {
      hero: heroImage,
      context: contextImage
    };
  } catch (error) {
    console.error('Failed to generate article images:', error);
    // Return fallback images
    return {
      hero: await generateFallbackImage(title, 'hero'),
      context: await generateFallbackImage(title, 'context')
    };
  }
}

async function generateImagePrompt(
  title: string,
  content: string,
  type: 'hero' | 'context'
): Promise<string> {
  const systemPrompt = `You are an expert at creating image prompts for AI art generation. 
Create a detailed, visual prompt for a ${type} image that illustrates the article content.
Focus on concrete, visual elements. Avoid abstract concepts or opinions.
Style: Clean, modern, professional. No text overlays.`;

  const userPrompt = `Article title: "${title}"
Article content: "${content.substring(0, 500)}..."

Create a prompt for a ${type} image that visually represents this content.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || generateDefaultPrompt(title, type);
  } catch (error) {
    console.warn('Failed to generate image prompt:', error);
    return generateDefaultPrompt(title, type);
  }
}

function generateDefaultPrompt(title: string, type: 'hero' | 'context'): string {
  const basePrompt = type === 'hero' 
    ? 'Modern professional illustration, clean design, technology theme'
    : 'Supporting visual element, minimalist style, professional';
  
  return `${basePrompt}, ${title.toLowerCase()}, high quality, digital art`;
}

async function generateImage(prompt: string, filename: string): Promise<ImageGenerationResult> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural'
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Download and save the image
    const localPath = await downloadAndSaveImage(imageUrl, filename);
    
    return {
      url: imageUrl,
      prompt: prompt,
      localPath: localPath
    };
  } catch (error) {
    console.error(`Failed to generate image for ${filename}:`, error);
    throw error;
  }
}

async function downloadAndSaveImage(imageUrl: string, filename: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(buffer);
  
  // Optimize image with sharp
  const optimizedBuffer = await sharp(imageBuffer)
    .resize(800, 600, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Save to disk
  const imagesDir = join(config.dataDir, 'images');
  const imagePath = join(imagesDir, `${filename}.jpg`);
  
  await fs.mkdir(imagesDir, { recursive: true });
  await atomicWrite(imagePath, optimizedBuffer);
  
  return imagePath;
}

async function generateFallbackImage(title: string, type: 'hero' | 'context'): Promise<ImageGenerationResult> {
  // Create a simple placeholder image
  const canvas = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 240, g: 240, b: 240 }
    }
  })
  .png()
  .toBuffer();

  const imagesDir = join(config.dataDir, 'images');
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '-')}-${type}-fallback`;
  const imagePath = join(imagesDir, `${filename}.png`);
  
  await fs.mkdir(imagesDir, { recursive: true });
  await atomicWrite(imagePath, canvas);
  
  return {
    url: `/api/images/${filename}.png`,
    prompt: `Fallback ${type} image for ${title}`,
    localPath: imagePath
  };
}

export async function generateRichContext(
  title: string,
  content: string,
  topic: string
): Promise<{
  background: string;
  keyPoints: string[];
  relatedTopics: string[];
  timeline?: string[];
}> {
  try {
    const systemPrompt = `You are a factual content researcher. Provide objective context about the topic.
Do not express opinions or judgments. Focus on verifiable facts and information.
Structure your response as JSON with: background, keyPoints, relatedTopics, timeline.`;

    const userPrompt = `Article title: "${title}"
Article content: "${content.substring(0, 800)}..."

Provide factual context and background information about this topic.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const contextText = response.choices[0]?.message?.content || '';
    
    try {
      return JSON.parse(contextText);
    } catch {
      // Fallback if JSON parsing fails
      return {
        background: contextText.substring(0, 300),
        keyPoints: extractKeyPoints(contextText),
        relatedTopics: extractRelatedTopics(title, topic),
        timeline: []
      };
    }
  } catch (error) {
    console.error('Failed to generate rich context:', error);
    return {
      background: `Background information about ${topic}`,
      keyPoints: [`Key development in ${topic}`, `Recent updates in ${topic}`],
      relatedTopics: [topic, 'technology', 'innovation'],
      timeline: []
    };
  }
}

function extractKeyPoints(text: string): string[] {
  const sentences = text.split('.').filter(s => s.trim().length > 20);
  return sentences.slice(0, 5).map(s => s.trim());
}

function extractRelatedTopics(title: string, topic: string): string[] {
  const words = title.toLowerCase().split(' ').filter(w => w.length > 3);
  return [...new Set([topic, ...words.slice(0, 4)])];
}
