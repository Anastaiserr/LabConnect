// js/teacher-dashboard.js
// Функциональность личного кабинета преподавателя

let currentCourseId = null;
let currentLabId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ teacher-dashboard.js загружен');
    initTeacherDashboard();
});

async function initTeacherDashboard() {
    console.log('🎯 Инициализация личного кабинета преподавателя');
    
    // Инициализация вкладок
    initTeacherTabs();
    
    // Инициализация модальных окон
    initTeacherModals();
    
    // Загрузка данных преподавателя
    await loadTeacherData();
    
    // Загружаем курсы если активна соответствующая вкладка
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'disciplines') {
        console.log('📚 Загружаем курсы...');
        await loadTeacherCourses();
    }
    
    console.log('✅ Личный кабинет преподавателя инициализирован');
}

function initTeacherTabs() {
    console.log('🔧 Инициализация вкладок');
    
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const tabId = this.getAttribute('data-tab');
            console.log('🔄 Переключение на вкладку:', tabId);
            
            // Убрать активный класс со всех ссылок и вкладок
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Добавить активный класс к текущей ссылке
            this.classList.add('active');
            
            // Показать соответствующую вкладку
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Загрузить данные для вкладки
            loadTeacherTabData(tabId);
        });
    });
}

function initTeacherModals() {
    console.log('🔧 Инициализация модальных окон');
    
    // 1. Кнопка создания курса
    const createCourseBtn = document.getElementById('create-course-btn');
    if (createCourseBtn) {
        createCourseBtn.addEventListener('click', function() {
            console.log('🎯 Кнопка создания курса нажата');
            document.getElementById('create-course-modal').style.display = 'block';
        });
    }
    
    // 2. Форма создания курса
    const courseCreateForm = document.getElementById('course-create-form');
    if (courseCreateForm) {
        courseCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Форма создания курса отправлена');
            createNewCourse();
        });
    }
    
    // 3. Кнопка создания лабораторной работы
    const createLabBtn = document.getElementById('create-lab-btn');
    if (createLabBtn) {
        createLabBtn.addEventListener('click', function() {
            console.log('🎯 Кнопка создания лабораторной работы нажата');
            openCreateLabModal();
        });
    }
    
    // 4. Форма создания лабораторной работы
    const labCreateForm = document.getElementById('lab-create-form');
    if (labCreateForm) {
        labCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Форма создания лабораторной работы отправлена');
            createNewLab();
        });
    }
    
    // 5. Форма редактирования лабораторной работы
    const labEditForm = document.getElementById('lab-edit-form');
    if (labEditForm) {
        labEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Форма редактирования лабораторной работы отправлена');
            updateLab();
        });
    }
    
    // 6. Поиск студентов
    const searchStudentBtn = document.getElementById('search-student-btn');
    if (searchStudentBtn) {
        searchStudentBtn.addEventListener('click', function() {
            searchStudents();
        });
    }
    
    const studentSearchInput = document.getElementById('student-search');
    if (studentSearchInput) {
        studentSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchStudents();
            }
        });
    }
    
    // 7. Инициализация вкладок в модальном окне управления курсом
    initCourseManagementTabs();

    // 8. Форма оценки работы
    initGradingForm();
    
    // Закрытие модальных окон
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                // Очищаем результаты поиска при закрытии
                if (modal.id === 'manage-course-modal') {
                    clearStudentSearch();
                }
            }
        });
    });
    
    // Закрытие при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            // Очищаем результаты поиска при закрытии
            clearStudentSearch();
        }
    });
    
    console.log('✅ Модальные окна инициализированы');
}

function initCourseManagementTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.course-management-tabs .tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убрать активный класс со всех кнопок и вкладок
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Добавить активный класс к текущей кнопке
            this.classList.add('active');
            
            // Показать соответствующую вкладку
            document.getElementById(tabId + '-tab').classList.add('active');
            
            // Загрузить данные для вкладки
            if (tabId === 'labs' && currentCourseId) {
                loadCourseLabs(currentCourseId);
            } else if (tabId === 'students' && currentCourseId) {
                loadCourseStudents(currentCourseId);
            }
        });
    });
}

async function loadTeacherTabData(tabId) {
    console.log('📂 Загрузка данных для вкладки:', tabId);
    
    switch(tabId) {
        case 'disciplines':
            await loadTeacherCourses();
            break;
        case 'check-works':
            await loadWorksToCheck();
            break;
        case 'statements':
            loadStatementData();
            break;
        case 'settings':
            loadSettingsData();
            break;
        case 'chat':
            loadTeacherChats();
            break;
    }
}

