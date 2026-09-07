const { conectarRabbitMQ } = require('../connection');

async function iniciar() {
    const channel = await conectarRabbitMQ();

    channel.consume('notifications', (mensagem) => {
        const dados = JSON.parse(mensagem.content.toString());

        console.log('[notifications] Nova notificação recebida:', dados);

        channel.ack(mensagem);
    });

    console.log('Consumer de notifications aguardando mensagens...');
}

iniciar();
