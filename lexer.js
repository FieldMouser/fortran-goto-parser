/**
 * Лексический анализатор (лексер) для Fortran GO TO операторов
 */

class Token {
    constructor(type, value, position) {
        this.type = type;
        this.value = value;
        this.position = position;
    }

    toString() {
        return `${this.type}(${this.value}) at ${this.position.line}:${this.position.column}`;
    }
}

// Типы токенов
const TokenType = {
    KEYWORD_GO: 'GO',
    KEYWORD_TO: 'TO',
    INTEGER: 'INTEGER',
    IDENTIFIER: 'IDENTIFIER',
    LEFT_PAREN: '(',
    RIGHT_PAREN: ')',
    COMMA: ',',
    EOF: 'EOF'
};

class Lexer {
    constructor(input) {
        this.input = input;
        this.position = new Position();
        this.currentChar = null;
        this.tokens = [];
        this.index = 0;
        this.startPosition = null;
        this.inComment = false;
        this.advance();
    }

    advance() {
        if (this.index < this.input.length) {
            this.currentChar = this.input[this.index];
            
            // Обработка комментариев (C в первой колонке)
            if (isCommentStart(this.currentChar, this.position)) {
                this.skipComment();
                return;
            }
            
            this.index++;
            this.position.advance(this.currentChar);
        } else {
            this.currentChar = null;
        }
    }

    skipComment() {
        // Пропускаем всю строку комментария
        while (this.currentChar !== null && this.currentChar !== '\n') {
            this.advance();
        }
        if (this.currentChar === '\n') {
            this.advance();
        }
    }

    skipWhitespace() {
        while (this.currentChar !== null && isWhitespace(this.currentChar)) {
            this.advance();
        }
    }

    peek() {
        if (this.index < this.input.length) {
            return this.input[this.index];
        }
        return null;
    }

    makeNumber() {
        let result = '';
        this.startPosition = this.position.clone();

        while (this.currentChar !== null && isDigit(this.currentChar)) {
            result += this.currentChar;
            this.advance();
        }

        // Проверяем, что после числа идет разделитель
        if (this.currentChar !== null && 
            !isWhitespace(this.currentChar) && 
            this.currentChar !== ',' && 
            this.currentChar !== ')' && 
            this.currentChar !== null) {
            
            // Если следующий символ буква - это ошибка (например, 123ABC)
            if (isAlpha(this.currentChar)) {
                throw ErrorFactory.invalidCharacter(
                    this.position.clone(),
                    this.currentChar
                );
            }
        }

        return new Token(TokenType.INTEGER, result, this.startPosition);
    }

    makeIdentifierOrKeyword() {
        let result = '';
        this.startPosition = this.position.clone();

        while (this.currentChar !== null && 
               (isAlpha(this.currentChar) || isDigit(this.currentChar))) {
            result += this.currentChar;
            this.advance();
        }

        // Приводим к верхнему регистру для нечувствительности к регистру
        result = toFortranCase(result);

        // Проверяем, является ли ключевым словом
        if (result === 'GO') {
            return new Token(TokenType.KEYWORD_GO, result, this.startPosition);
        } else if (result === 'TO') {
            return new Token(TokenType.KEYWORD_TO, result, this.startPosition);
        } else {
            return new Token(TokenType.IDENTIFIER, result, this.startPosition);
        }
    }

    getNextToken() {
        while (this.currentChar !== null) {
            // Пропускаем пробелы
            if (isWhitespace(this.currentChar)) {
                this.skipWhitespace();
                continue;
            }

            // Числа
            if (isDigit(this.currentChar)) {
                return this.makeNumber();
            }

            // Буквы (идентификаторы или ключевые слова)
            if (isAlpha(this.currentChar)) {
                return this.makeIdentifierOrKeyword();
            }

            // Специальные символы
            this.startPosition = this.position.clone();
            let char = this.currentChar;
            
            switch (char) {
                case '(':
                    this.advance();
                    return new Token(TokenType.LEFT_PAREN, '(', this.startPosition);
                case ')':
                    this.advance();
                    return new Token(TokenType.RIGHT_PAREN, ')', this.startPosition);
                case ',':
                    this.advance();
                    return new Token(TokenType.COMMA, ',', this.startPosition);
                default:
                    throw ErrorFactory.invalidCharacter(
                        this.position.clone(),
                        char
                    );
            }
        }

        return new Token(TokenType.EOF, null, this.position.clone());
    }

    tokenize() {
        this.tokens = [];
        errorHandler.clear();

        try {
            while (true) {
                const token = this.getNextToken();
                this.tokens.push(token);
                
                if (token.type === TokenType.EOF) {
                    break;
                }
            }
        } catch (error) {
            errorHandler.addError(error);
        }

        return this.tokens;
    }

    getTokens() {
        return this.tokens.filter(token => token.type !== TokenType.EOF);
    }

    debugTokens() {
        console.log('Токены:');
        this.tokens.forEach((token, i) => {
            console.log(`${i}: ${token.toString()}`);
        });
    }
}
