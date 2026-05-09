const pdfUpload = document.getElementById("pdfUpload");
const imageUpload = document.getElementById("imageUpload");
const downloadBtn = document.getElementById("downloadBtn");

const drawColor = document.getElementById("drawColor");
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");
const imageSize = document.getElementById("imageSize");

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const previewBox = document.querySelector(".pdf-preview");

const ocrOutputBox = document.getElementById("ocrOutputBox");
const ocrText = document.getElementById("ocrText");

previewBox.style.position = "relative";

let pdfDoc = null;
let currentPage = 1;
let rotation = 0;

let selectedElement = null;
let dragElement = null;

let offsetX = 0;
let offsetY = 0;

let isDrawing = false;
let drawMode = false;
let highlightMode = false;

let undoStack = [];

function saveUndo(){
    if(canvas.width && canvas.height){
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
}

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
    const viewport = page.getViewport({
        scale: 1.5,
        rotation: rotation
    });

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

/* ADD IMAGE / SIGNATURE */

function addImageToPDF(file){
    const reader = new FileReader();

    reader.onload = function(e){
        const img = document.createElement("img");

        img.src = e.target.result;
        img.className = "draggable-image";

        img.style.position = "absolute";
        img.style.left = "150px";
        img.style.top = "150px";
        img.style.width = "150px";
        img.style.zIndex = "1000";
        img.style.cursor = "move";

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

/* DRAW + HIGHLIGHT */

canvas.addEventListener("mousedown", function(e){
    if(drawMode || highlightMode){
        saveUndo();

        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    }
});

canvas.addEventListener("mousemove", function(e){
    if(isDrawing && drawMode){
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = "round";
        ctx.strokeStyle = drawColor.value;
        ctx.globalAlpha = 1;

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }

    if(isDrawing && highlightMode){
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.strokeStyle = "yellow";
        ctx.globalAlpha = 0.35;

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }
});

canvas.addEventListener("mouseup", function(){
    isDrawing = false;
    ctx.globalAlpha = 1;
});

/* DRAG MOVE */

document.addEventListener("mousemove", function(e){
    if(dragElement){
        dragElement.style.left = (e.clientX - offsetX) + "px";
        dragElement.style.top = (e.clientY - offsetY) + "px";
    }
});

document.addEventListener("mouseup", function(){
    dragElement = null;
});

/* DELETE SELECTED */

function deleteSelected(){
    if(selectedElement){
        selectedElement.remove();
        selectedElement = null;
    } else {
        alert("Please select text/image first.");
    }
}

/* WATERMARK */

function addWatermark(){
    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    saveUndo();

    const text = document.getElementById("watermarkText").value;
    const color = document.getElementById("watermarkColor").value;
    const size = document.getElementById("watermarkSize").value;
    const opacity = document.getElementById("watermarkOpacity").value / 100;
    const rotationValue = document.getElementById("watermarkRotation").value;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = size + "px Arial";
    ctx.fillStyle = color;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotationValue * Math.PI / 180);
    ctx.textAlign = "center";

    ctx.fillText(text, 0, 0);

    ctx.restore();
}

/* PAGE NUMBER */

function addPageNumber(){
    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    saveUndo();

    const position = document.getElementById("pageNumberPosition").value;
    const format = document.getElementById("pageNumberFormat").value;
    const startNumber = parseInt(document.getElementById("pageStartNumber").value);
    const color = document.getElementById("pageNumberColor").value;
    const size = document.getElementById("pageNumberSize").value;

    const current = startNumber + currentPage - 1;
    const total = pdfDoc ? pdfDoc.numPages : 1;

    let text = "";

    if(format === "number"){
        text = current;
    }
    else if(format === "page-number"){
        text = "Page " + current;
    }
    else if(format === "number-of-total"){
        text = current + " of " + total;
    }
    else{
        text = "Page " + current + " of " + total;
    }

    let x = canvas.width / 2;
    let y = canvas.height - 25;

    if(position === "bottom-right"){
        x = canvas.width - 80;
        y = canvas.height - 25;
    }
    else if(position === "bottom-left"){
        x = 80;
        y = canvas.height - 25;
    }
    else if(position === "top-center"){
        x = canvas.width / 2;
        y = 35;
    }
    else if(position === "top-right"){
        x = canvas.width - 80;
        y = 35;
    }
    else if(position === "top-left"){
        x = 80;
        y = 35;
    }

    ctx.save();
    ctx.font = size + "px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    ctx.restore();
}

/* DELETE PAGE */

function deletePage(){
    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    saveUndo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    alert("Current page cleared.");
}

/* OCR */

async function runOCR(){
    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    ocrOutputBox.style.display = "block";
    ocrText.value = "Scanning text... Please wait.";

    try{
        const result = await Tesseract.recognize(
            canvas.toDataURL(),
            "eng"
        );

        ocrText.value = result.data.text;
    }
    catch(error){
        console.error(error);
        ocrText.value = "OCR failed.";
    }
}

/* BASIC TRANSLATE */

function translateText(){
    if(
        !ocrText.value ||
        ocrText.value === "Scanning text... Please wait."
    ){
        alert("Please run OCR Scan first.");
        return;
    }

    let translated = ocrText.value;

    translated = translated
        .replace(/Medical/gi, "મેડિકલ")
        .replace(/Hospital/gi, "હોસ્પિટલ")
        .replace(/Tender/gi, "ટેન્ડર")
        .replace(/Page/gi, "પેજ")
        .replace(/Date/gi, "તારીખ")
        .replace(/Name/gi, "નામ")
        .replace(/Amount/gi, "રકમ")
        .replace(/Document/gi, "દસ્તાવેજ")
        .replace(/Invoice/gi, "ઇન્વોઇસ")
        .replace(/Certificate/gi, "સર્ટિફિકેટ");

    ocrText.value = translated;
    ocrOutputBox.style.display = "block";

    alert("Basic translation completed.");
}

/* IMAGE UPLOAD */

imageUpload.addEventListener("change", function(){
    const file = this.files[0];

    if(file){
        addImageToPDF(file);
    }

    imageUpload.value = "";
});

/* IMAGE RESIZE */

if(imageSize){
    imageSize.addEventListener("input", function(){
        if(
            selectedElement &&
            selectedElement.classList.contains("draggable-image")
        ){
            selectedElement.style.width = imageSize.value + "px";
        }
    });
}

/* TEXT FONT SIZE */

document.getElementById("textFontSize").addEventListener("input", function(){
    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){
        selectedElement.style.fontSize = this.value + "px";
    }
});

/* TEXT COLOR */

document.getElementById("textColor").addEventListener("input", function(){
    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){
        selectedElement.style.color = this.value;
    }
});

