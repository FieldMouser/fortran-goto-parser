/**
 * Основной модуль приложения
 */

function parseInput() {
    const inputElement = document.getElementById('fortranInput');
    const outputElement = document.getElementById('output');
    
    if (!inputElement || !outputElement) {
        console.error('Не найдены необходимые элементы DOM');
        return;
    }
    
    const input = inputElement.value.trim();
    if (!input) {
        outputElement.innerHTML = '<div class="error">Пожалуйста, введите код Fortran для разбора</div>';
        return;
    }
    
    // Разделяем входные данные по строкам
    const lines = input.split('\n');
    let allResults = [];
    let hasErrors = false;
    
    outputElement.innerHTML = '';
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // Пропускаем пустые строки
        if (!trimmedLine) {
            return;
        }
        
        // Пропускаем комментарии
        if (trimmedLine.charAt(0).toUpperCase() === 'C') {
            outputElement.innerHTML += `
                <div class="test-result">
                    <div class="test-title">Строка ${lineNumber}: Комментарий</div>
                    <div class="test-input"><em>${escapeHTML(trimmedLine)}</em></div>
                </div>
            `;
            return;
        }
        
        outputElement.innerHTML += `
            <div class="test-result">
                <div class="test-title">Строка ${lineNumber}:</div>
                <div class="test-input"><strong>${escapeHTML(trimmedLine)}</strong></div>
            </div>
        `;
        
        errorHandler.clear();
        const result = Parser.parseString(trimmedLine);
        
        if (result.success) {
            outputElement.innerHTML += `
                <div class="success">
                    <strong>Успешно разобрано:</strong> ${result.type}
                    <div class="json-block">
                        <pre>${escapeHTML(formatJSON(result))}</pre>
                    </div>
                </div>
            `;
        } else {
            hasErrors = true;
            outputElement.innerHTML += `
                <div class="error">
                    <strong>Ошибка:</strong> ${result.error}
                    <div class="json-block">
                        <pre>${escapeHTML(formatJSON(result))}</pre>
                    </div>
                </div>
            `;
        }
        
        allResults.push({ line: lineNumber, result });
    });
    
    // Итоговая статистика
    const successful = allResults.filter(r => r.result.success).length;
    const total = allResults.length;
    
    if (total > 0) {
        outputElement.innerHTML += `
            <div class="test-summary ${hasErrors ? 'error' : 'success'}">
                <strong>Статистика разбора:</strong> ${successful}/${total} строк успешно разобрано
                (${total > 0 ? (successful/total*100).toFixed(1) : 0}%)
            </div>
        `;
    }
}

function runTests() {
    const outputElement = document.getElementById('output');
    if (!outputElement) {
        console.error('Не найден элемент вывода');
        return;
    }
    
    outputElement.innerHTML = '<h3>Запуск тестов...</h3>';
    
    // Даем время для отображения сообщения
    setTimeout(() => {
        const results = testSuite.runAllTests();
        outputElement.innerHTML = testSuite.getHTMLResults();
    }, 100);
}

function clearOutput() {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.innerHTML = '';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fortran GO TO Parser загружен');
    
    // Добавляем обработчик нажатия Enter с Ctrl
    document.getElementById('fortranInput').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            parseInput();
        }
    });
    
    // Запускаем парсинг начального примера
    setTimeout(parseInput, 500);
});
