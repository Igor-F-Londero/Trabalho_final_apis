const { conectarRabbitMQ } = require('./connection');
let channel;

async function getChannel() {
    if (!channel) {
        channel = await conectarRabbitMQ();
    }
    return channel;
}

async function publicarMensagem(fila, mensagem) {
    const ch = await getChannel();
    ch.sendToQueue(fila, Buffer.from(JSON.stringify(mensagem)));
}

module.exports = { publicarMensagem };
