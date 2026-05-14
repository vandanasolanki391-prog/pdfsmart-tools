const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const fileInfo = document.getElementById("fileInfo");
const pageInput = document.getElementById("pageInput");
const targetLang = document.getElementById("targetLang");

const translateBtn = document.getElementById("translateBtn");

const originalText = document.getElementById("originalText");
const translatedText = document.getElementById("translatedText");

const copyBtn = document.getElementById("copyBtn");
const downloadTextBtn = document.getElementById("downloadTextBtn");

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

function getPages(){

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

/* BASIC TRANSLATION */

function translateBasic(text, lang){

    if(lang === "gujarati"){

        const words = {
            "name":"નામ",
            "address":"સરનામું",
            "date":"તારીખ",
            "invoice":"બીલ",
            "number":"નંબર",
            "total":"કુલ",
            "amount":"રકમ",
            "page":"પાનું",
            "phone":"ફોન",
            "email":"ઈમેલ",
            "company":"કંપની",
            "payment":"ચુકવણી",
            "customer":"ગ્રાહક"
        };

        Object.keys(words).forEach(key => {

            const regex =
                new RegExp(`\\b${key}\\b`,"gi");

            text =
                text.replace(regex, words[key]);
        });

        return text;
    }

    if(lang === "hindi"){

        const words = {
            "name":"नाम",
            "address":"पता",
            "date":"तारीख",
            "invoice":"बिल",
            "number":"नंबर",
            "total":"कुल",
            "amount":"राशि",
            "page":"पेज",
            "phone":"फोन",
            "email":"ईमेल",
            "company":"कंपनी",
            "payment":"भुगतान",
            "customer":"ग्राहक"
        };

        Object.keys(words).forEach(key => {

            const regex =
                new RegExp(`\\b${key}\\b`,"gi");

            text =
                text.replace(regex, words[key]);
        });

        return text;
    }

    return text;
}

/* OCR + TRANSLATE */

translateBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select a PDF file first.");
        return;
    }

    try{

        originalText.value = "";
        translatedText.value = "";

        statusText.innerText =
            "Running OCR and Translation...";

        const pages =
            getPages();

        let finalText = "";

        for(const pageNumber of pages){

            statusText.innerText =
                `Processing Page ${pageNumber}...`;

            const page =
                await pdfDoc.getPage(pageNumber);

            const viewport =
                page.getViewport({
                    scale:2
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
                canvas.toDataURL("image/png");

            const result =
                await Tesseract.recognize(
                    imageData,
                    "eng"
                );

            finalText +=
                `\n\n========== PAGE ${pageNumber} ==========\n\n`;

            finalText +=
                result.data.text;
        }

        originalText.value =
            finalText;

        translatedText.value =
            translateBasic(
                finalText,
                targetLang.value
            );

        statusText.innerText =
            "Translation completed.";

    }
    catch(error){

        console.error(error);

        alert(error.message);

        statusText.innerText =
            "Translation failed.";
    }
});

/* COPY */

copyBtn.addEventListener("click", async function(){

    if(!translatedText.value.trim()){

        alert("No translated text available.");
        return;
    }

    try{

        await navigator.clipboard.writeText(
            translatedText.value
        );

        alert("Translated text copied.");

    }
    catch(error){

        console.error(error);

        alert("Copy failed.");
    }
});

/* DOWNLOAD */

downloadTextBtn.addEventListener("click", function(){

    if(!translatedText.value.trim()){

        alert("No translated text available.");
        return;
    }

    const blob =
        new Blob(
            [translatedText.value],
            {type:"text/plain"}
        );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "translated-text.txt";

    link.click();
});
