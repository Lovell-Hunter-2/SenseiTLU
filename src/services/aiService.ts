import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '' });

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

  // 1: OpenRouter (Free tier models: gemini-2.0 or llama-3)
  if (process.env.OPENROUTER_API_KEY) {
    try {
        console.log("Đang thử OpenRouter API...");
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,
            "HTTP-Referer": window.location.origin || "https://senseitlu.vercel.app",
            "X-Title": "SenseiTLU"
        },
        body: JSON.stringify({
            model: "google/gemini-2.0-flash-lite-preview-02-05:free",
            messages: processStandardMessages(false),
            temperature: 0.7,
            response_format: options.jsonMode ? { type: "json_object" } : undefined
        })
        });

        if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
        } else {
        const errorData = await res.text();
        errors.push(new Error(`OpenRouter error: ${res.status} ${errorData}`));
        }
    } catch (e: any) {
        errors.push(new Error(`OpenRouter network error: ${e.message}`));
    }
  }

  // 2: Groq
  if (process.env.GROQ_API_KEY) {
    try {
        console.log("Đang thử Groq API...");
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY.trim()}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: processStandardMessages(false),
            temperature: 0.7,
            response_format: options.jsonMode ? { type: "json_object" } : undefined
        })
        });

        if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content.trim();
        } else {
        const errorData = await res.text();
        errors.push(new Error(`Groq error: ${res.status} ${errorData}`));
        }
    } catch (e: any) {
        errors.push(new Error(`Groq network error: ${e.message}`));
    }
  }

  // 3: Google Gemini (Native API)
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
                geminiContents[geminiContents.length - 1].parts.push(...parts);
            } else {
                geminiContents.push({ role, parts });
            }
        }

        const response = await gemini.models.generateContent({
        model: 'gemini-1.5-flash',
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

  // 4: DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    try {
        console.log("Đang thử DeepSeek API...");
        const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY.trim()}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: processStandardMessages(false),
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

  // 5: OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
        console.log("Đang thử OpenAI API...");
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY.trim()}`
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

  // 6: Grok
  if (process.env.GROK_API_KEY) {
    try {
        console.log("Đang thử Grok API...");
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROK_API_KEY.trim()}`
        },
        body: JSON.stringify({
            model: "grok-latest",
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

  // 7: Cohere
  if (process.env.COHERE_API_KEY) {
    try {
        console.log("Đang thử Cohere API...");
        const chatHistory = options.messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
          message: m.content
        }));
        const lastMessage = chatHistory.pop()?.message || "";
        const preamble = options.messages.find(m => m.role === 'system')?.content || "";

        const res = await fetch("https://api.cohere.com/v1/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.COHERE_API_KEY.trim()}`
        },
        body: JSON.stringify({
            model: "command-r-plus-08-2024",
            message: lastMessage,
            chat_history: chatHistory,
            preamble: preamble,
            temperature: 0.7,
        })
        });

        if (res.ok) {
        const data = await res.json();
        return data.text.trim();
        } else {
        const errorData = await res.text();
        errors.push(new Error(`Cohere error: ${res.status} ${errorData}`));
        }
    } catch (e: any) {
        errors.push(new Error(`Cohere network error: ${e.message}`));
    }
  }

  if (errors.length > 0) {
      console.error("All AI providers failed. Errors:", errors);
      const errorMsg = errors.map(e => {
        let msg = e.message;
        try {
           const match = msg.match(/({.*})/);
           if (match) {
               const parsed = JSON.parse(match[1]);
               msg = msg.substring(0, msg.indexOf('{')) + (parsed.error?.message || parsed.error || match[1]);
           }
        } catch(err) {}
        return msg;
      }).join('\n- ');
      throw new Error(`Hệ thống quá tải. Hãy thử lại sau.\n\nHãy tải tài liệu về và up lên gemini, yêu cầu tạo quiz để ôn tập thay cho chế độ làm đề thi này tạm thời.`);
  }

  throw new Error("Hệ thống quá tải. Hãy thử lại sau.\n\nHãy tải tài liệu về và up lên gemini, yêu cầu tạo quiz để ôn tập thay cho chế độ làm đề thi này tạm thời.");
};
