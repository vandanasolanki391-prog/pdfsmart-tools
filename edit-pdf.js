const uploadOnly = document.getElementById("uploadOnly");
const editorLayout = document.getElementById("editorLayout");
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

const shapeColor = document.getElementById("shapeColor");
const shapeBorderSize = document.getElementById("shapeBorderSize");
const shapeSize = document.getElementById("shapeSize");

const fontFamily = document.getElementById("fontFamily");
const textAlign = document.getElementById("textAlign");
const transparentBg = document.getElementById("transparentBg");

const boldBtn = document.getElementById("boldBtn");
const italicBtn = document.getElementById("italicBtn");
const underlineBtn = document.getElementById("underlineBtn");
const supBtn = document.getElementById("supBtn");
const subBtn = document.getElementById("subBtn");

const ocrOutputBox = document.getElementById("ocrOutputBox");
const ocrText = document.getElementById("ocrText");
const contextMenu = document.getElementById("contextMenu");

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

let isDrawing = false;
let drawMode = false;
let highlightMode = false;
let undoStack = [];

function setInfo(text){ toolInfo.innerText = text; }

function saveUndo(){
    if(canvas.width && canvas.height){
        undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    }
}

function hideContextMenu(){ contextMenu.style.display = "none"; }

function removeResizeHandles(){
    document.querySelectorAll(".resize-handle").forEach(h => h.remove());
}

function addResizeHandle(el){
    removeResizeHandles();

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

function selectElement(el){
    document.querySelectorAll(".editable-text,.edit-text-box,.draggable-image,.shape-element,.white-eraser")
    .forEach(item => item.classList.remove("selected-element"));

    selectedElement = el;

    if(selectedElement){
        selectedElement.classList.add("selected-element");
        addResizeHandle(selectedElement);
    }
}

function makeDraggable(el, handleEl = null){
    const dragHandle = handleEl || el;

    el.addEventListener("click", function(e){
        e.stopPropagation();
        selectElement(el);
    });

    dragHandle.addEventListener("mousedown", function(e){
        if(e.button !== 0) return;
        if(e.target.classList.contains("resize-handle")) return;

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
        dragElement.style.left = (e.clientX - offsetX) + "px";
        dragElement.style.top = (e.clientY - offsetY) + "px";
    }

    if(resizeElement){
        let w = startWidth + (e.clientX - startX);
        let h = startHeight + (e.clientY - startY);

        if(w < 30) w = 30;
        if(h < 20) h = 20;

        resizeElement.style.width = w + "px";

        if(!resizeElement.classList.contains("line-shape") && !resizeElement.classList.contains("arrow-shape")){
            resizeElement.style.height = h + "px";
        }

        if(resizeElement.classList.contains("circle-shape")){
            resizeElement.style.height = w + "px";
        }
    }
});

document.addEventListener("mouseup", function(){
    dragElement = null;
    resizeElement = null;
    document.body.style.userSelect = "auto";
});

document.addEventListener("click", hideContextMenu);

/* PDF LOAD */

pdfUpload.addEventListener("change", async function(e){
    const file = e.target.files[0];
    if(!file) return;

    const fileReader = new FileReader();

    fileReader.onload = async function(){
        const typedarray = new Uint8Array(this.result);
        pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
        await renderPage(currentPage);

        uploadOnly.classList.add("hidden");
        editorLayout.classList.remove("hidden");

        setInfo("PDF uploaded. Now select any editing tool.");
    };

    fileReader.readAsArrayBuffer(file);
});

async function renderPage(pageNumber){
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({scale:1.5, rotation:rotation});

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({canvasContext:ctx, viewport:viewport}).promise;
}

/* TEXT BOX CREATOR */

function createTextBox(text, isLargeBox){
    const box = document.createElement("div");
    box.className = isLargeBox ? "edit-text-box editable-text" : "editable-text";

    box.style.left = isLargeBox ? "140px" : "120px";
    box.style.top = isLargeBox ? "140px" : "120px";
    box.style.width = isLargeBox ? "190px" : "160px";
    box.style.minHeight = isLargeBox ? "65px" : "42px";
    box.style.background = transparentBg.checked ? "transparent" : document.getElementById("textBgColor").value;

    const handle = document.createElement("div");
    handle.className = "move-handle";
    handle.innerText = "↕ Move";

    const content = document.createElement("div");
    content.className = "text-content";
    content.contentEditable = true;
    content.innerText = text;
    content.style.fontSize = document.getElementById("textFontSize").value + "px";
    content.style.fontFamily = fontFamily.value;
    content.style.color = document.getElementById("textColor").value;
    content.style.textAlign = textAlign.value;

    box.appendChild(handle);
    box.appendChild(content);

    previewBox.appendChild(box);
    makeDraggable(box, handle);
    selectElement(box);
    content.focus();

    setInfo("Text box added. Type inside, drag from Move bar, resize from red dot.");
}

function addEditableText(){ createTextBox("Type here", false); }
function addEditTextBox(){ createTextBox("Edit text here", true); }

/* TEXT STYLE */

function getSelectedTextContent(){
    if(!selectedElement) return null;
    return selectedElement.querySelector(".text-content");
}

boldBtn.addEventListener("click", function(){
    const c = getSelectedTextContent();
    if(c) c.style.fontWeight = c.style.fontWeight === "bold" ? "normal" : "bold";
});

italicBtn.addEventListener("click", function(){
    const c = getSelectedTextContent();
    if(c) c.style.fontStyle = c.style.fontStyle === "italic" ? "normal" : "italic";
});

underlineBtn.addEventListener("click", function(){
    const c = getSelectedTextContent();
    if(c) c.style.textDecoration = c.style.textDecoration === "underline" ? "none" : "underline";
});

supBtn.addEventListener("click", function(){
    const c = getSelectedTextContent();
    if(c){ c.focus(); document.execCommand("superscript"); }
});

subBtn.addEventListener("click", function(){
    const c = getSelectedTextContent();
    if(c){ c.focus(); document.execCommand("subscript"); }
});

/* ERASER */

function addWhiteEraser(){
    const eraser = document.createElement("div");
    eraser.className = "white-eraser";
    eraser.style.left = "150px";
    eraser.style.top = "150px";
    eraser.style.width = "180px";
    eraser.style.height = "60px";
    eraser.style.background = "#ffffff";

    previewBox.appendChild(eraser);
    makeDraggable(eraser);
    selectElement(eraser);
}

/* IMAGE */

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
    if(file) addImageToPDF(file);
    imageUpload.value = "";
});

