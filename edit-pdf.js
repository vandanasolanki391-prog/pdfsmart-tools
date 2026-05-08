const pdfUpload = document.getElementById("pdfUpload");
const imageUpload = document.getElementById("imageUpload");

const downloadBtn = document.getElementById("downloadBtn");

const drawColor = document.getElementById("drawColor");
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

const previewBox = document.querySelector(".pdf-preview");

previewBox.style.position = "relative";

let pdfDoc = null;
let currentPage = 1;

let selectedElement = null;
let dragElement = null;

let offsetX = 0;
let offsetY = 0;

let isDrawing = false;
let drawMode = false;

let undoStack = [];

/* SELECT ELEMENT */

function selectElement(el){

    document.querySelectorAll(".editable-text, .draggable-image")
    .forEach(item => item.classList.remove("selected-element"));

    selectedElement = el;

    selectedElement.classList.add("selected-element");
}

/* PDF LOAD */

pdfUpload.addEventListener("change", async function(e){

    const file = e.target.files[0];

    if(!file) return;

    const fileReader = new FileReader();

    fileReader.onload = async function(){

        const typedarray = new Uint8Array(this.result);

        pdfDoc = await pdfjsLib.getDocument(typedarray).promise;

        renderPage(currentPage);

    };

    fileReader.readAsArrayBuffer(file);

});

/* RENDER PDF */

async function renderPage(pageNumber){

    const page = await pdfDoc.getPage(pageNumber);

    const viewport = page.getViewport({ scale: 1.5 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
}

/* ADD TEXT */

function addEditableText(){

    const textBox = document.createElement("div");

    textBox.innerText = "Type here";

    textBox.contentEditable = true;

    textBox.className = "editable-text";

    textBox.style.position = "absolute";
    textBox.style.left = "120px";
    textBox.style.top = "120px";

    textBox.style.fontSize = "20px";
    textBox.style.fontFamily = "Arial";

    textBox.style.color = "#000";

    textBox.style.padding = "5px 8px";

    textBox.style.border = "1px dashed #2563eb";

    textBox.style.background = "rgba(255,255,255,0.7)";

    textBox.style.cursor = "move";

    textBox.style.zIndex = "1000";

    previewBox.appendChild(textBox);

    selectElement(textBox);

    textBox.focus();

    textBox.addEventListener("click", function(e){

        e.stopPropagation();

        selectElement(textBox);

    });

    textBox.addEventListener("mousedown", function(e){

        e.stopPropagation();

        selectElement(textBox);

        dragElement = textBox;

        offsetX = e.clientX - textBox.offsetLeft;

        offsetY = e.clientY - textBox.offsetTop;

    });

}

/* ADD IMAGE */

function addImageToPDF(file){

    const reader = new FileReader();

    reader.onload = function(e){

        const img = document.createElement("img");

        img.src = e.target.result;

        img.className = "draggable-image";

        img.style.left = "150px";
        img.style.top = "150px";

        previewBox.appendChild(img);

        selectElement(img);

        img.addEventListener("click", function(e){

            e.stopPropagation();

            selectElement(img);

        });

        img.addEventListener("mousedown", function(e){

            e.stopPropagation();

            selectElement(img);

            dragElement = img;

            offsetX = e.clientX - img.offsetLeft;

            offsetY = e.clientY - img.offsetTop;

        });

    };

    reader.readAsDataURL(file);
}

/* DRAW */

canvas.addEventListener("mousedown", function(e){

    if(drawMode){

        undoStack.push(
            ctx.getImageData(0, 0, canvas.width, canvas.height)
        );

        isDrawing = true;

        ctx.beginPath();

        ctx.moveTo(
            e.offsetX,
            e.offsetY
        );

    }

});

canvas.addEventListener("mousemove", function(e){

    if(isDrawing && drawMode){

        ctx.lineWidth = brushSize.value;

        ctx.lineCap = "round";

        ctx.strokeStyle = drawColor.value;

        ctx.lineTo(
            e.offsetX,
            e.offsetY
        );

        ctx.stroke();

    }

});

canvas.addEventListener("mouseup", function(){

    isDrawing = false;

});

/* DRAG MOVE */

document.addEventListener("mousemove", function(e){

    if(dragElement){

        dragElement.style.left =
            (e.clientX - offsetX) + "px";

        dragElement.style.top =
            (e.clientY - offsetY) + "px";

    }

});

document.addEventListener("mouseup", function(){

    dragElement = null;

});

/* DELETE */

function deleteSelected(){

    if(selectedElement){

        selectedElement.remove();

        selectedElement = null;

    }
    else{

        alert("Please select added text/image first.");

    }

}

/* IMAGE UPLOAD */

imageUpload.addEventListener("change", function(){

    const file = this.files[0];

    if(file){

        addImageToPDF(file);

    }

});

/* BUTTON ACTIONS */

const buttons = document.querySelectorAll(".sidebar button");

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        if(btn.innerText === "Add Text"){

            addEditableText();

        }

        else if(btn.innerText === "Add Image"){

            imageUpload.click();

        }

        else if(btn.innerText === "Erase / Delete Selected"){

            deleteSelected();

        }

        else if(btn.innerText === "Draw"){

            drawMode = !drawMode;

            alert(
                drawMode
                ? "Draw Mode Enabled"
                : "Draw Mode Disabled"
            );

        }

        else{

            alert(btn.innerText + " feature coming soon!");

        }

    });

});

/* UNDO */

undoBtn.addEventListener("click", function(){

    if(undoStack.length > 0){

        const lastState = undoStack.pop();

        ctx.putImageData(lastState, 0, 0);

    }
    else{

        alert("Nothing to undo.");

    }

});

/* DOWNLOAD */

downloadBtn.addEventListener("click", function(){

    const link = document.createElement("a");

    link.download = "edited-pdf.png";

    link.href = canvas.toDataURL("image/png");

    link.click();

});
