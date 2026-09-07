const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { publicarMensagem } = require("../messaging/producer");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const dados = await prisma.livro.findMany();
  res.status(200).json(dados);
});

router.post("/", async (req, res) => {
  // destruturando o objeto req.body para pegar os dados do livro
  const { titulo, autor, anoPublicacao, preco } = req.body;

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
    return res.status(400).json({ error: "Dados inválidos" });
  }
});

router.get("/:id", async (req, res) => {
  // req.params.id é uma string, então precisamos converter para número
  const idNumber = Number(req.params.id); // embrulhando o id string em number
  const livro = await prisma.livro.findUnique({ where: { id: idNumber } });

  if (livro === null) {
    return res.status(404).json({ erro: "ERRO:NULO" });
  }

  res.status(200).json(livro);
});

router.put("/:id", async (req, res) => {
  const idNumber = Number(req.params.id);
  const { titulo, autor, anoPublicacao, preco, disponivel } = req.body;
  const livro = await prisma.livro.findUnique({ where: { id: idNumber } });

  if (livro === null) {
    return res.status(404).json({ erro: "ERRO:NULO" });
  }

  const seExiste = await prisma.livro.update({
    where: { id: idNumber },
    data: { titulo, autor, anoPublicacao, preco, disponivel },
  });

  await publicarMensagem("audit_log", { acao: "UPDATE", livroId: idNumber, quando: new Date() });

  res.status(200).json(seExiste);
});

router.delete("/:id", async (req, res) => {
  const idNumber = Number(req.params.id);
  const livro = await prisma.livro.findUnique({ where: { id: idNumber } });

  if (livro === null) {
    return res.status(404).json({ erro: "ERRO:NULO" });
  }
  const seExiste = await prisma.livro.delete({ where: { id: idNumber } });

  await publicarMensagem("audit_log", { acao: "DELETE", livroId: idNumber, quando: new Date() });

  res.status(204).send();
});
module.exports = router;
