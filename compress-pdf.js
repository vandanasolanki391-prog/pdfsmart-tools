const pdfFileInput = document.getElementById("pdfFile");
const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const fileInfo = document.getElementById("fileInfo");
const compressBtn = document.getElementById("compressBtn");
const statusText = document.getElementById("statusText");

let selectedFile = null;
let originalSize = 0;

pdfFileInput.addEventListener("change", async function(e){
    selectedFile = e.target.files[0];

    if(!selectedFile) return;

    originalSize = selectedFile.size;

    uploadSection.style.display = "none";
    workSection.style.display = "block";

    fileInfo.innerText = `${selectedFile.name} | Size: ${formatSize(originalSize)}`;
    statusText.innerText = "PDF selected successfully.";

    await renderFirstPagePreview(selectedFile);
});

function formatSize(bytes){
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

async function renderFirstPagePreview(file){
    try{
        const bytes = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        const page = await pdf.getPage(1);

        fileInfo.innerText =
            `${file.name} | Pages: ${pdf.numPages} | Size: ${formatSize(originalSize)}`;

        const viewport = page.getViewport({ scale: 0.7 });

        previewCanvas.width = viewport.width;
        previewCanvas.height = viewport.height;

        await page.render({
            canvasContext: previewCtx,
            viewport: viewport
        }).promise;
    }
    catch(error){
        console.error(error);
        statusText.innerText = "Preview failed, but you can still try compression.";
    }
}

function getCompressionLevel(){
    const selected = document.querySelector('input[name="compressLevel"]:checked');
    return selected ? selected.value : "medium";
}

compressBtn.addEventListener("click", async function(){
    if(!selectedFile){
        alert("Please select a PDF file first.");
        return;
    }

    try{
        statusText.innerText = "Compressing PDF... Please wait.";

        const fileBytes = await selectedFile.arrayBuffer();

        const pdfDoc = await PDFLib.PDFDocument.load(fileBytes, {
            ignoreEncryption: true
        });

        pdfDoc.setProducer("PDFSmart Tools");
        pdfDoc.setCreator("PDFSmart Tools");

        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false
        });

        const newSize = compressedBytes.length;

        const blob = new Blob([compressedBytes], {
            type: "application/pdf"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "compressed-pdf.pdf";
        link.click();

        const reduction = (((originalSize - newSize) / originalSize) * 100).toFixed(1);

        statusText.innerText =
            `Compressed successfully. New Size: ${formatSize(newSize)} | Reduction: ${reduction}%`;
    }
    catch(error){
        console.error(error);
        statusText.innerText = "Compression failed. Please try another PDF.";
        alert("Compression failed. This PDF may be encrypted or unsupported.");
    }
});
