/**
 * Вспомогательные функции для парсера Fortran
 */

class Position {
    constructor(line = 1, column = 1) {
        this.line = line;
        this.column = column;
    }

    advance(char) {
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
    }

    clone() {
        return new Position(this.line, this.column);
    }
}

/**
 * Проверяет, является ли символ буквой
 */
function isAlpha(char) {
    return /^[a-zA-Z]$/.test(char);
}

/**
 * Проверяет, является ли символ цифрой
 */
function isDigit(char) {
    return /^[0-9]$/.test(char);
}

/**
 * Проверяет, является ли символ пробельным
 */
function isWhitespace(char) {
    return /^\s$/.test(char);
}

/**
 * Проверяет, является ли символ началом комментария Fortran (C или c)
 */
function isCommentStart(char, position) {
    return (char === 'C' || char === 'c') && position.column === 1;
}

/**
 * Валидация метки Fortran
 */
function isValidLabel(label) {
    const num = parseInt(label);
    // Метка должна быть целым числом от 1 до 99999
    return /^[1-9][0-9]{0,4}$/.test(label) && num >= 1 && num <= 99999;
}

/**
 * Проверяет, является ли идентификатор допустимым именем переменной Fortran
 */
function isValidIdentifier(identifier) {
    return /^[A-Z][A-Z0-9]{0,5}$/i.test(identifier);
}

/**
 * Преобразует строку к верхнему регистру (для нечувствительности к регистру)
 */
function toFortranCase(str) {
    return str.toUpperCase();
}

/**
 * Форматирует JSON для красивого вывода
 */
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

/**
 * Экранирует HTML специальные символы
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Форматирует число с разделителями тысяч
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Проверяет, является ли строка допустимым именем файла
 */
function isValidFileName(name) {
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    
    return !invalidChars.test(name) && 
           !reservedNames.test(name) &&
           name.length > 0 && 
           name.length <= 255;
}

/**
 * Создает безопасное имя файла
 */
function createSafeFileName(name) {
    return name
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\.{2,}/g, '.')
        .trim();
}