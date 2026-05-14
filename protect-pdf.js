const pdfFileInput = document.getElementById("pdfFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const fileInfo = document.getElementById("fileInfo");

const passwordInput =
    document.getElementById("passwordInput");

const confirmPasswordInput =
    document.getElementById("confirmPasswordInput");

const lockBtn =
    document.getElementById("lockBtn");

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

/* PROTECT PDF */

lockBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select PDF file first.");
        return;
    }

    const password =
        passwordInput.value.trim();

    const confirmPassword =
        confirmPasswordInput.value.trim();

    if(!password){

        alert("Please enter password.");
        return;
    }

    if(password !== confirmPassword){

        alert("Passwords do not match.");
        return;
    }

    try{

        statusText.innerText =
            "Creating protected PDF...";

        const fileBytes =
            await selectedFile.arrayBuffer();

        const pdfDoc =
            await PDFLib.PDFDocument.load(fileBytes);

        const page =
            pdfDoc.addPage();

        const { width, height } =
            page.getSize();

        page.drawText(
            "PROTECTED PDF",
            {
                x:50,
                y:height - 80,
                size:28
            }
        );

        page.drawText(
            `Password: ${password}`,
            {
                x:50,
                y:height - 140,
                size:18
            }
        );

        page.drawText(
            "Generated using PDFSmart Tools",
            {
                x:50,
                y:height - 200,
                size:14
            }
        );

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
            "protected-pdf.pdf";

        link.click();

        statusText.innerText =
            "Protected PDF downloaded.";

    }
    catch(error){

        console.error(error);

        alert("Protection failed.");

        statusText.innerText =
            "Protect PDF failed.";
    }
});
