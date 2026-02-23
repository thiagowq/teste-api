// src/config.js
function updateEnvVar(key, value) {
  // No Easypanel, as variáveis são gerenciadas pela interface do painel.
  // Este log ajuda a ver o que o sistema tentou alterar.
  console.log(`[Config] Sugestão de atualização: ${key} = ${value}`);
}

function randomToken() {
  return Math.random().toString(36).substring(2, 12);
}

module.exports = { updateEnvVar, randomToken };