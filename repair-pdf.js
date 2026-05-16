const repairPdfUpload = document.getElementById("repairPdfUpload");
const repairBtn = document.getElementById("repairBtn");
const repairStatus = document.getElementById("repairStatus");

let selectedPdfBytes = null;

repairPdfUpload.addEventListener("change", function(e){
    const file = e.target.files[0];

    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(){
        selectedPdfBytes = this.result;
        repairStatus.innerText = "PDF selected: " + file.name;
    };

    reader.readAsArrayBuffer(file);
});

repairBtn.addEventListener("click", async function(){
    if(!selectedPdfBytes){
        alert("Please select a PDF first.");
        return;
    }

    repairStatus.innerText = "Repairing PDF, please wait...";

    try{
        const pdfDoc = await PDFLib.PDFDocument.load(selectedPdfBytes, {
            ignoreEncryption: true,
            updateMetadata: false
        });

        const newPdf = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdf.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices()
        );

        copiedPages.forEach(page => {
            newPdf.addPage(page);
        });

        newPdf.setTitle("Repaired PDF - PDFSmart Tools");
        newPdf.setProducer("PDFSmart Tools");

        const repairedBytes = await newPdf.save();

        const blob = new Blob([repairedBytes], {
            type: "application/pdf"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "repaired-pdf.pdf";
        link.click();

        repairStatus.innerText = "PDF repaired and downloaded successfully.";
    }
    catch(error){
        console.error(error);
        repairStatus.innerText =
            "Repair failed. This PDF may be heavily corrupted or password protected.";
    }
});
