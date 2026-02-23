require("dotenv").config();
const express = require("express");

const { initDatabase } = require("./database");
const { createWebhookRouter } = require("./webhook");

const port = process.env.PORT || 3000;

async function start() {
  const app = express();
  app.use(express.json());

  // 1. Inicializa o Banco de Dados (Postgres do seu Easypanel)
  const db = await initDatabase();

  // 2. Configura a rota do Webhook
  // É aqui que a Evolution API vai enviar as mensagens
  app.use("/webhook", createWebhookRouter(db));

  // 3. Inicia o servidor
  app.listen(port, () => {
    console.log(`🚀 Servidor da CrescIX rodando na porta ${port}`);
    console.log(`📡 Endpoint de Webhook pronto: /webhook`);
  });
}

start().catch(err => {
  console.error("❌ Falha ao iniciar o servidor:", err);
});