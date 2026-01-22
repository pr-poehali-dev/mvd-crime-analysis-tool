import base64
import io
from typing import Tuple

def extract_text_from_pdf(file_data: bytes) -> str:
    """Извлечение текста из PDF с помощью pypdf"""
    try:
        import pypdf
        pdf_file = io.BytesIO(file_data)
        pdf_reader = pypdf.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Ошибка обработки PDF: {str(e)}")

def extract_text_from_docx(file_data: bytes) -> str:
    """Извлечение текста из Word документа с помощью python-docx"""
    try:
        from docx import Document
        doc_file = io.BytesIO(file_data)
        doc = Document(doc_file)
        
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Ошибка обработки Word: {str(e)}")

def extract_text_from_txt(file_data: bytes) -> str:
    """Извлечение текста из TXT файла"""
    try:
        text = file_data.decode('utf-8')
        return text.strip()
    except UnicodeDecodeError:
        try:
            text = file_data.decode('windows-1251')
            return text.strip()
        except Exception as e:
            raise Exception(f"Ошибка обработки TXT: {str(e)}")

def parse_document(base64_data: str, file_name: str) -> Tuple[str, str]:
    """Парсинг документа и извлечение текста"""
    try:
        file_data = base64.b64decode(base64_data)
        
        file_ext = file_name.lower().split('.')[-1]
        
        if file_ext == 'pdf':
            text = extract_text_from_pdf(file_data)
            file_type = 'PDF'
        elif file_ext in ['doc', 'docx']:
            text = extract_text_from_docx(file_data)
            file_type = 'Word'
        elif file_ext == 'txt':
            text = extract_text_from_txt(file_data)
            file_type = 'TXT'
        else:
            raise Exception(f"Неподдерживаемый формат файла: {file_ext}")
        
        if len(text) < 10:
            raise Exception("Документ слишком короткий или не содержит текста")
        
        return text, file_type
        
    except Exception as e:
        raise Exception(f"Ошибка парсинга документа: {str(e)}")