import { GoogleGenerativeAI } from "@google/generative-ai";
import { LocationInfo } from "./types";

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not configured in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateResponse(
  question: string,
  locations: LocationInfo[]
): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Ensure locations is an array and not empty
    if (!Array.isArray(locations) || locations.length === 0) {
      console.error("No locations available for context");
      return "I apologize, but I don't have any location information available to answer your question.";
    }

    // Generate context from locations
    const context = generateLocationContext(locations);
    console.log("Generated context for AI:", context);

    const prompt = `
You are a helpful assistant that provides information about public services and facilities.
You have access to information about the following locations and their services.

Here is the available information:

${context}

User's question: ${question}

Please provide a clear and concise answer based on the available information.
If you can find the information in the context, provide it with specific details.
If the information needed is not available in the context, clearly state that.
`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    if (error instanceof Error) {
      return `I apologize, but I encountered an error: ${error.message}. Please try again later.`;
    }
    return "I apologize, but I encountered an error while processing your question. Please try again later.";
  }
}

function generateLocationContext(locations: LocationInfo[]): string {
  if (!Array.isArray(locations)) {
    console.error("Locations is not an array:", locations);
    return "";
  }

  const context = locations
    .map(
      (location) => `
LOCATION INFORMATION:
Name: ${location.name}
Type: ${location.type}
Address: ${location.address}
Operating Hours: ${location.operatingHours}
Contact Numbers: ${location.contactNumbers.join(", ")}
Description: ${location.description}

Available Services:
${location.services
  .map(
    (service) => `• ${service.name}
  - Description: ${service.description}
  - Requirements: ${service.requirements.join(", ")}
  - Estimated Time: ${service.estimatedTime}
  - Cost: ${service.cost}`
  )
  .join("\n")}

Available Facilities:
${location.facilities.map((facility) => `• ${facility}`).join("\n")}

Important Notes:
${location.importantNotes}

-------------------`
    )
    .join("\n\n");

  return context;
}

export async function generateFAQs(
  context: string
): Promise<Array<{ question: string; answer: string }>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Context about locations and services:
    ${context}

    Based on the provided context about locations and services, generate 10 frequently asked questions and their answers.
    The questions should cover various aspects like:
    - Location details and accessibility
    - Available services
    - Operating hours and procedures
    - Common concerns and requirements
    - Important information visitors should know

    Format each FAQ as a JSON object with "question" and "answer" fields.
    Return the FAQs as a JSON array.

    Make the answers informative, clear, and helpful for users seeking information about these locations and services.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the response as JSON
    const faqs = JSON.parse(response);

    // Validate the structure
    if (
      !Array.isArray(faqs) ||
      !faqs.every(
        (faq) =>
          typeof faq === "object" &&
          typeof faq.question === "string" &&
          typeof faq.answer === "string"
      )
    ) {
      throw new Error("Invalid FAQ format");
    }

    return faqs;
  } catch (error) {
    console.error("Error generating FAQs:", error);
    // Fallback to default FAQs if parsing fails
    return [
      {
        question: "What services are available at these locations?",
        answer:
          "Our locations offer various services based on their type. Please check the specific location details for a complete list of services.",
      },
      {
        question: "How can I find the nearest location?",
        answer:
          "You can view all our locations and their addresses in the locations section. Each listing includes detailed address information.",
      },
    ];
  }
}
