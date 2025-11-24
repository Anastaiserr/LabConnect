// js/student-dashboard.js
// Функциональность личного кабинета студента

let currentFilter = 'active';

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ student-dashboard.js загружен');
    initStudentDashboard();
});

async function initStudentDashboard() {
    console.log('🎯 Инициализация личного кабинета студента');
    
    // Инициализация вкладок
    initTabs();
    
    // Загрузка данных студента
    await loadStudentData();
    
    // Загрузка лабораторных работ
    await loadStudentLabs();
    
    // Загрузка курсов студента
    await loadStudentCourses();
    
    // Инициализация календаря
    initCalendar();
    
    // Инициализация модальных окон
    initModals();
    
    console.log('✅ Личный кабинет студента инициализирован');
}

function initTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Убрать активный класс со всех ссылок и вкладок
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Добавить активный класс к текущей ссылке
            this.classList.add('active');
            
            // Показать соответствующую вкладку
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Загрузить данные для вкладки при необходимости
            loadTabData(tabId);
        });
    });
}

function loadTabData(tabId) {
    console.log('📂 Загрузка данных для вкладки:', tabId);
    
    switch(tabId) {
        case 'my-courses':
            loadStudentCourses();
            break;
        case 'labs':
            loadStudentLabs();
            break;
        case 'calendar':
            initCalendar();
            break;
        case 'profile':
            // Уже загружено при инициализации
            break;
    }
}

async function loadStudentData() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Данные студента загружены:', data.user);
            
            if (data.user) {
                document.getElementById('student-name').textContent = data.user.firstName + ' ' + data.user.lastName;
                document.getElementById('user-group').textContent = 'Группа: ' + (data.user.group || 'Не указана');
                
                // Обновляем данные в профиле
                document.getElementById('profile-firstname').textContent = data.user.firstName;
                document.getElementById('profile-lastname').textContent = data.user.lastName;
                document.getElementById('profile-email').textContent = data.user.email;
                document.getElementById('profile-group').textContent = data.user.group || 'Не указана';
                document.getElementById('profile-faculty').textContent = data.user.faculty || 'Не указан';
            }
        } else {
            console.error('❌ Ошибка загрузки данных пользователя');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных студента:', error);
        window.location.href = 'login.html';
    }
}

// Загрузка курсов студента
async function loadStudentCourses() {
    try {
        const container = document.getElementById('student-courses-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Загрузка курсов...</div>';
        
        const response = await fetch('/api/student/courses', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Получены курсы студента:', result.courses);
            displayStudentCourses(result.courses || []);
        } else {
            throw new Error('Ошибка загрузки курсов');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки курсов студента:', error);
        const container = document.getElementById('student-courses-list');
        if (container) {
            container.innerHTML = '<div class="error-message">Ошибка загрузки курсов</div>';
        }
    }
}

// Отображение курсов студента
function displayStudentCourses(courses) {
    const container = document.getElementById('student-courses-list');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>Вы еще не записаны ни на один курс</p>
                <p><a href="student-courses.html" class="btn btn-primary">Найти курсы</a></p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-card enrolled" data-course-id="${course.id}">
            <div class="course-header">
                <h4 class="course-title">${course.name}</h4>
                <span class="enrollment-status">Записан</span>
            </div>
            <div class="course-meta">
                <span><strong>Дисциплина:</strong> ${course.discipline}</span>
                <span><strong>Преподаватель:</strong> ${course.teacher_first_name} ${course.teacher_last_name}</span>
                ${course.description ? `<span><strong>Описание:</strong> ${course.description}</span>` : ''}
            </div>
            <div class="course-actions">
                <button class="btn btn-primary btn-sm open-course" data-course-id="${course.id}">
                    Открыть курс
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.open-course').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            openCourseDetails(courseId);
        });
    });
}