async function loadTeacherData() {
    try {
        console.log('👤 Загрузка данных преподавателя...');
        const response = await fetch('/api/user', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Данные преподавателя загружены:', data.user);
            
            // Обновляем данные на странице
            if (data.user) {
                document.getElementById('teacher-name').textContent = data.user.firstName + ' ' + data.user.lastName;
                document.getElementById('teacher-department').textContent = 'Кафедра: ' + (data.user.department || 'Не указана');
                
                // Обновляем данные в профиле
                document.getElementById('teacher-firstname').textContent = data.user.firstName;
                document.getElementById('teacher-lastname').textContent = data.user.lastName;
                document.getElementById('teacher-email').textContent = data.user.email;
                document.getElementById('teacher-department-detail').textContent = data.user.department || 'Не указана';
                document.getElementById('teacher-position').textContent = data.user.position || 'Не указана';
            }
        } else {
            console.error('❌ Ошибка загрузки данных пользователя');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных преподавателя:', error);
    }
}

// Загрузка курсов преподавателя
async function loadTeacherCourses() {
    try {
        const coursesList = document.getElementById('courses-list');
        
        console.log('🔄 Загрузка курсов преподавателя...');
        
        if (!coursesList) {
            console.error('❌ Элемент courses-list не найден');
            return;
        }
        
        // Показываем загрузку
        coursesList.innerHTML = '<div class="loading">Загрузка курсов...</div>';
        
        const response = await fetch('/api/teacher/courses', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log('📊 Статус ответа:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Получены курсы:', result);
        
        if (result.courses && result.courses.length > 0) {
            displayTeacherCourses(result.courses);
        } else {
            coursesList.innerHTML = `
                <div class="no-courses">
                    <h4>Курсы не найдены</h4>
                    <p>У вас пока нет созданных курсов</p>
                    <p>Создайте первый курс, нажав кнопку "Создать новый курс"</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки курсов:', error);
        const coursesList = document.getElementById('courses-list');
        if (coursesList) {
            coursesList.innerHTML = `
                <div class="error-message">
                    <h4>Ошибка загрузки</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-secondary" onclick="loadTeacherCourses()">Повторить попытку</button>
                </div>
            `;
        }
    }
}

// Отображение курсов
function displayTeacherCourses(courses) {
    const container = document.getElementById('courses-list');
    
    if (!container) {
        console.error('❌ Контейнер курсов не найден');
        return;
    }
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses">
                <p>У вас пока нет созданных курсов</p>
                <p>Создайте первый курс, нажав кнопку "Создать новый курс"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-header">
                <h4 class="course-title">${course.name}</h4>
                <div class="course-actions">
                    <button class="btn btn-primary btn-sm manage-course" data-course-id="${course.id}">
                        Управление курсом
                    </button>
                </div>
            </div>
            <div class="course-meta">
                <span><strong>Дисциплина:</strong> ${course.discipline}</span>
                ${course.description ? `<span><strong>Описание:</strong> ${course.description}</span>` : ''}
                <span><strong>Создан:</strong> ${formatDate(course.created_at)}</span>
            </div>
            <div class="course-stats">
                <span>Лабораторных работ: <strong id="lab-count-${course.id}">0</strong></span>
                <span>Студентов: <strong id="student-count-${course.id}">0</strong></span>
            </div>
        </div>
    `).join('');
    
    addCourseEventHandlers();
    
    // Загружаем статистику для каждого курса
    courses.forEach(course => {
        loadCourseLabsCount(course.id);
        loadCourseStudentsCount(course.id);
    });
}

// Загрузка количества лабораторных работ для курса
async function loadCourseLabsCount(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/labs/count`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const countElement = document.getElementById(`lab-count-${courseId}`);
            if (countElement) {
                countElement.textContent = result.count || 0;
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки количества лабораторных работ:', error);
    }
}

// Функция для загрузки количества студентов
async function loadCourseStudentsCount(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/students`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const countElement = document.getElementById(`student-count-${courseId}`);
            if (countElement) {
                countElement.textContent = result.students.length || 0;
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки количества студентов:', error);
    }
}

// Обработчики событий для кнопок курсов
function addCourseEventHandlers() {
    // Кнопка "Управление"
    document.querySelectorAll('.manage-course').forEach(btn => {
        btn.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            openCourseManagement(courseId);
        });
    });
}

// Открытие управления курсом
async function openCourseManagement(courseId) {
    currentCourseId = courseId;
    
    try {
        // Загружаем информацию о курсе
        const response = await fetch(`/api/courses/${courseId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const course = result.course;
            
            // Обновляем заголовок модального окна
            document.getElementById('manage-course-title').textContent = `Управление курсом: ${course.name}`;
            
            // Показываем модальное окно
            document.getElementById('manage-course-modal').style.display = 'block';
            
            // Загружаем лабораторные работы курса
            await loadCourseLabs(courseId);
            
            // Загружаем студентов курса
            await loadCourseStudents(courseId);
            
        } else if (response.status === 403) {
            showAlert('Доступ к этому курсу запрещен', 'error');
        } else if (response.status === 404) {
            showAlert('Курс не найден', 'error');
        } else {
            throw new Error('Ошибка загрузки данных курса');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных курса:', error);
        showAlert('Ошибка загрузки данных курса: ' + error.message, 'error');
    }
}

// Загрузка лабораторных работ курса
async function loadCourseLabs(courseId) {
    try {
        const labsList = document.getElementById('course-labs-list');
        
        if (!labsList) return;
        
        labsList.innerHTML = '<div class="loading">Загрузка лабораторных работ...</div>';
        
        const response = await fetch(`/api/courses/${courseId}/labs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displayCourseLabs(result.labs || []);
        } else if (response.status === 403) {
            labsList.innerHTML = `
                <div class="error-message">
                    <p>Доступ к лабораторным работам запрещен</p>
                </div>
            `;
        } else {
            throw new Error('Ошибка загрузки лабораторных работ');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки лабораторных работ:', error);
        const labsList = document.getElementById('course-labs-list');
        if (labsList) {
            labsList.innerHTML = `
                <div class="error-message">
                    <p>Ошибка загрузки лабораторных работ: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Отображение лабораторных работ курса
// Обновите отображение лабораторных работ (уберите кнопку "Работы студентов")
function displayCourseLabs(labs) {
    const container = document.getElementById('course-labs-list');
    
    if (!container) return;
    
    if (!labs || labs.length === 0) {
        container.innerHTML = `
            <div class="no-labs">
                <p>Лабораторные работы не найдены</p>
                <p>Создайте первую лабораторную работу для этого курса</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = labs.map(lab => `
        <div class="lab-card" data-lab-id="${lab.id}">
            <div class="lab-header">
                <h4 class="lab-title">${lab.title}</h4>
                <span class="lab-status status-${getLabStatus(lab)}">
                    ${getLabStatusText(getLabStatus(lab))}
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
            <div class="lab-actions">
                <button class="btn btn-danger btn-sm delete-lab" data-lab-id="${lab.id}">
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок лабораторных работ
    addLabEventHandlers();
}

// Инициализация формы оценки
function initGradingForm() {
    const gradeForm = document.getElementById('grade-submission-form');
    if (gradeForm) {
        gradeForm.addEventListener('submit', gradeSubmission);
    }
}

// Обработчики событий для лабораторных работ
function addLabEventHandlers() {
    // Кнопка "Удалить"
    document.querySelectorAll('.delete-lab').forEach(btn => {
        btn.addEventListener('click', function() {
            const labId = this.getAttribute('data-lab-id');
            deleteLab(labId);
        });
    });
    
    // Кнопка "Работы студентов"
    document.querySelectorAll('.view-submissions').forEach(btn => {
        btn.addEventListener('click', function() {
            const labId = this.getAttribute('data-lab-id');
            showAlert('Функция просмотра работ студентов в разработке', 'info');
        });
    });
}

// Открытие модального окна редактирования лабораторной работы
async function openEditLabModal(labId) {
    currentLabId = labId;
    
    try {
        // Находим лабораторную работу в текущем списке
        const labElement = document.querySelector(`[data-lab-id="${labId}"]`);
        if (!labElement) {
            throw new Error('Лабораторная работа не найдена');
        }
        
        // Заполняем форму данными
        const labTitle = labElement.querySelector('.lab-title').textContent;
        const labDescription = labElement.querySelector('.lab-description p').textContent;
        const labMeta = labElement.querySelectorAll('.lab-meta span');
        
        let startDate = '';
        let deadline = '';
        let maxScore = '10';
        
        labMeta.forEach(meta => {
            const text = meta.textContent;
            if (text.includes('Начало:')) {
                startDate = text.replace('Начало:', '').trim();
            } else if (text.includes('Дедлайн:')) {
                deadline = text.replace('Дедлайн:', '').trim();
            } else if (text.includes('Макс. балл:')) {
                maxScore = text.replace('Макс. балл:', '').trim();
            }
        });
        
        // Заполняем форму
        document.getElementById('edit-lab-id').value = labId;
        document.getElementById('edit-lab-name').value = labTitle;
        document.getElementById('edit-lab-description').value = labDescription;
        document.getElementById('edit-lab-max-score').value = maxScore;
        
        // Преобразуем даты в формат для input[type="datetime-local"]
        if (startDate && startDate !== 'Не указано') {
            const startDateObj = new Date(startDate);
            document.getElementById('edit-lab-start-date').value = formatDateTimeLocal(startDateObj);
        }
        
        if (deadline && deadline !== 'Не указано') {
            const deadlineObj = new Date(deadline);
            document.getElementById('edit-lab-deadline').value = formatDateTimeLocal(deadlineObj);
        }
        
        // Показываем модальное окно
        document.getElementById('edit-lab-modal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Ошибка открытия редактирования:', error);
        showAlert('Ошибка загрузки данных лабораторной работы', 'error');
    }
}

// Удаление лабораторной работы
async function deleteLab(labId) {
    if (!confirm('Вы уверены, что хотите удалить эту лабораторную работу? Все связанные сдачи работ также будут удалены.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/labs/${labId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            
            // Перезагружаем список лабораторных работ
            await loadCourseLabs(currentCourseId);
            await loadCourseLabsCount(currentCourseId);
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
    } catch (error) {
        console.error('❌ Ошибка удаления лабораторной работы:', error);
        showAlert('Ошибка удаления: ' + error.message, 'error');
    }
}

// Обновление лабораторной работы
async function updateLab() {
    const form = document.getElementById('lab-edit-form');
    const labId = document.getElementById('edit-lab-id').value;
    
    const formData = new FormData(form);
    const labData = {
        title: formData.get('edit-lab-name'),
        description: formData.get('edit-lab-description'),
        template_code: formData.get('edit-lab-template') || null,
        start_date: formData.get('edit-lab-start-date'),
        deadline: formData.get('edit-lab-deadline'),
        max_score: parseInt(formData.get('edit-lab-max-score')),
        requirements: formData.get('edit-lab-requirements') || null
    };
    
    // Валидация
    if (!labData.title || !labData.description) {
        showAlert('Название и описание обязательны для заполнения', 'error');
        return;
    }
    
    // Проверка дат
    const startDate = new Date(labData.start_date);
    const deadline = new Date(labData.deadline);
    
    if (deadline <= startDate) {
        showAlert('Дедлайн должен быть позже даты начала', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/labs/${labId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(labData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка обновления лабораторной работы');
        }

        const result = await response.json();
        showAlert(result.message, 'success');
        document.getElementById('edit-lab-modal').style.display = 'none';
        
        // Перезагружаем список лабораторных работ
        await loadCourseLabs(currentCourseId);
        
    } catch (error) {
        console.error('❌ Ошибка обновления лабораторной работы:', error);
        showAlert('Ошибка обновления: ' + error.message, 'error');
    }
}

// Обновите вкладку "Студенты" в модальном окне
async function loadCourseStudents(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/students`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displayCourseStudents(result.students);
        } else if (response.status === 403) {
            const studentsTab = document.getElementById('students-tab');
            studentsTab.innerHTML = `
                <div class="error-message">
                    <p>Доступ к списку студентов запрещен</p>
                </div>
            `;
        } else {
            throw new Error('Ошибка загрузки студентов');
        }
    } catch (error) {
        console.error('Ошибка загрузки студентов:', error);
        const studentsTab = document.getElementById('students-tab');
        studentsTab.innerHTML = `
            <div class="error-message">
                <p>Ошибка загрузки студентов: ${error.message}</p>
            </div>
        `;
    }
}


// Функция для отображения студентов
function displayCourseStudents(students) {
    const container = document.getElementById('course-students-list');
    const countElement = document.getElementById('students-count');
    
    if (!container) return;
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="no-students">
                <p>На курс еще не записан ни один студент</p>
                <p>Используйте поиск выше для добавления студентов</p>
            </div>
        `;
        if (countElement) countElement.textContent = '0';
        return;
    }
    
    container.innerHTML = students.map(student => `
        <div class="student-card" data-student-id="${student.id}">
            <div class="student-info">
                <strong>${student.firstName} ${student.lastName}</strong>
                <div class="student-details">
                    <span>Группа: ${student.group || 'Не указана'}</span>
                    <span>Email: ${student.email}</span>
                    <span>Записан: ${formatDate(student.createdAt)}</span>
                </div>
            </div>
            <div class="student-actions">
                <button class="btn btn-danger btn-sm remove-student" data-student-id="${student.id}">
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
    
    if (countElement) countElement.textContent = students.length;
    
    // Добавляем обработчики для кнопок удаления студентов
    addStudentEventHandlers();
}

// Обработчики событий для студентов
function addStudentEventHandlers() {
    // Кнопка "Удалить" студента
    document.querySelectorAll('.remove-student').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            showAlert('Функция удаления студентов в разработке', 'info');
        });
    });
}

