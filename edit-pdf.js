const pdfUpload = document.getElementById("pdfUpload");
const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

let pdfDoc = null;
let currentPage = 1;

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


async function renderPage(pageNumber){

    const page = await pdfDoc.getPage(pageNumber);

    const viewport = page.getViewport({ scale: 1.5 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };

    await page.render(renderContext).promise;
}


/* DRAW TOOL */

let drawing = false;

canvas.addEventListener("mousedown", () => {
    drawing = true;
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
});

canvas.addEventListener("mousemove", draw);

function draw(e){

    if(!drawing) return;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "red";

    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(
        e.clientX - rect.left,
        e.clientY - rect.top
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        e.clientX - rect.left,
        e.clientY - rect.top
    );
}


/* ADD TEXT */

const buttons = document.querySelectorAll(".sidebar button");

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        if(btn.innerText === "Add Text"){

            const text = prompt("Enter Text");

            if(text){

                ctx.font = "30px Arial";
                ctx.fillStyle = "blue";
                ctx.fillText(text, 100, 100);

            }
        }

    });

});