// Загрузка лабораторных работ студента
async function loadStudentLabs() {
    try {
        const container = document.getElementById('labs-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Загрузка лабораторных работ...</div>';
        
        // Загружаем сданные работы студента
        const submissionsResponse = await fetch('/api/student/submissions', {
            credentials: 'include'
        });
        
        let submissions = [];
        if (submissionsResponse.ok) {
            const submissionsResult = await submissionsResponse.json();
            submissions = submissionsResult.submissions || [];
        }
        
        // Загружаем курсы студента
        const coursesResponse = await fetch('/api/student/courses', {
            credentials: 'include'
        });
        
        if (coursesResponse.ok) {
            const coursesResult = await coursesResponse.json();
            const courses = coursesResult.courses || [];
            
            // Для каждого курса загружаем лабораторные работы
            let allLabs = [];
            
            for (const course of courses) {
                const labsResponse = await fetch(`/api/courses/${course.id}/labs`, {
                    credentials: 'include'
                });
                
                if (labsResponse.ok) {
                    const labsResult = await labsResponse.json();
                    const labs = labsResult.labs || [];
                    
                    // Объединяем лабораторные работы с информацией о сдаче
                    const labsWithSubmission = labs.map(lab => {
                        const submission = submissions.find(s => s.lab_id == lab.id);
                        return {
                            ...lab,
                            course_name: course.name,
                            course_id: course.id,
                            submission: submission || null
                        };
                    });
                    
                    allLabs = allLabs.concat(labsWithSubmission);
                }
            }
            
            displayStudentLabs(allLabs);
        } else {
            throw new Error('Ошибка загрузки курсов');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки лабораторных работ:', error);
        const container = document.getElementById('labs-container');
        if (container) {
            container.innerHTML = '<div class="error-message">Ошибка загрузки лабораторных работ</div>';
        }
    }
}

// Функция для отображения лабораторных работ с фильтрами
function displayStudentLabs(labs) {
    const container = document.getElementById('labs-container');
    if (!container) return;
    
    // Фильтруем работы по выбранному статусу
    let filteredLabs = labs;
    
    switch(currentFilter) {
        case 'active':
            filteredLabs = labs.filter(lab => {
                const status = getLabStatus(lab);
                return (status === 'active' || status === 'upcoming') && !lab.submission;
            });
            break;
        case 'completed':
            filteredLabs = labs.filter(lab => 
                lab.submission && lab.submission.status === 'checked'
            );
            break;
        case 'revision':
            filteredLabs = labs.filter(lab => 
                lab.submission && lab.submission.status === 'revision'
            );
            break;
        case 'submitted':
            filteredLabs = labs.filter(lab => 
                lab.submission && lab.submission.status === 'pending'
            );
            break;
    }
    
    if (filteredLabs.length === 0) {
        let message = '';
        switch(currentFilter) {
            case 'active':
                message = 'Нет активных лабораторных работ';
                break;
            case 'completed':
                message = 'Нет проверенных работ';
                break;
            case 'revision':
                message = 'Нет работ на доработку';
                break;
            case 'submitted':
                message = 'Нет работ на проверке';
                break;
            default:
                message = 'Нет лабораторных работ';
        }
        container.innerHTML = `<p class="no-data">${message}</p>`;
        return;
    }
    
    container.innerHTML = filteredLabs.map(lab => {
        const labStatus = getLabStatus(lab);
        const submission = lab.submission;
        
        let statusText = getLabStatusText(lab);
        let statusClass = `status-${labStatus}`;
        let buttonText = 'Приступить к выполнению';
        let buttonClass = 'btn-primary';
        let disabled = false;
        
        if (submission) {
            statusText = getSubmissionStatusText(submission.status);
            statusClass = `status-${submission.status}`;
            
            switch(submission.status) {
                case 'pending':
                    buttonText = 'Ожидает проверки';
                    buttonClass = 'btn-secondary';
                    disabled = true;
                    break;
                case 'checked':
                    buttonText = 'Посмотреть результат';
                    buttonClass = 'btn-success';
                    break;
                case 'revision':
                    buttonText = 'Отправить на доработку';
                    buttonClass = 'btn-warning';
                    break;
            }
        }
        
        return `
        <div class="task-card" data-task-id="${lab.id}">
            <div class="task-header">
                <h4 class="task-title">${lab.title}</h4>
                <span class="task-status ${statusClass}">
                    ${statusText}
                </span>
            </div>
            <div class="task-meta">
                <span>Курс: ${lab.course_name}</span>
                <span>Дедлайн: ${formatDateTime(lab.deadline)}</span>
                <span>Макс. балл: ${lab.max_score}</span>
                ${submission && submission.score !== null ? `<span>Оценка: ${submission.score}/${lab.max_score}</span>` : ''}
            </div>
            ${submission && submission.teacher_comment ? `
                <div class="task-comment">
                    <strong>Комментарий преподавателя:</strong>
                    <p>${submission.teacher_comment}</p>
                </div>
            ` : ''}
            <div class="task-actions">
                <button class="btn btn-sm ${buttonClass} start-lab-task" 
                        data-lab-id="${lab.id}" 
                        data-course-id="${lab.course_id}"
                        ${disabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        </div>
    `}).join('');
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.start-lab-task').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', function() {
                const labId = this.getAttribute('data-lab-id');
                const submission = labs.find(l => l.id == labId)?.submission;
                
                if (submission && submission.status === 'checked') {
                    viewLabResult(labId, submission);
                } else {
                    openLabWorkModal(labId);
                }
            });
        }
    });
}

