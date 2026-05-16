/* PDFSmart Tools - Edit PDF Multi Page Scroll Version */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const uploadScreen = document.getElementById("uploadScreen");
const editorScreen = document.getElementById("editorScreen");

const pdfUpload = document.getElementById("pdfUpload");
const imageUpload = document.getElementById("imageUpload");

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
let selectedPageWrap = null;
let selectedElement = null;
let dragElement = null;
let resizeElement = null;
let copiedElement = null;

let offsetX = 0;
let offsetY = 0;

let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

let drawMode = false;
let highlightMode = false;
let isDrawing = false;
let activeDrawCanvas = null;
let activeDrawCtx = null;

let undoStack = [];

function setStatus(text){
    statusBar.innerText = text;
}

function getPageWrapFromElement(el){
    return el.closest(".pdf-page-wrap");
}

function getSelectedPageWrap(){
    if(selectedPageWrap) return selectedPageWrap;
    return document.querySelector(".pdf-page-wrap");
}

function selectPageWrap(pageWrap){
    document.querySelectorAll(".pdf-page-wrap").forEach(p => p.classList.remove("active-page"));
    selectedPageWrap = pageWrap;
    if(selectedPageWrap){
        selectedPageWrap.classList.add("active-page");
    }
}

function getPageNumber(pageWrap){
    return parseInt(pageWrap.dataset.pageNumber, 10);
}

function getPageCanvas(pageWrap){
    return pageWrap.querySelector(".pdf-page-canvas");
}

function getOverlay(pageWrap){
    return pageWrap.querySelector(".page-overlay");
}

function getEditableElements(pageWrap = null){
    const base = pageWrap ? getOverlay(pageWrap) : pdfStage;
    return base.querySelectorAll(".edit-box, .eraser-box, .image-element, .shape-element");
}

function saveUndo(){
    const pageWrap = getSelectedPageWrap();
    if(!pageWrap) return;

    const canvas = getPageCanvas(pageWrap);
    if(canvas && canvas.width && canvas.height){
        undoStack.push({
            pageWrap: pageWrap,
            imageData: canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height)
        });
    }
}

