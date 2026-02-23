require("dotenv").config();
const axios = require("axios");

async function enviarMensagemTexto(to, text) {
  // A URL no seu .env já parece ser a rota completa ou base da instância
  // Ajustamos para o padrão da Evolution API: /message/sendText/{instancia}
  // Se a sua URL no .env já termina com o nome da instância, remova a parte final
  const url = `${process.env.WHATSAPP_API_URL}/message/sendText/crescix`; 
  
  try {
    await axios.post(
      url,
      {
        number: to,
        text: text,
        delay: 1200,
        linkPreview: true
      },
      {
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.WHATSAPP_TOKEN, // Usando o token do seu print
        },
      }
    );
    console.log(`✅ Mensagem enviada para ${to}`);
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem pela Evolution:", error.response?.data || error.message);
  }
}

module.exports = { enviarMensagemTexto };