// Просмотр результата лабораторной работы
function viewLabResult(labId, submission) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Результат проверки</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="result-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Оценка:</label>
                            <span class="score">${submission.score}/${submission.max_score || 10}</span>
                        </div>
                        <div class="info-item">
                            <label>Статус:</label>
                            <span class="status status-${submission.status}">${getSubmissionStatusText(submission.status)}</span>
                        </div>
                        <div class="info-item">
                            <label>Дата проверки:</label>
                            <span>${formatDateTime(submission.checked_at)}</span>
                        </div>
                    </div>
                    
                    ${submission.teacher_comment ? `
                        <div class="comment-section">
                            <h4>Комментарий преподавателя:</h4>
                            <div class="comment-content">${submission.teacher_comment}</div>
                        </div>
                    ` : ''}
                    
                    ${submission.files ? `
                        <div class="files-section">
                            <h4>Ваши файлы:</h4>
                            <div class="file-item">
                                <span class="file-icon">📎</span>
                                <span class="file-name">${submission.files}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary close-btn">Закрыть</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики событий
    modal.querySelector('.close').addEventListener('click', () => modal.remove());
    modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', function(e) {
        if (e.target === this) modal.remove();
    });
}

// Открытие деталей курса с лабораторными работами
async function openCourseDetails(courseId) {
    try {
        // Загружаем лабораторные работы курса
        const response = await fetch(`/api/courses/${courseId}/labs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            showCourseLabsModal(courseId, result.labs || []);
        } else {
            throw new Error('Ошибка загрузки лабораторных работ');
        }
    } catch (error) {
        console.error('❌ Ошибка открытия курса:', error);
        showAlert('Ошибка загрузки курса: ' + error.message, 'error');
    }
}

