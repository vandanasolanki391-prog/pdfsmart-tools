const uploadScreen = document.getElementById("uploadScreen");
const editorScreen = document.getElementById("editorScreen");

const pdfUpload = document.getElementById("pdfUpload");
const imageUpload = document.getElementById("imageUpload");

const pdfCanvas = document.getElementById("pdfCanvas");
const ctx = pdfCanvas.getContext("2d");
const pdfStage = document.getElementById("pdfStage");

const statusBar = document.getElementById("statusBar");
const downloadBtn = document.getElementById("downloadBtn");
const undoBtn = document.getElementById("undoBtn");

const fontFamily = document.getElementById("fontFamily");
const fontSize = document.getElementById("fontSize");
const textColor = document.getElementById("textColor");
const textBg = document.getElementById("textBg");

const boldBtn = document.getElementById("boldBtn");
const italicBtn = document.getElementById("italicBtn");
const underlineBtn = document.getElementById("underlineBtn");
const supBtn = document.getElementById("supBtn");
const subBtn = document.getElementById("subBtn");

const drawColor = document.getElementById("drawColor");
const brushSize = document.getElementById("brushSize");

const imageSize = document.getElementById("imageSize");

const shapeColor = document.getElementById("shapeColor");
const shapeBorder = document.getElementById("shapeBorder");
const shapeSize = document.getElementById("shapeSize");



let pdfDoc = null;
let currentPage = 1;
let rotation = 0;

let selectedElement = null;
let dragElement = null;
let resizeElement = null;

let offsetX = 0;
let offsetY = 0;

let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

let drawMode = false;
let highlightMode = false;
let isDrawing = false;

let undoStack = [];

/* BASIC */

function setStatus(text){
    statusBar.innerText = text;
}

function saveUndo(){
    if(pdfCanvas.width && pdfCanvas.height){
        undoStack.push(
            ctx.getImageData(0, 0, pdfCanvas.width, pdfCanvas.height)
        );
    }
}

function removeResizeHandles(){
    document.querySelectorAll(".resize-handle").forEach(handle => {
        handle.remove();
    });
}

function selectElement(el){
    document.querySelectorAll(
        ".edit-box, .shape-element, .image-element, .eraser-box"
    ).forEach(item => item.classList.remove("selected"));

    removeResizeHandles();

    selectedElement = el;

    if(selectedElement){
        selectedElement.classList.add("selected");
        addResizeHandle(selectedElement);
    }
}

function addResizeHandle(el){
    const handle = document.createElement("div");
    handle.className = "resize-handle";

    el.appendChild(handle);

    handle.addEventListener("mousedown", function(e){
        e.stopPropagation();

        resizeElement = el;

        startX = e.clientX;
        startY = e.clientY;

        startWidth = el.offsetWidth;
        startHeight = el.offsetHeight;

        document.body.style.userSelect = "none";
    });
}
/* DELETE USING KEYBOARD */

document.addEventListener("keydown", function(e){

    if(
        e.key === "Delete" &&
        selectedElement
    ){
        selectedElement.remove();

        selectedElement = null;

        setStatus("Element deleted.");
    }
});


/* COPY PASTE */

let copiedElement = null;

document.addEventListener("keydown", function(e){

    if(e.ctrlKey && e.key.toLowerCase() === "c"){

        if(selectedElement){
            copiedElement = selectedElement.cloneNode(true);

            setStatus("Element copied.");
        }
    }

    if(e.ctrlKey && e.key.toLowerCase() === "v"){

        if(copiedElement){

            const clone = copiedElement.cloneNode(true);

            clone.style.left =
                (parseInt(selectedElement?.style.left || 150) + 20) + "px";

            clone.style.top =
                (parseInt(selectedElement?.style.top || 150) + 20) + "px";

            pdfStage.appendChild(clone);

            const moveBar = clone.querySelector(".move-bar");

            makeMovable(clone, moveBar || clone);

            selectElement(clone);

            setStatus("Element pasted.");
        }
    }
});


/* CLICK OUTSIDE = DESELECT */

document.addEventListener("click", function(e){

    if(
        !e.target.closest(".edit-box") &&
        !e.target.closest(".shape-element") &&
        !e.target.closest(".image-element") &&
        !e.target.closest(".eraser-box")
    ){
        removeResizeHandles();

        document.querySelectorAll(
            ".edit-box, .shape-element, .image-element, .eraser-box"
        ).forEach(item => item.classList.remove("selected"));

        selectedElement = null;
    }
});
function makeMovable(el, moveHandle = null){
    const handle = moveHandle || el;

    el.addEventListener("click", function(e){
        e.stopPropagation();
        selectElement(el);
    });

    handle.addEventListener("mousedown", function(e){
        if(e.button !== 0) return;
        if(e.target.classList.contains("resize-handle")) return;

        e.stopPropagation();

        selectElement(el);

        dragElement = el;

        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
    });
}

