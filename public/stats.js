const statsCodeEl = document.getElementById("stats-code");
const statsCreatedEl = document.getElementById("stats-created");
const statsDestinationEl = document.getElementById("stats-destination");
const statsClicksEl = document.getElementById("stats-clicks");
const statsLastClickedEl = document.getElementById("stats-last-clicked");
const shareInput = document.getElementById("share-input");
const copyBtn = document.getElementById("copy-btn");
const copyFeedback = document.getElementById("copy-feedback");

const code = window.location.pathname.split("/").filter(Boolean).pop();

const formatDate = (value) => {
  if (!value) return "—";
  const dateObj = new Date(value);
  if (!dateObj) return "—";
  return dateObj.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
};

const showError = (message) => {
  statsCodeEl.textContent = "Not found";
  statsCreatedEl.textContent = message;
  statsDestinationEl.textContent = "—";
  statsClicksEl.textContent = "0";
  statsLastClickedEl.textContent = "—";
  shareInput.value = message;
  copyBtn.disabled = true;
};

const fetchStats = async () => {
  if (!code) {
    showError("Missing short code");
    return;
  }

  try {
    const response = await fetch(`/api/links/${code}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Link not found");
    }

    statsCodeEl.textContent = data.short_code;
    statsCreatedEl.textContent = `Created ${formatDate(data.created_at)}`;
    statsDestinationEl.href = data.original_url;
    statsDestinationEl.textContent = data.original_url;
    statsClicksEl.textContent = data.clicks ?? 0;
    statsLastClickedEl.textContent = formatDate(data.last_clicked);

    const shareLink = `${window.location.origin}/${data.short_code}`;
    shareInput.value = shareLink;

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareLink);
        copyFeedback.textContent = "Copied!";
        copyFeedback.className = "mt-2 text-sm font-medium text-green-600";
      } catch (error) {
        copyFeedback.textContent = "Unable to copy automatically.";
        copyFeedback.className = "mt-2 text-sm font-medium text-red-600";
      }
    });
  } catch (error) {
    console.error(error);
    showError(error.message);
  }
};

fetchStats();

