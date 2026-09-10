const { conectarRabbitMQ } = require('./connection');
let canal;

async function obterCanal() {
    if (!canal) {
        canal = await conectarRabbitMQ();
        // se a conexão cair, descarta o canal em cache pra forçar
        // reconexão na próxima publicação, em vez de ficar publicando
        // num canal morto pra sempre
        canal.on('close', () => { canal = null; });
        canal.on('error', () => { canal = null; });
    }
    return canal;
}

async function publicarMensagem(fila, mensagem) {
    const canalAtual = await obterCanal();
    canalAtual.sendToQueue(fila, Buffer.from(JSON.stringify(mensagem)));
}

module.exports = { publicarMensagem };
