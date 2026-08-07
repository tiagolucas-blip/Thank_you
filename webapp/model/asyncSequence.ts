/**
 * Guarda de sequenciamento para pedidos assíncronos disparados por
 * interação repetida do utilizador (pesquisa "ao vivo", filtros). Sem
 * isto, uma resposta a um pedido mais antigo que chegue depois de uma
 * mais recente (rede real, ex.: DATA_SOURCE=vercel-api) sobrepõe-se ao
 * resultado correto. `run()` só devolve o resultado se, no momento em
 * que a promise resolve, ainda for o pedido mais recente lançado por
 * esta guarda — caso contrário devolve `undefined` e o chamador deve
 * ignorar a resposta.
 */
export class LatestRequestGuard {
    private token = 0;

    public async run<T>(operation: () => Promise<T>): Promise<T | undefined> {
        const currentToken = ++this.token;
        const result = await operation();
        return currentToken === this.token ? result : undefined;
    }
}
