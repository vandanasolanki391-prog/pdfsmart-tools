/* OCR BUTTON */

else if(btn.innerText === "OCR Scan"){

    runOCR();

}

/* TRANSLATE BUTTON */

else if(btn.innerText.includes("Translate")){

    ocrOutputBox.style.display = "block";

    if(

        !ocrText.value ||

        ocrText.value === "Scanning text... Please wait."

    ){

        alert("Please run OCR Scan first.");

        return;

    }

    translateText();

}

/* ERASE BUTTON */

else if(btn.innerText === "Erase / Delete Selected"){

    deleteSelected();

}