// Поиск студентов
async function searchStudents() {
    const query = document.getElementById('student-search').value.trim();
    const resultsContainer = document.getElementById('student-search-results-list');
    const resultsSection = document.getElementById('student-search-results');
    
    if (!query) {
        showAlert('Введите имя или фамилию студента для поиска', 'warning');
        return;
    }
    
    if (query.length < 2) {
        showAlert('Введите минимум 2 символа для поиска', 'warning');
        return;
    }
    
    try {
        resultsContainer.innerHTML = '<div class="loading">Поиск студентов...</div>';
        resultsSection.style.display = 'block';
        
        const response = await fetch(`/api/students/search?query=${encodeURIComponent(query)}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.students && result.students.length > 0) {
                displayStudentSearchResults(result.students);
            } else {
                resultsContainer.innerHTML = '<div class="no-results">Студенты не найдены</div>';
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка поиска');
        }
    } catch (error) {
        console.error('Ошибка поиска студентов:', error);
        resultsContainer.innerHTML = '<div class="error-message">Ошибка поиска студентов: ' + error.message + '</div>';
    }
}

// Отображение результатов поиска студентов
function displayStudentSearchResults(students) {
    const container = document.getElementById('student-search-results-list');
    
    container.innerHTML = students.map(student => {
        // Проверяем, записан ли студент уже на курс
        const isEnrolled = isStudentEnrolled(student.id);
        
        return `
        <div class="search-student-card ${isEnrolled ? 'enrolled' : ''}">
            <div class="student-info">
                <strong>${student.firstName} ${student.lastName}</strong>
                <div class="student-details">
                    <span>Группа: ${student.group || 'Не указана'}</span>
                    <span>Email: ${student.email}</span>
                    ${isEnrolled ? '<span class="enrolled-badge">Уже в курсе</span>' : ''}
                </div>
            </div>
            <div class="student-actions">
                ${isEnrolled ? 
                    '<button class="btn btn-secondary btn-sm" disabled>Уже в курсе</button>' :
                    `<button class="btn btn-primary btn-sm add-student" data-student-id="${student.id}">
                        Добавить в курс
                    </button>`
                }
            </div>
        </div>
    `}).join('');
    
    // Добавляем обработчики для кнопок добавления студентов
    document.querySelectorAll('.add-student').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-student-id');
            addStudentToCourse(studentId);
        });
    });
}

// Проверка, записан ли студент уже на курс
function isStudentEnrolled(studentId) {
    // Эта функция будет работать после загрузки студентов курса
    const currentStudents = document.querySelectorAll('.student-card');
    for (let studentCard of currentStudents) {
        if (studentCard.getAttribute('data-student-id') == studentId) {
            return true;
        }
    }
    return false;
}

// Добавление студента в курс
async function addStudentToCourse(studentId) {
    try {
        console.log('🔄 Добавление студента', studentId, 'в курс', currentCourseId);
        
        const response = await fetch(`/api/courses/${currentCourseId}/enroll-student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ studentId: parseInt(studentId) })
        });
        
        console.log('📊 Статус ответа:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            
            // Перезагружаем список студентов
            await loadCourseStudents(currentCourseId);
            await loadCourseStudentsCount(currentCourseId);
            
            // Обновляем результаты поиска (убираем добавленного студента)
            const currentQuery = document.getElementById('student-search').value.trim();
            if (currentQuery) {
                await searchStudents(); // Перезапускаем поиск
            }
            
        } else {
            const errorData = await response.json();
            console.error('❌ Ошибка ответа:', errorData);
            throw new Error(errorData.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        console.error('❌ Ошибка добавления студента:', error);
        showAlert('Ошибка добавления: ' + error.message, 'error');
    }
}