/* SHAPES */

function applyShapeStyle(shape,type){
    const color = shapeColor.value;
    const border = shapeBorderSize.value + "px";
    const size = parseInt(shapeSize.value);

    if(type === "rectangle"){
        shape.style.width = size + "px";
        shape.style.height = Math.round(size * .65) + "px";
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
        shape.style.height = shapeBorderSize.value + "px";
        shape.style.background = color;
    }

    if(type === "arrow"){
        shape.style.width = size + "px";
        shape.style.height = shapeBorderSize.value + "px";
        shape.style.background = color;
        shape.style.setProperty("--arrow-color", color);
    }
}

function addShape(type){
    const shape = document.createElement("div");
    shape.classList.add("shape-element");
    shape.dataset.shapeType = type;

    if(type === "rectangle") shape.classList.add("rectangle-shape");
    if(type === "circle") shape.classList.add("circle-shape");
    if(type === "line") shape.classList.add("line-shape");
    if(type === "arrow") shape.classList.add("arrow-shape");

    shape.style.left = "180px";
    shape.style.top = "180px";

    applyShapeStyle(shape,type);

    previewBox.appendChild(shape);
    makeDraggable(shape);
    selectElement(shape);
}

/* DRAW */

canvas.addEventListener("mousedown", function(e){
    if(drawMode || highlightMode){
        saveUndo();
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX,e.offsetY);
    }
});

canvas.addEventListener("mousemove", function(e){
    if(isDrawing && drawMode){
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = "round";
        ctx.strokeStyle = drawColor.value;
        ctx.globalAlpha = 1;
        ctx.lineTo(e.offsetX,e.offsetY);
        ctx.stroke();
    }

    if(isDrawing && highlightMode){
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.strokeStyle = "yellow";
        ctx.globalAlpha = .35;
        ctx.lineTo(e.offsetX,e.offsetY);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
});

canvas.addEventListener("mouseup", function(){
    isDrawing = false;
    ctx.globalAlpha = 1;
});

/* WATERMARK PAGE OCR */

function addWatermark(){
    if(!canvas.width){ alert("Please upload PDF first."); return; }

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
    ctx.fillText(text,0,0);
    ctx.restore();
}

function addPageNumber(){
    const color = document.getElementById("pageNumberColor").value;
    const size = document.getElementById("pageNumberSize").value;

    ctx.save();
    ctx.font = size + "px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText("Page " + currentPage, canvas.width / 2, canvas.height - 25);
    ctx.restore();
}

async function runOCR(){
    ocrOutputBox.style.display = "block";
    ocrText.value = "Scanning text... Please wait.";

    try{
        const result = await Tesseract.recognize(canvas.toDataURL(),"eng");
        ocrText.value = result.data.text;
    }catch(error){
        ocrText.value = "OCR failed.";
    }
}

function translateText(){
    if(!ocrText.value || ocrText.value.includes("Scanning")){
        alert("Please run OCR first.");
        return;
    }

    ocrText.value = ocrText.value
        .replace(/Medical/gi,"મેડિકલ")
        .replace(/Hospital/gi,"હોસ્પિટલ")
        .replace(/Tender/gi,"ટેન્ડર")
        .replace(/Page/gi,"પેજ")
        .replace(/Date/gi,"તારીખ");
}

/* PROPERTY CONTROLS */

document.getElementById("textFontSize").addEventListener("input", function(){
    const c = getSelectedTextContent();
    if(c) c.style.fontSize = this.value + "px";
});

document.getElementById("textColor").addEventListener("input", function(){
    const c = getSelectedTextContent();
    if(c) c.style.color = this.value;
});

document.getElementById("textBgColor").addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("editable-text")){
        selectedElement.style.background = this.value;
    }
});

