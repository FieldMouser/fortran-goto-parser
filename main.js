/**
 * Основной модуль приложения с поддержкой файлов
 */

// Глобальные переменные
let currentResults = [];

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
    currentResults = [];
    let hasErrors = false;
    
    outputElement.innerHTML = '';
    fileHandler.clear(); // Очищаем предыдущие данные
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // Пропускаем пустые строки
        if (!trimmedLine) {
            return;
        }
        
        // Определяем, является ли строка комментарием
        const isComment = trimmedLine.charAt(0).toUpperCase() === 'C';
        
        if (isComment) {
            currentResults.push({
                line: lineNumber,
                input: trimmedLine,
                isComment: true,
                result: { success: true, type: 'comment' }
            });
            
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
        
        // Сохраняем результат для файла
        currentResults.push({
            line: lineNumber,
            input: trimmedLine,
            isComment: false,
            result: result
        });
        
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
    });
    
    // Обновляем статистику и сохраняем результаты
    fileHandler.allResults = currentResults;
    fileHandler.updateStatistics(currentResults);
    
    // Показываем информацию о количестве строк
    const outputInfo = document.getElementById('outputInfo');
    if (outputInfo) {
        const successful = currentResults.filter(r => r.result.success && !r.isComment).length;
        const totalProcessed = currentResults.filter(r => !r.isComment).length;
        const comments = currentResults.filter(r => r.isComment).length;
        
        outputInfo.innerHTML = `
            Обработано ${totalProcessed} строк (${successful} успешно, 
            ${totalProcessed - successful} с ошибками${comments ? `, ${comments} комментариев` : ''})
        `;
    }
}

function loadFile() {
    fileHandler.loadFile()
        .then(() => {
            console.log('Файл успешно загружен');
        })
        .catch(error => {
            console.error('Ошибка при загрузке файла:', error);
            fileHandler.showNotification(`Ошибка: ${error.message}`, 'error');
        });
}

function saveOutputAsFile() {
    fileHandler.saveOutputAsFile();
}

function saveAllResultsAsFile() {
    fileHandler.saveAllResultsAsFile();
}

function clearInput() {
    const inputElement = document.getElementById('fortranInput');
    if (inputElement) {
        inputElement.value = '';
        inputElement.focus();
    }
}

function loadSample() {
    const sampleCode = `C Пример программы Fortran с операторами GO TO
C Этот файл содержит различные типы переходов
      
      PROGRAM EXAMPLE
      INTEGER I, J, K
      ASSIGN 100 TO K
      
C Безусловный переход
      GO TO 100
      
C Другой безусловный переход
      go to 200
      
C Вычисляемый GO TO
      GO TO (10, 20, 30), I
      
C Еще один вычисляемый GO TO
      GO TO (100, 200), 2
      
C Назначенный GO TO
      GO TO K
      
C Пример с ошибкой - пропущено TO
      GO 100
      
C Пример с ошибкой - пропущена запятая
      GO TO (10, 20 30), I
      
  10  CONTINUE
  20  CONTINUE
  30  CONTINUE
 100  CONTINUE
 200  CONTINUE
      END PROGRAM EXAMPLE`;
    
    const inputElement = document.getElementById('fortranInput');
    if (inputElement) {
        inputElement.value = sampleCode;
        fileHandler.lastFileName = 'example_fortran';
        
        const outputInfo = document.getElementById('outputInfo');
        if (outputInfo) {
            outputInfo.innerHTML = '<strong>Загружен пример программы Fortran</strong>';
        }
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
        
        // Сохраняем результаты тестов
        const testResults = results.map((test, index) => ({
            line: index + 1,
            input: testSuite.tests[index].input,
            isComment: false,
            result: test.result
        }));
        
        fileHandler.allResults = testResults;
        fileHandler.updateStatistics(testResults);
    }, 100);
}

function clearOutput() {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.innerHTML = '';
        fileHandler.clear();
        
        const outputInfo = document.getElementById('outputInfo');
        if (outputInfo) {
            outputInfo.innerHTML = '';
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fortran GO TO Parser с поддержкой файлов загружен');
    
    // Добавляем обработчики клавиш
    const inputElement = document.getElementById('fortranInput');
    if (inputElement) {
        inputElement.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                parseInput();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveOutputAsFile();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                saveAllResultsAsFile();
            }
        });
    }
    
    // Добавляем обработчик для выбора файла
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                // Автоматически загружаем файл при выборе
                setTimeout(loadFile, 100);
            }
        });
    }
    
    // Запускаем парсинг начального примера
    setTimeout(() => {
        loadSample();
        setTimeout(parseInput, 1000);
    }, 500);
    
    // Добавляем информацию о горячих клавишах
    const hotkeysInfo = `
        <div style="margin-top: 20px; padding: 10px; background: #f0f4f8; border-radius: 6px; font-size: 0.9em;">
            <strong>Горячие клавиши:</strong><br>
            • Ctrl+Enter - Разобрать код<br>
            • Ctrl+S - Сохранить результат в файл<br>
            • Ctrl+Shift+S - Сохранить все результаты<br>
            • Ctrl+O - Выбрать файл (стандартная комбинация браузера)
        </div>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertAdjacentHTML('beforeend', hotkeysInfo);
    }
});

// Экспортируем функции для глобального использования
window.parseInput = parseInput;
window.loadFile = loadFile;
window.saveOutputAsFile = saveOutputAsFile;
window.saveAllResultsAsFile = saveAllResultsAsFile;
window.clearInput = clearInput;
window.loadSample = loadSample;
window.runTests = runTests;
window.clearOutput = clearOutput;
