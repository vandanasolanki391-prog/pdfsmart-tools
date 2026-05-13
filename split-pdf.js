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

/* 
Supports:
1-5
1,3,5
1-5, 6-10, 15
*/
function getPageNumbers(input){
    let pages = [];
    const parts = input.split(",");

    parts.forEach(part => {
        part = part.trim();

        if(part.includes("-")){
            const range = part.split("-");
            const start = parseInt(range[0]);
            const end = parseInt(range[1]);

            if(
                isNaN(start) ||
                isNaN(end) ||
                start < 1 ||
                end > totalPages ||
                start > end
            ){
                throw new Error("Invalid range: " + part);
            }

            for(let i = start; i <= end; i++){
                pages.push(i - 1);
            }
        }
        else{
            const page = parseInt(part);

            if(
                isNaN(page) ||
                page < 1 ||
                page > totalPages
            ){
                throw new Error("Invalid page number: " + part);
            }

            pages.push(page - 1);
        }
    });

    return pages;
}

splitBtn.addEventListener("click", async function(){
    if(!selectedFile){
        alert("Please select a PDF file first.");
        return;
    }

    if(!pageInput.value.trim()){
        alert("Please enter page range or page numbers.");
        return;
    }

    try{
        statusText.innerText = "Creating split PDF... Please wait.";

        const fileBytes = await selectedFile.arrayBuffer();
        const sourcePdf = await PDFLib.PDFDocument.load(fileBytes);

        const newPdf = await PDFLib.PDFDocument.create();

        const pageNumbers = getPageNumbers(pageInput.value.trim());

        const copiedPages = await newPdf.copyPages(
            sourcePdf,
            pageNumbers
        );

        copiedPages.forEach(page => {
            newPdf.addPage(page);
        });

        const pdfBytes = await newPdf.save();

        const blob = new Blob([pdfBytes], {
            type: "application/pdf"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "split-selected-pages.pdf";
        link.click();

        statusText.innerText =
            "Split PDF created successfully.";
    }
    catch(error){
        console.error(error);
        alert(error.message);
        statusText.innerText = "Error while splitting PDF.";
    }
});
