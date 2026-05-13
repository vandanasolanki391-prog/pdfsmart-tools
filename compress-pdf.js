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
let totalPages = 0;

pdfFileInput.addEventListener("change", async function(e){

    selectedFile = e.target.files[0];

    if(!selectedFile){
        fileInfo.innerText = "No PDF selected";
        return;
    }

    try{
        originalSize = selectedFile.size;

        const bytes = await selectedFile.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(bytes);

        totalPages = pdf.getPageCount();

        fileInfo.innerText =
            `${selectedFile.name} | Pages: ${totalPages} | Size: ${formatSize(originalSize)}`;

        uploadSection.style.display = "none";
        workSection.style.display = "block";

        statusText.innerText = "PDF loaded successfully.";

        await renderFirstPagePreview(selectedFile);

    }
    catch(error){
        console.error(error);
        fileInfo.innerText = "Invalid PDF file.";
        statusText.innerText = "Please select a valid PDF.";
    }
});

function formatSize(bytes){
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getCompressionLevel(){
    const selected =
        document.querySelector('input[name="compressLevel"]:checked');

    return selected ? selected.value : "medium";
}

async function renderFirstPagePreview(file){
    try{
        const bytes = await file.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
            data: bytes
        });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({
            scale: 0.7
        });

        previewCanvas.width = viewport.width;
        previewCanvas.height = viewport.height;

        await page.render({
            canvasContext: previewCtx,
            viewport: viewport
        }).promise;
    }
    catch(error){
        console.error("Preview error:", error);
    }
}

compressBtn.addEventListener("click", async function(){

    if(!selectedFile){
        alert("Please select a PDF file first.");
        return;
    }

    try{
        statusText.innerText = "Compressing PDF... Please wait.";

        const compressionLevel = getCompressionLevel();

        const fileBytes = await selectedFile.arrayBuffer();

        const pdfDoc = await PDFLib.PDFDocument.load(fileBytes, {
            ignoreEncryption: true
        });

        pdfDoc.setProducer("PDFSmart Tools");
        pdfDoc.setCreator("PDFSmart Tools");

        let useObjectStreams = true;

        if(compressionLevel === "low"){
            useObjectStreams = false;
        }

        if(compressionLevel === "medium"){
            useObjectStreams = true;
        }

        if(compressionLevel === "high"){
            useObjectStreams = true;
        }

        const compressedBytes = await pdfDoc.save({
            useObjectStreams: useObjectStreams,
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

        const reduction =
            (((originalSize - newSize) / originalSize) * 100).toFixed(1);

        statusText.innerText =
            `Compressed successfully. New Size: ${formatSize(newSize)} | Reduction: ${reduction}%`;

    }
    catch(error){
        console.error(error);

        statusText.innerText =
            "Compression failed. This PDF may be encrypted or unsupported.";

        alert("Compression failed. Please try another PDF.");
    }
});
