const { conectarRabbitMQ } = require('../connection');

async function iniciar() {
    const channel = await conectarRabbitMQ();

    channel.consume('audit_log', (mensagem) => {
        const dados = JSON.parse(mensagem.content.toString());

        console.log('[audit_log]', dados);

        channel.ack(mensagem);
    });

    // sem isso, se a conexão cair o processo continua de pé mas para de
    // consumir mensagens silenciosamente, sem que o Docker perceba e reinicie
    channel.on('close', () => {
        console.error('Conexão com o RabbitMQ perdida, reconectando em 2s...');
        setTimeout(iniciar, 2000);
    });

    console.log('Consumer de audit_log aguardando mensagens...');
}

iniciar();
