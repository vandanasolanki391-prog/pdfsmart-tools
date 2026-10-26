const API_BASE = "https://pdf-smart-tools.onrender.com";
const pdfFileInput = document.getElementById("pdfFile");
const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const fileInfo = document.getElementById("fileInfo");
const compressBtn = document.getElementById("compressBtn");
const statusText = document.getElementById("statusText");
let selectedFile = null; let originalSize = 0;
pdfFileInput.addEventListener("change", async e => {
  selectedFile = e.target.files[0]; if (!selectedFile) return;
  originalSize = selectedFile.size; uploadSection.style.display = "none"; workSection.style.display = "block";
  fileInfo.innerText = `${selectedFile.name} | Size: ${formatSize(originalSize)}`;
  statusText.innerText = "PDF selected successfully."; await renderFirstPagePreview(selectedFile);
});
function formatSize(bytes) { return (bytes / 1048576).toFixed(2) + " MB"; }
async function renderFirstPagePreview(file) {
  try { const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const page = await pdf.getPage(1); fileInfo.innerText = `${file.name} | Pages: ${pdf.numPages} | Size: ${formatSize(originalSize)}`;
    const viewport = page.getViewport({ scale: 0.7 }); previewCanvas.width = viewport.width; previewCanvas.height = viewport.height;
    await page.render({ canvasContext: previewCtx, viewport }).promise;
  } catch (e) { console.error(e); statusText.innerText = "Preview failed, but you can still try compression."; }
}
compressBtn.addEventListener("click", async () => {
  if (!selectedFile) return alert("Please select a PDF file first.");
  compressBtn.disabled = true;
  try {
    const selected = document.querySelector('input[name="compressLevel"]:checked');
    const level = selected ? selected.value : "medium";
    statusText.innerText = "Optimizing PDF... Please wait.";
    const form = new FormData(); form.append("pdfFile", selectedFile); form.append("level", level);
    const response = await fetch(`${API_BASE}/api/compress-pdf`, { method: "POST", body: form });
    if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.error || "Compression failed."); }
    const blob = await response.blob(); const newSize = blob.size; const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "compressed-pdf.pdf"; a.click(); URL.revokeObjectURL(url);
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    statusText.innerText = `Optimization finished. New size: ${formatSize(newSize)} | Size change: ${reduction}% (positive means smaller). Image-heavy PDFs may not shrink much.`;
  } catch (e) { statusText.innerText = e.message; alert(e.message); }
  finally { compressBtn.disabled = false; }
});
