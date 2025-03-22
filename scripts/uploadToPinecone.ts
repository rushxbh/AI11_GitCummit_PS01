import fs from "fs";
import pdf from "pdf-parse";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!});
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

/**
 * Generate embeddings for a given text using Gemini's textembedding-gecko model.
 */
async function getEmbedding(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: "models/embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Extracts text from a PDF and splits it into chunks.
 */
async function processPDF(pdfPath: string) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  const text = data.text;

  // Split text into 500-character chunks
  const chunks = text.match(/.{1,500}/g) || [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    if (!chunk) continue;

    console.log(`Processing chunk ${i + 1}...`);
    const embedding = await getEmbedding(chunk);

    await index.upsert([
      {
        id: `faq-${i}`,
        values: embedding,
        metadata: { text: chunk },
      },
    ]);

    console.log(`✅ Uploaded chunk ${i + 1} to Pinecone.`);
  }
}

/**
 * Run the script
 */
processPDF("FAQs.pdf")
  .then(() => console.log("🚀 PDF Processing and Uploading Done!"))
  .catch((error) => console.error("Error:", error));
