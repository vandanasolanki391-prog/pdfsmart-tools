const pdfUpload = document.getElementById("pdfUpload");
const imageUpload = document.getElementById("imageUpload");
const downloadBtn = document.getElementById("downloadBtn");

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const previewBox = document.getElementById("pdfPreview");

const drawColor = document.getElementById("drawColor");
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");
const imageSize = document.getElementById("imageSize");
const eraserSize = document.getElementById("eraserSize");

const ocrOutputBox = document.getElementById("ocrOutputBox");
const ocrText = document.getElementById("ocrText");

const contextMenu = document.getElementById("contextMenu");

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

/* BASIC FUNCTIONS */

function saveUndo(){
    if(canvas.width && canvas.height){
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
}

function hideContextMenu(){
    contextMenu.style.display = "none";
}

function selectElement(el){
    document.querySelectorAll(".editable-text, .draggable-image, .shape-element, .white-eraser")
        .forEach(item => item.classList.remove("selected-element"));

    selectedElement = el;
    selectedElement.classList.add("selected-element");
}

function makeDraggable(el){
    el.addEventListener("click", function(e){
        e.stopPropagation();
        selectElement(el);
    });

    el.addEventListener("mousedown", function(e){
        if(e.button !== 0) return;

        e.stopPropagation();
        selectElement(el);

        dragElement = el;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
    });

    el.addEventListener("contextmenu", function(e){
        e.preventDefault();
        selectElement(el);

        contextMenu.style.left = e.pageX + "px";
        contextMenu.style.top = e.pageY + "px";
        contextMenu.style.display = "block";
    });
}

document.addEventListener("click", function(){
    hideContextMenu();
});

document.addEventListener("mousemove", function(e){
    if(dragElement){
        dragElement.style.left = (e.clientX - offsetX) + "px";
        dragElement.style.top = (e.clientY - offsetY) + "px";
    }
});

document.addEventListener("mouseup", function(){
    dragElement = null;
});

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

    canvas.width = viewport.width;
    canvas.height = viewport.height;

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

    textBox.style.left = "120px";
    textBox.style.top = "120px";
    textBox.style.fontSize = document.getElementById("textFontSize").value + "px";
    textBox.style.color = document.getElementById("textColor").value;
    textBox.style.background = document.getElementById("textBgColor").value;

    previewBox.appendChild(textBox);
    makeDraggable(textBox);
    selectElement(textBox);
    textBox.focus();
}

/* EDIT TEXT PRACTICAL TOOL */

function editTextTool(){
    alert("Old PDF text cannot be directly edited in browser. Use White Eraser to cover old text, then Add Text to place new text.");
}

/* WHITE ERASER */

function addWhiteEraser(){
    const eraser = document.createElement("div");

    eraser.className = "white-eraser";
    eraser.style.left = "150px";
    eraser.style.top = "150px";
    eraser.style.width = eraserSize.value + "px";
    eraser.style.height = "60px";

    previewBox.appendChild(eraser);
    makeDraggable(eraser);
    selectElement(eraser);
}

/* ADD IMAGE / SIGNATURE */

function addImageToPDF(file){
    const reader = new FileReader();

    reader.onload = function(e){
        const img = document.createElement("img");

        img.src = e.target.result;
        img.className = "draggable-image";
        img.style.left = "150px";
        img.style.top = "150px";
        img.style.width = imageSize.value + "px";

        previewBox.appendChild(img);
        makeDraggable(img);
        selectElement(img);
    };

    reader.readAsDataURL(file);
}

imageUpload.addEventListener("change", function(){
    const file = this.files[0];

    if(file){
        addImageToPDF(file);
    }

    imageUpload.value = "";
});

/* SHAPES */

