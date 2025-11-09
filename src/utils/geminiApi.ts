import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyAJjGgRwU0pXA2CbmdnoSTmB1dzWsCiLuI';

export class GeminiAPI {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      },
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const enhancedPrompt = `You are a concise code assistant. Provide direct, helpful answers without unnecessary explanations. Format code blocks properly using markdown syntax.

User query: ${prompt}`;

      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  async *generateStreamResponse(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      const enhancedPrompt = `You are a concise code assistant. Provide direct, helpful answers without unnecessary explanations. Format code blocks properly using markdown syntax.

User query: ${prompt}`;

      const result = await this.model.generateContentStream(enhancedPrompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      console.error('Error generating stream response:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }
}

export const geminiApi = new GeminiAPI();