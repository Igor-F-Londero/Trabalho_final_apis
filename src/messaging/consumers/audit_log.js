const { conectarRabbitMQ } = require('../connection');

async function iniciar() {
    const channel = await conectarRabbitMQ();

    channel.consume('audit_log', (mensagem) => {
        const dados = JSON.parse(mensagem.content.toString());

        console.log('[audit_log]', dados);

        channel.ack(mensagem);
    });

    console.log('Consumer de audit_log aguardando mensagens...');
}

iniciar();
