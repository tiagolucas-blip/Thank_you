import type IRecognitionService from "./IRecognitionService";
import { DATA_SOURCE } from "./runtimeConfig.generated";

let instance: IRecognitionService | undefined;

/**
 * Único ponto de seleção da implementação da camada de dados, por
 * DATA_SOURCE. Controllers nunca devem importar Mock/VercelApi/OData
 * diretamente — ver CLAUDE.md secção 6 ("nunca chames plataforma
 * diretamente a partir de controllers").
 */
export async function getRecognitionService(): Promise<IRecognitionService> {
    if (instance) {
        return instance;
    }

    switch (DATA_SOURCE) {
        case "vercel-api": {
            const { default: VercelApiRecognitionService } = await import("./vercel/VercelApiRecognitionService");
            instance = new VercelApiRecognitionService();
            break;
        }
        case "odata": {
            const { default: ODataRecognitionService } = await import("./odata/ODataRecognitionService");
            instance = new ODataRecognitionService();
            break;
        }
        case "mock":
        default: {
            const { default: MockRecognitionService } = await import("./mock/MockRecognitionService");
            instance = new MockRecognitionService();
            break;
        }
    }

    return instance;
}
