import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  jsonMode?: boolean;
}

/**
 * Thử gọi các API theo thứ tự: DeepSeek -> Gemini -> OpenAI -> Grok
 * Sử dụng tham số return format nếu là jsonMode.
 */
export const generateWithFallback = async (options: AIGenerateOptions): Promise<string> => {
  const errors: Error[] = [];

  // Provider 1: DeepSeek (Ưu tiên theo yêu cầu người dùng)
  if (process.env.DEEPSEEK_API_KEY) {
    try {
        console.log("Đang thử DeepSeek API...");
        const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: options.messages,
            temperature: 0.7,
            response_format: options.jsonMode ? { type: "json_object" } : undefined
        })
        });

        if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
        } else {
        const errorData = await res.text();
        errors.push(new Error(`DeepSeek error: ${res.status} ${errorData}`));
        }
    } catch (e: any) {
        errors.push(new Error(`DeepSeek network error: ${e.message}`));
    }
  }

  // Provider 2: Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
        console.log("Đang thử Gemini API...");
        // Ghép system prompt vào prompt của user (vì Gemini flash 2.5 API SDK mới chưa chắc dễ xài roles array, hoặc build prompt thủ công)
        const systemMsg = options.messages.filter(m => m.role === 'system').map(m => m.content).join("\n");
        const userMsg = options.messages.filter(m => m.role === 'user').map(m => m.content).join("\n");
        
        const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

        const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: options.jsonMode ? "application/json" : "text/plain",
        }
        });

        const text = response.text;
        if (text) {
          return text;
        } else {
          errors.push(new Error("Empty response from Gemini"));
        }
    } catch (e: any) {
        errors.push(new Error(`Gemini error: ${e.message}`));
    }
  }

  // Provider 3: OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
        console.log("Đang thử OpenAI API...");
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: options.messages,
            temperature: 0.7,
            response_format: options.jsonMode ? { type: "json_object" } : undefined
        })
        });

        if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
        } else {
        const errorData = await res.text();
        errors.push(new Error(`OpenAI error: ${res.status} ${errorData}`));
        }
    } catch (e: any) {
        errors.push(new Error(`OpenAI network error: ${e.message}`));
    }
  }

  // Provider 4: Grok
  if (process.env.GROK_API_KEY) {
    try {
        console.log("Đang thử Grok API...");
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
            model: "grok-2-latest", // Hoặc grok-beta
            messages: options.messages,
            temperature: 0.7,
            response_format: options.jsonMode ? { type: "json_object" } : undefined
        })
        });

        if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
        } else {
        const errorData = await res.text();
        errors.push(new Error(`Grok error: ${res.status} ${errorData}`));
        }
    } catch (e: any) {
        errors.push(new Error(`Grok network error: ${e.message}`));
    }
  }

  if (errors.length > 0) {
      console.error("All AI providers failed. Errors:", errors);
      throw new Error("Không thể gọi được AI nào. Vui lòng kiểm tra lại quota hoặc thêm API key! Chi tiết lỗi được in trong console.");
  }

  throw new Error("Không có API key nào được cấu hình!");
};