// Функция для отображения студентов курса
function displayCourseStudents(students) {
    const container = document.getElementById('course-students-list');
    const countElement = document.getElementById('students-count');
    
    if (!container) return;
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="no-students">
                <p>На курс еще не записан ни один студент</p>
                <p>Используйте поиск выше для добавления студентов</p>
            </div>
        `;
        if (countElement) countElement.textContent = '0';
        return;
    }
    
    container.innerHTML = students.map(student => `
        <div class="student-card" data-student-id="${student.id}">
            <div class="student-info">
                <strong>${student.firstName} ${student.lastName}</strong>
                <div class="student-details">
                    <span>Группа: ${student.group || 'Не указана'}</span>
                    <span>Email: ${student.email}</span>
                    <span>Записан: ${formatDate(student.createdAt || student.enrolled_at)}</span>
                </div>
            </div>
            <div class="student-actions">
                <button class="btn btn-danger btn-sm remove-student" data-student-id="${student.id}">
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
    
    if (countElement) countElement.textContent = students.length;
    
    // Добавляем обработчики для кнопок удаления студентов
    addStudentEventHandlers();
}
// Очистка результатов поиска
function clearStudentSearch() {
    document.getElementById('student-search').value = '';
    document.getElementById('student-search-results').style.display = 'none';
    document.getElementById('student-search-results-list').innerHTML = '';
}

