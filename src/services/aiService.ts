export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachedFileData?: string;
  attachedFileName?: string;
  attachedFileType?: string;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  jsonMode?: boolean;
  attachedFileString?: string; // base64 data URL
}

/**
 * Thử gọi các API theo thứ tự: DeepSeek -> Gemini -> OpenAI -> Grok
 * Sử dụng tham số return format nếu là jsonMode.
 */
export const generateWithFallback = async (options: AIGenerateOptions): Promise<string> => {
  try {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Lỗi từ server: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw new Error(error.message || "Hệ thống quá tải. Hãy thử lại sau.");
  }
};
