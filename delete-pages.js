const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const fileInfo = document.getElementById("fileInfo");
const pageInput = document.getElementById("pageInput");

const deleteBtn = document.getElementById("deleteBtn");
const statusText = document.getElementById("statusText");

let pdfDoc = null;
let totalPages = 0;
let selectedFile = null;

/* FILE SELECT */

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

    }
    catch(error){

        console.error(error);

        alert("Invalid PDF file.");

        statusText.innerText =
            "Failed to load PDF.";
    }
});

/* PREVIEW */

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

/* PAGE RANGE */

function getPagesToDelete(){

    const input =
        pageInput.value.trim();

    if(!input){
        throw new Error(
            "Please enter pages to delete."
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

            const start =
                parseInt(range[0]);

            const end =
                parseInt(range[1]);

            if(
                isNaN(start) ||
                isNaN(end) ||
                start < 1 ||
                end > totalPages ||
                start > end
            ){
                throw new Error(
                    "Invalid range: " + part
                );
            }

            for(let i = start; i <= end; i++){
                pages.push(i - 1);
            }
        }
        else{

            const page =
                parseInt(part);

            if(
                isNaN(page) ||
                page < 1 ||
                page > totalPages
            ){
                throw new Error(
                    "Invalid page: " + part
                );
            }

            pages.push(page - 1);
        }
    });

    return [...new Set(pages)]
        .sort((a,b) => b - a);
}

/* DELETE PAGES */

deleteBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select a PDF file first.");
        return;
    }

    try{

        statusText.innerText =
            "Deleting pages...";

        const fileBytes =
            await selectedFile.arrayBuffer();

        const pdfDocEdit =
            await PDFLib.PDFDocument.load(fileBytes);

        const pagesToDelete =
            getPagesToDelete();

        if(
            pagesToDelete.length >=
            pdfDocEdit.getPageCount()
        ){
            throw new Error(
                "Cannot delete all pages."
            );
        }

        pagesToDelete.forEach(index => {

            pdfDocEdit.removePage(index);
        });

        const newPdfBytes =
            await pdfDocEdit.save();

        const blob =
            new Blob(
                [newPdfBytes],
                {type:"application/pdf"}
            );

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            "pages-deleted.pdf";

        link.click();

        statusText.innerText =
            "Pages deleted successfully.";

    }
    catch(error){

        console.error(error);

        alert(error.message);

        statusText.innerText =
            "Delete pages failed.";
    }
});
