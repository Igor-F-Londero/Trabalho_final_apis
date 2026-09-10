const amqp = require('amqplib');

// mesmo com o healthcheck do compose marcando o rabbitmq como "healthy",
// o listener AMQP pode ainda não estar aceitando conexões — sem retry aqui,
// isso derruba o processo antes mesmo de começar (e em máquinas mais lentas
// isso é bem mais provável de acontecer)
async function conectarComRetry() {
    while (true) {
        try {
            return await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        } catch (erro) {
            console.error('Falha ao conectar no RabbitMQ, tentando de novo em 2s:', erro.message);
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
}

async function conectarRabbitMQ() {
    const conexao = await conectarComRetry();
    const canal = await conexao.createChannel();

    await canal.assertQueue('notifications', { durable: true });
    await canal.assertQueue('audit_log', { durable: true });

    conexao.on('error', (erro) => console.error('Erro na conexão com o RabbitMQ:', erro.message));

    return canal;
}

module.exports = { conectarRabbitMQ };