// Функция для открытия модального окна создания лабораторной работы
function openCreateLabModal() {
    const modal = document.getElementById('create-lab-modal');
    
    if (!currentCourseId) {
        showAlert('Ошибка: курс не выбран', 'error');
        return;
    }
    
    // Устанавливаем текущую дату и время по умолчанию
    const now = new Date();
    const startDate = new Date(now.getTime() + 60 * 60 * 1000); // +1 час
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 дней
    
    document.getElementById('lab-start-date').value = formatDateTimeLocal(startDate);
    document.getElementById('lab-deadline').value = formatDateTimeLocal(deadline);
    
    modal.style.display = 'block';
}

// Функция создания новой лабораторной работы
async function createNewLab() {
    const form = document.getElementById('lab-create-form');
    if (!form) {
        console.error('❌ Форма создания лабораторной работы не найдена');
        return;
    }
    
    if (!currentCourseId) {
        showAlert('Ошибка: курс не выбран', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const labData = {
        name: formData.get('lab-name'),
        course_id: currentCourseId,
        description: formData.get('lab-description'),
        template_code: formData.get('lab-template') || null,
        start_date: formData.get('lab-start-date'),
        deadline: formData.get('lab-deadline'),
        max_score: parseInt(formData.get('lab-max-score')),
        attempts: parseInt(formData.get('lab-attempts')),
        requirements: formData.get('lab-requirements') || null
    };
    
    console.log('🔄 Создание лабораторной работы:', labData);
    
    // Валидация
    if (!labData.name || !labData.description) {
        showAlert('Название и описание обязательны для заполнения', 'error');
        return;
    }
    
    // Проверка дат
    const startDate = new Date(labData.start_date);
    const deadline = new Date(labData.deadline);
    
    if (deadline <= startDate) {
        showAlert('Дедлайн должен быть позже даты начала', 'error');
        return;
    }

    try {
        const response = await fetch('/api/labs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(labData)
        });

        console.log('📊 Статус создания лабораторной работы:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания лабораторной работы');
        }

        const result = await response.json();
        console.log('✅ Лабораторная работа создана:', result);
        
        showAlert(result.message, 'success');
        document.getElementById('create-lab-modal').style.display = 'none';
        form.reset();
        
        // Перезагружаем список лабораторных работ
        await loadCourseLabs(currentCourseId);
        await loadCourseLabsCount(currentCourseId);
        
    } catch (error) {
        console.error('❌ Ошибка создания лабораторной работы:', error);
        showAlert('Ошибка создания лабораторной работы: ' + error.message, 'error');
    }
}

