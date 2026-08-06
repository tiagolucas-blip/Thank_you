import type IRecognitionService from "./IRecognitionService";
import { DATA_SOURCE } from "./runtimeConfig.generated";
import MockRecognitionService from "./mock/MockRecognitionService";
import VercelApiRecognitionService from "./vercel/VercelApiRecognitionService";
import ODataRecognitionService from "./odata/ODataRecognitionService";

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
        case "vercel-api":
            instance = new VercelApiRecognitionService();
            break;
        case "odata":
            instance = new ODataRecognitionService();
            break;
        case "mock":
        default:
            instance = new MockRecognitionService();
            break;
    }

    return instance;
}
