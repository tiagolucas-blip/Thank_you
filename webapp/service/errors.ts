/**
 * Erro de serviço com um código estável (não traduzido), igual nas 3
 * implementações de IRecognitionService. O controlador é responsável por
 * mapear o código para uma chave i18n — nunca mostrar `message` ao
 * utilizador, que serve só para logs/depuração.
 */
export class ServiceError extends Error {
    public readonly code: string;
    public readonly field?: string;

    constructor(code: string, field?: string) {
        super(code);
        this.name = "ServiceError";
        this.code = code;
        this.field = field;
    }
}
