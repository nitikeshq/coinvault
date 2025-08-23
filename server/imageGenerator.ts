import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMemeImage(prompt: string): Promise<string> {
  try {
    console.log('Generating meme image for prompt:', prompt);
    
    // Enhanced prompt for meme generation
    const enhancedPrompt = `Create a funny and engaging meme image for: "${prompt}". The image should be humorous, eye-catching, and suitable for social media sharing. Make it colorful and attention-grabbing with clear visual elements.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Download and save the image
    const filename = `meme_${randomUUID()}.png`;
    const imagePath = await downloadAndSaveImage(imageUrl, filename, 'memes_images');
    
    console.log('Meme image generated successfully:', imagePath);
    return `/memes_images/${filename}`;
  } catch (error) {
    console.error('Error generating meme image:', error);
    throw new Error('Failed to generate meme image');
  }
}

export async function generateNFTImage(name: string, description: string, rarity: string): Promise<string> {
  try {
    console.log('Generating NFT image for:', name);
    
    // Enhanced prompt for NFT generation
    const enhancedPrompt = `Create a high-quality, artistic NFT image of ${name}. ${description}. The image should be ${rarity.toLowerCase()} quality with mystical and unique characteristics. Make it visually striking, detailed, and worthy of being a collectible digital asset. Style: digital art, fantasy, high resolution.`;
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Download and save the image
    const filename = `nft_${randomUUID()}.png`;
    const imagePath = await downloadAndSaveImage(imageUrl, filename, 'NFTS');
    
    console.log('NFT image generated successfully:', imagePath);
    return `/NFTS/${filename}`;
  } catch (error) {
    console.error('Error generating NFT image:', error);
    throw new Error('Failed to generate NFT image');
  }
}

async function downloadAndSaveImage(imageUrl: string, filename: string, directory: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const directoryPath = path.join(process.cwd(), directory);
    
    // Ensure directory exists
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
    
    const filePath = path.join(directoryPath, filename);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    return filePath;
  } catch (error) {
    console.error('Error downloading and saving image:', error);
    throw error;
  }
}