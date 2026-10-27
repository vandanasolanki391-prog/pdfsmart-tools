const API_BASE = "https://pdfsmart-tools.onrender.com";
const repairPdfUpload = document.getElementById("repairPdfUpload");
const repairBtn = document.getElementById("repairBtn");
const repairStatus = document.getElementById("repairStatus");
let selectedFile = null;
repairPdfUpload.addEventListener("change", e => {
  selectedFile = e.target.files[0] || null;
  repairStatus.innerText = selectedFile ? `PDF selected: ${selectedFile.name} (${(selectedFile.size / 1048576).toFixed(2)} MB)` : "No file selected.";
});
repairBtn.addEventListener("click", async () => {
  if (!selectedFile) return alert("Please select a PDF first.");
  repairBtn.disabled = true;
  try {
    repairStatus.innerText = "Trying to recover the PDF structure...";
    const form = new FormData(); form.append("pdfFile", selectedFile);
    const response = await fetch(`${API_BASE}/api/repair-pdf`, { method: "POST", body: form });
    if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error || "Repair failed."); }
    const blob = await response.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "repaired-pdf.pdf"; a.click(); URL.revokeObjectURL(url);
    repairStatus.innerText = "PDF structure was rebuilt and the file downloaded. Check the output; severely damaged files may not be fully recoverable.";
  } catch (e) { repairStatus.innerText = e.message; alert(e.message); }
  finally { repairBtn.disabled = false; }
});
