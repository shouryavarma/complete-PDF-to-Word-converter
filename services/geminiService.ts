import { GoogleGenAI, Type } from "@google/genai";
import { DocStructure, DocElementType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Converts a File object to a Base64 string suitable for the API.
 */
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Sends the PDF to Gemini and requests a structured JSON representation of the content.
 */
export const extractContentFromPdf = async (file: File): Promise<DocStructure> => {
  try {
    const base64Data = await fileToGenerativePart(file);

    const prompt = `
      Analyze the attached PDF document. 
      Extract the text content while preserving the structural hierarchy.
      Return a JSON object containing a list of elements.
      
      For each element, identify if it is a main heading (h1), sub-heading (h2, h3), a standard paragraph (p), a bullet point (bullet), or a code block (code).
      Clean up any artifacts like page numbers or headers/footers if they interrupt the flow.
      Ensure the content is plain text strings.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: [
                      DocElementType.HEADING_1,
                      DocElementType.HEADING_2,
                      DocElementType.HEADING_3,
                      DocElementType.PARAGRAPH,
                      DocElementType.BULLET,
                      DocElementType.CODE,
                    ]
                  },
                  content: {
                    type: Type.STRING
                  }
                },
                required: ["type", "content"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI model.");

    const data = JSON.parse(text) as DocStructure;
    return data;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to process PDF with AI.");
  }
};
