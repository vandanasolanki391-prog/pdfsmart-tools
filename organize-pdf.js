const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const pageGrid = document.getElementById("pageGrid");

const downloadBtn = document.getElementById("downloadBtn");
const statusText = document.getElementById("statusText");

let selectedFile = null;
let pdfDoc = null;

let pageOrder = [];
let dragIndex = null;

/* FILE SELECT */

pdfFileInput.addEventListener("change", async function(e){

    selectedFile = e.target.files[0];

    if(!selectedFile){
        return;
    }

    try{

        statusText.innerText =
            "Loading PDF...";

        const bytes =
            await selectedFile.arrayBuffer();

        pdfDoc =
            await pdfjsLib.getDocument({
                data: bytes
            }).promise;

        uploadSection.style.display = "none";
        workSection.style.display = "block";

        pageOrder = [];

        for(let i = 1; i <= pdfDoc.numPages; i++){
            pageOrder.push(i);
        }

        await renderPages();

        statusText.innerText =
            "PDF loaded successfully.";

    }
    catch(error){

        console.error(error);

        alert("Failed to load PDF.");

        statusText.innerText =
            "PDF load failed.";
    }
});

/* RENDER PAGES */

async function renderPages(){

    pageGrid.innerHTML = "";

    for(let index = 0; index < pageOrder.length; index++){

        const pageNumber =
            pageOrder[index];

        const page =
            await pdfDoc.getPage(pageNumber);

        const viewport =
            page.getViewport({
                scale:0.4
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

        const pageCard =
            document.createElement("div");

        pageCard.className =
            "page-card";

        pageCard.draggable = true;

        pageCard.dataset.index =
            index;

        pageCard.innerHTML = `
            <div class="page-preview"></div>

            <div class="page-number">
                Page ${pageNumber}
            </div>

            <button class="remove-page-btn">
                Remove
            </button>
        `;

        pageCard
            .querySelector(".page-preview")
            .appendChild(canvas);

        /* REMOVE PAGE */

        pageCard
            .querySelector(".remove-page-btn")
            .addEventListener("click", function(){

                pageOrder.splice(index, 1);

                renderPages();
            });

        /* DRAG EVENTS */

        pageCard.addEventListener("dragstart", function(){

            dragIndex = index;

            pageCard.classList.add("dragging");
        });

        pageCard.addEventListener("dragend", function(){

            pageCard.classList.remove("dragging");
        });

        pageCard.addEventListener("dragover", function(e){

            e.preventDefault();
        });

        pageCard.addEventListener("drop", function(e){

            e.preventDefault();

            const dropIndex =
                parseInt(pageCard.dataset.index);

            if(
                dragIndex === null ||
                dragIndex === dropIndex
            ){
                return;
            }

            const movedPage =
                pageOrder.splice(dragIndex,1)[0];

            pageOrder.splice(
                dropIndex,
                0,
                movedPage
            );

            renderPages();
        });

        pageGrid.appendChild(pageCard);
    }
}

/* DOWNLOAD ORGANIZED PDF */

downloadBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select PDF file first.");
        return;
    }

    try{

        statusText.innerText =
            "Creating organized PDF...";

        const existingBytes =
            await selectedFile.arrayBuffer();

        const sourcePdf =
            await PDFLib.PDFDocument.load(existingBytes);

        const newPdf =
            await PDFLib.PDFDocument.create();

        const pageIndexes =
            pageOrder.map(p => p - 1);

        const copiedPages =
            await newPdf.copyPages(
                sourcePdf,
                pageIndexes
            );

        copiedPages.forEach(page => {

            newPdf.addPage(page);
        });

        const pdfBytes =
            await newPdf.save();

        const blob =
            new Blob(
                [pdfBytes],
                {
                    type:"application/pdf"
                }
            );

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            "organized-pdf.pdf";

        link.click();

        statusText.innerText =
            "Organized PDF downloaded.";

    }
    catch(error){

        console.error(error);

        alert("Failed to organize PDF.");

        statusText.innerText =
            "Organize PDF failed.";
    }
});