// Модальное окно с лабораторными работами курса
function showCourseLabsModal(courseId, labs) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Лабораторные работы курса</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="labs-list" id="course-labs-list">
                    ${labs.length === 0 ? 
                        '<div class="no-labs">Лабораторные работы пока не добавлены</div>' : 
                        labs.map(lab => `
                            <div class="lab-card" data-lab-id="${lab.id}">
                                <div class="lab-header">
                                    <h4 class="lab-title">${lab.title}</h4>
                                    <span class="lab-status status-${getLabStatus(lab)}">
                                        ${getLabStatusText(lab)}
                                    </span>
                                </div>
                                <div class="lab-meta">
                                    <span><strong>Начало:</strong> ${formatDateTime(lab.start_date)}</span>
                                    <span><strong>Дедлайн:</strong> ${formatDateTime(lab.deadline)}</span>
                                    <span><strong>Макс. балл:</strong> ${lab.max_score}</span>
                                </div>
                                <div class="lab-description">
                                    <p>${lab.description}</p>
                                </div>
                                ${lab.requirements ? `
                                    <div class="lab-requirements">
                                        <h5>Требования:</h5>
                                        <p>${lab.requirements}</p>
                                    </div>
                                ` : ''}
                                ${lab.template_code ? `
                                    <div class="lab-template">
                                        <h5>Шаблон кода:</h5>
                                        <pre><code>${lab.template_code}</code></pre>
                                    </div>
                                ` : ''}
                                <div class="lab-actions">
                                    <button class="btn btn-primary btn-sm start-lab" data-lab-id="${lab.id}">
                                        Приступить к выполнению
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики событий
    modal.querySelector('.close').addEventListener('click', () => {
        modal.remove();
    });
    
    // Обработчики для кнопок начала выполнения
    modal.querySelectorAll('.start-lab').forEach(btn => {
        btn.addEventListener('click', function() {
            const labId = this.getAttribute('data-lab-id');
            modal.remove();
            openLabWorkModal(labId);
        });
    });
    
    // Закрытие при клике вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });
}

// Модальное окно выполнения лабораторной работы
async function openLabWorkModal(labId) {
    try {
        // Загружаем информацию о лабораторной работе
        const response = await fetch(`/api/labs/${labId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки информации о лабораторной работе');
        }
        
        const result = await response.json();
        const lab = result.lab;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${lab.title}</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="lab-info-section">
                        <h4>Информация о лабораторной работе</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Дедлайн:</label>
                                <span>${formatDateTime(lab.deadline)}</span>
                            </div>
                            <div class="info-item">
                                <label>Максимальный балл:</label>
                                <span>${lab.max_score}</span>
                            </div>
                            <div class="info-item">
                                <label>Статус:</label>
                                <span class="status status-${getLabStatus(lab)}">${getLabStatusText(lab)}</span>
                            </div>
                        </div>
                        
                        <div class="lab-description">
                            <h5>Описание:</h5>
                            <p>${lab.description}</p>
                        </div>
                        
                        ${lab.requirements ? `
                            <div class="lab-requirements">
                                <h5>Требования к работе:</h5>
                                <p>${lab.requirements}</p>
                            </div>
                        ` : ''}
                        
                        ${lab.template_code ? `
                            <div class="lab-template">
                                <h5>Шаблон кода:</h5>
                                <pre><code class="language-javascript">${lab.template_code}</code></pre>
                                <button class="btn btn-secondary btn-sm copy-template" data-code="${escapeHtml(lab.template_code)}">
                                    Копировать шаблон
                                </button>
                            </div>
                        ` : ''}
                        
                        ${lab.attached_files_info && lab.attached_files_info.length > 0 ? `
                            <div class="lab-files">
                                <h5>Файлы преподавателя:</h5>
                                <div class="files-list">
                                    ${lab.attached_files_info.map(file => `
                                        <div class="file-item">
                                            <span class="file-icon">📎</span>
                                            <span class="file-name">${file.originalname}</span>
                                            <button class="btn btn-secondary btn-sm download-teacher-file" 
                                                    data-lab-id="${labId}" 
                                                    data-filename="${file.originalname}">
                                                Скачать
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <hr>
                    
                    <form id="lab-submit-form" enctype="multipart/form-data">
                        <input type="hidden" id="lab-id" value="${labId}">
                        
                        <div class="form-group">
                            <label for="lab-files">Прикрепить файлы с решением *</label>
                            <input type="file" id="lab-files" name="files" class="form-control" multiple 
                                   accept=".pdf,.doc,.docx,.zip,.rar,.txt,.cpp,.java,.py,.html,.css,.js,.php,.c,.h,.cs,.sql,.xml,.json,.jpg,.jpeg,.png,.gif">
                            <small class="form-text">Можно выбрать несколько файлов. Максимальный размер: 10MB</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="lab-code">Код решения (если требуется)</label>
                            <textarea id="lab-code" name="code" class="form-control" rows="10" 
                                      placeholder="Вставьте ваш код здесь..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="lab-comment">Комментарий к работе</label>
                            <textarea id="lab-comment" name="comment" class="form-control" rows="4" 
                                      placeholder="Опишите особенности вашего решения, возникшие проблемы..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary cancel-btn">Отмена</button>
                            <button type="submit" class="btn btn-primary">Отправить на проверку</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики событий
        const form = modal.querySelector('#lab-submit-form');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const closeBtn = modal.querySelector('.close');
        
        form.addEventListener('submit', handleLabSubmission);
        cancelBtn.addEventListener('click', () => modal.remove());
        closeBtn.addEventListener('click', () => modal.remove());
        
        // Обработчик копирования шаблона
        const copyBtn = modal.querySelector('.copy-template');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                const code = this.getAttribute('data-code');
                navigator.clipboard.writeText(code).then(() => {
                    showAlert('Шаблон скопирован в буфер обмена', 'success');
                });
            });
        }
        
        // Обработчики скачивания файлов преподавателя
        modal.querySelectorAll('.download-teacher-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const labId = this.getAttribute('data-lab-id');
                const filename = this.getAttribute('data-filename');
                downloadTeacherFile(labId, filename);
            });
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                modal.remove();
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка открытия лабораторной работы:', error);
        showAlert('Ошибка загрузки лабораторной работы: ' + error.message, 'error');
    }
}

