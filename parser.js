/**
 * Синтаксический анализатор (парсер) для Fortran GO TO операторов
 */

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentTokenIndex = 0;
        this.currentToken = null;
        this.result = null;
        this.advance();
    }

    advance() {
        if (this.currentTokenIndex < this.tokens.length) {
            this.currentToken = this.tokens[this.currentTokenIndex];
            this.currentTokenIndex++;
        } else {
            this.currentToken = null;
        }
    }

    peek() {
        if (this.currentTokenIndex < this.tokens.length) {
            return this.tokens[this.currentTokenIndex];
        }
        return null;
    }

    match(tokenType) {
        return this.currentToken && this.currentToken.type === tokenType;
    }

    consume(tokenType, errorMessage = null) {
        if (this.match(tokenType)) {
            const token = this.currentToken;
            this.advance();
            return token;
        } else {
            throw ErrorFactory.unexpectedToken(
                this.currentToken ? this.currentToken.position.clone() : new Position(),
                tokenType,
                this.currentToken ? this.currentToken.type : 'EOF'
            );
        }
    }

    parse() {
        try {
            // Начинаем с GO
            this.consume(TokenType.KEYWORD_GO, 'Ожидалось ключевое слово GO');
            
            // Затем TO
            this.consume(TokenType.KEYWORD_TO, 'Ожидалось ключевое слово TO после GO');
            
            // Определяем тип оператора GO TO
            if (this.match(TokenType.LEFT_PAREN)) {
                return this.parseComputedGoto();
            } else if (this.match(TokenType.INTEGER)) {
                return this.parseUnconditionalGoto();
            } else if (this.match(TokenType.IDENTIFIER)) {
                return this.parseAssignedGoto();
            } else {
                throw ErrorFactory.unexpectedToken(
                    this.currentToken ? this.currentToken.position.clone() : new Position(),
                    'INTEGER, IDENTIFIER или (',
                    this.currentToken ? this.currentToken.type : 'EOF'
                );
            }
        } catch (error) {
            errorHandler.addError(error);
            return null;
        }
    }

    parseUnconditionalGoto() {
        const startPos = this.currentToken.position.clone();
        const labelToken = this.consume(TokenType.INTEGER);
        
        // Валидация метки
        if (!isValidLabel(labelToken.value)) {
            throw ErrorFactory.invalidLabel(labelToken.position, labelToken.value);
        }
        
        // Проверяем, что нет лишних токенов
        if (this.currentToken && this.currentToken.type !== TokenType.EOF) {
            throw ErrorFactory.unexpectedToken(
                this.currentToken.position.clone(),
                'конец оператора',
                this.currentToken.type
            );
        }
        
        return {
            type: 'unconditional',
            label: labelToken.value,
            line: startPos.line,
            column: startPos.column,
            success: true
        };
    }

    parseComputedGoto() {
        const startPos = this.currentToken.position.clone();
        
        // Открывающая скобка
        this.consume(TokenType.LEFT_PAREN);
        
        // Список меток
        const labels = this.parseLabelList();
        
        // Закрывающая скобка
        this.consume(TokenType.RIGHT_PAREN);
        
        // Запятая перед выражением
        this.consume(TokenType.COMMA, 'Ожидалась запятая после списка меток');
        
        // Выражение (метка или идентификатор)
        if (!this.match(TokenType.INTEGER) && !this.match(TokenType.IDENTIFIER)) {
            throw ErrorFactory.missingExpression(
                this.currentToken ? this.currentToken.position.clone() : new Position()
            );
        }
        
        const expressionToken = this.currentToken;
        this.advance();
        
        // Проверяем, что нет лишних токенов
        if (this.currentToken && this.currentToken.type !== TokenType.EOF) {
            throw ErrorFactory.unexpectedToken(
                this.currentToken.position.clone(),
                'конец оператора',
                this.currentToken.type
            );
        }
        
        return {
            type: 'computed',
            labels: labels,
            expression: expressionToken.value,
            line: startPos.line,
            column: startPos.column,
            success: true
        };
    }

    parseLabelList() {
        const labels = [];
        
        // Первая метка обязательна
        if (!this.match(TokenType.INTEGER)) {
            throw ErrorFactory.unexpectedToken(
                this.currentToken.position.clone(),
                'метка (целое число)',
                this.currentToken.type
            );
        }
        
        let labelToken = this.consume(TokenType.INTEGER);
        if (!isValidLabel(labelToken.value)) {
            throw ErrorFactory.invalidLabel(labelToken.position, labelToken.value);
        }
        labels.push(labelToken.value);
        
        // Дополнительные метки через запятую
        while (this.match(TokenType.COMMA)) {
            this.advance(); // Пропускаем запятую
            
            if (!this.match(TokenType.INTEGER)) {
                throw ErrorFactory.unexpectedToken(
                    this.currentToken.position.clone(),
                    'метка после запятой',
                    this.currentToken.type
                );
            }
            
            labelToken = this.consume(TokenType.INTEGER);
            if (!isValidLabel(labelToken.value)) {
                throw ErrorFactory.invalidLabel(labelToken.position, labelToken.value);
            }
            labels.push(labelToken.value);
        }
        
        return labels;
    }

    parseAssignedGoto() {
        const startPos = this.currentToken.position.clone();
        const identifierToken = this.consume(TokenType.IDENTIFIER);
        
        // Проверяем, что идентификатор валидный
        if (!isValidIdentifier(identifierToken.value)) {
            throw new SemanticError(
                `Недопустимый идентификатор: ${identifierToken.value}`,
                identifierToken.position,
                { identifier: identifierToken.value }
            );
        }
        
        // Проверяем, что нет лишних токенов
        if (this.currentToken && this.currentToken.type !== TokenType.EOF) {
            throw ErrorFactory.unexpectedToken(
                this.currentToken.position.clone(),
                'конец оператора',
                this.currentToken.type
            );
        }
        
        return {
            type: 'assigned',
            expression: identifierToken.value,
            line: startPos.line,
            column: startPos.column,
            success: true
        };
    }

    static parseString(input) {
        const lexer = new Lexer(input);
        const tokens = lexer.tokenize();
        
        if (errorHandler.hasErrors()) {
            return errorHandler.getLastError();
        }
        
        const parser = new Parser(tokens);
        const result = parser.parse();
        
        if (result) {
            return result;
        } else if (errorHandler.hasErrors()) {
            return errorHandler.getLastError();
        } else {
            return {
                error: 'Неизвестная ошибка при разборе',
                line: 1,
                column: 1,
                success: false
            };
        }
    }
}
