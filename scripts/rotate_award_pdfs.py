import pypdf

pdf_files = [
    'public/documents/projects/11-agricultural-aaicon-award.pdf',
    'public/documents/projects/11-agricultural-winter-ai-award.pdf',
    'public/documents/projects/07-pedal-blackbox-siw-award.pdf',
    'public/documents/projects/13-reborn-esg-funding-award.pdf',
    'public/documents/projects/12-greenlight-daejeon-award.pdf',
    'public/documents/projects/14-park2gather-ip-hackathon-award.pdf'
]

for pdf_path in pdf_files:
    reader = pypdf.PdfReader(pdf_path)
    writer = pypdf.PdfWriter()
    for page in reader.pages:
        # Rotate 90 degrees counter-clockwise (left)
        page.rotate(-90)
        writer.add_page(page)
    with open(pdf_path, 'wb') as f:
        writer.write(f)
    print(f"Successfully rotated 90 degrees CCW: {pdf_path}")
