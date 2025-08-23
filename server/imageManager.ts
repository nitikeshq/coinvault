import { ObjectStorageService } from "./objectStorage";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ImageManager {
  private objectStorageService: ObjectStorageService;

  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  async generateAndSaveNFTImage(metadata: any, theme: string, rarity: string, referenceImageUrl?: string): Promise<string> {
    try {
      // Generate AI image based on metadata
      let imagePrompt = `Create a high-quality, squared (1:1 aspect ratio) NFT artwork for: "${metadata.name}". 
      Theme: ${theme}, Rarity: ${rarity}. 
      Description: ${metadata.description}. 
      Style: Digital art, vibrant colors, detailed, professional NFT quality.`;
      
      if (referenceImageUrl) {
        imagePrompt += ` Use this reference image style and elements as inspiration.`;
      }

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      });

      const generatedImageUrl = imageResponse.data?.[0]?.url;
      if (!generatedImageUrl) {
        throw new Error('No image generated');
      }

      // Download and save image to object storage
      const imageBuffer = await this.downloadImage(generatedImageUrl);
      const fileName = `nft_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.png`;
      
      // Save to nft folder in object storage
      const savedImageUrl = await this.saveImageToStorage(imageBuffer, `nfts/${fileName}`);
      
      return savedImageUrl;
    } catch (error) {
      console.error("Error generating NFT image:", error);
      // Return placeholder if generation fails
      return `https://via.placeholder.com/512x512/1a1a2e/ffffff?text=${encodeURIComponent(metadata.name)}`;
    }
  }

  async generateAndSaveMemeImage(prompt: string, style: string): Promise<string> {
    try {
      const imagePrompt = `Create a funny meme image based on: "${prompt}". 
      Style: ${style}, humorous, engaging, meme format, high quality.
      Make it suitable for sharing and social media.`;

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

      // Download and save image to object storage
      const imageBuffer = await this.downloadImage(generatedImageUrl);
      const fileName = `meme_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.png`;
      
      // Save to memes folder in object storage
      const savedImageUrl = await this.saveImageToStorage(imageBuffer, `memes/${fileName}`);
      
      return savedImageUrl;
    } catch (error) {
      console.error("Error generating meme image:", error);
      // Return placeholder if generation fails
      return `https://via.placeholder.com/512x512/ff6b6b/ffffff?text=${encodeURIComponent('Meme Failed')}`;
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

  private async saveImageToStorage(imageBuffer: Buffer, filePath: string): Promise<string> {
    try {
      // Get upload URL from object storage
      const uploadUrl = await this.objectStorageService.getObjectEntityUploadURL();
      
      // Upload the image buffer directly
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: imageBuffer,
        headers: {
          'Content-Type': 'image/png',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
      }

      // Return the object path for accessing the image
      const objectPath = this.objectStorageService.normalizeObjectEntityPath(uploadUrl);
      
      return objectPath;
    } catch (error) {
      console.error("Error saving image to storage:", error);
      throw error;
    }
  }

  // Generate image URL for public access
  getImageUrl(objectPath: string): string {
    // Return the full URL for accessing the image
    return `/objects${objectPath}`;
  }
}