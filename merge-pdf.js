const pdfFilesInput = document.getElementById("pdfFiles");
const fileList = document.getElementById("fileList");
const mergeBtn = document.getElementById("mergeBtn");
const statusText = document.getElementById("statusText");

let selectedFiles = [];

/* SHOW FILES */

pdfFilesInput.addEventListener("change", function(e){

    selectedFiles = Array.from(e.target.files);

    fileList.innerHTML = "";

    if(selectedFiles.length === 0){
        return;
    }

    selectedFiles.forEach((file,index)=>{

        const li = document.createElement("li");

        const fileName = document.createElement("div");
        fileName.className = "file-name";
        fileName.innerText = `${index + 1}. ${file.name}`;

        const fileSize = document.createElement("div");
        fileSize.className = "file-size";

        const sizeMB =
            (file.size / (1024 * 1024)).toFixed(2);

        fileSize.innerText =
            `${sizeMB} MB`;

        li.appendChild(fileName);
        li.appendChild(fileSize);

        fileList.appendChild(li);
    });

    statusText.innerText =
        `${selectedFiles.length} PDF files selected`;
});

/* MERGE PDF */

mergeBtn.addEventListener("click", async function(){

    if(selectedFiles.length < 2){

        alert("Please select at least 2 PDF files.");

        return;
    }

    try{

        statusText.innerText =
            "Merging PDFs... Please wait.";

        const mergedPdf =
            await PDFLib.PDFDocument.create();

        for(const file of selectedFiles){

            const fileBytes =
                await file.arrayBuffer();

            const pdf =
                await PDFLib.PDFDocument.load(fileBytes);

            const copiedPages =
                await mergedPdf.copyPages(
                    pdf,
                    pdf.getPageIndices()
                );

            copiedPages.forEach((page)=>{
                mergedPdf.addPage(page);
            });
        }

        const mergedPdfBytes =
            await mergedPdf.save();

        const blob =
            new Blob(
                [mergedPdfBytes],
                {type:"application/pdf"}
            );

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            "merged-pdf.pdf";

        link.click();

        statusText.innerText =
            "PDF merged successfully.";

    }

    catch(error){

        console.error(error);

        statusText.innerText =
            "Error while merging PDF.";
    }
});