function addShape(type){
    const shape = document.createElement("div");

    shape.classList.add("shape-element");

    if(type === "rectangle"){
        shape.classList.add("rectangle-shape");
    }

    if(type === "circle"){
        shape.classList.add("circle-shape");
    }

    if(type === "line"){
        shape.classList.add("line-shape");
    }

    if(type === "arrow"){
        shape.classList.add("arrow-shape");
    }

    shape.style.left = "180px";
    shape.style.top = "180px";

    previewBox.appendChild(shape);
    makeDraggable(shape);
    selectElement(shape);
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
    const rotate = document.getElementById("watermarkRotation").value;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = size + "px Arial";
    ctx.fillStyle = color;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotate * Math.PI / 180);
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

/* PROPERTY CONTROLS */

document.getElementById("textFontSize").addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("editable-text")){
        selectedElement.style.fontSize = this.value + "px";
    }
});

document.getElementById("textColor").addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("editable-text")){
        selectedElement.style.color = this.value;
    }
});

document.getElementById("textBgColor").addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("editable-text")){
        selectedElement.style.background = this.value;
    }
});

imageSize.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("draggable-image")){
        selectedElement.style.width = this.value + "px";
    }
});

eraserSize.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("white-eraser")){
        selectedElement.style.width = this.value + "px";
    }
});

/* BUTTONS */

document.getElementById("addTextBtn").addEventListener("click", addEditableText);

document.getElementById("editTextBtn").addEventListener("click", editTextTool);

document.getElementById("whiteEraserBtn").addEventListener("click", addWhiteEraser);

document.getElementById("drawBtn").addEventListener("click", function(){
    drawMode = !drawMode;
    highlightMode = false;
    alert(drawMode ? "Draw Mode Enabled" : "Draw Mode Disabled");
});

document.getElementById("highlightBtn").addEventListener("click", function(){
    highlightMode = !highlightMode;
    drawMode = false;
    alert(highlightMode ? "Highlight Mode Enabled" : "Highlight Mode Disabled");
});

document.getElementById("rectangleBtn").addEventListener("click", function(){
    addShape("rectangle");
});

document.getElementById("circleBtn").addEventListener("click", function(){
    addShape("circle");
});

document.getElementById("lineBtn").addEventListener("click", function(){
    addShape("line");
});

document.getElementById("arrowBtn").addEventListener("click", function(){
    addShape("arrow");
});

document.getElementById("addImageBtn").addEventListener("click", function(){
    imageUpload.click();
});

document.getElementById("signatureBtn").addEventListener("click", function(){
    imageUpload.click();
});

document.getElementById("watermarkBtn").addEventListener("click", addWatermark);

document.getElementById("rotateBtn").addEventListener("click", function(){
    if(!pdfDoc){
        alert("Please upload PDF first.");
        return;
    }

    rotation = (rotation + 90) % 360;
    renderPage(currentPage);
});

document.getElementById("deletePageBtn").addEventListener("click", deletePage);

document.getElementById("pageNumberBtn").addEventListener("click", addPageNumber);

document.getElementById("ocrBtn").addEventListener("click", runOCR);

document.getElementById("translateBtn").addEventListener("click", function(){
    ocrOutputBox.style.display = "block";
    translateText();
});

/* CONTEXT MENU */

document.getElementById("ctxDelete").addEventListener("click", function(){
    if(selectedElement){
        selectedElement.remove();
        selectedElement = null;
    }
    hideContextMenu();
});

document.getElementById("ctxDuplicate").addEventListener("click", function(){
    if(selectedElement){
        const clone = selectedElement.cloneNode(true);

        clone.style.left = (selectedElement.offsetLeft + 20) + "px";
        clone.style.top = (selectedElement.offsetTop + 20) + "px";

        previewBox.appendChild(clone);
        makeDraggable(clone);
        selectElement(clone);
    }
    hideContextMenu();
});

document.getElementById("ctxBringFront").addEventListener("click", function(){
    if(selectedElement){
        selectedElement.style.zIndex = "5000";
    }
    hideContextMenu();
});

document.getElementById("ctxSendBack").addEventListener("click", function(){
    if(selectedElement){
        selectedElement.style.zIndex = "900";
    }
    hideContextMenu();
});

