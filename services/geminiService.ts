import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available from the environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Gets the town/city name from geographical coordinates using the Gemini API.
 * @param lat - The latitude.
 * @param lon - The longitude.
 * @returns A promise that resolves to the town name as a string.
 */
export const getTownFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    const prompt = `Quelle est la ville ou la commune pour la latitude : ${lat}, longitude : ${lon} ? Répondez uniquement avec le nom de la ville ou de la commune. N'ajoutez aucun autre texte, formatage ou explication.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const townName = response.text.trim();

    if (!townName) {
      throw new Error("Received an empty response from the API.");
    }
    
    // Clean up potential markdown or unwanted characters, just in case.
    return townName.replace(/[`*]/g, '');

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to fetch town name from Gemini API.");
  }
};