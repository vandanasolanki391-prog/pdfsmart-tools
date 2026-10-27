const API_BASE = "https://pdfsmart-tools.onrender.com";
const pdfFileInput = document.getElementById("pdfFile");
const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");
const fileInfo = document.getElementById("fileInfo");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const lockBtn = document.getElementById("lockBtn");
const statusText = document.getElementById("statusText");
let selectedFile = null;
pdfFileInput.addEventListener("change", e => {
  selectedFile = e.target.files[0]; if (!selectedFile) return;
  uploadSection.style.display = "none"; workSection.style.display = "block";
  fileInfo.innerText = `${selectedFile.name} | ${(selectedFile.size / 1048576).toFixed(2)} MB`;
  statusText.innerText = "PDF loaded successfully.";
});
lockBtn.addEventListener("click", async () => {
  if (!selectedFile) return alert("Please select PDF file first.");
  const password = passwordInput.value;
  if (!password) return alert("Please enter password.");
  if (password !== confirmPasswordInput.value) return alert("Passwords do not match.");
  lockBtn.disabled = true;
  try {
    statusText.innerText = "Applying real password encryption... Please wait.";
    const form = new FormData(); form.append("pdfFile", selectedFile); form.append("password", password);
    const response = await fetch(`${API_BASE}/api/protect-pdf`, { method: "POST", body: form });
    if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error || "Protection failed."); }
    const blob = await response.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "protected-pdf.pdf"; a.click(); URL.revokeObjectURL(url);
    statusText.innerText = "Password-protected PDF downloaded. Keep your password safe.";
  } catch (e) { statusText.innerText = e.message; alert(e.message); }
  finally { lockBtn.disabled = false; }
});
