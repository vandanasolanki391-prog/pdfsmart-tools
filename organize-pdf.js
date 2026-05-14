const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const pageGrid = document.getElementById("pageGrid");

const downloadBtn = document.getElementById("downloadBtn");
const statusText = document.getElementById("statusText");

let pdfFiles = [];
let pageItems = [];
let dragIndex = null;

/* FILE SELECT / ADD MORE PDFs */

pdfFileInput.addEventListener("change", async function(e){

    const newFiles = Array.from(e.target.files);

    if(newFiles.length === 0){
        return;
    }

    uploadSection.style.display = "none";
    workSection.style.display = "block";

    statusText.innerText = "Loading PDF pages...";

    for(const file of newFiles){

        pdfFiles.push(file);

        await loadPdfPages(file, pdfFiles.length - 1);
    }

    await renderPages();

    statusText.innerText =
        `${pageItems.length} page(s) loaded from ${pdfFiles.length} PDF file(s).`;

    pdfFileInput.value = "";
});

/* LOAD PDF PAGES */

async function loadPdfPages(file, fileIndex){

    const bytes = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: bytes
    }).promise;

    for(let pageNo = 1; pageNo <= pdf.numPages; pageNo++){

        pageItems.push({
            fileIndex: fileIndex,
            fileName: file.name,
            pageNo: pageNo
        });
    }
}

/* RENDER PAGE CARDS */

async function renderPages(){

    pageGrid.innerHTML = "";

    for(let index = 0; index < pageItems.length; index++){

        const item = pageItems[index];
        const file = pdfFiles[item.fileIndex];

        const bytes = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: bytes
        }).promise;

        const page = await pdf.getPage(item.pageNo);

        const viewport = page.getViewport({
            scale:0.35
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        const pageCard = document.createElement("div");
        pageCard.className = "page-card";
        pageCard.draggable = true;
        pageCard.dataset.index = index;

        pageCard.innerHTML = `
            <div class="page-preview"></div>

            <div class="page-number">
                Page ${item.pageNo}
            </div>

            <div class="source-file">
                ${item.fileName}
            </div>

            <button class="remove-page-btn">
                Remove
            </button>
        `;

        pageCard.querySelector(".page-preview").appendChild(canvas);

        pageCard
            .querySelector(".remove-page-btn")
            .addEventListener("click", function(){
                pageItems.splice(index, 1);
                renderPages();
            });

        addDragEvents(pageCard);

        pageGrid.appendChild(pageCard);
    }
}

/* DRAG EVENTS */

function addDragEvents(card){

    card.addEventListener("dragstart", function(){
        dragIndex = Number(card.dataset.index);
        card.classList.add("dragging");
    });

    card.addEventListener("dragend", function(){
        card.classList.remove("dragging");
        dragIndex = null;
    });

    card.addEventListener("dragover", function(e){
        e.preventDefault();
    });

    card.addEventListener("drop", function(e){
        e.preventDefault();

        const dropIndex = Number(card.dataset.index);

        if(dragIndex === null || dragIndex === dropIndex){
            return;
        }

        const movedPage = pageItems.splice(dragIndex, 1)[0];
        pageItems.splice(dropIndex, 0, movedPage);

        renderPages();
    });
}

/* DOWNLOAD ORGANIZED PDF */

downloadBtn.addEventListener("click", async function(){

    if(pageItems.length === 0){
        alert("Please add at least one PDF page.");
        return;
    }

    try{

        statusText.innerText = "Creating organized PDF...";

        const newPdf = await PDFLib.PDFDocument.create();

        const loadedPdfDocs = {};

        for(const item of pageItems){

            if(!loadedPdfDocs[item.fileIndex]){

                const bytes =
                    await pdfFiles[item.fileIndex].arrayBuffer();

                loadedPdfDocs[item.fileIndex] =
                    await PDFLib.PDFDocument.load(bytes);
            }

            const sourcePdf = loadedPdfDocs[item.fileIndex];

            const [copiedPage] =
                await newPdf.copyPages(
                    sourcePdf,
                    [item.pageNo - 1]
                );

            newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();

        const blob = new Blob([pdfBytes], {
            type:"application/pdf"
        });

        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "organized-pdf.pdf";

        link.click();

        statusText.innerText =
            "Organized PDF downloaded successfully.";

    }
    catch(error){

        console.error(error);

        alert("Failed to organize PDF.");

        statusText.innerText =
            "Organize PDF failed.";
    }
});
