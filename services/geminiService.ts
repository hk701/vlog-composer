import { GoogleGenAI } from "@google/genai";
import { ScriptRequest } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateFoodScript = async (request: ScriptRequest): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const prompt = `
    你是一位拥有百万粉丝的专业美食自媒体导演和编剧。请根据以下要求，为一个美食视频撰写一份详细的拍摄分镜脚本。

    **需求详情：**
    - **视频主题/菜品：** ${request.topic}
    - **视频风格：** ${request.style} (例如：ASMR、快节奏剪辑、治愈系 Vlog、硬核教程、探店)
    - **预估时长：** ${request.duration}
    - **文案语气：** ${request.tone} (例如：幽默风趣、专业严谨、温柔治愈、热情高亢)
    - **核心亮点/关键词：** ${request.keyPoints}

    **输出格式要求（请使用 Markdown）：**

    # [视频标题] (请起3个具有爆款潜质的标题供选择)

    ## 1. 视频摘要
    简要描述视频的核心逻辑和情感基调。

    ## 2. 拍摄准备
    - **道具/食材：** 
    - **场景/光线建议：**

    ## 3. 分镜脚本 (Table Format)
    请创建一个表格，包含以下列：
    | 时间 (秒) | 景别/画面内容 | 运镜/动作 | 台词/文案 | 音效/BGM |
    |---|---|---|---|---|
    | ... | ... | ... | ... | ... |

    ## 4. 运营建议
    - **封面图建议：**
    - **推荐话题标签 (Hashtags)：**
    - **评论区互动话术：**

    请确保内容生动、画面感强，并特别注意美食的色泽和声音描写，以吸引观众的食欲。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7, // Slightly creative
        topK: 40,
        topP: 0.95,
      }
    });

    return response.text || "生成脚本时出现问题，请重试。";
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("无法连接到 AI 服务，请检查网络或 API Key。");
  }
};
