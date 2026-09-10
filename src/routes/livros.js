const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { publicarMensagem } = require("../messaging/producer");

const rotas = express.Router();
const prisma = new PrismaClient();

rotas.get("/", async (req, res) => {
  const dados = await prisma.livro.findMany();
  res.status(200).json(dados);
});

rotas.post("/", async (req, res) => {
  // destruturando o objeto req.body pra pegar os dados do livro  
  const { titulo, autor, anoPublicacao, preco } = req.body;

  // validar se os dados estão corretos antes de criar o livro
  if (
    titulo &&
    autor &&
    typeof anoPublicacao === "number" &&
    typeof preco === "number"
  ) {
    const livro = await prisma.livro.create({
      data: { titulo, autor, anoPublicacao, preco },
    });

    await publicarMensagem("notifications", { evento: "livro_criado", livro });
    await publicarMensagem("audit_log", { acao: "CREATE", livroId: livro.id, quando: new Date() });

    res.status(201).json(livro);
  } else {
    // return antes de res.status(400) pra evitar que o código continue executando após enviar a resposta
    return res.status(400).json({ erro: "Dados inválidos" });
  }
});

rotas.get("/:id", async (req, res) => {
  // req.params.id é uma string, então precisamos converter para número
  const idNumero = Number(req.params.id); // embrulhando o id string em number
  const livro = await prisma.livro.findUnique({ where: { id: idNumero } });

  if (livro === null) {
    return res.status(404).json({ erro: "Livro não encontrado" });
  }

  res.status(200).json(livro);
});

rotas.put("/:id", async (req, res) => {
  const idNumero = Number(req.params.id);
  const { titulo, autor, anoPublicacao, preco, disponivel } = req.body;
  const livro = await prisma.livro.findUnique({ where: { id: idNumero } });

  if (livro === null) {
    return res.status(404).json({ erro: "Livro não encontrado" });
  }

  const livroAtualizado = await prisma.livro.update({
    where: { id: idNumero },
    data: { titulo, autor, anoPublicacao, preco, disponivel },
  });

  await publicarMensagem("audit_log", { acao: "UPDATE", livroId: idNumero, quando: new Date() });

  res.status(200).json(livroAtualizado);
});

rotas.delete("/:id", async (req, res) => {
  const idNumero = Number(req.params.id);
  const livro = await prisma.livro.findUnique({ where: { id: idNumero } });

  if (livro === null) {
    return res.status(404).json({ erro: "Livro não encontrado" });
  }
  await prisma.livro.delete({ where: { id: idNumero } });

  await publicarMensagem("audit_log", { acao: "DELETE", livroId: idNumero, quando: new Date() });

  res.status(204).send();
});
module.exports = rotas;
