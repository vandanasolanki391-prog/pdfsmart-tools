from flask import Flask, render_template, request, send_file, redirect
import pdfplumber
import pandas as pd
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route("/")
def home():
    return render_template("pdf-to-excel.html")

@app.route("/convert", methods=["GET", "POST"])
def convert():
    if request.method == "GET":
        return render_template("pdf-to-excel.html")

    try:
        if "pdfFile" not in request.files:
            return "No file uploaded"

        pdf_file = request.files["pdfFile"]

        if pdf_file.filename == "":
            return "No selected file"

        filename = secure_filename(pdf_file.filename)
        pdf_path = os.path.join(UPLOAD_FOLDER, filename)
        pdf_file.save(pdf_path)

        all_tables = []

        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if table:
                        all_tables.append(pd.DataFrame(table))

        if not all_tables:
    text_rows = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_no, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()

            if text:
                lines = text.split("\n")

                for line in lines:
                    text_rows.append([page_no, line])

    if not text_rows:
        return "No readable text or table found in PDF"

    all_tables.append(pd.DataFrame(text_rows, columns=["Page No", "Text"]))
        output_excel = filename.rsplit(".", 1)[0] + ".xlsx"
        output_path = os.path.join(OUTPUT_FOLDER, output_excel)

        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            for i, df in enumerate(all_tables):
                df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False, header=False)

        return send_file(output_path, as_attachment=True)

    except Exception as e:
        return "Error: " + str(e)

if __name__ == "__main__":
    app.run()
