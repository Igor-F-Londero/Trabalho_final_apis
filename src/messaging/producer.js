const { conectarRabbitMQ } = require('./connection');
let channel;

async function getChannel() {
    if (!channel) {
        channel = await conectarRabbitMQ();
        // se a conexão cair, descarta o channel em cache pra forçar
        // reconexão na próxima publicação, em vez de ficar publicando
        // num channel morto pra sempre
        channel.on('close', () => { channel = null; });
        channel.on('error', () => { channel = null; });
    }
    return channel;
}

async function publicarMensagem(fila, mensagem) {
    const ch = await getChannel();
    ch.sendToQueue(fila, Buffer.from(JSON.stringify(mensagem)));
}

module.exports = { publicarMensagem };
