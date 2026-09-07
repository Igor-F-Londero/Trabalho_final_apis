const express = require('express');
const app = express();
app.use(express.json());


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/livros',require(('./routes/livros')))
module.exports =app;




