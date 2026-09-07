const amqp = require('amqplib');

async function conectarRabbitMQ() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue('notifications', { durable: true });
    await channel.assertQueue('audit_log', { durable: true });

    return channel;
}

module.exports = { conectarRabbitMQ };
