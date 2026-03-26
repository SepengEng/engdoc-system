document.addEventListener("DOMContentLoaded", () => {
  const pathName = window.location.pathname;
  const isAppPage = pathName === "/app" || pathName === "/app/";
  const token = localStorage.getItem("token");

  if (!isAppPage) return;

  if (!token) {
    window.location.replace("/");
    return;
  }

  const totalClients = document.getElementById("totalClients");
  const totalDocuments = document.getElementById("totalDocuments");
  const totalWorks = document.getElementById("totalWorks");

  const clientsList = document.getElementById("clientsList");
  const worksList = document.getElementById("worksList");
  const worksSectionList = document.getElementById("worksSectionList");
  const documentsList = document.getElementById("documentsList");
  const quotesList = document.getElementById("quotesList");

  const searchInput = document.getElementById("searchInput");

  const clientForm = document.getElementById("clientForm");
  const workForm = document.getElementById("workForm");
  const documentForm = document.getElementById("documentForm");
  const quoteForm = document.getElementById("quoteForm");
  const iaUploadForm = document.getElementById("iaUploadForm");

  const workClientSelect = document.getElementById("work_client_id");
  const documentClientSelect = document.getElementById("document_client_id");
  const documentTypeSelect = document.getElementById("document_type_id");
  const quoteClientSelect = document.getElementById("quote_client_id");

  const docSelect = document.getElementById("docSelect");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const analysisResult = document.getElementById("analysisResult");

  const iaDocTitle = document.getElementById("iaDocTitle");
  const iaFileInput = document.getElementById("iaFileInput");
  const iaPromptInput = document.getElementById("iaPromptInput");
  const iaUploadResult = document.getElementById("iaUploadResult");

  const chatDocSelect = document.getElementById("chatDocSelect");
  const chatBox = document.getElementById("chatBox");
  const chatMessage = document.getElementById("chatMessage");
  const sendChatBtn = document.getElementById("sendChatBtn");

  const logoutBtn = document.getElementById("logoutBtn");
  const navButtons = document.querySelectorAll(".nav-btn[data-section]");
  const sections = document.querySelectorAll(".section");

  let chatHistory = [];

  function authHeaders(extra = {}) {
    return {
      ...extra,
      Authorization: `Bearer ${token}`
    };
  }

  async function fetchProtected(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: authHeaders(options.headers || {})
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("/");
      throw new Error("Sessão expirada");
    }

    return response;
  }

  function showSection(sectionId) {
    sections.forEach((section) => section.classList.remove("active"));
    navButtons.forEach((button) => button.classList.remove("active"));

    const targetSection = document.getElementById(sectionId);
    const targetButton = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);

    if (targetSection) targetSection.classList.add("active");
    if (targetButton) targetButton.classList.add("active");
  }

  function addChatMessage(role, content) {
    if (!chatBox) return;

    const div = document.createElement("div");
    div.className = `chat-message ${role}`;
    div.textContent = content;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      showSection(button.dataset.section);
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("/");
    });
  }

  async function loadClients(search = "") {
    try {
      const response = await fetchProtected(`/clients?search=${encodeURIComponent(search)}`);
      const clients = await response.json();

      if (clientsList) clientsList.innerHTML = "";
      if (workClientSelect) workClientSelect.innerHTML = `<option value="">Selecione o cliente</option>`;
      if (documentClientSelect) documentClientSelect.innerHTML = `<option value="">Selecione o cliente</option>`;
      if (quoteClientSelect) quoteClientSelect.innerHTML = `<option value="">Selecione o cliente</option>`;

      clients.forEach((client) => {
        if (clientsList) {
          const card = document.createElement("div");
          card.className = "client-card";
          card.innerHTML = `
            <h3>${client.name}</h3>
            <p><strong>Categoria:</strong> ${client.category || "-"}</p>
            <p><strong>Email:</strong> ${client.contact_email || "-"}</p>
            <p><strong>Telefone:</strong> ${client.phone || "-"}</p>
            <p><strong>Cidade:</strong> ${client.city || "-"}</p>
          `;
          clientsList.appendChild(card);
        }

        if (workClientSelect) {
          const option = document.createElement("option");
          option.value = client.id;
          option.textContent = client.name;
          workClientSelect.appendChild(option);
        }

        if (documentClientSelect) {
          const option = document.createElement("option");
          option.value = client.id;
          option.textContent = client.name;
          documentClientSelect.appendChild(option);
        }

        if (quoteClientSelect) {
          const option = document.createElement("option");
          option.value = client.id;
          option.textContent = client.name;
          quoteClientSelect.appendChild(option);
        }
      });

      if (totalClients) totalClients.textContent = clients.length;
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  }

  async function loadWorks() {
    try {
      const response = await fetchProtected("/works");
      const works = await response.json();

      if (worksList) worksList.innerHTML = "";
      if (worksSectionList) worksSectionList.innerHTML = "";

      works.forEach((work) => {
        const cardHtml = `
          <h3>${work.name}</h3>
          <p><strong>Cliente:</strong> ${work.client_name || "-"}</p>
          <p><strong>Local:</strong> ${work.location || "-"}</p>
          <p><strong>Status:</strong> ${work.status || "-"}</p>
        `;

        if (worksList) {
          const card = document.createElement("div");
          card.className = "document-card";
          card.innerHTML = cardHtml;
          worksList.appendChild(card);
        }

        if (worksSectionList) {
          const card = document.createElement("div");
          card.className = "document-card";
          card.innerHTML = cardHtml;
          worksSectionList.appendChild(card);
        }
      });

      if (totalWorks) totalWorks.textContent = works.length;
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
    }
  }

  async function loadDocumentTypes() {
    if (!documentTypeSelect) return;

    try {
      const response = await fetchProtected("/documents/types");
      const types = await response.json();

      documentTypeSelect.innerHTML = `<option value="">Selecione o tipo de documento</option>`;

      types.forEach((type) => {
        const option = document.createElement("option");
        option.value = type.id;
        option.textContent = type.name;
        documentTypeSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar tipos de documento:", error);
    }
  }

  async function loadDocuments() {
    try {
      const response = await fetchProtected("/documents");
      const docs = await response.json();

      if (documentsList) documentsList.innerHTML = "";
      if (docSelect) docSelect.innerHTML = `<option value="">Selecione um documento</option>`;
      if (chatDocSelect) chatDocSelect.innerHTML = `<option value="">Selecione um documento</option>`;

      docs.forEach((doc) => {
        const attachmentsHtml = Array.isArray(doc.attachments) && doc.attachments.length
          ? doc.attachments.map((file) => {
              const fileUrl = `/${String(file.stored_file_path).replace(/^\.?\//, "")}`;
              return `
                <div class="attachment-item">
                  <p>📎 ${file.original_file_name}</p>
                  <div class="attachment-actions">
                    <a href="${fileUrl}" target="_blank" class="secondary-btn">Ver</a>
                    <a href="${fileUrl}" download class="secondary-btn">Baixar</a>
                  </div>
                </div>
              `;
            }).join("")
          : `<p><strong>Anexos:</strong> Nenhum</p>`;

        if (documentsList) {
          const card = document.createElement("div");
          card.className = "document-card";
          card.innerHTML = `
            <h3>${doc.project_name}</h3>
            <p><strong>Cliente:</strong> ${doc.client_name || "-"}</p>
            <p><strong>Tipo:</strong> ${doc.document_type || "-"}</p>
            <p><strong>Valor:</strong> ${doc.value || "-"}</p>
            <p><strong>Status:</strong> ${doc.status || "-"}</p>
            <div style="margin-top:8px;">
              ${attachmentsHtml}
            </div>
          `;
          documentsList.appendChild(card);
        }

        if (docSelect) {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = doc.project_name;
          docSelect.appendChild(option);
        }

        if (chatDocSelect) {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = doc.project_name;
          chatDocSelect.appendChild(option);
        }
      });

      if (totalDocuments) totalDocuments.textContent = docs.length;
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    }
  }

  async function loadQuotes() {
    try {
      const response = await fetchProtected("/quotes");
      const quotes = await response.json();

      if (!quotesList) return;
      quotesList.innerHTML = "";

      quotes.forEach((quote) => {
        const attachmentsHtml = Array.isArray(quote.attachments) && quote.attachments.length
          ? quote.attachments.map((file) => `<p>📎 ${file.original_file_name}</p>`).join("")
          : `<p><strong>Anexos:</strong> Nenhum</p>`;

        const card = document.createElement("div");
        card.className = "document-card";
        card.innerHTML = `
          <h3>${quote.project_name}</h3>
          <p><strong>Cliente:</strong> ${quote.client_name || "-"}</p>
          <p><strong>Valor:</strong> ${quote.value || "-"}</p>
          <p><strong>Status:</strong> ${quote.status || "-"}</p>
          <p><strong>Descrição:</strong> ${quote.description || "-"}</p>
          <div style="margin-top:8px;">${attachmentsHtml}</div>
          <div style="margin-top:10px; display:flex; gap:10px;">
            ${
              quote.status !== "aprovada"
                ? `<button type="button" class="primary-btn win-quote-btn" data-id="${quote.id}">Obra ganha</button>`
                : `<span style="color:green;font-weight:bold;">✔ Obra criada</span>`
            }
          </div>
        `;
        quotesList.appendChild(card);
      });

      document.querySelectorAll(".win-quote-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const id = button.dataset.id;

          if (!confirm("Deseja transformar essa cotação em obra?")) return;

          try {
            const response = await fetchProtected(`/quotes/${id}/win`, {
              method: "POST"
            });

            const data = await response.json();

            if (!response.ok) {
              alert(data.error || "Erro ao converter cotação");
              return;
            }

            alert("Obra criada com sucesso 🚀");
            await loadQuotes();
            await loadWorks();
          } catch (error) {
            console.error("Erro ao converter cotação:", error);
            alert("Erro ao converter cotação");
          }
        });
      });
    } catch (error) {
      console.error("Erro ao carregar cotações:", error);
    }
  }

  if (clientForm) {
    clientForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const body = {
          name: document.getElementById("name")?.value.trim() || "",
          category: document.getElementById("category")?.value.trim() || "",
          contact_email: document.getElementById("contact_email")?.value.trim() || "",
          phone: document.getElementById("phone")?.value.trim() || "",
          city: document.getElementById("city")?.value.trim() || "",
          notes: document.getElementById("notes")?.value.trim() || ""
        };

        if (!body.name || !body.category) {
          alert("Nome e categoria são obrigatórios");
          return;
        }

        const response = await fetchProtected("/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Erro ao criar cliente");
          return;
        }

        alert("Cliente criado com sucesso");
        clientForm.reset();
        await loadClients(searchInput?.value || "");
      } catch (error) {
        console.error("Erro ao criar cliente:", error);
      }
    });
  }

  if (workForm) {
    workForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const body = {
          client_id: document.getElementById("work_client_id")?.value || "",
          name: document.getElementById("work_name")?.value || "",
          location: document.getElementById("work_location")?.value || "",
          status: document.getElementById("work_status")?.value || "",
          start_date: document.getElementById("work_start_date")?.value || "",
          end_date: document.getElementById("work_end_date")?.value || "",
          notes: document.getElementById("work_notes")?.value || ""
        };

        const response = await fetchProtected("/works", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Erro ao criar obra");
          return;
        }

        alert("Obra criada com sucesso");
        workForm.reset();
        await loadWorks();
      } catch (error) {
        console.error("Erro ao criar obra:", error);
      }
    });
  }

  if (documentForm) {
    documentForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const clientId = document.getElementById("document_client_id")?.value || "";
        const documentTypeId = document.getElementById("document_type_id")?.value || "";
        const projectName = document.getElementById("project_name")?.value || "";
        const value = document.getElementById("value")?.value || "";
        const status = document.getElementById("status")?.value || "";
        const description = document.getElementById("description")?.value || "";
        const files = document.getElementById("documentFiles")?.files || [];

        if (!clientId || !documentTypeId || !projectName) {
          alert("Cliente, tipo de documento e nome do projeto são obrigatórios.");
          return;
        }

        const formData = new FormData();
        formData.append("client_id", clientId);
        formData.append("document_type_id", documentTypeId);
        formData.append("project_name", projectName);
        formData.append("value", value);
        formData.append("status", status);
        formData.append("description", description);

        for (const file of files) {
          formData.append("files", file);
        }

        const response = await fetch("/documents", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Erro ao criar documento");
          return;
        }

        alert("Documento criado com sucesso");
        documentForm.reset();
        await loadDocuments();
      } catch (error) {
        console.error("Erro ao criar documento:", error);
        alert("Erro ao criar documento");
      }
    });
  }

  if (quoteForm) {
    quoteForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const files = document.getElementById("quoteFiles")?.files || [];

        const formData = new FormData();
        formData.append("client_id", document.getElementById("quote_client_id")?.value || "");
        formData.append("project_name", document.getElementById("quote_project_name")?.value || "");
        formData.append("value", document.getElementById("quote_value")?.value || "");
        formData.append("status", document.getElementById("quote_status")?.value || "negociacao");
        formData.append("description", document.getElementById("quote_description")?.value || "");

        for (const file of files) {
          formData.append("files", file);
        }

        const response = await fetchProtected("/quotes", {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Erro ao criar cotação");
          return;
        }

        alert("Cotação criada com sucesso");
        quoteForm.reset();
        await loadQuotes();
      } catch (error) {
        console.error("Erro ao criar cotação:", error);
      }
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      try {
        const id = docSelect?.value || "";
        const prompt = document.getElementById("aiPrompt")?.value || "";

        if (!id || !prompt) {
          alert("Selecione um documento e escreva o prompt");
          return;
        }

        if (analysisResult) analysisResult.textContent = "Analisando...";

        const response = await fetchProtected("/external-documents/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, prompt })
        });

        const data = await response.json();

        if (!response.ok) {
          if (analysisResult) analysisResult.textContent = "";
          alert(data.error || "Erro ao analisar documento");
          return;
        }

        if (analysisResult) analysisResult.textContent = data.result;
      } catch (error) {
        console.error("Erro ao analisar documento:", error);
      }
    });
  }

  if (iaUploadForm) {
    iaUploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const file = iaFileInput?.files?.[0];
        const title = iaDocTitle?.value || "";
        const prompt = iaPromptInput?.value || "";

        if (!file || !prompt) {
          alert("Envie um arquivo e um prompt");
          return;
        }

        if (iaUploadResult) iaUploadResult.textContent = "Processando...";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);

        const uploadResponse = await fetchProtected("/external-documents/upload", {
          method: "POST",
          body: formData
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          if (iaUploadResult) iaUploadResult.textContent = "";
          alert(uploadData.error || "Erro no upload");
          return;
        }

        const analyzeResponse = await fetchProtected("/external-documents/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: uploadData.id, prompt })
        });

        const analyzeData = await analyzeResponse.json();

        if (!analyzeResponse.ok) {
          if (iaUploadResult) iaUploadResult.textContent = "";
          alert(analyzeData.error || "Erro na análise");
          return;
        }

        if (iaUploadResult) iaUploadResult.textContent = analyzeData.result;
        iaUploadForm.reset();
      } catch (error) {
        console.error("Erro no upload + análise:", error);
      }
    });
  }

  if (sendChatBtn) {
    sendChatBtn.addEventListener("click", async () => {
      try {
        const id = chatDocSelect?.value || "";
        const message = chatMessage?.value?.trim() || "";

        if (!id || !message) {
          alert("Selecione um documento e escreva uma pergunta");
          return;
        }

        addChatMessage("user", message);
        chatHistory.push({ role: "user", content: message });
        chatMessage.value = "";

        const response = await fetchProtected("/external-documents/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, message, history: chatHistory })
        });

        const data = await response.json();

        if (!response.ok) {
          addChatMessage("assistant", data.error || "Erro ao conversar com o documento");
          return;
        }

        addChatMessage("assistant", data.result);
        chatHistory.push({ role: "assistant", content: data.result });
      } catch (error) {
        console.error("Erro no chat:", error);
      }
    });
  }

  if (chatDocSelect) {
    chatDocSelect.addEventListener("change", () => {
      chatHistory = [];
      if (chatBox) chatBox.innerHTML = "";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      await loadClients(e.target.value);
    });
  }

  async function init() {
    await loadClients();
    await loadWorks();
    await loadDocumentTypes();
    await loadDocuments();
    await loadQuotes();
  }

  init().catch((error) => {
    console.error("Erro ao iniciar painel:", error);
  });
});