/* GLOBAL MOVE + RESIZE */

document.addEventListener("mousemove", function(e){

    if(dragElement){
        dragElement.style.left = (e.clientX - offsetX) + "px";
        dragElement.style.top = (e.clientY - offsetY) + "px";
    }

    if(resizeElement){
        let newWidth = startWidth + (e.clientX - startX);
        let newHeight = startHeight + (e.clientY - startY);

        if(newWidth < 30) newWidth = 30;
        if(newHeight < 20) newHeight = 20;

        resizeElement.style.width = newWidth + "px";

        if(
            !resizeElement.classList.contains("line") &&
            !resizeElement.classList.contains("arrow")
        ){
            resizeElement.style.height = newHeight + "px";
        }

        if(resizeElement.classList.contains("circle")){
            resizeElement.style.height = newWidth + "px";
        }
    }
});

document.addEventListener("mouseup", function(){
    dragElement = null;
    resizeElement = null;
    document.body.style.userSelect = "auto";
});

/* PDF LOAD */

pdfUpload.addEventListener("change", async function(e){
    const file = e.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = async function(){
        const typedArray = new Uint8Array(this.result);

        pdfDoc = await pdfjsLib.getDocument(typedArray).promise;

        await renderPage(currentPage);
        updatePageInfo();

        uploadScreen.classList.add("hidden");
        editorScreen.classList.remove("hidden");

        setStatus("PDF uploaded. Select any tool from left side.");
    };

    reader.readAsArrayBuffer(file);
});

async function renderPage(pageNumber){
    const page = await pdfDoc.getPage(pageNumber);

    const viewport = page.getViewport({
        scale: 1.5,
        rotation: rotation
    });

    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
}
function updatePageInfo(){
    if(pdfDoc && pageInfo){
        pageInfo.innerText =
            "Page " + currentPage + " of " + pdfDoc.numPages;
    }
}
/* TEXT BOX */

function createTextBox(text, large = false){
    const box = document.createElement("div");
    box.className = "edit-box";

    box.style.left = large ? "160px" : "120px";
    box.style.top = large ? "160px" : "120px";
    box.style.width = large ? "220px" : "170px";
    box.style.height = large ? "90px" : "70px";
    box.style.background = textBg.value;

    const moveBar = document.createElement("div");
    moveBar.className = "move-bar";
    moveBar.innerText = "↕ Move";

    const textArea = document.createElement("div");
    textArea.className = "text-editor";
    textArea.contentEditable = true;
    textArea.innerText = text;
    textArea.style.fontFamily = fontFamily.value;
    textArea.style.fontSize = fontSize.value + "px";
    textArea.style.color = textColor.value;

    box.appendChild(moveBar);
    box.appendChild(textArea);

    pdfStage.appendChild(box);

    makeMovable(box, moveBar);
    selectElement(box);

    textArea.focus();

    setStatus("Text box added. Type inside, move from blue bar, resize from red dot.");
}

function getTextEditor(){
    if(!selectedElement) return null;
    return selectedElement.querySelector(".text-editor");
}

/* ERASER */

function addEraser(){
    const eraser = document.createElement("div");

    eraser.className = "eraser-box";
    eraser.style.left = "150px";
    eraser.style.top = "150px";
    eraser.style.width = "180px";
    eraser.style.height = "60px";

    pdfStage.appendChild(eraser);

    makeMovable(eraser);
    selectElement(eraser);

    setStatus("White eraser added. Move it and resize from red dot.");
}

/* IMAGE */

function addImage(file){
    const reader = new FileReader();

    reader.onload = function(e){
        const img = document.createElement("img");

        img.src = e.target.result;
        img.className = "image-element";
        img.style.left = "150px";
        img.style.top = "150px";
        img.style.width = imageSize.value + "px";

        pdfStage.appendChild(img);

        makeMovable(img);
        selectElement(img);

        setStatus("Image added. Move and resize from red dot.");
    };

    reader.readAsDataURL(file);
}

imageUpload.addEventListener("change", function(){
    const file = this.files[0];

    if(file){
        addImage(file);
    }

    imageUpload.value = "";
});

/* SHAPES */

function applyShapeStyle(shape, type){
    const color = shapeColor.value;
    const border = shapeBorder.value + "px";
    const size = parseInt(shapeSize.value);

    if(type === "rectangle"){
        shape.style.width = size + "px";
        shape.style.height = Math.round(size * 0.65) + "px";
        shape.style.border = border + " solid " + color;
        shape.style.background = "transparent";
    }

    if(type === "circle"){
        shape.style.width = size + "px";
        shape.style.height = size + "px";
        shape.style.border = border + " solid " + color;
        shape.style.borderRadius = "50%";
        shape.style.background = "transparent";
    }

    if(type === "line"){
        shape.style.width = size + "px";
        shape.style.height = shapeBorder.value + "px";
        shape.style.background = color;
    }

    if(type === "arrow"){
        shape.style.width = size + "px";
        shape.style.height = shapeBorder.value + "px";
        shape.style.background = color;
        shape.style.setProperty("--arrow-color", color);
    }
}

