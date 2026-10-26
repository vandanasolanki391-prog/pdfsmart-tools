const API_BASE = "https://pdf-smart-tools.onrender.com";
const pdfFileInput = document.getElementById("pdfFile");
const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");
const fileInfo = document.getElementById("fileInfo");
const passwordInput = document.getElementById("passwordInput");
const unlockBtn = document.getElementById("unlockBtn");
const statusText = document.getElementById("statusText");
let selectedFile = null;
pdfFileInput.addEventListener("change", e => {
  selectedFile = e.target.files[0]; if (!selectedFile) return;
  uploadSection.style.display = "none"; workSection.style.display = "block";
  fileInfo.innerText = `${selectedFile.name} | ${(selectedFile.size / 1048576).toFixed(2)} MB`;
  statusText.innerText = "PDF loaded successfully.";
});
unlockBtn.addEventListener("click", async () => {
  if (!selectedFile) return alert("Please select PDF file first.");
  unlockBtn.disabled = true;
  try {
    statusText.innerText = "Unlocking PDF on secure processing server...";
    const form = new FormData(); form.append("pdfFile", selectedFile); form.append("password", passwordInput.value);
    const response = await fetch(`${API_BASE}/api/unlock-pdf`, { method: "POST", body: form });
    if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error || "Unlock failed."); }
    const blob = await response.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "unlocked-pdf.pdf"; a.click(); URL.revokeObjectURL(url);
    statusText.innerText = "Unlocked PDF downloaded.";
  } catch (e) { statusText.innerText = e.message; alert(e.message); }
  finally { unlockBtn.disabled = false; }
});
