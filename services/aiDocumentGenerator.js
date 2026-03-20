function buildDocumentText({
  client,
  documentType,
  projectName,
  value,
  description,
  previousDocuments = []
}) {
  const previousText =
    previousDocuments.length > 0
      ? previousDocuments
          .map((doc, index) => `${index + 1}. ${doc.document_type} - ${doc.project_name} (${doc.status})`)
          .join("\n")
      : "Nenhum documento anterior encontrado.";

  return `
${documentType.name}

Cliente: ${client.name}
Categoria: ${client.category || "-"}
Email: ${client.contact_email || "-"}
Telefone: ${client.phone || "-"}
Cidade: ${client.city || "-"}

Projeto: ${projectName}
Valor: ${value || "-"}
Descrição: ${description || "-"}

Histórico recente:
${previousText}

Texto base gerado automaticamente para apoio documental.
  `.trim();
}

module.exports = { buildDocumentText };