// Создание нового курса
async function createNewCourse() {
    const form = document.getElementById('course-create-form');
    const formData = new FormData(form);
    
    const courseData = {
        name: formData.get('course-name'),
        description: formData.get('course-description'),
        discipline: formData.get('course-discipline'),
        password: formData.get('course-password') || null
    };
    
    console.log('🔄 Создание курса:', courseData);
    
    // Валидация
    if (!courseData.name || !courseData.discipline) {
        showAlert('Название и дисциплина обязательны для заполнения', 'error');
        return;
    }

    try {
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(courseData)
        });

        console.log('📊 Статус создания курса:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка создания курса');
        }

        const result = await response.json();
        console.log('✅ Курс создан:', result);
        
        showAlert(result.message, 'success');
        document.getElementById('create-course-modal').style.display = 'none';
        form.reset();
        
        // Перезагружаем список курсов
        await loadTeacherCourses();
        
    } catch (error) {
        console.error('❌ Ошибка создания курса:', error);
        showAlert('Ошибка создания курса: ' + error.message, 'error');
    }
}

// Вспомогательные функции
function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return 'Неверная дата';
    }
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

function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
}

function getLabStatus(lab) {
    if (!lab.start_date || !lab.deadline) return 'active';
    
    const now = new Date();
    const startDate = new Date(lab.start_date);
    const deadline = new Date(lab.deadline);
    
    if (now < startDate) return 'upcoming';
    if (now > deadline) return 'completed';
    return 'active';
}

