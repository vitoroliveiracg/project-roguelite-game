/**
 * Estrutura de dados globais que persistem entre as "runs" (sonhos).
 */
export interface GlobalProgressData {
    globalLevel: number;
    globalXp: number;
    unlockedBrooches: string[];
    achievements: string[];
}

/** Porta Secundária para a persistência de dados. */
export interface ISaveRepository {
    saveProgress(data: GlobalProgressData): Promise<void>;
    loadProgress(): Promise<GlobalProgressData | null>;
}