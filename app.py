
from flask import Flask, render_template, request, send_file, jsonify
import pdfplumber
import pandas as pd
import os
import io
import tempfile
import time
import logging
from werkzeug.utils import secure_filename
import pikepdf

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

logging.basicConfig(level=logging.INFO)


# CORS and basic security headers
@app.after_request
def add_security_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


# Delete one temporary file and log the result
def delete_temp_file(path):
    if not path:
        return True

    try:
        if os.path.isfile(path):
            os.remove(path)
            app.logger.info("Temporary file deleted: %s", path)
        return not os.path.exists(path)
    except OSError:
        app.logger.exception("Temporary file cleanup failed: %s", path)
        return False


# Remove abandoned app-created temporary files older than one hour.
# This runs when a new PDF-to-Excel conversion starts.
def cleanup_old_temp_files():
    cutoff = time.time() - 3600

    for folder in (UPLOAD_FOLDER, OUTPUT_FOLDER):
        try:
            for name in os.listdir(folder):
                if not name.startswith("pdfsmart_"):
                    continue

                path = os.path.join(folder, name)

                try:
                    if (
                        os.path.isfile(path)
                        and os.path.getmtime(path) < cutoff
                    ):
                        delete_temp_file(path)
                except OSError:
                    app.logger.exception(
                        "Could not inspect temporary file: %s", path
                    )
        except OSError:
            app.logger.exception(
                "Could not inspect temporary folder: %s", folder
            )


@app.route('/')
def home():
    return render_template('pdf-to-excel.html')


@app.route('/convert', methods=['GET', 'POST'])
def convert():
    if request.method == 'GET':
        return render_template('pdf-to-excel.html')

    pdf_path = None
    output_path = None

    try:
        cleanup_old_temp_files()

        pdf_file = request.files.get('pdfFile')

        if not pdf_file or not pdf_file.filename:
            return 'No PDF file selected', 400

        if not pdf_file.filename.lower().endswith('.pdf'):
            return 'Please upload a PDF file', 400

        filename = secure_filename(pdf_file.filename)
        if not filename:
            return 'Invalid filename', 400

        # Save uploaded PDF to a unique temporary file.
        with tempfile.NamedTemporaryFile(
            prefix='pdfsmart_',
            suffix='.pdf',
            dir=UPLOAD_FOLDER,
            delete=False
        ) as temp_pdf:
            pdf_path = temp_pdf.name
            pdf_file.save(pdf_path)

        # Create a unique temporary Excel file.
        with tempfile.NamedTemporaryFile(
            prefix='pdfsmart_',
            suffix='.xlsx',
            dir=OUTPUT_FOLDER,
            delete=False
        ) as temp_excel:
            output_path = temp_excel.name

        all_tables = []

        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                for table in page.extract_tables():
                    if table:
                        all_tables.append(pd.DataFrame(table))

        # If no tables are detected, export readable text instead.
        if not all_tables:
            text_rows = []

            with pdfplumber.open(pdf_path) as pdf:
                for page_no, page in enumerate(pdf.pages, start=1):
                    page_text = page.extract_text()

                    if page_text:
                        for line in page_text.splitlines():
                            text_rows.append([page_no, line])

            if not text_rows:
                return 'No readable text or table found in PDF', 422

            all_tables.append(
                pd.DataFrame(text_rows, columns=['Page No', 'Text'])
            )

        # Write extracted data to Excel.
        with pd.ExcelWriter(
            output_path, engine='openpyxl'
        ) as writer:
            for i, df in enumerate(all_tables):
                df.to_excel(
                    writer,
                    sheet_name=f'Table_{i + 1}',
                    index=False,
                    header=False
                )

        # Read the finished workbook into memory before deleting files.
        with open(output_path, 'rb') as excel_file:
            excel_data = excel_file.read()

        download_name = f'{filename.rsplit(".", 1)[0]}.xlsx'

        # Delete temporary files before sending the in-memory download.
        pdf_deleted = delete_temp_file(pdf_path)
        if pdf_deleted:
            pdf_path = None

        excel_deleted = delete_temp_file(output_path)
        if excel_deleted:
            output_path = None

        return send_file(
            io.BytesIO(excel_data),
            mimetype=(
                'application/vnd.openxmlformats-officedocument.'
                'spreadsheetml.sheet'
            ),
            as_attachment=True,
            download_name=download_name
        )

    except Exception:
        app.logger.exception('PDF to Excel conversion failed')
        return (
            'Unable to convert this PDF. Please check the file and try again.',
            500
        )

    finally:
        # Retry deletion if a previous attempt failed.
        for path in (pdf_path, output_path):
            if path:
                delete_temp_file(path)


