
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyLead, SearchFilters } from "../types";

export const discoverLeads = async (filters: SearchFilters): Promise<CompanyLead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const exclusionSnippet = filters.excludedEiks && filters.excludedEiks.length > 0 
    ? `\nCRITICAL: DO NOT return any of these companies (EIKs): ${filters.excludedEiks.slice(0, 100).join(', ')}. Find NEW companies only.`
    : "";

  const prompt = `Search for active Bulgarian companies in the "${filters.industry}" industry located in "${filters.city}". 
  For each company, find the following details: 
  - Official Name
  - EIK (Unified Identification Code)
  - Valid Phone Number
  - Email Address
  - Physical Address
  - Official Website
  - Specific Industry Category
  
  Requirements:
  - Prioritize companies with active status and valid contact information. 
  - Ensure phones follow the Bulgarian format (+359 or 08...). 
  - Return exactly ${filters.limit} UNIQUE results.${exclusionSnippet}
  
  Return data in structured JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              eik: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              address: { type: Type.STRING },
              website: { type: Type.STRING },
              industry: { type: Type.STRING }
            },
            required: ["name", "phone", "email", "industry"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || '[]');
    return results.map((item: any, index: number) => ({
      ...item,
      id: `lead-${Date.now()}-${index}`,
      status: 'active',
      source: 'Google Search / Registry Grounding',
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Gemini Lead Discovery Error:", error);
    throw error;
  }
};

export const validateLeads = async (leads: CompanyLead[]): Promise<CompanyLead[]> => {
  if (leads.length === 0) return [];
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `Quickly verify these Bulgarian companies. Mark as 'active' or 'inactive' based on data consistency.
  Data: ${JSON.stringify(leads.map(l => ({ id: l.id, name: l.name, website: l.website, email: l.email })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              status: { type: Type.STRING }
            }
          }
        }
      }
    });

    const validations = JSON.parse(response.text || '[]');
    return leads.map(lead => {
      const v = validations.find((val: any) => val.id === lead.id);
      return v ? { ...lead, status: (v.status === 'active' || v.status === 'inactive' ? v.status : 'active') } : lead;
    });
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return leads;
  }
};
