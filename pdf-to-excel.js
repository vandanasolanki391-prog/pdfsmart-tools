const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const fileInfo = document.getElementById("fileInfo");
const pageInput = document.getElementById("pageInput");

const convertBtn = document.getElementById("convertBtn");

const textPreview = document.getElementById("textPreview");
const statusText = document.getElementById("statusText");

let pdfDoc = null;
let totalPages = 0;
let selectedFile = null;

pdfFileInput.addEventListener("change", async function(e){

    selectedFile = e.target.files[0];

    if(!selectedFile){
        return;
    }

    try{
        const bytes = await selectedFile.arrayBuffer();

        pdfDoc = await pdfjsLib.getDocument({
            data: bytes
        }).promise;

        totalPages = pdfDoc.numPages;

        uploadSection.style.display = "none";
        workSection.style.display = "block";

        fileInfo.innerText =
            `${selectedFile.name} | Pages: ${totalPages}`;

        statusText.innerText =
            "PDF loaded successfully.";

        await renderPreviewPage();

    }catch(error){
        console.error(error);
        alert("Invalid PDF file.");
        statusText.innerText = "Failed to load PDF.";
    }
});

async function renderPreviewPage(){

    const page = await pdfDoc.getPage(1);

    const viewport = page.getViewport({
        scale:0.7
    });

    previewCanvas.width = viewport.width;
    previewCanvas.height = viewport.height;

    await page.render({
        canvasContext: previewCtx,
        viewport: viewport
    }).promise;
}

function getPages(){

    const input = pageInput.value.trim().toLowerCase();

    if(input === "all"){
        return Array.from(
            {length: totalPages},
            (_, i) => i + 1
        );
    }

    let pages = [];
    const parts = input.split(",");

    parts.forEach(part => {

        part = part.trim();

        if(!part){
            return;
        }

        if(part.includes("-")){

            const range = part.split("-");
            const start = parseInt(range[0]);
            const end = parseInt(range[1]);

            if(
                isNaN(start) ||
                isNaN(end) ||
                start < 1 ||
                end > totalPages ||
                start > end
            ){
                throw new Error("Invalid range: " + part);
            }

            for(let i = start; i <= end; i++){
                pages.push(i);
            }

        }else{

            const page = parseInt(part);

            if(
                isNaN(page) ||
                page < 1 ||
                page > totalPages
            ){
                throw new Error("Invalid page: " + part);
            }

            pages.push(page);
        }
    });

    return [...new Set(pages)];
}

async function extractTextFromPage(pageNumber){

    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();

    let rows = [];

    textContent.items.forEach(item => {
        rows.push([
            pageNumber,
            item.str
        ]);
    });

    return rows;
}

convertBtn.addEventListener("click", async function(){

    if(!selectedFile){
        alert("Please select a PDF file first.");
        return;
    }

    try{
        textPreview.value = "";
        statusText.innerText = "Extracting PDF text...";

        const pages = getPages();
        let excelRows = [["Page No.", "Text"]];
        let previewText = "";

        for(const pageNumber of pages){

            statusText.innerText =
                `Processing Page ${pageNumber}...`;

            const rows = await extractTextFromPage(pageNumber);

            rows.forEach(row => {
                excelRows.push(row);
                previewText += `Page ${row[0]}: ${row[1]}\n`;
            });
        }

        textPreview.value = previewText;

        const worksheet =
            XLSX.utils.aoa_to_sheet(excelRows);

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "PDF Text"
        );

        XLSX.writeFile(
            workbook,
            "pdf-to-excel.xlsx"
        );

        statusText.innerText =
            "Excel file downloaded successfully.";

    }catch(error){
        console.error(error);
        alert(error.message);
        statusText.innerText = "Conversion failed.";
    }
});
