const pdfUpload = document.getElementById("pdfUpload");
const imageUpload = document.getElementById("imageUpload");
const downloadBtn = document.getElementById("downloadBtn");

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");
const previewBox = document.getElementById("pdfPreview");

const toolInfo = document.getElementById("toolInfo");

const drawColor = document.getElementById("drawColor");
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");
const imageSize = document.getElementById("imageSize");

const eraserWidth = document.getElementById("eraserWidth");
const eraserHeight = document.getElementById("eraserHeight");
const eraserColor = document.getElementById("eraserColor");

const shapeColor = document.getElementById("shapeColor");
const shapeBorderSize = document.getElementById("shapeBorderSize");
const shapeSize = document.getElementById("shapeSize");

const fontFamily = document.getElementById("fontFamily");
const textAlign = document.getElementById("textAlign");
const transparentBg = document.getElementById("transparentBg");

const boldBtn = document.getElementById("boldBtn");
const italicBtn = document.getElementById("italicBtn");
const underlineBtn = document.getElementById("underlineBtn");

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

/* BASIC */

function setInfo(text){
    toolInfo.innerText = text;
}

function saveUndo(){
    if(canvas.width && canvas.height){
        undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    }
}

function hideContextMenu(){
    contextMenu.style.display = "none";
}

function selectElement(el){

    document.querySelectorAll(
        ".editable-text, .draggable-image, .shape-element, .white-eraser"
    ).forEach(item=>{
        item.classList.remove("selected-element");
    });

    selectedElement = el;

    if(selectedElement){
        selectedElement.classList.add("selected-element");
    }
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

document.addEventListener("click", function(){
    hideContextMenu();
});

/* PDF LOAD */

pdfUpload.addEventListener("change", async function(e){

    const file = e.target.files[0];

    if(!file) return;

    const fileReader = new FileReader();

    fileReader.onload = async function(){

        const typedarray =
            new Uint8Array(this.result);

        pdfDoc =
            await pdfjsLib
            .getDocument(typedarray)
            .promise;

        renderPage(currentPage);

        setInfo(
            "PDF uploaded successfully."
        );
    };

    fileReader.readAsArrayBuffer(file);
});

/* RENDER */

async function renderPage(pageNumber){

    const page =
        await pdfDoc.getPage(pageNumber);

    const viewport =
        page.getViewport({
            scale:1.5,
            rotation:rotation
        });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext:ctx,
        viewport:viewport
    }).promise;
}

/* ADD TEXT */

function addEditableText(){

    const textBox =
        document.createElement("div");

    textBox.innerText = "Type here";

    textBox.contentEditable = true;

    textBox.className = "editable-text";

    textBox.style.left = "120px";
    textBox.style.top = "120px";

    textBox.style.fontSize =
        document.getElementById("textFontSize").value + "px";

    textBox.style.fontFamily =
        fontFamily.value;

    textBox.style.color =
        document.getElementById("textColor").value;

    textBox.style.textAlign =
        textAlign.value;

    if(transparentBg.checked){
        textBox.style.background = "transparent";
    }
    else{
        textBox.style.background =
            document.getElementById("textBgColor").value;
    }

    previewBox.appendChild(textBox);

    makeDraggable(textBox);

    selectElement(textBox);

    textBox.focus();

    setInfo(
        "Text added. Type and drag anywhere."
    );
}

/* TEXT STYLE BUTTONS */

boldBtn.addEventListener("click", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.fontWeight =
            selectedElement.style.fontWeight === "bold"
            ? "normal"
            : "bold";
    }
});

italicBtn.addEventListener("click", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.fontStyle =
            selectedElement.style.fontStyle === "italic"
            ? "normal"
            : "italic";
    }
});

underlineBtn.addEventListener("click", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.textDecoration =
            selectedElement.style.textDecoration === "underline"
            ? "none"
            : "underline";
    }
});

/* EDIT TEXT MODE */

function editTextMode(){

    setInfo(
        "Use White Eraser to cover old PDF text. Then Add Text to write new text."
    );
}

/* WHITE ERASER */

function addWhiteEraser(){

    const eraser =
        document.createElement("div");

    eraser.className = "white-eraser";

    eraser.style.left = "150px";
    eraser.style.top = "150px";

    eraser.style.width =
        eraserWidth.value + "px";

    eraser.style.height =
        eraserHeight.value + "px";

    eraser.style.background =
        eraserColor.value;

    previewBox.appendChild(eraser);

    makeDraggable(eraser);

    selectElement(eraser);

    setInfo(
        "White Eraser added."
    );
}

/* IMAGE */

