const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const fileInfo = document.getElementById("fileInfo");

const passwordInput =
    document.getElementById("passwordInput");

const unlockBtn =
    document.getElementById("unlockBtn");

const statusText =
    document.getElementById("statusText");

let selectedFile = null;

/* FILE SELECT */

pdfFileInput.addEventListener("change", function(e){

    selectedFile = e.target.files[0];

    if(!selectedFile){
        return;
    }

    uploadSection.style.display = "none";
    workSection.style.display = "block";

    fileInfo.innerText =
        `${selectedFile.name} | ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;

    statusText.innerText =
        "PDF loaded successfully.";
});

/* UNLOCK PDF */

unlockBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select PDF file first.");
        return;
    }

    try{

        statusText.innerText =
            "Unlocking PDF...";

        const fileBytes =
            await selectedFile.arrayBuffer();

        let pdfDoc;

        try{

            pdfDoc =
                await PDFLib.PDFDocument.load(
                    fileBytes,
                    {
                        ignoreEncryption:true
                    }
                );

        }
        catch(loadError){

            console.error(loadError);

            alert(
                "Unable to unlock strongly encrypted PDF in browser."
            );

            statusText.innerText =
                "Unlock failed.";

            return;
        }

        const pdfBytes =
            await pdfDoc.save();

        const blob =
            new Blob(
                [pdfBytes],
                {
                    type:"application/pdf"
                }
            );

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            "unlocked-pdf.pdf";

        link.click();

        statusText.innerText =
            "Unlocked PDF downloaded.";

    }
    catch(error){

        console.error(error);

        alert("Unlock failed.");

        statusText.innerText =
            "Unlock PDF failed.";
    }
});
