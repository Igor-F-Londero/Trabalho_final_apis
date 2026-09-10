const { conectarRabbitMQ } = require('../connection');

async function iniciar() {
    const canal = await conectarRabbitMQ();

    // CONSUMER_DELAY_MS: atraso proposital antes do ack, só pra demonstração
    // (deixar a mensagem visível na fila por alguns segundos); 0 = desligado
    const atrasoMs = Number(process.env.CONSUMER_DELAY_MS || 0);

    canal.consume('notifications', async (mensagem) => {
        const dados = JSON.parse(mensagem.content.toString());

        console.log('[notifications] Nova notificação recebida:', dados);

        if (atrasoMs > 0) await new Promise((resolve) => setTimeout(resolve, atrasoMs));

        canal.ack(mensagem);
    });

    // sem isso, se a conexão cair o processo continua de pé mas para de
    // consumir mensagens silenciosamente, sem que o Docker perceba e reinicie
    canal.on('close', () => {
        console.error('Conexão com o RabbitMQ perdida, reconectando em 2s...');
        setTimeout(iniciar, 2000);
    });

    console.log('Consumer de notifications aguardando mensagens...');
}

iniciar();
