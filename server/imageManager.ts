import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export class ImageManager {
  constructor() {
    // Ensure upload directories exist
    this.ensureDirectoryExists('uploads/memes');
    this.ensureDirectoryExists('uploads/nfts');
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async generateAndSaveMemeImage(prompt: string, style: string): Promise<string> {
    try {
      if (!openai) {
        console.warn("OpenAI API key not configured");
        throw new Error("AI image generation not available");
      }

      const imagePrompt = `Create a funny meme image based on: "${prompt}". 
      Style: ${style}, humorous, engaging, meme format, high quality, suitable for sharing on social media.
      Make it visually appealing with clear text and imagery.`;

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const generatedImageUrl = imageResponse.data?.[0]?.url;
      if (!generatedImageUrl) {
        throw new Error('No meme image generated');
      }

      // Download and save image locally
      const imageBuffer = await this.downloadImage(generatedImageUrl);
      const fileName = `meme_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.png`;
      const filePath = path.join('uploads/memes', fileName);
      
      fs.writeFileSync(filePath, imageBuffer);
      
      return `/uploads/memes/${fileName}`;
    } catch (error) {
      console.error("Error generating meme image:", error);
      throw error;
    }
  }

  async generateAndSaveNFTImage(metadata: any, characterPrompt: string): Promise<string> {
    try {
      if (!openai) {
        console.warn("OpenAI API key not configured");
        throw new Error("AI image generation not available");
      }

      if (!characterPrompt) {
        throw new Error("Admin must set NFT character first");
      }

      // Generate AI image based on character and metadata
      const imagePrompt = `Create a high-quality, unique NFT artwork based on the character: "${characterPrompt}". 
      Name: ${metadata.name}
      Description: ${metadata.description}
      Rarity: ${metadata.rarity}
      Attributes: ${JSON.stringify(metadata.attributes)}
      
      Style: Digital art, vibrant colors, detailed, professional NFT quality, 1:1 aspect ratio.
      Make this NFT unique and visually distinct from others while maintaining the core character theme.`;

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      });

      const generatedImageUrl = imageResponse.data?.[0]?.url;
      if (!generatedImageUrl) {
        throw new Error('No NFT image generated');
      }

      // Download and save image locally
      const imageBuffer = await this.downloadImage(generatedImageUrl);
      const fileName = `nft_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.png`;
      const filePath = path.join('uploads/nfts', fileName);
      
      fs.writeFileSync(filePath, imageBuffer);
      
      return `/uploads/nfts/${fileName}`;
    } catch (error) {
      console.error("Error generating NFT image:", error);
      throw error;
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Generate image URL for public access
  getImageUrl(imagePath: string): string {
    return imagePath;
  }
}