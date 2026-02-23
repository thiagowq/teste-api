const axios = require("axios");
const express = require("express");
const router = express.Router();

const { transcreverAudio } = require("./whisper");
const { enviarMensagemTexto } = require("./service");
const { dispatchText } = require("./dispatcher");

function createWebhookRouter(db) {
  // A Evolution não exige verificação de GET como a Meta, 
  // mas mantemos para evitar erros se você testar via browser.
  router.get("/", (req, res) => {
    res.send("Webhook da CrescIX está online! 🚀");
  });

  // Função para pegar ou criar o usuário no seu Postgres/MySQL
  async function getUserId(phone_number) {
    const [existingUser] = await db.query("SELECT id FROM users WHERE phone_number = ?", [phone_number]);
    if (existingUser.length === 0) {
      const [result] = await db.query("INSERT INTO users (phone_number) VALUES (?)", [phone_number]);
      return result.insertId;
    }
    return existingUser[0].id;
  }

  router.post("/", async (req, res) => {
    try {
      // 1. Extração de dados no padrão Evolution API
      const data = req.body.data;
      const event = req.body.event;

      // Ignora se não for uma mensagem recebida ou se vier de um grupo (opcional)
      if (event !== "messages.upsert" || data?.key?.fromMe) {
        return res.sendStatus(200);
      }

      // Extrai o número (formato: 5535999999999@s.whatsapp.net)
      const raw_phone = data?.key?.remoteJid;
      if (!raw_phone) return res.sendStatus(200);

      const phone_number = raw_phone.split("@")[0]; // Pega apenas os números
      const userId = await getUserId(phone_number);
      const reply = (text) => enviarMensagemTexto(phone_number, text);

      // 2. Tratamento de Mensagem de Texto
      const textMessage = data?.message?.conversation || data?.message?.extendedTextMessage?.text;

      if (textMessage) {
        try {
          // Envia para o dispatcher que você já tem
          await dispatchText(db, { text: textMessage, userId, reply });
        } catch (error) {
          console.error("Erro no dispatcher:", error);
          reply("❌ Tive um problema ao processar isso agora.");
        }
      }

      // 3. Tratamento de Áudio (Whisper/OpenAI)
      const audioMessage = data?.message?.audioMessage;
      if (audioMessage) {
        try {
          // Na Evolution, o áudio pode vir em base64 ou você precisa baixar via API deles
          // Se a sua instância estiver configurada para enviar base64:
          const audioBase64 = data?.base64; 
          
          if (audioBase64) {
            const buffer = Buffer.from(audioBase64, 'base64');
            const transcription = await transcreverAudio(buffer);
            await dispatchText(db, { text: transcription, userId, reply });
          } else {
             // Caso não venha base64, você precisaria de uma chamada GET na Evolution API 
             // usando o process.env.WHATSAPP_API_URL para baixar o arquivo.
             console.log("Áudio recebido, mas base64 não configurada no Webhook da Evolution.");
          }
        } catch (error) {
          console.error("Erro ao processar áudio:", error);
          reply("❌ Não consegui entender o áudio, pode digitar?");
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("❌ Erro crítico no webhook:", err);
      res.sendStatus(500);
    }
  });

  return router;
}

module.exports = { createWebhookRouter };