# Validate PDF uploads for the API tools.
def get_uploaded_pdf():
    uploaded = request.files.get('pdfFile')

    if not uploaded or not uploaded.filename:
        return None, (
            jsonify(error='Please select a PDF file.'),
            400
        )

    if not uploaded.filename.lower().endswith('.pdf'):
        return None, (
            jsonify(error='Please upload a PDF file.'),
            400
        )

    return uploaded, None


# Return PDF data from memory.
def pdf_response(data, download_name):
    return send_file(
        io.BytesIO(data),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=download_name
    )


@app.route('/api/protect-pdf', methods=['POST', 'OPTIONS'])
def protect_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)

    uploaded, error = get_uploaded_pdf()
    if error:
        return error

    password = request.form.get('password', '')

    if not password:
        return jsonify(error='Please enter a password.'), 400

    if len(password) > 200:
        return jsonify(error='Password is too long.'), 400

    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()

        with pikepdf.open(source) as pdf:
            pdf.save(
                output,
                encryption=pikepdf.Encryption(
                    user=password,
                    owner=password,
                    R=6
                )
            )

        output.seek(0)
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='protected-pdf.pdf'
        )

    except pikepdf.PasswordError:
        return jsonify(
            error='This PDF is already password protected. '
                  'Unlock it first using its current password.'
        ), 400

    except Exception:
        app.logger.exception('Protect PDF failed')
        return jsonify(
            error='Could not protect this PDF. It may be damaged or unsupported.'
        ), 422


@app.route('/api/unlock-pdf', methods=['POST', 'OPTIONS'])
def unlock_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)

    uploaded, error = get_uploaded_pdf()
    if error:
        return error

    password = request.form.get('password', '')

    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()

        with pikepdf.open(source, password=password) as pdf:
            pdf.save(output, encryption=False)

        output.seek(0)
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='unlocked-pdf.pdf'
        )

    except pikepdf.PasswordError:
        return jsonify(
            error='Incorrect password, or this PDF requires a password.'
        ), 400

    except Exception:
        app.logger.exception('Unlock PDF failed')
        return jsonify(
            error='Could not unlock this PDF. The file may be damaged '
                  'or use unsupported encryption.'
        ), 422


@app.route('/api/compress-pdf', methods=['POST', 'OPTIONS'])
def compress_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)

    uploaded, error = get_uploaded_pdf()
    if error:
        return error

    level = request.form.get('level', 'medium').lower()

    if level not in ('low', 'medium', 'high'):
        level = 'medium'

    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()

        with pikepdf.open(source) as pdf:
            pdf.save(
                output,
                compress_streams=True,
                recompress_flate=True,
                object_stream_mode=pikepdf.ObjectStreamMode.generate,
                linearize=(level == 'high')
            )

        result = output.getvalue()
        original_size = source.getbuffer().nbytes

        # Keep the original if optimization makes it larger.
        if len(result) >= original_size:
            result = source.getvalue()

        return pdf_response(result, 'compressed-pdf.pdf')

    except pikepdf.PasswordError:
        return jsonify(
            error='This PDF is password protected. Unlock it first.'
        ), 400

    except Exception:
        app.logger.exception('Compress PDF failed')
        return jsonify(
            error='Could not compress this PDF. It may be damaged or unsupported.'
        ), 422


@app.route('/api/repair-pdf', methods=['POST', 'OPTIONS'])
def repair_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)

    uploaded, error = get_uploaded_pdf()
    if error:
        return error

    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()

        with pikepdf.open(source, attempt_recovery=True) as pdf:
            pdf.save(
                output,
                compress_streams=True,
                recompress_flate=True,
                object_stream_mode=pikepdf.ObjectStreamMode.generate
            )

        output.seek(0)
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='repaired-pdf.pdf'
        )

    except pikepdf.PasswordError:
        return jsonify(
            error='This PDF is password protected. '
                  'Unlock it with the correct password first.'
        ), 400

    except Exception:
        app.logger.exception('Repair PDF failed')
        return jsonify(
            error='Automatic repair could not recover this PDF. '
                  'Some severely damaged files cannot be repaired.'
        ), 422


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify(
        error='File is too large. Maximum upload size is 50 MB.'
    ), 413


if __name__ == '__main__':
    app.run()
