const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const fileInfo = document.getElementById("fileInfo");
const pageInput = document.getElementById("pageInput");
const imageQuality = document.getElementById("imageQuality");
const imageScale = document.getElementById("imageScale");

const convertBtn = document.getElementById("convertBtn");
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

function getPagesToConvert(){

    const input =
        pageInput.value.trim().toLowerCase();

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
                pages.push(i);
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

            pages.push(page);
        }
    });

    return [...new Set(pages)];
}

/* DOWNLOAD JPG */

function downloadImage(dataUrl, fileName){

    const link =
        document.createElement("a");

    link.href = dataUrl;
    link.download = fileName;

    link.click();
}

/* CONVERT */

convertBtn.addEventListener("click", async function(){

    if(!pdfDoc){
        alert("Please select a PDF file first.");
        return;
    }

    try{

        statusText.innerText =
            "Converting PDF pages to JPG...";

        const pages =
            getPagesToConvert();

        const scale =
            parseFloat(imageScale.value);

        const quality =
            parseFloat(imageQuality.value);

        for(const pageNumber of pages){

            const page =
                await pdfDoc.getPage(pageNumber);

            const viewport =
                page.getViewport({
                    scale: scale
                });

            const canvas =
                document.createElement("canvas");

            const ctx =
                canvas.getContext("2d");

            canvas.width =
                viewport.width;

            canvas.height =
                viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            const imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    quality
                );

            downloadImage(
                imageData,
                `page-${pageNumber}.jpg`
            );
        }

        statusText.innerText =
            `${pages.length} JPG image(s) downloaded successfully.`;

    }
    catch(error){

        console.error(error);

        alert(error.message);

        statusText.innerText =
            "Conversion failed.";
    }
});