fontFamily.addEventListener("change", function(){
    const c = getSelectedTextContent();
    if(c) c.style.fontFamily = this.value;
});

textAlign.addEventListener("change", function(){
    const c = getSelectedTextContent();
    if(c) c.style.textAlign = this.value;
});

transparentBg.addEventListener("change", function(){
    if(selectedElement && selectedElement.classList.contains("editable-text")){
        selectedElement.style.background = this.checked ? "transparent" : document.getElementById("textBgColor").value;
    }
});

imageSize.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("draggable-image")){
        selectedElement.style.width = this.value + "px";
    }
});

shapeColor.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("shape-element")){
        applyShapeStyle(selectedElement, selectedElement.dataset.shapeType);
    }
});
shapeBorderSize.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("shape-element")){
        applyShapeStyle(selectedElement, selectedElement.dataset.shapeType);
    }
});
shapeSize.addEventListener("input", function(){
    if(selectedElement && selectedElement.classList.contains("shape-element")){
        applyShapeStyle(selectedElement, selectedElement.dataset.shapeType);
    }
});

/* BUTTONS */

document.getElementById("addTextBtn").addEventListener("click", addEditableText);
document.getElementById("editTextBoxBtn").addEventListener("click", addEditTextBox);
document.getElementById("whiteEraserBtn").addEventListener("click", addWhiteEraser);

document.getElementById("drawBtn").addEventListener("click", function(){
    drawMode = !drawMode;
    highlightMode = false;
});

document.getElementById("highlightBtn").addEventListener("click", function(){
    highlightMode = !highlightMode;
    drawMode = false;
});

document.getElementById("shapesBtn").addEventListener("click", function(){
    document.getElementById("shapePanel").classList.toggle("show");
});

document.getElementById("rectangleBtn").addEventListener("click", function(){ addShape("rectangle"); });
document.getElementById("circleBtn").addEventListener("click", function(){ addShape("circle"); });
document.getElementById("lineBtn").addEventListener("click", function(){ addShape("line"); });
document.getElementById("arrowBtn").addEventListener("click", function(){ addShape("arrow"); });

document.getElementById("addImageBtn").addEventListener("click", function(){ imageUpload.click(); });
document.getElementById("signatureBtn").addEventListener("click", function(){ imageUpload.click(); });

document.getElementById("watermarkBtn").addEventListener("click", addWatermark);
document.getElementById("pageNumberBtn").addEventListener("click", addPageNumber);
document.getElementById("ocrBtn").addEventListener("click", runOCR);

document.getElementById("translateBtn").addEventListener("click", function(){
    ocrOutputBox.style.display = "block";
    translateText();
});

document.getElementById("rotateBtn").addEventListener("click", function(){
    rotation = (rotation + 90) % 360;
    renderPage(currentPage);
});

document.getElementById("deletePageBtn").addEventListener("click", function(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
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
        const handle = clone.querySelector(".move-handle");
        makeDraggable(clone, handle);
        selectElement(clone);
    }
    hideContextMenu();
});

document.getElementById("ctxBringFront").addEventListener("click", function(){
    if(selectedElement) selectedElement.style.zIndex = "5000";
    hideContextMenu();
});

document.getElementById("ctxSendBack").addEventListener("click", function(){
    if(selectedElement) selectedElement.style.zIndex = "900";
    hideContextMenu();
});

document.getElementById("ctxIncrease").addEventListener("click", function(){
    if(selectedElement){
        selectedElement.style.width = (selectedElement.offsetWidth + 20) + "px";
        selectedElement.style.height = (selectedElement.offsetHeight + 10) + "px";
    }
    hideContextMenu();
});

