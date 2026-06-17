import {GoogleGenAI} from "@google/genai"

const ai = new GoogleGenAI({
    apiKey:process.env.GEMENI_API_KEY,
})

export async function generateEmbedding(text:string){
    const response:any = await ai.models.embedContent({
        model:"gemini-embedding-001",
        contents:text,
        config: {
    outputDimensionality: 768,
  },
    })
    return response.embeddings[0]?.values ?? []
}