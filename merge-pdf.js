const pdfFilesInput = document.getElementById("pdfFiles");
const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");
const fileList = document.getElementById("fileList");
const mergeBtn = document.getElementById("mergeBtn");
const statusText = document.getElementById("statusText");

const oldToNewBtn = document.getElementById("oldToNewBtn");
const newToOldBtn = document.getElementById("newToOldBtn");
const azBtn = document.getElementById("azBtn");
const zaBtn = document.getElementById("zaBtn");

let selectedFiles = [];
let dragIndex = null;

/* SELECT FILES */

pdfFilesInput.addEventListener("change", function(e){
    const newFiles = Array.from(e.target.files);

    selectedFiles = selectedFiles.concat(newFiles);

    if(selectedFiles.length > 0){
        uploadSection.style.display = "none";
        workSection.style.display = "block";
    }

    renderFileList();

    pdfFilesInput.value = "";
});

/* RENDER FILE LIST */

async function renderFileList(){
    fileList.innerHTML = "";

    if(selectedFiles.length === 0){
        uploadSection.style.display = "block";
        workSection.style.display = "none";
        return;
    }

    statusText.innerText = `${selectedFiles.length} PDF file(s) selected`;

    for(let index = 0; index < selectedFiles.length; index++){
        const file = selectedFiles[index];

        const item = document.createElement("div");
        item.className = "file-item";
        item.draggable = true;
        item.dataset.index = index;

        item.innerHTML = `
            <div class="file-left">
                <div class="pdf-preview">
                    <canvas id="preview-${index}"></canvas>
                </div>

                <div class="file-info">
                    <h4>${index + 1}. ${file.name}</h4>
                    <p>${formatSize(file.size)} | Last Modified: ${formatDate(file.lastModified)}</p>
                </div>
            </div>

            <div class="file-actions">
                <button class="action-btn" onclick="moveFileUp(${index})">↑</button>
                <button class="action-btn" onclick="moveFileDown(${index})">↓</button>
                <button class="remove-btn" onclick="removeFile(${index})">Remove</button>
            </div>
        `;

        fileList.appendChild(item);

        addDragEvents(item);
        renderPdfPreview(file, `preview-${index}`);
    }
}

/* PDF FIRST PAGE PREVIEW */

async function renderPdfPreview(file, canvasId){
    try{
        const bytes = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: bytes
        }).promise;

        const page = await pdf.getPage(1);

        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext("2d");

        const viewport = page.getViewport({ scale: 0.25 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
    }
    catch(error){
        console.error("Preview error:", error);
    }
}

/* FORMAT HELPERS */

function formatSize(bytes){
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDate(timestamp){
    const date = new Date(timestamp);
    return date.toLocaleDateString();
}

/* DRAG DROP REORDER */

function addDragEvents(item){
    item.addEventListener("dragstart", function(){
        dragIndex = Number(item.dataset.index);
        item.classList.add("dragging");
    });

    item.addEventListener("dragend", function(){
        item.classList.remove("dragging");
        dragIndex = null;
    });

    item.addEventListener("dragover", function(e){
        e.preventDefault();
    });

    item.addEventListener("drop", function(e){
        e.preventDefault();

        const dropIndex = Number(item.dataset.index);

        if(dragIndex === null || dragIndex === dropIndex){
            return;
        }

        const draggedFile = selectedFiles.splice(dragIndex, 1)[0];
        selectedFiles.splice(dropIndex, 0, draggedFile);

        renderFileList();
    });
}

/* MOVE BUTTONS */

function moveFileUp(index){
    if(index === 0) return;

    [selectedFiles[index - 1], selectedFiles[index]] =
    [selectedFiles[index], selectedFiles[index - 1]];

    renderFileList();
}

function moveFileDown(index){
    if(index === selectedFiles.length - 1) return;

    [selectedFiles[index + 1], selectedFiles[index]] =
    [selectedFiles[index], selectedFiles[index + 1]];

    renderFileList();
}

function removeFile(index){
    selectedFiles.splice(index, 1);
    renderFileList();
}

/* SORT BUTTONS */

oldToNewBtn.addEventListener("click", function(){
    selectedFiles.sort((a, b) => a.lastModified - b.lastModified);
    renderFileList();
});

newToOldBtn.addEventListener("click", function(){
    selectedFiles.sort((a, b) => b.lastModified - a.lastModified);
    renderFileList();
});

azBtn.addEventListener("click", function(){
    selectedFiles.sort((a, b) => a.name.localeCompare(b.name));
    renderFileList();
});

zaBtn.addEventListener("click", function(){
    selectedFiles.sort((a, b) => b.name.localeCompare(a.name));
    renderFileList();
});

/* MERGE PDF */

mergeBtn.addEventListener("click", async function(){
    if(selectedFiles.length < 2){
        alert("Please select at least 2 PDF files.");
        return;
    }

    try{
        statusText.innerText = "Merging PDFs... Please wait.";

        const mergedPdf = await PDFLib.PDFDocument.create();

        for(const file of selectedFiles){
            const fileBytes = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(fileBytes);

            const copiedPages = await mergedPdf.copyPages(
                pdf,
                pdf.getPageIndices()
            );

            copiedPages.forEach(page => {
                mergedPdf.addPage(page);
            });
        }

        const mergedPdfBytes = await mergedPdf.save();

        const blob = new Blob([mergedPdfBytes], {
            type: "application/pdf"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "merged-pdf.pdf";
        link.click();

        statusText.innerText = "PDF merged successfully.";
    }
    catch(error){
        console.error(error);
        statusText.innerText = "Error while merging PDF.";
        alert("Merge failed. Please try again.");
    }
});
