import { env } from '../../config/env';

export interface GeminiGenerateOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiService {
  private static apiKey: string = env.GEMINI_API_KEY || '';
  private static defaultModel = 'gemini-3.5-flash-lite';
  private static fallbackModels = ['gemini-3.5-flash', 'gemini-3.6-flash'];

  public static setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Generates text content using Google Gemini REST API with automatic model fallback
   */
  public static async generateContent(prompt: string, options?: GeminiGenerateOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no ambiente. Configure GEMINI_API_KEY no .env ou nas variáveis da Vercel.');
    }

    const modelsToTry = options?.model 
      ? [options.model] 
      : [this.defaultModel, ...this.fallbackModels];

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const result = await this.callGeminiApi(prompt, model, options);
        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiService] Falha no modelo ${model}, tentando próximo fallback... Erro: ${err.message}`);
      }
    }

    throw lastError || new Error('Falha ao gerar conteúdo com Google Gemini.');
  }

  private static async callGeminiApi(
    prompt: string,
    model: string,
    options?: GeminiGenerateOptions
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents: any[] = [
      {
        parts: [{ text: prompt }]
      }
    ];

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature !== undefined ? options.temperature : 0.7,
        maxOutputTokens: options?.maxOutputTokens || 2048
      }
    };

    if (options?.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API HTTP ${response.status} ${response.statusText} (${model}): ${JSON.stringify(errorData)}`
      );
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error(`Resposta vazia retornada pelo modelo ${model}.`);
    }

    return textPart;
  }

  /**
   * Generates smart executive summary for commercial contracts and proposals
   */
  public static async summarizeContract(contractTitle: string, terms: any[]): Promise<string> {
    const prompt = `Analise o seguinte contrato comercial da DiskIngressos e gere um resumo executivo objetivo em português:
Título: ${contractTitle}
Termos Comerciais: ${JSON.stringify(terms, null, 2)}

Destaque:
1. Resumo do modelo de precificação e split;
2. Principais obrigações operacionais;
3. Ponto de atenção para o gestor comercial.`;

    return this.generateContent(prompt, {
      systemInstruction: 'Você é um assistente sênior de inteligência comercial da DiskIngressos.',
      temperature: 0.3
    });
  }

  /**
   * Generates commercial insights for an opportunity or negotiation
   */
  public static async generateOpportunityInsights(
    opportunityTitle: string,
    estimatedValue: number,
    producerSegment?: string
  ): Promise<string> {
    const prompt = `Gere 3 recomendações comerciais estratégicas para a seguinte oportunidade da DiskIngressos:
Oportunidade: ${opportunityTitle}
Valor Estimado: R$ ${estimatedValue.toLocaleString('pt-BR')}
Segmento: ${producerSegment || 'Geral'}`;

    return this.generateContent(prompt, {
      systemInstruction: 'Você é um consultor especialista em comercialização de eventos e ingressos.',
      temperature: 0.5
    });
  }
}