function addImageToPDF(file){

    const reader = new FileReader();

    reader.onload = function(e){

        const img =
            document.createElement("img");

        img.src = e.target.result;

        img.className = "draggable-image";

        img.style.left = "150px";
        img.style.top = "150px";

        img.style.width =
            imageSize.value + "px";

        previewBox.appendChild(img);

        makeDraggable(img);

        selectElement(img);

        setInfo(
            "Image/Signature added."
        );
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

function applyShapeStyle(shape, type){

    const color = shapeColor.value;

    const border =
        shapeBorderSize.value + "px";

    const size =
        parseInt(shapeSize.value);

    if(type === "rectangle"){

        shape.style.width =
            size + "px";

        shape.style.height =
            Math.round(size * 0.65) + "px";

        shape.style.border =
            border + " solid " + color;

        shape.style.background =
            "transparent";
    }

    if(type === "circle"){

        shape.style.width =
            size + "px";

        shape.style.height =
            size + "px";

        shape.style.border =
            border + " solid " + color;

        shape.style.borderRadius =
            "50%";
    }

    if(type === "line"){

        shape.style.width =
            size + "px";

        shape.style.height =
            shapeBorderSize.value + "px";

        shape.style.background =
            color;
    }

    if(type === "arrow"){

        shape.style.width =
            size + "px";

        shape.style.height =
            shapeBorderSize.value + "px";

        shape.style.background =
            color;

        shape.style.setProperty(
            "--arrow-color",
            color
        );
    }
}

function addShape(type){

    const shape =
        document.createElement("div");

    shape.classList.add("shape-element");

    shape.dataset.shapeType = type;

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

    applyShapeStyle(shape, type);

    previewBox.appendChild(shape);

    makeDraggable(shape);

    selectElement(shape);

    setInfo(type + " added.");
}

/* DRAW */

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

        ctx.lineWidth =
            brushSize.value;

        ctx.lineCap = "round";

        ctx.strokeStyle =
            drawColor.value;

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

    const text =
        document.getElementById("watermarkText").value;

    const color =
        document.getElementById("watermarkColor").value;

    const size =
        document.getElementById("watermarkSize").value;

    const opacity =
        document.getElementById("watermarkOpacity").value / 100;

    const rotate =
        document.getElementById("watermarkRotation").value;

    ctx.save();

    ctx.globalAlpha = opacity;

    ctx.font =
        size + "px Arial";

    ctx.fillStyle = color;

    ctx.translate(
        canvas.width / 2,
        canvas.height / 2
    );

    ctx.rotate(
        rotate * Math.PI / 180
    );

    ctx.textAlign = "center";

    ctx.fillText(text,0,0);

    ctx.restore();

    setInfo("Watermark added.");
}

/* PAGE NUMBER */

function addPageNumber(){

    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    saveUndo();

    const position =
        document.getElementById("pageNumberPosition").value;

    const format =
        document.getElementById("pageNumberFormat").value;

    const startNumber =
        parseInt(document.getElementById("pageStartNumber").value);

    const color =
        document.getElementById("pageNumberColor").value;

    const size =
        document.getElementById("pageNumberSize").value;

    const current =
        startNumber + currentPage - 1;

    const total =
        pdfDoc ? pdfDoc.numPages : 1;

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
    }

    if(position === "bottom-left"){
        x = 80;
    }

    if(position === "top-center"){
        y = 35;
    }

    if(position === "top-right"){
        x = canvas.width - 80;
        y = 35;
    }

    if(position === "top-left"){
        x = 80;
        y = 35;
    }

    ctx.save();

    ctx.font =
        size + "px Arial";

    ctx.fillStyle = color;

    ctx.textAlign = "center";

    ctx.fillText(text,x,y);

    ctx.restore();

    setInfo("Page number added.");
}

/* OCR */

async function runOCR(){

    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    ocrOutputBox.style.display = "block";

    ocrText.value =
        "Scanning text... Please wait.";

    try{

        const result =
            await Tesseract.recognize(
                canvas.toDataURL(),
                "eng"
            );

        ocrText.value =
            result.data.text;

        setInfo("OCR completed.");
    }

    catch(error){

        console.error(error);

        ocrText.value =
            "OCR failed.";
    }
}

/* TRANSLATE */

function translateText(){

    if(
        !ocrText.value ||
        ocrText.value.includes("Scanning")
    ){

        alert("Please run OCR first.");

        return;
    }

    let translated =
        ocrText.value;

    translated = translated
        .replace(/Medical/gi,"મેડિકલ")
        .replace(/Hospital/gi,"હોસ્પિટલ")
        .replace(/Tender/gi,"ટેન્ડર")
        .replace(/Page/gi,"પેજ")
        .replace(/Date/gi,"તારીખ");

    ocrText.value =
        translated;

    setInfo("Translation completed.");
}

/* PROPERTY CONTROLS */

document.getElementById("textFontSize")
.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.fontSize =
            this.value + "px";
    }
});

document.getElementById("textColor")
.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.color =
            this.value;
    }
});

document.getElementById("textBgColor")
.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.background =
            this.value;
    }
});

fontFamily.addEventListener("change", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.fontFamily =
            this.value;
    }
});

textAlign.addEventListener("change", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.textAlign =
            this.value;
    }
});

transparentBg.addEventListener("change", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("editable-text")
    ){

        selectedElement.style.background =
            this.checked
            ? "transparent"
            : document.getElementById("textBgColor").value;
    }
});