function removeResizeHandles(){
    document.querySelectorAll(".resize-handle").forEach(handle => handle.remove());
    document.querySelectorAll(".delete-btn").forEach(btn => btn.remove());
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

function addDeleteButton(el){
    const del = document.createElement("div");
    del.className = "delete-btn";
    del.innerHTML = "✕";
    el.appendChild(del);

    del.addEventListener("click", function(e){
        e.stopPropagation();
        el.remove();
        selectedElement = null;
        setStatus("Element deleted.");
    });
}

function selectElement(el){
    document.querySelectorAll(".edit-box, .shape-element, .image-element, .eraser-box")
        .forEach(item => item.classList.remove("selected"));

    removeResizeHandles();

    selectedElement = el;

    if(selectedElement){
        selectedElement.classList.add("selected");
        addResizeHandle(selectedElement);
        addDeleteButton(selectedElement);

        const pageWrap = getPageWrapFromElement(selectedElement);
        if(pageWrap) selectPageWrap(pageWrap);
    }
}

function makeMovable(el, moveHandle = null){
    const handle = moveHandle || el;

    el.addEventListener("click", function(e){
        e.stopPropagation();
        selectElement(el);
    });

    handle.addEventListener("mousedown", function(e){
        if(e.button !== 0) return;
        if(e.target.classList.contains("resize-handle")) return;
        if(e.target.classList.contains("delete-btn")) return;
        
        e.stopPropagation();
        e.preventDefault();
        selectElement(el);

        dragElement = el;

        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.body.style.userSelect = "none";
    });
}

document.addEventListener("mousemove", function(e){
    if(dragElement){
        const overlay = dragElement.parentElement;
        const overlayRect = overlay.getBoundingClientRect();

        let left = e.clientX - overlayRect.left - offsetX;
        let top = e.clientY - overlayRect.top - offsetY;

        if(left < 0) left = 0;
        if(top < 0) top = 0;

        if(left + dragElement.offsetWidth > overlay.offsetWidth){
            left = overlay.offsetWidth - dragElement.offsetWidth;
        }

        if(top + dragElement.offsetHeight > overlay.offsetHeight){
            top = overlay.offsetHeight - dragElement.offsetHeight;
        }

        dragElement.style.left = left + "px";
        dragElement.style.top = top + "px";
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

document.addEventListener("mouseup", stopDragResize, true);
window.addEventListener("mouseup", stopDragResize, true);
document.addEventListener("pointerup", stopDragResize, true);
window.addEventListener("blur", stopDragResize);

function stopDragResize(){
    dragElement = null;
    resizeElement = null;
    document.body.style.userSelect = "auto";
}

document.addEventListener("mousemove", function(e){

    if(dragElement){

        const overlay = dragElement.parentElement;
        const overlayRect = overlay.getBoundingClientRect();

        let left = e.clientX - overlayRect.left - offsetX;
        let top = e.clientY - overlayRect.top - offsetY;

        if(left < 0) left = 0;
        if(top < 0) top = 0;

        if(left + dragElement.offsetWidth > overlay.offsetWidth){
            left = overlay.offsetWidth - dragElement.offsetWidth;
        }

        if(top + dragElement.offsetHeight > overlay.offsetHeight){
            top = overlay.offsetHeight - dragElement.offsetHeight;
        }

        dragElement.style.left = left + "px";
        dragElement.style.top = top + "px";
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

document.addEventListener("click", function(e){
    if(
        !e.target.closest(".edit-box") &&
        !e.target.closest(".shape-element") &&
        !e.target.closest(".image-element") &&
        !e.target.closest(".eraser-box") &&
        !e.target.closest(".pdf-page-wrap")
    ){
        removeResizeHandles();
        document.querySelectorAll(".edit-box, .shape-element, .image-element, .eraser-box")
            .forEach(item => item.classList.remove("selected"));
        selectedElement = null;
    }
});

/* PDF LOAD AND RENDER ALL PAGES */

pdfUpload.addEventListener("change", async function(e){
    const file = e.target.files[0];
    if(!file) return;

    setStatus("PDF loading, please wait...");

    const reader = new FileReader();

    reader.onload = async function(){
        const typedArray = new Uint8Array(this.result);

        pdfDoc = await pdfjsLib.getDocument(typedArray).promise;

        pdfStage.innerHTML = "";

        for(let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++){
            await renderPage(pageNum);
        }

        uploadScreen.classList.add("hidden");
        editorScreen.classList.remove("hidden");

        selectPageWrap(document.querySelector(".pdf-page-wrap"));

        setStatus("PDF uploaded. Scroll pages and click any page to edit.");
    };

    reader.readAsArrayBuffer(file);
});

async function renderPage(pageNumber){
    const page = await pdfDoc.getPage(pageNumber);

    const viewport = page.getViewport({
        scale: 1.5
    });

    const pageWrap = document.createElement("div");
    pageWrap.className = "pdf-page-wrap";
    pageWrap.dataset.pageNumber = pageNumber;

    const pageLabel = document.createElement("div");
    pageLabel.className = "page-label";
    pageLabel.innerText = "Page " + pageNumber + " of " + pdfDoc.numPages;

    const canvasHolder = document.createElement("div");
    canvasHolder.className = "canvas-holder";

    const canvas = document.createElement("canvas");
    canvas.className = "pdf-page-canvas";
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const drawCanvas = document.createElement("canvas");
    drawCanvas.className = "draw-canvas";
    drawCanvas.width = viewport.width;
    drawCanvas.height = viewport.height;

    const overlay = document.createElement("div");
    overlay.className = "page-overlay";
    overlay.style.width = viewport.width + "px";
    overlay.style.height = viewport.height + "px";

    canvasHolder.style.width = viewport.width + "px";
    canvasHolder.style.height = viewport.height + "px";

    canvasHolder.appendChild(canvas);
    canvasHolder.appendChild(drawCanvas);
    canvasHolder.appendChild(overlay);

    pageWrap.appendChild(pageLabel);
    pageWrap.appendChild(canvasHolder);
    pdfStage.appendChild(pageWrap);

    const ctx = canvas.getContext("2d");

    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;

    pageWrap.addEventListener("click", function(){
        selectPageWrap(pageWrap);
    });

    setupDrawCanvas(drawCanvas, pageWrap);
}

function setupDrawCanvas(canvas, pageWrap){
    const ctx = canvas.getContext("2d");

    canvas.addEventListener("mousedown", function(e){
        if(drawMode || highlightMode){
            selectPageWrap(pageWrap);
            activeDrawCanvas = canvas;
            activeDrawCtx = ctx;
            isDrawing = true;

            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        }
    });

    canvas.addEventListener("mousemove", function(e){
        if(!isDrawing || activeDrawCanvas !== canvas) return;

        if(drawMode){
            ctx.lineWidth = brushSize.value;
            ctx.lineCap = "round";
            ctx.strokeStyle = drawColor.value;
            ctx.globalAlpha = 1;
        }

        if(highlightMode){
            ctx.lineWidth = 18;
            ctx.lineCap = "round";
            ctx.strokeStyle = "yellow";
            ctx.globalAlpha = 0.35;
        }

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

   document.addEventListener("mouseup", stopDragResize);
   window.addEventListener("mouseup", stopDragResize);
   document.addEventListener("mouseleave", stopDragResize);
   window.addEventListener("blur", stopDragResize);

function stopDragResize(){
    dragElement = null;
    resizeElement = null;
    document.body.style.userSelect = "auto";
}
/* ADD ELEMENTS */

function appendToSelectedOverlay(el){
    const pageWrap = getSelectedPageWrap();
    if(!pageWrap){
        alert("Please upload PDF first.");
        return;
    }

    const overlay = getOverlay(pageWrap);
    overlay.appendChild(el);
    selectPageWrap(pageWrap);
}

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

    appendToSelectedOverlay(box);
    makeMovable(box, moveBar);
    selectElement(box);

    textArea.focus();

    setStatus("Text box added on selected page.");
}

function getTextEditor(){
    if(!selectedElement) return null;
    return selectedElement.querySelector(".text-editor");
}

function addEraser(){
    const eraser = document.createElement("div");

    eraser.className = "eraser-box";
    eraser.style.left = "150px";
    eraser.style.top = "150px";
    eraser.style.width = "180px";
    eraser.style.height = "60px";

    appendToSelectedOverlay(eraser);

    makeMovable(eraser);
    selectElement(eraser);

    setStatus("White eraser added on selected page.");
}

function addImage(file){
    const reader = new FileReader();

    reader.onload = function(e){
        const img = document.createElement("img");

        img.src = e.target.result;
        img.className = "image-element";
        img.style.left = "150px";
        img.style.top = "150px";
        img.style.width = imageSize.value + "px";
        img.style.height = "auto";

        appendToSelectedOverlay(img);

        makeMovable(img);
        selectElement(img);

        setStatus("Image added on selected page. Ctrl+C / Ctrl+V supported.");
    };

    reader.readAsDataURL(file);
}

function applyShapeStyle(shape, type){
    const color = shapeColor.value;
    const border = shapeBorder.value + "px";
    const size = parseInt(shapeSize.value);

    shape.style.borderRadius = "0";

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
        shape.style.border = "none";
        shape.style.background = color;
    }

    if(type === "arrow"){
        shape.style.width = size + "px";
        shape.style.height = shapeBorder.value + "px";
        shape.style.border = "none";
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

    appendToSelectedOverlay(shape);

    makeMovable(shape);
    selectElement(shape);

    setStatus(type + " shape added on selected page.");
}

/* WATERMARK AND PAGE NUMBER */

function addWatermark(){
    if(!pdfDoc){
        alert("Please upload PDF first.");
        return;
    }

    const text = document.getElementById("watermarkText").value;
    const color = document.getElementById("watermarkColor").value;
    const size = document.getElementById("watermarkSize").value;
    const opacity = document.getElementById("watermarkOpacity").value / 100;

    document.querySelectorAll(".draw-canvas").forEach(canvas => {
        const ctx = canvas.getContext("2d");

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.font = size + "px Arial";
        ctx.fillStyle = color;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-30 * Math.PI / 180);
        ctx.textAlign = "center";
        ctx.fillText(text, 0, 0);
        ctx.restore();
    });

    setStatus("Watermark added on all pages.");
}

function addPageNumber(){
    if(!pdfDoc){
        alert("Please upload PDF first.");
        return;
    }

    document.querySelectorAll(".pdf-page-wrap").forEach(pageWrap => {
        const canvas = pageWrap.querySelector(".draw-canvas");
        const ctx = canvas.getContext("2d");
        const pageNumber = getPageNumber(pageWrap);

        ctx.save();
        ctx.font = "18px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText("Page " + pageNumber, canvas.width / 2, canvas.height - 25);
        ctx.restore();
    });

    setStatus("Page numbers added.");
}

/* FORMAT CONTROLS */

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
    setStatus(drawMode ? "Draw enabled. Draw on any page." : "Draw disabled.");
});

document.getElementById("highlightBtn").addEventListener("click", function(){
    highlightMode = !highlightMode;
    drawMode = false;
    setStatus(highlightMode ? "Highlight enabled. Highlight on any page." : "Highlight disabled.");
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

imageUpload.addEventListener("change", function(){
    const file = this.files[0];

    if(file){
        addImage(file);
    }

    imageUpload.value = "";
});

document.getElementById("watermarkBtn").addEventListener("click", addWatermark);
document.getElementById("pageNumberBtn").addEventListener("click", addPageNumber);

document.getElementById("clearPageBtn").addEventListener("click", function(){
    const pageWrap = getSelectedPageWrap();
    if(!pageWrap) return;

    const drawCanvas = pageWrap.querySelector(".draw-canvas");
    drawCanvas.getContext("2d").clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    getEditableElements(pageWrap).forEach(el => el.remove());

    setStatus("Selected page cleared.");
});

/* DELETE + COPY PASTE */

document.addEventListener("keydown", function(e){
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = document.activeElement.isContentEditable || activeTag === "input" || activeTag === "textarea";

    if(e.key === "Delete" && selectedElement && !isTyping){
        selectedElement.remove();
        selectedElement = null;
        setStatus("Element deleted.");
    }

    if(e.ctrlKey && e.key.toLowerCase() === "c" && selectedElement){
        copiedElement = selectedElement.cloneNode(true);
        removeResizeHandles();
        setStatus("Element copied.");
    }

    if(e.ctrlKey && e.key.toLowerCase() === "v" && copiedElement){
        e.preventDefault();

        const pageWrap = getSelectedPageWrap();
        if(!pageWrap) return;

        const clone = copiedElement.cloneNode(true);

        clone.style.left = (parseInt(copiedElement.style.left || 150) + 25) + "px";
        clone.style.top = (parseInt(copiedElement.style.top || 150) + 25) + "px";

        getOverlay(pageWrap).appendChild(clone);

        const moveBar = clone.querySelector(".move-bar");
        makeMovable(clone, moveBar || clone);
        selectElement(clone);

        copiedElement = clone.cloneNode(true);

        setStatus("Element pasted on selected page.");
    }
});

/* UNDO */

undoBtn.addEventListener("click", function(){
    if(undoStack.length > 0){
        const last = undoStack.pop();
        const canvas = last.pageWrap.querySelector(".pdf-page-canvas");
        canvas.getContext("2d").putImageData(last.imageData, 0, 0);
    }
    else{
        alert("Nothing to undo.");
    }
});

/* DOWNLOAD ALL PAGES */

downloadBtn.addEventListener("click", async function(){
    if(!pdfDoc){
        alert("Please upload PDF first.");
        return;
    }

    removeResizeHandles();
    setStatus("Preparing PDF download...");

    const pdf = await PDFLib.PDFDocument.create();

    const pages = document.querySelectorAll(".pdf-page-wrap");

    for(const pageWrap of pages){
        const baseCanvas = pageWrap.querySelector(".pdf-page-canvas");
        const drawCanvas = pageWrap.querySelector(".draw-canvas");

        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        tempCanvas.width = baseCanvas.width;
        tempCanvas.height = baseCanvas.height;

        tempCtx.drawImage(baseCanvas, 0, 0);
        tempCtx.drawImage(drawCanvas, 0, 0);

        const elements = getEditableElements(pageWrap);

        for(const el of elements){
            const x = el.offsetLeft;
            const y = el.offsetTop;

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
        const page = pdf.addPage([tempCanvas.width, tempCanvas.height]);
        const pngImage = await pdf.embedPng(imageData);

        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: tempCanvas.width,
            height: tempCanvas.height
        });
    }

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
