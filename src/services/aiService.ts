import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  const errors: Error[] = [];

  const processStandardMessages = (supportVision: boolean) => {
    return options.messages.map(m => {
      if (m.role === 'user' && m.attachedFileData && m.attachedFileType?.startsWith('image/') && supportVision) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Xem ảnh" },
            { type: "image_url", image_url: { url: m.attachedFileData } }
          ]
        };
      } else if (m.role === 'user' && m.attachedFileData && !m.attachedFileType?.startsWith('image/')) {
         return {
            role: m.role,
            content: `[Tệp đính kèm: ${m.attachedFileName}]\n(Lưu ý: Nội dung tệp có thể nằm trong prompt hoặc tệp không được hỗ trợ bởi model này)\n\n${m.content}`,
         };
      }
      return {
        role: m.role,
        content: m.content
      };
    });
  };

  // Provider 1: Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
        console.log("Đang thử Gemini API...");
        const systemMsg = options.messages.filter(m => m.role === 'system').map(m => m.content).join("\n");
        let geminiContents: any[] = [];
        
        for (const m of options.messages) {
            if (m.role === 'system') continue;
            const role = m.role === 'assistant' ? 'model' : 'user';
            let text = m.content || " ";
            const parts: any[] = [];
            
            if (m.attachedFileData) {
                const match = m.attachedFileData.match(/^data:([\w+/.-]+);base64,(.*)$/);
                if (match && m.attachedFileType?.startsWith('image/')) {
                    parts.push({
                        inlineData: {
                            data: match[2],
                            mimeType: match[1]
                        }
                    });
                } else if (!m.attachedFileType?.startsWith('image/')) {
                    text = `[Tệp đính kèm: ${m.attachedFileName || 'Tài liệu'}]\n\n${text}`;
                }
            }
            // fallback if legacy attachedFileString is present on the last message
            else if (options.attachedFileString && m === options.messages[options.messages.length - 1]) {
                const match = options.attachedFileString.match(/^data:([\w+/.-]+);base64,(.*)$/);
                if (match) {
                    if (match[1].startsWith('image/')) {
                        parts.push({
                            inlineData: {
                                data: match[2],
                                mimeType: match[1]
                            }
                        });
                    }
                }
            }
            
            parts.push({ text });

            if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
                // Merge parts if the same role is contiguous
                geminiContents[geminiContents.length - 1].parts.push(...parts);
            } else {
                geminiContents.push({ role, parts });
            }
        }

        const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: geminiContents.length > 0 ? geminiContents : [{ role: 'user', parts: [{ text: "Hello" }] }],
        config: {
            systemInstruction: systemMsg ? systemMsg : undefined,
            temperature: 0.7,
            responseMimeType: options.jsonMode ? "application/json" : "text/plain",
            httpOptions: {
               headers: { 'User-Agent': 'aistudio-build' }
            }
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

  // Provider 2: DeepSeek
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
            messages: processStandardMessages(false), // Deepseek chat chưa hỗ trợ file vision tốt
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

  // Provider 3: Grok
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
            messages: processStandardMessages(true),
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

  // Provider 4: OpenAI
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
            messages: processStandardMessages(true),
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

  if (errors.length > 0) {
      console.error("All AI providers failed. Errors:", errors);
      throw new Error("Không thể gọi được AI nào. Vui lòng kiểm tra lại quota hoặc thêm API key! Chi tiết lỗi được in trong console.");
  }

  throw new Error("Không có API key nào được cấu hình!");
};