document.getElementById("ctxDecrease").addEventListener("click", function(){
    if(selectedElement){
        selectedElement.style.width = Math.max(20, selectedElement.offsetWidth - 20) + "px";
        selectedElement.style.height = Math.max(10, selectedElement.offsetHeight - 10) + "px";
    }
    hideContextMenu();
});

/* UNDO */

undoBtn.addEventListener("click", function(){
    if(undoStack.length > 0){
        const lastState = undoStack.pop();
        ctx.putImageData(lastState,0,0);
    }else{
        alert("Nothing to undo.");
    }
});

/* DOWNLOAD */

downloadBtn.addEventListener("click", async function(){
    if(!canvas.width){
        alert("Please upload PDF first.");
        return;
    }

    hideContextMenu();
    removeResizeHandles();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.drawImage(canvas,0,0);

    const elements = previewBox.querySelectorAll(".white-eraser,.editable-text,.edit-text-box,.draggable-image,.shape-element");

    for(const el of elements){
        const x = el.offsetLeft - canvas.offsetLeft;
        const y = el.offsetTop - canvas.offsetTop;

        if(el.classList.contains("white-eraser")){
            tempCtx.fillStyle = window.getComputedStyle(el).backgroundColor;
            tempCtx.fillRect(x,y,el.offsetWidth,el.offsetHeight);
        }

        if(el.classList.contains("editable-text")){
            const content = el.querySelector(".text-content");
            const style = content ? window.getComputedStyle(content) : window.getComputedStyle(el);
            const bg = window.getComputedStyle(el).backgroundColor;

            if(bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"){
                tempCtx.fillStyle = bg;
                tempCtx.fillRect(x,y,el.offsetWidth,el.offsetHeight);
            }

            tempCtx.font = `${style.fontWeight} ${style.fontStyle} ${style.fontSize} ${style.fontFamily}`;
            tempCtx.fillStyle = style.color;
            tempCtx.textAlign = style.textAlign || "left";

            const text = content ? content.innerText : el.innerText;
            const lines = text.split("\n");
            const fontSize = parseInt(style.fontSize);

            lines.forEach((line,index)=>{
                let textX = x + 8;

                if(style.textAlign === "center") textX = x + el.offsetWidth / 2;
                if(style.textAlign === "right") textX = x + el.offsetWidth - 8;

                tempCtx.fillText(line,textX,y + 25 + (index * (fontSize + 6)));
            });
        }

        if(el.classList.contains("draggable-image")){
            await new Promise(resolve=>{
                const img = new Image();
                img.onload = function(){
                    tempCtx.drawImage(img,x,y,el.offsetWidth,el.offsetHeight);
                    resolve();
                };
                img.src = el.src;
            });
        }

        if(el.classList.contains("rectangle-shape")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorderSize.value);
            tempCtx.strokeRect(x,y,el.offsetWidth,el.offsetHeight);
        }

        if(el.classList.contains("circle-shape")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorderSize.value);
            tempCtx.beginPath();
            tempCtx.ellipse(x+el.offsetWidth/2,y+el.offsetHeight/2,el.offsetWidth/2,el.offsetHeight/2,0,0,Math.PI*2);
            tempCtx.stroke();
        }

        if(el.classList.contains("line-shape")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorderSize.value);
            tempCtx.beginPath();
            tempCtx.moveTo(x,y);
            tempCtx.lineTo(x+el.offsetWidth,y);
            tempCtx.stroke();
        }

        if(el.classList.contains("arrow-shape")){
            tempCtx.strokeStyle = shapeColor.value;
            tempCtx.fillStyle = shapeColor.value;
            tempCtx.lineWidth = parseInt(shapeBorderSize.value);

            tempCtx.beginPath();
            tempCtx.moveTo(x,y);
            tempCtx.lineTo(x+el.offsetWidth,y);
            tempCtx.stroke();

            tempCtx.beginPath();
            tempCtx.moveTo(x+el.offsetWidth,y);
            tempCtx.lineTo(x+el.offsetWidth-15,y-8);
            tempCtx.lineTo(x+el.offsetWidth-15,y+8);
            tempCtx.closePath();
            tempCtx.fill();
        }
    }

    const imageData = tempCanvas.toDataURL("image/png");
    const pdf = await PDFLib.PDFDocument.create();
    const page = pdf.addPage([canvas.width,canvas.height]);
    const pngImage = await pdf.embedPng(imageData);

    page.drawImage(pngImage,{x:0,y:0,width:canvas.width,height:canvas.height});

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes],{type:"application/pdf"});
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "edited-pdf.pdf";
    link.click();
});
 