function addShape(type){
    const shape = document.createElement("div");

    shape.className = "shape-element " + type;
    shape.dataset.shape = type;

    shape.style.left = "180px";
    shape.style.top = "180px";

    applyShapeStyle(shape, type);

    pdfStage.appendChild(shape);

    makeMovable(shape);
    selectElement(shape);

    setStatus(type + " shape added.");
}

/* DRAW / HIGHLIGHT */

pdfCanvas.addEventListener("mousedown", function(e){
    if(drawMode || highlightMode){
        saveUndo();

        isDrawing = true;

        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    }
});

pdfCanvas.addEventListener("mousemove", function(e){
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

pdfCanvas.addEventListener("mouseup", function(){
    isDrawing = false;
    ctx.globalAlpha = 1;
});

/* WATERMARK */

function addWatermark(){
    if(!pdfCanvas.width){
        alert("Please upload PDF first.");
        return;
    }

    saveUndo();

    const text = document.getElementById("watermarkText").value;
    const color = document.getElementById("watermarkColor").value;
    const size = document.getElementById("watermarkSize").value;
    const opacity = document.getElementById("watermarkOpacity").value / 100;

    ctx.save();

    ctx.globalAlpha = opacity;
    ctx.font = size + "px Arial";
    ctx.fillStyle = color;

    ctx.translate(pdfCanvas.width / 2, pdfCanvas.height / 2);
    ctx.rotate(-30 * Math.PI / 180);
    ctx.textAlign = "center";

    ctx.fillText(text, 0, 0);

    ctx.restore();

    setStatus("Watermark added.");
}

/* PAGE NUMBER */

function addPageNumber(){
    if(!pdfCanvas.width){
        alert("Please upload PDF first.");
        return;
    }

    saveUndo();

    ctx.save();
    ctx.font = "18px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("Page " + currentPage, pdfCanvas.width / 2, pdfCanvas.height - 25);
    ctx.restore();

    setStatus("Page number added.");
}

/* TEXT FORMAT CONTROLS */

fontSize.addEventListener("input", function(){
    const editor = getTextEditor();
    if(editor){
        editor.style.fontSize = this.value + "px";
    }
});

fontFamily.addEventListener("change", function(){
    const editor = getTextEditor();
    if(editor){
        editor.style.fontFamily = this.value;
    }
});

textColor.addEventListener("input", function(){
    const editor = getTextEditor();
    if(editor){
        editor.style.color = this.value;
    }
});

textBg.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("edit-box")){
        selectedElement.style.background = this.value;
    }
});

boldBtn.addEventListener("click", function(){
    const editor = getTextEditor();
    if(editor){
        editor.style.fontWeight =
            editor.style.fontWeight === "bold" ? "normal" : "bold";
    }
});

italicBtn.addEventListener("click", function(){
    const editor = getTextEditor();
    if(editor){
        editor.style.fontStyle =
            editor.style.fontStyle === "italic" ? "normal" : "italic";
    }
});

underlineBtn.addEventListener("click", function(){
    const editor = getTextEditor();
    if(editor){
        editor.style.textDecoration =
            editor.style.textDecoration === "underline" ? "none" : "underline";
    }
});

supBtn.addEventListener("click", function(){
    const editor = getTextEditor();
    if(editor){
        editor.focus();
        document.execCommand("superscript");
    }
});

subBtn.addEventListener("click", function(){
    const editor = getTextEditor();
    if(editor){
        editor.focus();
        document.execCommand("subscript");
    }
});

/* IMAGE / SHAPE CONTROLS */

imageSize.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("image-element")){
        selectedElement.style.width = this.value + "px";
    }
});

shapeColor.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("shape-element")){
        applyShapeStyle(selectedElement, selectedElement.dataset.shape);
    }
});

shapeBorder.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("shape-element")){
        applyShapeStyle(selectedElement, selectedElement.dataset.shape);
    }
});

shapeSize.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("shape-element")){
        applyShapeStyle(selectedElement, selectedElement.dataset.shape);
    }
});
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

let pageElements = {};
/* BUTTONS */

document.getElementById("addTextBtn").addEventListener("click", function(){
    createTextBox("Type here", false);
});

document.getElementById("editBoxBtn").addEventListener("click", function(){
    createTextBox("Edit text here", true);
});

document.getElementById("eraserBtn").addEventListener("click", addEraser);

