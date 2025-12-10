/**
 * Обработчик ошибок парсера Fortran
 */

class ParserError extends Error {
    constructor(message, position, expected = null, found = null) {
        super(message);
        this.name = 'ParserError';
        this.position = position;
        this.expected = expected;
        this.found = found;
        this.type = 'syntax';
    }

    toJSON() {
        return {
            error: this.message,
            line: this.position.line,
            column: this.position.column,
            expected: this.expected,
            found: this.found,
            success: false
        };
    }
}

class LexerError extends Error {
    constructor(message, position, char = null) {
        super(message);
        this.name = 'LexerError';
        this.position = position;
        this.char = char;
        this.type = 'lexical';
    }

    toJSON() {
        return {
            error: this.message,
            line: this.position.line,
            column: this.position.column,
            char: this.char,
            success: false
        };
    }
}

class SemanticError extends Error {
    constructor(message, position, details = null) {
        super(message);
        this.name = 'SemanticError';
        this.position = position;
        this.details = details;
        this.type = 'semantic';
    }

    toJSON() {
        return {
            error: this.message,
            line: this.position.line,
            column: this.position.column,
            details: this.details,
            success: false
        };
    }
}

/**
 * Фабрика ошибок для удобного создания
 */
const ErrorFactory = {
    unexpectedToken(position, expected, found) {
        return new ParserError(
            `Неожиданный токен. Ожидалось: ${expected}, получено: ${found}`,
            position,
            expected,
            found
        );
    },

    missingToken(position, expected) {
        return new ParserError(
            `Пропущен токен: ${expected}`,
            position,
            expected,
            null
        );
    },

    invalidLabel(position, label) {
        return new SemanticError(
            `Недопустимая метка: ${label}. Метка должна быть целым числом от 1 до 99999`,
            position,
            { label }
        );
    },

    invalidCharacter(position, char) {
        return new LexerError(
            `Недопустимый символ: ${char}`,
            position,
            char
        );
    },

    missingExpression(position) {
        return new ParserError(
            'Пропущено выражение после запятой',
            position,
            'выражение (метка или переменная)',
            null
        );
    },

    unexpectedEndOfInput(position) {
        return new ParserError(
            'Неожиданный конец ввода',
            position,
            'продолжение оператора',
            'конец ввода'
        );
    }
};

/**
 * Глобальный обработчик ошибок
 */
class ErrorHandler {
    constructor() {
        this.errors = [];
    }

    addError(error) {
        this.errors.push(error);
    }

    clear() {
        this.errors = [];
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getLastError() {
        return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
    }

    getAllErrors() {
        return this.errors.map(error => error.toJSON());
    }

    formatErrorForDisplay(error) {
        if (error instanceof LexerError || 
            error instanceof ParserError || 
            error instanceof SemanticError) {
            return error.toJSON();
        }
        return {
            error: error.message,
            line: 1,
            column: 1,
            success: false
        };
    }
}

// Экспорт глобального обработчика ошибок
const errorHandler = new ErrorHandler();