/* TEXT BACKGROUND */

document.getElementById("textBgColor").addEventListener("input", function(){
    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){
        selectedElement.style.background = this.value;
    }
});

/* BUTTON ACTIONS */

const buttons = document.querySelectorAll(".sidebar button");

buttons.forEach(btn => {
    btn.addEventListener("click", () => {

        if(btn.innerText === "Add Text"){
            addEditableText();
        }

        else if(btn.innerText === "Draw"){
            drawMode = !drawMode;
            highlightMode = false;
            alert(drawMode ? "Draw Mode Enabled" : "Draw Mode Disabled");
        }

        else if(btn.innerText === "Highlight"){
            highlightMode = !highlightMode;
            drawMode = false;
            alert(highlightMode ? "Highlight Mode Enabled" : "Highlight Mode Disabled");
        }

        else if(btn.innerText === "Add Image"){
            imageUpload.click();
        }

        else if(btn.innerText === "Signature"){
            imageUpload.click();
        }

        else if(btn.innerText === "Watermark"){
            addWatermark();
        }

        else if(btn.innerText === "Rotate Page"){
            if(!pdfDoc){
                alert("Please upload PDF first.");
                return;
            }

            rotation = (rotation + 90) % 360;
            renderPage(currentPage);
        }

        else if(btn.innerText === "Delete Page"){
            deletePage();
        }

        else if(btn.innerText === "Page Number"){
            addPageNumber();
        }

        else if(btn.innerText === "OCR Scan"){
            runOCR();
        }

        else if(btn.innerText.includes("Translate")){
            ocrOutputBox.style.display = "block";

            if(
                !ocrText.value ||
                ocrText.value === "Scanning text... Please wait."
            ){
                alert("Please run OCR Scan first.");
                return;
            }

            translateText();
        }

        else if(btn.innerText === "Erase / Delete Selected"){
            deleteSelected();
        }

    });
});

/* UNDO */

undoBtn.addEventListener("click", function(){
    if(undoStack.length > 0){
        const lastState = undoStack.pop();
        ctx.putImageData(lastState, 0, 0);
    } else {
        alert("Nothing to undo.");
    }
});

/* DOWNLOAD AS PDF */

downloadBtn.addEventListener("click", async function(){
    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    const imageData = canvas.toDataURL("image/png");

    const pdf = await PDFLib.PDFDocument.create();

    const page = pdf.addPage([canvas.width, canvas.height]);

    const pngImage = await pdf.embedPng(imageData);

    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
    });

    const pdfBytes = await pdf.save();

    const blob = new Blob([pdfBytes], {
        type: "application/pdf"
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "edited-pdf.pdf";

    link.click();
});
