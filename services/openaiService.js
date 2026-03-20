async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Erro ao chamar OpenAI");
  }

  return data.choices?.[0]?.message?.content || "";
}

async function analyzeWithGPT(documentText, prompt) {
  return callOpenAI([
    {
      role: "system",
      content: "Você analisa documentos de engenharia de forma clara, objetiva e prática."
    },
    {
      role: "user",
      content: `Documento:\n${documentText}\n\nTarefa:\n${prompt}`
    }
  ]);
}

async function chatWithGPT({ documentText, userMessage, history = [] }) {
  return callOpenAI([
    {
      role: "system",
      content: "Responda somente com base no documento fornecido. Se a informação não estiver no texto, diga isso claramente."
    },
    {
      role: "user",
      content: `Documento base:\n${documentText}`
    },
    ...history,
    {
      role: "user",
      content: userMessage
    }
  ]);
}

module.exports = { analyzeWithGPT, chatWithGPT };