function getLabStatusText(status) {
    const statusMap = {
        'active': 'Активна',
        'upcoming': 'Скоро начнется',
        'completed': 'Завершена'
    };
    return statusMap[status] || status;
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

// Загрузка работ для проверки
async function loadWorksToCheck() {
    try {
        const submissionsList = document.getElementById('submissions-list');
        submissionsList.innerHTML = '<div class="loading">Загрузка работ для проверки...</div>';
        
        const response = await fetch('/api/teacher/submissions', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            displaySubmissions(result.submissions || []);
        } else {
            throw new Error('Ошибка загрузки работ');
        }
    } catch (error) {
        console.error('Ошибка загрузки работ:', error);
        const submissionsList = document.getElementById('submissions-list');
        submissionsList.innerHTML = `
            <div class="error-message">
                <p>Ошибка загрузки работ: ${error.message}</p>
            </div>
        `;
    }
}

// Отображение списка работ
function displaySubmissions(submissions) {
    const container = document.getElementById('submissions-list');
    
    if (!submissions || submissions.length === 0) {
        container.innerHTML = `
            <div class="no-submissions">
                <p>Работ для проверки пока нет</p>
                <p>Студенты еще не сдали ни одной работы</p>
            </div>
        `;
        return;
    }
    
    // Фильтрация работ
    const filter = document.getElementById('works-filter').value;
    let filteredSubmissions = submissions;
    
    if (filter !== 'all') {
        filteredSubmissions = submissions.filter(s => s.status === filter);
    }
    
    if (filteredSubmissions.length === 0) {
        container.innerHTML = `
            <div class="no-submissions">
                <p>Нет работ с выбранным статусом</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredSubmissions.map(submission => `
        <div class="submission-card status-${submission.status}" data-submission-id="${submission.id}">
            <div class="submission-header">
                <h4 class="submission-title">${submission.lab_title}</h4>
                <span class="submission-status status-${submission.status}">
                    ${getSubmissionStatusText(submission.status)}
                </span>
            </div>
            <div class="submission-meta">
                <span><strong>Студент:</strong> ${submission.student_name}</span>
                <span><strong>Группа:</strong> ${submission.student_group || 'Не указана'}</span>
                <span><strong>Курс:</strong> ${submission.course_name}</span>
                <span><strong>Сдана:</strong> ${formatDateTime(submission.submitted_at)}</span>
                ${submission.score !== null ? `<span><strong>Оценка:</strong> ${submission.score}</span>` : ''}
            </div>
            <div class="submission-preview">
                ${submission.comment ? `<p><strong>Комментарий студента:</strong> ${submission.comment}</p>` : ''}
                ${submission.teacher_comment ? `<p><strong>Комментарий преподавателя:</strong> ${submission.teacher_comment}</p>` : ''}
            </div>
            <div class="submission-actions">
                <button class="btn btn-primary btn-sm grade-submission" data-submission-id="${submission.id}">
                    ${submission.status === 'pending' ? 'Проверить' : 'Посмотреть'}
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок проверки
    addSubmissionEventHandlers();
}

// Обработчики событий для работ
function addSubmissionEventHandlers() {
    // Кнопка "Проверить/Посмотреть"
    document.querySelectorAll('.grade-submission').forEach(btn => {
        btn.addEventListener('click', function() {
            const submissionId = this.getAttribute('data-submission-id');
            openGradeModal(submissionId);
        });
    });
    
    // Фильтр работ
    const worksFilter = document.getElementById('works-filter');
    if (worksFilter) {
        worksFilter.addEventListener('change', function() {
            loadWorksToCheck();
        });
    }
}

// Открытие модального окна проверки работы
async function openGradeModal(submissionId) {
    try {
        // Находим данные работы в текущем списке
        const submissionCard = document.querySelector(`[data-submission-id="${submissionId}"]`);
        if (!submissionCard) {
            throw new Error('Работа не найдена');
        }
        
        // Загружаем полные данные работы
        const submissions = await getTeacherSubmissions();
        const submission = submissions.find(s => s.id == submissionId);
        
        if (!submission) {
            throw new Error('Данные работы не найдены');
        }
        
        // Заполняем модальное окно
        document.getElementById('grade-submission-id').value = submissionId;
        document.getElementById('grade-submission-title').textContent = `Проверка: ${submission.lab_title}`;
        document.getElementById('submission-student-name').textContent = submission.student_name;
        document.getElementById('submission-student-group').textContent = submission.student_group || 'Не указана';
        document.getElementById('submission-lab-title').textContent = submission.lab_title;
        document.getElementById('submission-course-name').textContent = submission.course_name;
        document.getElementById('submission-date').textContent = formatDateTime(submission.submitted_at);
        
        // Показываем файлы
        const filesSection = document.getElementById('submission-files');
        const filesList = document.getElementById('files-list');
        if (submission.files) {
            filesSection.style.display = 'block';
            filesList.innerHTML = `
                <div class="file-item">
                    <span class="file-icon">📎</span>
                    <span class="file-name">${submission.files}</span>
                    <button class="btn btn-secondary btn-sm download-file" data-filename="${submission.files}">
                        Скачать
                    </button>
                </div>
            `;
        } else {
            filesSection.style.display = 'none';
        }
        
        // Показываем код
        const codeSection = document.getElementById('submission-code');
        const codeContent = document.getElementById('submission-code-content');
        if (submission.code) {
            codeSection.style.display = 'block';
            codeContent.textContent = submission.code;
        } else {
            codeSection.style.display = 'none';
        }
        
        // Показываем комментарий студента
        const commentSection = document.getElementById('submission-comment');
        const commentContent = document.getElementById('submission-comment-content');
        if (submission.comment) {
            commentSection.style.display = 'block';
            commentContent.textContent = submission.comment;
        } else {
            commentSection.style.display = 'none';
        }
        
        // Заполняем форму оценки
        document.getElementById('submission-score').value = submission.score || '';
        document.getElementById('submission-status').value = submission.status || 'checked';
        document.getElementById('teacher-comment').value = submission.teacher_comment || '';
        
        // Показываем модальное окно
        document.getElementById('grade-submission-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Ошибка открытия проверки:', error);
        showAlert('Ошибка загрузки данных работы', 'error');
    }
}

// Получение списка работ для преподавателя
async function getTeacherSubmissions() {
    try {
        const response = await fetch('/api/teacher/submissions', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.submissions || [];
        } else {
            throw new Error('Ошибка загрузки работ');
        }
    } catch (error) {
        console.error('Ошибка получения работ:', error);
        return [];
    }
}

// Оценка работы
async function gradeSubmission(e) {
    e.preventDefault();
    
    const submissionId = document.getElementById('grade-submission-id').value;
    const score = document.getElementById('submission-score').value;
    const status = document.getElementById('submission-status').value;
    const teacherComment = document.getElementById('teacher-comment').value;
    
    if (!score && status === 'checked') {
        showAlert('Для статуса "Принято" необходимо указать оценку', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/submissions/${submissionId}/grade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                score: score ? parseInt(score) : null,
                teacher_comment: teacherComment,
                status: status
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert(result.message, 'success');
            
            // Закрываем модальное окно
            document.getElementById('grade-submission-modal').style.display = 'none';
            
            // Перезагружаем список работ
            await loadWorksToCheck();
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
    } catch (error) {
        console.error('Ошибка оценки работы:', error);
        showAlert('Ошибка оценки: ' + error.message, 'error');
    }
}

// Вспомогательные функции
function getSubmissionStatusText(status) {
    const statusMap = {
        'pending': 'Ожидает проверки',
        'checked': 'Проверено',
        'revision': 'На доработку'
    };
    return statusMap[status] || status;
}

function loadStatementData() {
    console.log('📊 Загрузка данных для ведомостей...');
}

function loadSettingsData() {
    console.log('⚙️ Загрузка настроек...');
}

function loadTeacherChats() {
    console.log('💬 Загрузка чатов...');
    const groupsList = document.querySelector('.groups-list');
    groupsList.innerHTML = `
        <div class="no-chats'>
            <p>Чаты появятся здесь, когда студенты запишутся на ваши курсы</p>
        </div>
    `;
}