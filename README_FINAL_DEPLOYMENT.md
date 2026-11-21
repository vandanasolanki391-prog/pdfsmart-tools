# PDFSmart Tools — Final Website Bundle

This folder contains the consolidated source for the PDFSmart Tools website and its Flask PDF-to-Excel backend.

## What was updated

- Added consistent page descriptions and canonical URLs to public HTML pages.
- Corrected the sitemap namespace and rebuilt the sitemap from the actual public `.html` routes.
- Ensured one main H1 per public page.
- Added the existing AdSense publisher script to public pages so Auto Ads can load across the site.
- Unified the public PDF-to-Excel page with the Render table-extraction backend.
- Corrected the backend form URL and the PDF-to-Excel navigation link.
- Updated Protect PDF instructions to describe actual password encryption; passwords must be at least 8 characters.
- Corrected compression descriptions and removed misleading low/medium/high choices because the backend uses the same structural optimization for those levels (high only linearizes the file).
- Corrected PDF-to-Word and Translate PDF descriptions to explain their actual limitations.
- Removed an unexplained third-party service-worker loader that was not registered by the site.
- Restricted API CORS responses to the website's apex and `www` origins.
- Pinned floating CDN library URLs to explicit versions.

## Deploy to GitHub and Render

1. Make a backup of the current GitHub repository.
2. Extract this ZIP.
3. Upload the contents of the `pdfsmart-tools-main` folder into the repository root, replacing the matching old files. Keep the folder structure, especially `templates/`.
4. Commit the changes to GitHub.
5. Render should deploy the new commit using the existing service settings. The expected start command is `gunicorn app:app` and dependencies are listed in `requirements.txt`.
6. After deployment, open `https://pdfsmarttools.in/pdf-to-excel.html` and test with a non-confidential, text-based PDF containing a table.

## Important notes

- This bundle was prepared from the latest source ZIP supplied in this conversation (14 November 2026). The 20 November Render deployment was described as a test deployment of the same source, not a new code change.
- Local static checks passed: Python syntax, JavaScript syntax, HTML metadata/H1 checks, local file links and sitemap paths.
- These checks do not replace a live end-to-end test of every PDF tool on the deployed hosting service.
- PDF-to-Word extracts selectable text into a Word-compatible `.doc` file; it does not preserve the original page layout. Scanned PDFs need OCR first.
- Translate PDF uses English OCR and a limited built-in word substitution list; it is not full machine translation.
- PDF-to-Excel extracts detected tables into separate worksheets. If no table is found, it exports readable text by page. Image-only scanned PDFs need OCR first.
- PDF compression performs structural optimization, not image re-encoding. A smaller result is not guaranteed.
- AdSense approval is decided by Google. No code bundle can guarantee approval; original useful content, site quality and policy compliance remain important.
