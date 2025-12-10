/**
 * Модуль для работы с файлами в Fortran GO TO Parser
 */

class FileHandler {
    constructor() {
        this.lastFileName = null;
        this.allResults = [];
        this.statistics = {
            total: 0,
            successful: 0,
            errors: 0,
            comments: 0
        };
    }

    /**
     * Загружает файл и помещает его содержимое в textarea
     */
    loadFile() {
        return new Promise((resolve, reject) => {
            const fileInput = document.getElementById('fileInput');
            
            if (!fileInput.files.length) {
                alert('Пожалуйста, выберите файл для загрузки');
                reject(new Error('Файл не выбран'));
                return;
            }

            const file = fileInput.files[0];
            
            // Проверяем расширение файла
            if (!file.name.toLowerCase().endsWith('.txt')) {
                alert('Пожалуйста, выберите файл с расширением .txt');
                reject(new Error('Неверный формат файла'));
                return;
            }

            this.lastFileName = file.name.replace('.txt', '');
            
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    document.getElementById('fortranInput').value = content;
                    
                    // Показываем информацию о загруженном файле
                    this.showFileInfo(file);
                    
                    // Автоматически запускаем парсинг
                    setTimeout(() => {
                        parseInput();
                    }, 500);
                    
                    resolve(content);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Ошибка при чтении файла'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Сохраняет текущий вывод в файл
     */
    saveOutputAsFile() {
        const outputElement = document.getElementById('output');
        if (!outputElement || !outputElement.textContent.trim()) {
            alert('Нет данных для сохранения');
            return;
        }

        const content = outputElement.textContent;
        const fileName = this.lastFileName ? 
            `${this.lastFileName}_parsed_${this.getTimestamp()}.txt` : 
            `fortran_parser_output_${this.getTimestamp()}.txt`;
        
        this.downloadFile(content, fileName);
    }

    /**
     * Сохраняет все результаты парсинга в структурированном JSON формате
     */
    saveAllResultsAsFile() {
        if (this.allResults.length === 0) {
            alert('Нет результатов парсинга для сохранения');
            return;
        }

        const output = {
            metadata: {
                generated: new Date().toISOString(),
                totalLines: this.statistics.total,
                successful: this.statistics.successful,
                errors: this.statistics.errors,
                comments: this.statistics.comments
            },
            results: this.allResults
        };

        const content = JSON.stringify(output, null, 2);
        const fileName = this.lastFileName ? 
            `${this.lastFileName}_results_${this.getTimestamp()}.json` : 
            `fortran_parser_results_${this.getTimestamp()}.json`;
        
        this.downloadFile(content, fileName);
    }

    /**
     * Сохраняет результаты в формате CSV
     */
    saveAsCSV() {
        if (this.allResults.length === 0) {
            alert('Нет результатов парсинга для сохранения');
            return;
        }

        // Заголовки CSV
        let csvContent = 'Line Number,Input,Type,Result,Label(s),Expression,Error\n';
        
        this.allResults.forEach(result => {
            const line = result.line;
            const input = result.input ? `"${result.input.replace(/"/g, '""')}"` : '""';
            
            if (result.result.success) {
                const type = result.result.type || '';
                const label = result.result.label ? `"${result.result.label}"` : '""';
                const labels = result.result.labels ? `"${result.result.labels.join(',')}"` : '""';
                const expression = result.result.expression ? `"${result.result.expression}"` : '""';
                
                csvContent += `${line},${input},${type},SUCCESS,${label},${labels},${expression},,\n`;
            } else {
                const error = result.result.error ? `"${result.result.error.replace(/"/g, '""')}"` : '""';
                const expected = result.result.expected ? `"${result.result.expected}"` : '""';
                const found = result.result.found ? `"${result.result.found}"` : '""';
                
                csvContent += `${line},${input},,ERROR,,,,${error}\n`;
            }
        });

        const fileName = this.lastFileName ? 
            `${this.lastFileName}_results_${this.getTimestamp()}.csv` : 
            `fortran_parser_results_${this.getTimestamp()}.csv`;
        
        this.downloadFile(csvContent, fileName);
    }

    /**
     * Сохраняет сырые данные для отладки
     */
    saveRawData() {
        const inputElement = document.getElementById('fortranInput');
        const outputElement = document.getElementById('output');
        
        if (!inputElement.value.trim()) {
            alert('Нет данных для сохранения');
            return;
        }

        const rawData = {
            input: inputElement.value,
            output: outputElement.innerHTML,
            timestamp: new Date().toISOString(),
            statistics: this.statistics
        };

        const content = JSON.stringify(rawData, null, 2);
        const fileName = this.lastFileName ? 
            `${this.lastFileName}_raw_${this.getTimestamp()}.json` : 
            `fortran_parser_raw_${this.getTimestamp()}.json`;
        
        this.downloadFile(content, fileName);
    }

    /**
     * Создает и скачивает файл
     */
    downloadFile(content, fileName) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        this.showNotification(`Файл "${fileName}" успешно сохранен`);
    }

    /**
     * Показывает информацию о загруженном файле
     */
    showFileInfo(file) {
        const fileSize = (file.size / 1024).toFixed(2);
        const lastModified = new Date(file.lastModified).toLocaleString();
        
        const infoElement = document.getElementById('outputInfo');
        if (infoElement) {
            infoElement.innerHTML = `
                <strong>Файл:</strong> ${file.name} 
                (${fileSize} KB, изменен: ${lastModified})
            `;
        }
    }

    /**
     * Показывает уведомление
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#38a169' : '#e53e3e'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Обновляет статистику парсинга
     */
    updateStatistics(results) {
        this.statistics = {
            total: results.length,
            successful: results.filter(r => r.result.success).length,
            errors: results.filter(r => !r.result.success && r.result.error).length,
            comments: results.filter(r => r.isComment).length
        };
        
        this.displayStatistics();
    }

    /**
     * Отображает статистику в интерфейсе
     */
    displayStatistics() {
        const stats = this.statistics;
        const processed = stats.total - stats.comments;
        const successRate = processed > 0 ? (stats.successful / processed * 100).toFixed(1) : 0;
        
        const statsHTML = `
            <div class="statistics">
                <div class="stat-card">
                    <div class="stat-label">Всего строк</div>
                    <div class="stat-value">${stats.total}</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-label">Успешно</div>
                    <div class="stat-value">${stats.successful}</div>
                </div>
                <div class="stat-card error">
                    <div class="stat-label">Ошибки</div>
                    <div class="stat-value">${stats.errors}</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-label">Успешность</div>
                    <div class="stat-value">${successRate}%</div>
                </div>
            </div>
            
            <div class="download-links">
                <h4>Скачать результаты:</h4>
                <a href="#" class="link-button" onclick="fileHandler.saveOutputAsFile()">
                    📄 Текстовый формат (.txt)
                </a>
                <a href="#" class="link-button" onclick="fileHandler.saveAllResultsAsFile()">
                    📊 Полные результаты (.json)
                </a>
                <a href="#" class="link-button" onclick="fileHandler.saveAsCSV()">
                    📈 Таблица (.csv)
                </a>
                <a href="#" class="link-button" onclick="fileHandler.saveRawData()">
                    🔧 Отладочные данные (.json)
                </a>
            </div>
        `;
        
        const outputElement = document.getElementById('output');
        if (outputElement) {
            const existingStats = outputElement.querySelector('.statistics, .download-links');
            if (existingStats) {
                existingStats.remove();
            }
            
            if (stats.total > 0) {
                outputElement.insertAdjacentHTML('beforeend', statsHTML);
            }
        }
    }

    /**
     * Генерирует временную метку для имени файла
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, 19);
    }

    /**
     * Экспортирует данные для внешнего использования
     */
    exportData() {
        return {
            results: this.allResults,
            statistics: this.statistics,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Импортирует данные
     */
    importData(data) {
        if (data.results) {
            this.allResults = data.results;
        }
        if (data.statistics) {
            this.statistics = data.statistics;
        }
        
        this.displayStatistics();
    }

    /**
     * Очищает все данные
     */
    clear() {
        this.allResults = [];
        this.statistics = {
            total: 0,
            successful: 0,
            errors: 0,
            comments: 0
        };
        this.lastFileName = null;
        
        const outputElement = document.getElementById('output');
        if (outputElement) {
            const stats = outputElement.querySelector('.statistics, .download-links');
            if (stats) {
                stats.remove();
            }
        }
    }
}

// Создаем глобальный экземпляр обработчика файлов
const fileHandler = new FileHandler();

// Добавляем CSS анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification.success {
        background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
    }
    
    .notification.error {
        background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    }
`;
document.head.appendChild(style);
