const pdfUpload = document.getElementById("pdfUpload");
const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

let pdfDoc = null;
let currentPage = 1;

let selectedElement = null;
let dragElement = null;

let offsetX = 0;
let offsetY = 0;

const previewBox = document.querySelector(".pdf-preview");

previewBox.style.position = "relative";

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

/* ADD EDITABLE TEXT */

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

    textBox.style.background = "rgba(255,255,255,0.5)";

    textBox.style.cursor = "move";

    textBox.style.zIndex = "1000";

    previewBox.appendChild(textBox);

    textBox.focus();

    selectedElement = textBox;

    /* SELECT */

    textBox.addEventListener("click", function(e){

        e.stopPropagation();

        selectedElement = textBox;

    });

    /* DRAG START */

    textBox.addEventListener("mousedown", function(e){

        dragElement = textBox;

        offsetX = e.clientX - textBox.offsetLeft;

        offsetY = e.clientY - textBox.offsetTop;

    });

}

/* DRAG MOVE */

document.addEventListener("mousemove", function(e){

    if(dragElement){

        dragElement.style.left =
            (e.clientX - offsetX) + "px";

        dragElement.style.top =
            (e.clientY - offsetY) + "px";

    }

});

/* DRAG END */

document.addEventListener("mouseup", function(){

    dragElement = null;

});

/* DELETE SELECTED */

function deleteSelected(){

    if(selectedElement){

        selectedElement.remove();

        selectedElement = null;

    }
    else{

        alert("Please select text first.");

    }

}

/* BUTTON ACTIONS */

const buttons = document.querySelectorAll(".sidebar button");

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        if(btn.innerText === "Add Text"){

            addEditableText();

        }

        else if(btn.innerText === "Erase / Delete Selected"){

            deleteSelected();

        }

        else{

            alert(btn.innerText + " feature coming soon!");

        }

    });

});
