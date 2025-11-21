const form = document.getElementById("create-form");
const destinationInput = document.getElementById("destination-input");
const customCodeInput = document.getElementById("custom-code-input");
const feedback = document.getElementById("create-feedback");
const tableBody = document.getElementById("links-table-body");
const rowTemplate = document.getElementById("link-row-template");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const refreshBtn = document.getElementById("refresh-btn");
const shortModal = document.getElementById("short-modal");
const modalShortcode = document.getElementById("modal-shortcode");
const modalShortlink = document.getElementById("modal-shortlink");
const modalCopyBtn = document.getElementById("modal-copy");
const modalOpenBtn = document.getElementById("modal-open");
const modalCloseBtn = document.getElementById("modal-close");
const modalFeedback = document.getElementById("modal-feedback");

let currentSearch = "";
let currentSort = "newest";
let debounceTimer;
let modalLink = "";

const formatDateTime = (value) => {
  if (!value) return "—";
  const dateObj = new Date(value);
  if (!dateObj) return "—";
  return dateObj.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
};

const setFeedback = (message, type = "info") => {
  const colors = {
    info: "text-gray-700",
    success: "text-green-600",
    error: "text-red-600",
  };

  feedback.innerHTML = message;
  feedback.className = `mt-4 text-sm font-medium ${colors[type] ?? colors.info}`;
};

const renderEmptyState = (message) => {
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500">${message}</td>
    </tr>
  `;
};

const renderLinks = (links) => {
  if (!links.length) {
    renderEmptyState("No links found. Create your first TinyLink!");
    return;
  }

  const fragment = document.createDocumentFragment();

  links.forEach((link) => {
    const row = rowTemplate.content.cloneNode(true);
    const cells = row.querySelectorAll("td");
    const clicksCell = cells[2];
    const lastClickedCell = cells[3];
    const targetAnchor = row.querySelector("a");
    const statsBtn = row.querySelector(".stats-btn");
    const deleteBtn = row.querySelector(".delete-btn");
    const shortcodeBtn = row.querySelector(".show-shortcode");

    const shortLink = `${window.location.origin}/${link.short_code}`;

    shortcodeBtn.textContent = link.short_code;
    shortcodeBtn.addEventListener("click", () => openShortModal(link.short_code, shortLink));

    targetAnchor.href = shortLink;
    targetAnchor.textContent = link.original_url;
    targetAnchor.title = link.original_url;
    clicksCell.textContent = link.clicks ?? 0;
    lastClickedCell.textContent = formatDateTime(link.last_clicked);

    statsBtn.addEventListener("click", () => {
      window.location.href = `/code/${link.short_code}`;
    });

    deleteBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Delete ${link.short_code}? This action cannot be undone.`
      );
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/links/${link.short_code}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to delete link");
        }
        await fetchLinks();
      } catch (error) {
        setFeedback(error.message, "error");
      }
    });

    fragment.appendChild(row);
  });

  tableBody.innerHTML = "";
  tableBody.appendChild(fragment);
};

const fetchLinks = async () => {
  renderEmptyState("Loading links…");

  try {
    const params = new URLSearchParams({
      search: currentSearch,
      sort: currentSort,
    });
    const response = await fetch(`/api/links?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to load links");
    }

    const data = await response.json();
    renderLinks(data);
  } catch (error) {
    console.error(error);
    renderEmptyState("Unable to load links right now.");
    setFeedback(error.message, "error");
  }
};

const createLink = async (event) => {
  event.preventDefault();
  setFeedback("");

  const payload = {
    url: destinationInput.value.trim(),
    customCode: customCodeInput.value.trim(),
  };

  if (!payload.url) {
    setFeedback("Please enter a destination URL.", "error");
    destinationInput.focus();
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.classList.add("opacity-70");

  try {
    const response = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to shorten URL");
    }

    destinationInput.value = "";
    customCodeInput.value = "";
    setFeedback(
      `Success! Short link: <a class="underline" href="${data.shortUrl}" target="_blank" rel="noopener">${data.shortUrl}</a>`,
      "success"
    );
    await fetchLinks();
  } catch (error) {
    setFeedback(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("opacity-70");
  }
};

const handleSearchInput = (event) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentSearch = event.target.value.trim();
    fetchLinks();
  }, 350);
};

const handleSortChange = (event) => {
  currentSort = event.target.value;
  fetchLinks();
};

const openShortModal = (code, shortLink) => {
  modalLink = shortLink;
  modalShortcode.textContent = code;
  modalShortlink.value = shortLink;
  modalFeedback.textContent = "";
  shortModal.classList.remove("hidden");
};

const closeShortModal = () => {
  shortModal.classList.add("hidden");
};

modalCopyBtn.addEventListener("click", async () => {
  if (!modalLink) return;
  try {
    await navigator.clipboard.writeText(modalLink);
    modalFeedback.textContent = "Copied to clipboard";
    modalFeedback.className = "text-sm text-green-600";
  } catch (error) {
    modalFeedback.textContent = "Unable to copy automatically";
    modalFeedback.className = "text-sm text-red-600";
  }
});

modalOpenBtn.addEventListener("click", () => {
  if (!modalLink) return;
  window.open(modalLink, "_blank", "noopener");
});

modalCloseBtn.addEventListener("click", closeShortModal);
shortModal.addEventListener("click", (event) => {
  if (event.target === shortModal) {
    closeShortModal();
  }
});

form.addEventListener("submit", createLink);
searchInput.addEventListener("input", handleSearchInput);
sortSelect.addEventListener("change", handleSortChange);
refreshBtn.addEventListener("click", fetchLinks);

fetchLinks();

