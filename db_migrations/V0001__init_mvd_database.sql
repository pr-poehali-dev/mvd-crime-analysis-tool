-- Таблица пользователей (сотрудников МВД)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    rank VARCHAR(100),
    department VARCHAR(200),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'officer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Таблица статей УК РФ
CREATE TABLE uk_rf_articles (
    id SERIAL PRIMARY KEY,
    article_number VARCHAR(20) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(200),
    severity VARCHAR(50),
    full_text TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица статей УПК РФ
CREATE TABLE upk_rf_articles (
    id SERIAL PRIMARY KEY,
    article_number VARCHAR(20) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(200),
    full_text TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица статей Конституции РФ
CREATE TABLE constitution_articles (
    id SERIAL PRIMARY KEY,
    article_number VARCHAR(20) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(200),
    full_text TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица анализов преступлений
CREATE TABLE crime_analyses (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(100) UNIQUE NOT NULL,
    incident_date DATE NOT NULL,
    category VARCHAR(200),
    description TEXT,
    evidence TEXT,
    analysis_result JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    officer_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица связей анализов со статьями
CREATE TABLE analysis_articles (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES crime_analyses(id),
    article_type VARCHAR(50) NOT NULL,
    article_id INTEGER NOT NULL,
    relevance_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица логов обновлений законодательства
CREATE TABLE legislation_updates (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    articles_added INTEGER DEFAULT 0,
    articles_updated INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'success',
    details JSONB
);

-- Индексы для оптимизации поиска
CREATE INDEX idx_uk_rf_article_number ON uk_rf_articles(article_number);
CREATE INDEX idx_uk_rf_category ON uk_rf_articles(category);
CREATE INDEX idx_upk_rf_article_number ON upk_rf_articles(article_number);
CREATE INDEX idx_constitution_article_number ON constitution_articles(article_number);
CREATE INDEX idx_crime_analyses_case_number ON crime_analyses(case_number);
CREATE INDEX idx_crime_analyses_officer_id ON crime_analyses(officer_id);
CREATE INDEX idx_crime_analyses_status ON crime_analyses(status);
CREATE INDEX idx_analysis_articles_analysis_id ON analysis_articles(analysis_id);

-- Вставка примерных данных УК РФ
INSERT INTO uk_rf_articles (article_number, title, category, severity) VALUES
('105', 'Убийство', 'Преступления против жизни и здоровья', 'Особо тяжкое'),
('158', 'Кража', 'Преступления против собственности', 'Средней тяжести'),
('159', 'Мошенничество', 'Преступления против собственности', 'Средней тяжести'),
('161', 'Грабёж', 'Преступления против собственности', 'Тяжкое'),
('162', 'Разбой', 'Преступления против собственности', 'Тяжкое'),
('228', 'Незаконные приобретение, хранение, перевозка, изготовление наркотических средств', 'Преступления против здоровья населения', 'Тяжкое'),
('264', 'Нарушение правил дорожного движения', 'Преступления против безопасности движения', 'Средней тяжести');

-- Вставка примерных данных УПК РФ
INSERT INTO upk_rf_articles (article_number, title, category) VALUES
('73', 'Обстоятельства, подлежащие доказыванию', 'Доказательства и доказывание'),
('146', 'Возбуждение уголовного дела', 'Досудебное производство'),
('171', 'Следственные действия', 'Предварительное расследование'),
('307', 'Приговор суда', 'Судебное разбирательство');

-- Вставка примерных данных Конституции РФ
INSERT INTO constitution_articles (article_number, title, category) VALUES
('2', 'Человек, его права и свободы являются высшей ценностью', 'Основы конституционного строя'),
('19', 'Равенство перед законом и судом', 'Права и свободы человека и гражданина'),
('49', 'Презумпция невиновности', 'Права и свободы человека и гражданина'),
('51', 'Право не свидетельствовать против себя', 'Права и свободы человека и гражданина');

-- Тестовый пользователь (пароль: admin123)
INSERT INTO users (username, full_name, rank, department, password_hash, role) VALUES
('admin', 'Администратор Системы', 'Подполковник', 'Отдел информационных технологий', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILSBVxZ2S', 'admin');