imageSize.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("draggable-image")
    ){

        selectedElement.style.width =
            this.value + "px";
    }
});

eraserWidth.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("white-eraser")
    ){

        selectedElement.style.width =
            this.value + "px";
    }
});

eraserHeight.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("white-eraser")
    ){

        selectedElement.style.height =
            this.value + "px";
    }
});

eraserColor.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("white-eraser")
    ){

        selectedElement.style.background =
            this.value;
    }
});

shapeColor.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("shape-element")
    ){

        applyShapeStyle(
            selectedElement,
            selectedElement.dataset.shapeType
        );
    }
});

shapeBorderSize.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("shape-element")
    ){

        applyShapeStyle(
            selectedElement,
            selectedElement.dataset.shapeType
        );
    }
});

shapeSize.addEventListener("input", function(){

    if(
        selectedElement &&
        selectedElement.classList.contains("shape-element")
    ){

        applyShapeStyle(
            selectedElement,
            selectedElement.dataset.shapeType
        );
    }
});

/* BUTTONS */

document.getElementById("addTextBtn")
.addEventListener("click", addEditableText);

document.getElementById("editTextBtn")
.addEventListener("click", editTextMode);

document.getElementById("whiteEraserBtn")
.addEventListener("click", addWhiteEraser);

document.getElementById("drawBtn")
.addEventListener("click", function(){

    drawMode = !drawMode;

    highlightMode = false;

    setInfo(
        drawMode
        ? "Draw enabled."
        : "Draw disabled."
    );
});

document.getElementById("highlightBtn")
.addEventListener("click", function(){

    highlightMode = !highlightMode;

    drawMode = false;

    setInfo(
        highlightMode
        ? "Highlight enabled."
        : "Highlight disabled."
    );
});

document.getElementById("shapesBtn")
.addEventListener("click", function(){

    document.getElementById("shapePanel")
    .classList.toggle("show");
});

document.getElementById("rectangleBtn")
.addEventListener("click", function(){
    addShape("rectangle");
});

document.getElementById("circleBtn")
.addEventListener("click", function(){
    addShape("circle");
});

document.getElementById("lineBtn")
.addEventListener("click", function(){
    addShape("line");
});

document.getElementById("arrowBtn")
.addEventListener("click", function(){
    addShape("arrow");
});

document.getElementById("addImageBtn")
.addEventListener("click", function(){
    imageUpload.click();
});

document.getElementById("signatureBtn")
.addEventListener("click", function(){
    imageUpload.click();
});

document.getElementById("watermarkBtn")
.addEventListener("click", addWatermark);

document.getElementById("rotateBtn")
.addEventListener("click", function(){

    if(!pdfDoc){
        alert("Please upload PDF first.");
        return;
    }

    rotation =
        (rotation + 90) % 360;

    renderPage(currentPage);

    setInfo("Page rotated.");
});

document.getElementById("deletePageBtn")
.addEventListener("click", function(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    setInfo("Page cleared.");
});

document.getElementById("pageNumberBtn")
.addEventListener("click", addPageNumber);

document.getElementById("ocrBtn")
.addEventListener("click", runOCR);

document.getElementById("translateBtn")
.addEventListener("click", function(){

    ocrOutputBox.style.display = "block";

    translateText();
});

/* CONTEXT MENU */

document.getElementById("ctxDelete")
.addEventListener("click", function(){

    if(selectedElement){

        selectedElement.remove();

        selectedElement = null;
    }

    hideContextMenu();
});

document.getElementById("ctxDuplicate")
.addEventListener("click", function(){

    if(selectedElement){

        const clone =
            selectedElement.cloneNode(true);

        clone.style.left =
            (selectedElement.offsetLeft + 20) + "px";

        clone.style.top =
            (selectedElement.offsetTop + 20) + "px";

        previewBox.appendChild(clone);

        makeDraggable(clone);

        selectElement(clone);
    }

    hideContextMenu();
});

/* UNDO */

undoBtn.addEventListener("click", function(){

    if(undoStack.length > 0){

        const lastState =
            undoStack.pop();

        ctx.putImageData(lastState,0,0);
    }

    else{
        alert("Nothing to undo.");
    }
});

/* DOWNLOAD */

downloadBtn.addEventListener("click", async function(){

    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    const imageData =
        canvas.toDataURL("image/png");

    const pdf =
        await PDFLib.PDFDocument.create();

    const page =
        pdf.addPage([
            canvas.width,
            canvas.height
        ]);

    const pngImage =
        await pdf.embedPng(imageData);

    page.drawImage(pngImage,{
        x:0,
        y:0,
        width:canvas.width,
        height:canvas.height
    });

    const pdfBytes =
        await pdf.save();

    const blob =
        new Blob(
            [pdfBytes],
            {type:"application/pdf"}
        );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "edited-pdf.pdf";

    link.click();

    setInfo("PDF downloaded.");
});
