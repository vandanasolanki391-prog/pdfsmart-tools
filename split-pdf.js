const pdfFileInput = document.getElementById("pdfFile");
const fileInfo = document.getElementById("fileInfo");
const splitMode = document.getElementById("splitMode");
const pageInput = document.getElementById("pageInput");
const splitBtn = document.getElementById("splitBtn");
const statusText = document.getElementById("statusText");

let selectedFile = null;
let totalPages = 0;

pdfFileInput.addEventListener("change", async function(e){
    selectedFile = e.target.files[0];

    if(!selectedFile){
        fileInfo.innerText = "No PDF selected";
        return;
    }

    try{
        const bytes = await selectedFile.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(bytes);

        totalPages = pdf.getPageCount();

        fileInfo.innerText =
            `${selectedFile.name} | Total Pages: ${totalPages}`;

        statusText.innerText = "PDF loaded successfully.";
    }
    catch(error){
        console.error(error);
        fileInfo.innerText = "Invalid PDF file.";
        statusText.innerText = "Please select a valid PDF.";
    }
});

function getPageNumbers(input, mode){
    let pages = [];

    if(mode === "range"){
        const parts = input.split("-");

        if(parts.length !== 2){
            throw new Error("Please enter range like 1-3");
        }

        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);

        if(isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end){
            throw new Error("Invalid page range.");
        }

        for(let i = start; i <= end; i++){
            pages.push(i - 1);
        }
    }

    if(mode === "specific"){
        pages = input
            .split(",")
            .map(num => parseInt(num.trim()))
            .filter(num => !isNaN(num));

        if(pages.length === 0){
            throw new Error("Please enter pages like 1,3,5");
        }

        pages.forEach(page => {
            if(page < 1 || page > totalPages){
                throw new Error("Invalid page number: " + page);
            }
        });

        pages = pages.map(page => page - 1);
    }

    return pages;
}

splitBtn.addEventListener("click", async function(){
    if(!selectedFile){
        alert("Please select a PDF file first.");
        return;
    }

    if(!pageInput.value.trim()){
        alert("Please enter page range or specific pages.");
        return;
    }

    try{
        statusText.innerText = "Splitting PDF... Please wait.";

        const fileBytes = await selectedFile.arrayBuffer();
        const sourcePdf = await PDFLib.PDFDocument.load(fileBytes);

        const newPdf = await PDFLib.PDFDocument.create();

        const pageNumbers = getPageNumbers(
            pageInput.value.trim(),
            splitMode.value
        );

        const copiedPages = await newPdf.copyPages(
            sourcePdf,
            pageNumbers
        );

        copiedPages.forEach(page => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();

        const blob = new Blob([pdfBytes], {
            type: "application/pdf"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "split-pdf.pdf";
        link.click();

        statusText.innerText = "PDF split successfully.";
    }
    catch(error){
        console.error(error);
        alert(error.message);
        statusText.innerText = "Error while splitting PDF.";
    }
});
