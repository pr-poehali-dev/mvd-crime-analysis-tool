-- Создание таблицы для хранения документов
CREATE TABLE IF NOT EXISTS document_attachments (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL REFERENCES crime_analyses(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    extracted_text TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_document_attachments_analysis_id ON document_attachments(analysis_id);
CREATE INDEX idx_document_attachments_upload_date ON document_attachments(upload_date DESC);