document.getElementById("drawBtn").addEventListener("click", function(){
    drawMode = !drawMode;
    highlightMode = false;
    setStatus(drawMode ? "Draw enabled." : "Draw disabled.");
});

document.getElementById("highlightBtn").addEventListener("click", function(){
    highlightMode = !highlightMode;
    drawMode = false;
    setStatus(highlightMode ? "Highlight enabled." : "Highlight disabled.");
});

document.getElementById("shapesBtn").addEventListener("click", function(){
    document.getElementById("shapeMenu").classList.toggle("show");
});

document.getElementById("rectBtn").addEventListener("click", function(){
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

document.getElementById("imageBtn").addEventListener("click", function(){
    imageUpload.click();
});

document.getElementById("signatureBtn").addEventListener("click", function(){
    imageUpload.click();
});

document.getElementById("watermarkBtn").addEventListener("click", addWatermark);
document.getElementById("pageNumberBtn").addEventListener("click", addPageNumber);

document.getElementById("rotateBtn").addEventListener("click", function(){
    if(!pdfDoc){
        alert("Please upload PDF first.");
        return;
    }

    rotation = (rotation + 90) % 360;
    renderPage(currentPage);
});

document.getElementById("clearPageBtn").addEventListener("click", function(){
    saveUndo();
    ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
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

downloadBtn.addEventListener("click", async function(){
    if(!pdfCanvas.width){
        alert("Please upload PDF first.");
        return;
    }

    removeResizeHandles();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = pdfCanvas.width;
    tempCanvas.height = pdfCanvas.height;

    tempCtx.drawImage(pdfCanvas, 0, 0);

    const elements = pdfStage.querySelectorAll(
        ".edit-box, .eraser-box, .image-element, .shape-element"
    );

    for(const el of elements){
        const x = el.offsetLeft - pdfCanvas.offsetLeft;
        const y = el.offsetTop - pdfCanvas.offsetTop;

        if(el.classList.contains("eraser-box")){
            tempCtx.fillStyle = "white";
            tempCtx.fillRect(x, y, el.offsetWidth, el.offsetHeight);
        }

        if(el.classList.contains("edit-box")){
            const editor = el.querySelector(".text-editor");
            const editorStyle = window.getComputedStyle(editor);
            const boxStyle = window.getComputedStyle(el);

            tempCtx.fillStyle = boxStyle.backgroundColor;
            tempCtx.fillRect(x, y, el.offsetWidth, el.offsetHeight);

            tempCtx.font =
                `${editorStyle.fontWeight} ${editorStyle.fontStyle} ${editorStyle.fontSize} ${editorStyle.fontFamily}`;

            tempCtx.fillStyle = editorStyle.color;

            const lines = editor.innerText.split("\n");
            const fontPx = parseInt(editorStyle.fontSize);

            lines.forEach((line, index) => {
                tempCtx.fillText(
                    line,
                    x + 10,
                    y + 30 + index * (fontPx + 6)
                );
            });
        }

        if(el.classList.contains("image-element")){
            await new Promise(resolve => {
                const img = new Image();

                img.onload = function(){
                    tempCtx.drawImage(img, x, y, el.offsetWidth, el.offsetHeight);
                    resolve();
                };

                img.src = el.src;
            });
        }

        if(el.classList.contains("rectangle")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorder.value);
            tempCtx.strokeRect(x, y, el.offsetWidth, el.offsetHeight);
        }

        if(el.classList.contains("circle")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorder.value);
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

        if(el.classList.contains("line")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorder.value);
            tempCtx.beginPath();
            tempCtx.moveTo(x, y);
            tempCtx.lineTo(x + el.offsetWidth, y);
            tempCtx.stroke();
        }

        if(el.classList.contains("arrow")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.fillStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorder.value);

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
    const page = pdf.addPage([pdfCanvas.width, pdfCanvas.height]);

    const pngImage = await pdf.embedPng(imageData);

    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pdfCanvas.width,
        height: pdfCanvas.height
    });

    const pdfBytes = await pdf.save();

    const blob = new Blob([pdfBytes], {
        type: "application/pdf"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "edited-pdf.pdf";
    link.click();

    setStatus("Edited PDF downloaded successfully.");
});
prevPageBtn.addEventListener("click", async function(){

    if(!pdfDoc) return;

    if(currentPage > 1){

        saveCurrentPageElements();

        currentPage--;

        await renderPage(currentPage);

        restorePageElements();

        updatePageInfo();

        setStatus("Page " + currentPage + " opened.");
    }
});


nextPageBtn.addEventListener("click", async function(){

    if(!pdfDoc) return;

    if(currentPage < pdfDoc.numPages){

        saveCurrentPageElements();

        currentPage++;

        await renderPage(currentPage);

        restorePageElements();

        updatePageInfo();

        setStatus("Page " + currentPage + " opened.");
    }
});
