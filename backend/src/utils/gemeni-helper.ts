import {GoogleGenAI} from "@google/genai"
import { prisma } from "../config/prisma.js"

const ai = new GoogleGenAI({
    apiKey:process.env.GOOGLE_GENAI_API_KEY,
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

export async function semanticProductSearch(query:string){
    const embedding = await generateEmbedding(query)
    const products = await prisma.$queryRaw`
    SELECT p.*,
    1 - (pe.embedding <=> ${`[${embedding.join(",")}]`}::vector) as similarity FROM product_embeddings pe JOIN "Product" p
    ON p.id = pe.product_id
    WHERE p.disabled = false
    ORDER BY pe.embedding <=> ${`[${embedding.join(",")}]`}::vector
    LIMIT 10
    `

    return products
}