from PyPDF2 import PdfReader

reader = PdfReader("D6.10_ Open digital research data.pdf")
text = ""
for i in range(min(4, len(reader.pages))):
    text += reader.pages[i].extract_text()
print(text)