// Скачивание файла преподавателя
async function downloadTeacherFile(labId, filename) {
    try {
        const response = await fetch(`/api/labs/${labId}/files/${encodeURIComponent(filename)}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            // Создаем blob и скачиваем файл
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
    } catch (error) {
        console.error('❌ Ошибка скачивания файла преподавателя:', error);
        showAlert('Ошибка скачивания файла: ' + error.message, 'error');
    }
}

// Обработка отправки лабораторной работы
async function handleLabSubmission(e) {
    e.preventDefault();
    
    const labId = document.getElementById('lab-id').value;
    const code = document.getElementById('lab-code').value;
    const comment = document.getElementById('lab-comment').value;
    const filesInput = document.getElementById('lab-files');
    
    // Проверяем, что прикреплены файлы
    if (filesInput.files.length === 0 && !code) {
        showAlert('Пожалуйста, прикрепите файлы или введите код', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('code', code);
        formData.append('comment', comment);
        
        // Добавляем файлы
        for (let i = 0; i < filesInput.files.length; i++) {
            formData.append('files', filesInput.files[i]);
        }
        
        const response = await fetch(`/api/labs/${labId}/submit`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            
            // Закрываем модальное окно
            document.querySelector('.modal').remove();
            
            // Перезагружаем список лабораторных работ
            await loadStudentLabs();
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
    } catch (error) {
        console.error('❌ Ошибка отправки работы:', error);
        showAlert('Ошибка отправки работы: ' + error.message, 'error');
    }
}

// Инициализация календаря
function initCalendar() {
    const calendar = document.getElementById('calendar-widget');
    const currentMonthElement = document.getElementById('current-month');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (!calendar || !currentMonthElement) return;
    
    let currentDate = new Date();
    
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Обновление отображаемого месяца
        currentMonthElement.textContent = currentDate.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Генерация календаря
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        let calendarHTML = '<div class="calendar-grid">';
        
        // Заголовки дней недели
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day header">${day}</div>`;
        });
        
        // Пустые ячейки перед первым днем месяца
        for (let i = 0; i < (startingDay === 0 ? 6 : startingDay - 1); i++) {
            calendarHTML += '<div class="calendar-day other-month"></div>';
        }
        
        // Дни месяца
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const dayClass = isToday ? 'calendar-day today' : 'calendar-day';
            
            calendarHTML += `<div class="${dayClass}" data-date="${date.toISOString().split('T')[0]}">${day}`;
            
            // Здесь можно добавить события (дедлайны лабораторных работ)
            // В реальном приложении это будет загружаться с сервера
            if (day % 5 === 0) {
                calendarHTML += `<div class="calendar-event">Сдача ЛР</div>`;
            }
            
            calendarHTML += '</div>';
        }
        
        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;
        
        // Загружаем дедлайны для текущего месяца
        loadDeadlinesForMonth(year, month + 1);
    }
    
    // Загрузка дедлайнов для месяца
    async function loadDeadlinesForMonth(year, month) {
        try {
            const deadlinesList = document.getElementById('deadlines-list');
            if (!deadlinesList) return;
            
            // В реальном приложении здесь будет запрос к API
            // Сейчас используем mock данные
            const mockDeadlines = [
                { title: 'ЛР1: Основы HTML', course: 'Веб-технологии', date: `${year}-${month.toString().padStart(2, '0')}-15` },
                { title: 'ЛР2: CSS стилизация', course: 'Веб-технологии', date: `${year}-${month.toString().padStart(2, '0')}-25` },
                { title: 'ЛР1: Алгоритмы сортировки', course: 'Алгоритмы', date: `${year}-${month.toString().padStart(2, '0')}-10` }
            ];
            
            deadlinesList.innerHTML = mockDeadlines.map(deadline => `
                <div class="deadline-item">
                    <div class="deadline-title">${deadline.title}</div>
                    <div class="deadline-course">${deadline.course}</div>
                    <div class="deadline-date">${formatDate(deadline.date)}</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Ошибка загрузки дедлайнов:', error);
        }
    }
    
    // Обработчики для кнопок навигации
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Первоначальная отрисовка
    renderCalendar();
}

// Вспомогательные функции
function getLabStatus(lab) {
    if (!lab.start_date || !lab.deadline) return 'active';
    
    const now = new Date();
    const startDate = new Date(lab.start_date);
    const deadline = new Date(lab.deadline);
    
    if (now < startDate) return 'upcoming';
    if (now > deadline) return 'completed';
    return 'active';
}

function getLabStatusText(lab) {
    const status = getLabStatus(lab);
    const statusMap = {
        'active': 'Активна',
        'upcoming': 'Скоро начнется', 
        'completed': 'Завершена'
    };
    return statusMap[status] || status;
}

function getSubmissionStatusText(status) {
    const statusMap = {
        'pending': 'Ожидает проверки',
        'checked': 'Проверено',
        'revision': 'На доработку'
    };
    return statusMap[status] || status;
}

function formatDateTime(dateString) {
    if (!dateString) return 'Не указано';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    } catch (e) {
        return 'Неверная дата';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return 'Неверная дата';
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Инициализация модальных окон
function initModals() {
    // Обработчик для редактирования профиля
    const editProfileBtn = document.getElementById('edit-profile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfileModal);
    }
    
    // Обработчик для фильтра лабораторных работ
    const labsFilter = document.getElementById('labs-filter');
    if (labsFilter) {
        labsFilter.addEventListener('change', function() {
            currentFilter = this.value;
            loadStudentLabs();
        });
    }
    
    // Закрытие модальных окон при клике на крестик
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Закрытие модальных окон при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Обработчик формы редактирования профиля
    const profileEditForm = document.getElementById('profile-edit-form');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }
    
    // Обработчики для кнопок отмены
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    
    // Заполнение формы текущими данными
    document.getElementById('edit-firstname').value = document.getElementById('profile-firstname').textContent;
    document.getElementById('edit-lastname').value = document.getElementById('profile-lastname').textContent;
    document.getElementById('edit-group').value = document.getElementById('profile-group').textContent;
    document.getElementById('edit-faculty').value = document.getElementById('profile-faculty').textContent;
    
    modal.style.display = 'block';
}

function saveProfileChanges() {
    const formData = new FormData(document.getElementById('profile-edit-form'));
    
    // Обновление данных в интерфейсе
    document.getElementById('profile-firstname').textContent = formData.get('edit-firstname');
    document.getElementById('profile-lastname').textContent = formData.get('edit-lastname');
    document.getElementById('profile-group').textContent = formData.get('edit-group');
    document.getElementById('profile-faculty').textContent = formData.get('edit-faculty');
    document.getElementById('student-name').textContent = formData.get('edit-firstname') + ' ' + formData.get('edit-lastname');
    
    // Закрытие модального окна
    document.getElementById('edit-profile-modal').style.display = 'none';
    
    showAlert('Профиль успешно обновлен', 'success');
}

function showAlert(message, type = 'info') {
    console.log(`📢 Уведомление [${type}]:`, message);
    
    // Удаляем существующие уведомления
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    alert.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}