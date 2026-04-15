export interface AI_Plan {
    thought: string;
    dialogue: string | null;
    new_methods?: Record<string, string>;
    code: string;
}

export interface ILLMService {
    generatePlan(perceptions: string, persona: string): Promise<AI_Plan | null>;
}