document.getElementById("ctxIncrease").addEventListener("click", function(){
    if(selectedElement){
        if(selectedElement.classList.contains("draggable-image")){
            selectedElement.style.width = (selectedElement.offsetWidth + 20) + "px";
        }
        else{
            selectedElement.style.transform = "scale(1.15)";
        }
    }
    hideContextMenu();
});

document.getElementById("ctxDecrease").addEventListener("click", function(){
    if(selectedElement){
        if(selectedElement.classList.contains("draggable-image")){
            selectedElement.style.width = Math.max(40, selectedElement.offsetWidth - 20) + "px";
        }
        else{
            selectedElement.style.transform = "scale(0.9)";
        }
    }
    hideContextMenu();
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

/* DOWNLOAD AS PDF */

downloadBtn.addEventListener("click", async function(){
    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    hideContextMenu();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.drawImage(canvas, 0, 0);

    const elements = previewBox.querySelectorAll(
        ".editable-text, .draggable-image, .shape-element, .white-eraser"
    );

    for(const el of elements){
        const x = el.offsetLeft - canvas.offsetLeft;
        const y = el.offsetTop - canvas.offsetTop;

        if(el.classList.contains("editable-text")){
            tempCtx.font = window.getComputedStyle(el).fontSize + " Arial";
            tempCtx.fillStyle = window.getComputedStyle(el).backgroundColor;
            tempCtx.fillRect(x, y, el.offsetWidth, el.offsetHeight);

            tempCtx.fillStyle = window.getComputedStyle(el).color;
            tempCtx.fillText(el.innerText, x + 5, y + el.offsetHeight - 8);
        }

        if(el.classList.contains("white-eraser")){
            tempCtx.fillStyle = "white";
            tempCtx.fillRect(x, y, el.offsetWidth, el.offsetHeight);
        }

        if(el.classList.contains("draggable-image")){
            await new Promise(resolve => {
                const img = new Image();
                img.onload = function(){
                    tempCtx.drawImage(img, x, y, el.offsetWidth, el.offsetHeight);
                    resolve();
                };
                img.src = el.src;
            });
        }

        if(el.classList.contains("rectangle-shape")){
            tempCtx.strokeStyle = "red";
            tempCtx.lineWidth = 4;
            tempCtx.strokeRect(x, y, el.offsetWidth, el.offsetHeight);
        }

        if(el.classList.contains("circle-shape")){
            tempCtx.strokeStyle = "blue";
            tempCtx.lineWidth = 4;
            tempCtx.beginPath();
            tempCtx.ellipse(
                x + el.offsetWidth / 2,
                y + el.offsetHeight / 2,
                el.offsetWidth / 2,
                el.offsetHeight / 2,
                0,
                0,
                Math.PI * 2
            );
            tempCtx.stroke();
        }

        if(el.classList.contains("line-shape")){
            tempCtx.strokeStyle = "black";
            tempCtx.lineWidth = 4;
            tempCtx.beginPath();
            tempCtx.moveTo(x, y);
            tempCtx.lineTo(x + el.offsetWidth, y);
            tempCtx.stroke();
        }

        if(el.classList.contains("arrow-shape")){
            tempCtx.strokeStyle = "black";
            tempCtx.fillStyle = "black";
            tempCtx.lineWidth = 4;

            tempCtx.beginPath();
            tempCtx.moveTo(x, y);
            tempCtx.lineTo(x + el.offsetWidth, y);
            tempCtx.stroke();

            tempCtx.beginPath();
            tempCtx.moveTo(x + el.offsetWidth, y);
            tempCtx.lineTo(x + el.offsetWidth - 15, y - 8);
            tempCtx.lineTo(x + el.offsetWidth - 15, y + 8);
            tempCtx.closePath();
            tempCtx.fill();
        }
    }

    const imageData = tempCanvas.toDataURL("image/png");

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
