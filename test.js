/**
 * Тестовые примеры для парсера Fortran GO TO
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    addTest(name, input, expectedType = null, shouldFail = false) {
        this.tests.push({
            name,
            input,
            expectedType,
            shouldFail
        });
    }

    runAllTests() {
        this.results = [];
        console.log('Запуск тестов...');
        
        for (const test of this.tests) {
            console.log(`\nТест: ${test.name}`);
            console.log(`Ввод: "${test.input}"`);
            
            errorHandler.clear();
            const result = Parser.parseString(test.input);
            
            if (test.shouldFail) {
                if (result.success === false) {
                    this.results.push({
                        name: test.name,
                        passed: true,
                        result
                    });
                    console.log('✓ Ожидаемая ошибка обнаружена');
                } else {
                    this.results.push({
                        name: test.name,
                        passed: false,
                        result
                    });
                    console.log('✗ Ожидалась ошибка, но парсинг прошел успешно');
                }
            } else {
                if (result.success === true && result.type === test.expectedType) {
                    this.results.push({
                        name: test.name,
                        passed: true,
                        result
                    });
                    console.log(`✓ Успешно, тип: ${result.type}`);
                } else {
                    this.results.push({
                        name: test.name,
                        passed: false,
                        result
                    });
                    console.log(`✗ Ошибка: ${result.error || 'Неожиданный результат'}`);
                }
            }
        }
        
        this.displayResults();
        return this.results;
    }

    displayResults() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`\n=== ИТОГИ ТЕСТОВ ===`);
        console.log(`Пройдено: ${passed}/${total}`);
        console.log(`Успешно: ${(passed/total*100).toFixed(1)}%`);
        
        this.results.forEach((test, index) => {
            const status = test.passed ? '✓' : '✗';
            console.log(`${status} ${test.name}`);
        });
    }

    getHTMLResults() {
        let html = '<div class="test-results">';
        html += '<h3>Результаты тестирования</h3>';
        
        this.results.forEach((test, index) => {
            html += `<div class="test-result ${test.passed ? 'success' : 'error'}">`;
            html += `<div class="test-title">${test.passed ? '✓' : '✗'} ${test.name}</div>`;
            html += `<div class="test-input"><strong>Ввод:</strong> ${escapeHTML(test.input)}</div>`;
            
            if (test.result.success) {
                html += `<div class="json-block"><pre>${escapeHTML(formatJSON(test.result))}</pre></div>`;
            } else {
                html += `<div class="json-block"><pre>${escapeHTML(formatJSON(test.result))}</pre></div>`;
            }
            
            html += '</div>';
        });
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const percentage = total > 0 ? (passed/total*100).toFixed(1) : 0;
        
        html += `<div class="test-summary ${passed === total ? 'success' : 'error'}">`;
        html += `<strong>Итоги:</strong> ${passed}/${total} тестов пройдено (${percentage}%)`;
        html += '</div>';
        html += '</div>';
        
        return html;
    }
}

function createTestSuite() {
    const testRunner = new TestRunner();
    
    // Корректные операторы
    testRunner.addTest('Безусловный переход (верхний регистр)', 'GO TO 100', 'unconditional');
    testRunner.addTest('Безусловный переход (нижний регистр)', 'go to 200', 'unconditional');
    testRunner.addTest('Безусловный переход (смешанный регистр)', 'Go To 300', 'unconditional');
    testRunner.addTest('Вычисляемый GO TO с переменной', 'GO TO (10, 20, 30), I', 'computed');
    testRunner.addTest('Вычисляемый GO TO с числом', 'GO TO (100, 200), 2', 'computed');
    testRunner.addTest('Назначенный GO TO', 'GO TO VAR', 'assigned');
    testRunner.addTest('Назначенный GO TO с длинным именем', 'GO TO VAR123', 'assigned');
    testRunner.addTest('Вычисляемый GO TO с одной меткой', 'GO TO (100), X', 'computed');
    testRunner.addTest('Вычисляемый GO TO с пробелами', 'GO TO ( 10 , 20 , 30 ), I', 'computed');
    
    // Операторы с ошибками
    testRunner.addTest('Пропущено TO', 'GO 100', null, true);
    testRunner.addTest('Пропущена запятая в списке', 'GO TO (10, 20 30), I', null, true);
    testRunner.addTest('Пропущена запятая перед выражением', 'GO TO (10, 20, 30) I', null, true);
    testRunner.addTest('Отсутствует метка', 'GO TO', null, true);
    testRunner.addTest('Метка 0 недопустима', 'GO TO 0', null, true);
    testRunner.addTest('Неправильный формат метки', 'GO TO 123ABC', null, true);
    testRunner.addTest('Лишние символы в конце', 'GO TO 100 EXTRA', null, true);
    testRunner.addTest('Недопустимый символ', 'GO TO #100', null, true);
    testRunner.addTest('Пустой список меток', 'GO TO (), I', null, true);
    testRunner.addTest('Запятая без метки', 'GO TO (10, ,20), I', null, true);
    testRunner.addTest('Незакрытая скобка', 'GO TO (10, 20, 30, I', null, true);
    testRunner.addTest('Неверный идентификатор', 'GO TO 123VAR', null, true);
    
    return testRunner;
}

// Экспорт для использования в основном модуле
const testSuite = createTestSuite();
