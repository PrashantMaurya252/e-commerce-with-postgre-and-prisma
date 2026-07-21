import { GoogleGenAI } from '@google/genai';
import { Groq } from 'groq-sdk';
import { prisma } from '../config/prisma.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search for products based on a semantic query or description. Useful when the user is looking for items to buy.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_product_details",
      description: "Get detailed information about a specific product by its ID.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "The ID of the product" }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description: "Add a product to the user's cart.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "The ID of the product to add" }
        },
        required: ["productId"]
      }
    }
  }
];

const SYSTEM_PROMPT = `You are an intelligent AI shopping assistant for DesiMarket. 
You help users find products, provide details, and add items to their cart.
CRITICAL RULE: ONLY provide information about products that are explicitly returned by your tools. If a tool returns no results, you MUST tell the user that no products were found. DO NOT hallucinate, invent, or suggest products that were not provided by the tools.
CRITICAL RULE FOR TOOLS: To use a tool, you must ONLY use the native function calling API. Do not write out the tool call manually in text. Do not output any conversational text before calling a tool.
ALWAYS format your responses using beautiful Markdown. Use bullet points, bold text, and clear paragraphs to make your answers easy to read. 
Never output raw JSON to the user. Always interpret tool results and present them in a friendly, conversational, and highly readable format.
If you are asked about the services provided by this website, explain that you are an e-commerce platform offering a variety of products, fast delivery, and secure payments.`;

export const processUserMessage = async (userId: string | null, message: string, chatHistory: any[]) => {
  // We first add the user message to history
  const messages: any[] = [...chatHistory.map((m: any) => ({ role: m.role, content: m.content })), { role: "user", content: message }];

  let responseMessage: any;

  try {
    let response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      tools: tools,
      tool_choice: "auto",
    });

    console.log("Response in line 78", response)

    responseMessage = response.choices[0].message;

    console.log("Response message in line 81", responseMessage)

    // Handle tool calls
    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        console.log("Tool Call and function name", toolCall, functionName)
        const args = JSON.parse(toolCall.function.arguments);
        console.log("Args", args)
        let toolResponse = "";

        try {
          if (functionName === "search_products") {
            const embedRes = await ai.models.embedContent({
              model: 'gemini-embedding-001',
              contents: args.query,
              config: { outputDimensionality: 768 }
            });
            const embedding = embedRes.embeddings?.[0]?.values;
            if (!embedding) {
              toolResponse = "Failed to generate embeddings for search query.";
              continue;
            }

            console.log("Embeddings in line 108", embedding)

            // pgvector distance query
            let products: any[] = [];
            try {
              products = await prisma.$queryRawUnsafe(`
                SELECT p.id, p.title, p.description, p."sellingPrice", p."offerPrice", p."isOfferActive",
                       1 - (pe.embedding <=> $1::vector) AS similarity
                FROM "Product" p
                JOIN product_embeddings pe ON p.id = pe.product_id
                WHERE p."isDeleted" = false AND p."isActive" = true
                ORDER BY pe.embedding <=> $1::vector
                LIMIT 5;
              `, JSON.stringify(embedding));
            } catch (err) {
              console.error("Vector search error", err);
            }

            console.log("Products in line 124", products)

            // Fallback to text search if no embeddings exist for the products
            if (!products || products.length === 0) {
              const searchPattern = `%${args.query.split(' ')[0]}%`; // basic first-word text match
              products = await prisma.$queryRaw`
                 SELECT id, title, description, "sellingPrice", "offerPrice", "isOfferActive"
                 FROM "Product"
                 WHERE "isDeleted" = false AND "isActive" = true
                 AND (title ILIKE ${searchPattern} OR description ILIKE ${searchPattern} OR brand ILIKE ${searchPattern})
                 LIMIT 5;
               `;
            }

            toolResponse = JSON.stringify(products);

            console.log("Tool Response in line 138", toolResponse)

          } else if (functionName === "get_product_details") {
            const p = await prisma.product.findUnique({ where: { id: args.productId } });
            toolResponse = p ? JSON.stringify(p) : "Product not found";

          } else if (functionName === "add_to_cart") {
            if (!userId) {
              toolResponse = "Error: User is not logged in. Please ask the user to log in first.";
            } else {
              let cart = await prisma.cart.findUnique({ where: { userId } });
              if (!cart) cart = await prisma.cart.create({ data: { userId } });
              const p = await prisma.product.findUnique({ where: { id: args.productId } });
              if (!p || p.itemLeft <= 0) {
                toolResponse = p ? "Product out of stock" : "Product not found";
              } else {
                await prisma.cartItem.upsert({
                  where: { cartId_productId: { cartId: cart.id, productId: args.productId } },
                  update: { quantity: { increment: 1 } },
                  create: { cartId: cart.id, productId: args.productId, quantity: 1 }
                });
                toolResponse = "Product added to cart successfully.";
              }
            }
          } else {
            toolResponse = "Unknown tool called.";
          }
        } catch (e: any) {
          console.error("Tool execution error:", e);
          toolResponse = `Error executing tool: ${e.message}`;
        }

        messages.push({
          role: "tool",
          name: functionName,
          content: toolResponse,
          tool_call_id: toolCall.id,
        });
      }

      // Call Groq again with tool results
      response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
        tools: tools,
      });
      responseMessage = response.choices[0].message;
    }

    let finalContent = responseMessage.content || "";
    // Clean up any leaked function call tags from Llama 3 models
    finalContent = finalContent.replace(/<?function=.*?>.*?<\/function>/gs, "");
    finalContent = finalContent.replace(/<?function=.*?>/gs, "");
    return finalContent.trim();
  } catch (error) {
    console.error("Chat completion error", error);
    throw error;
  }
}
