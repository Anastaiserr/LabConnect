// js/settings.js
// Функциональность страницы настроек

document.addEventListener('DOMContentLoaded', function() {
    initSettingsPage();
});

async function initSettingsPage() {
    // Загрузка данных пользователя
    await loadUserData();
    
    // Инициализация кнопок
    initSettingsButtons();
    
    // Инициализация модальных окон
    initSettingsModals();
}

async function loadUserData() {
    try {
        const response = await API.getCurrentUser();
        if (response.user) {
            const user = response.user;
            
            // Отображаем информацию о пользователе
            document.getElementById('current-user').textContent = 
                `${user.firstName} ${user.lastName} (${user.role === 'student' ? 'Студент' : 'Преподаватель'})`;
            
            // Сохраняем данные пользователя для форм
            window.currentUser = user;
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        // Если не авторизован, перенаправляем на вход
        window.location.href = 'login.html';
    }
}

function initSettingsButtons() {
    // Кнопка "Назад в кабинет"
    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const user = window.currentUser;
            if (user) {
                window.location.href = user.role === 'teacher' ? 
                    'teacher-dashboard.html' : 'student-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        });
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

function initSettingsModals() {
    // Кнопка редактирования профиля
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfileModal);
    }

    // Кнопка смены логина
    const changeUsernameBtn = document.getElementById('change-username-btn');
    if (changeUsernameBtn) {
        changeUsernameBtn.addEventListener('click', openChangeUsernameModal);
    }

    // Кнопка смены пароля
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', openChangePasswordModal);
    }

    // Кнопка удаления профиля
    const deleteProfileBtn = document.getElementById('delete-profile-btn');
    if (deleteProfileBtn) {
        deleteProfileBtn.addEventListener('click', openDeleteProfileModal);
    }

    // Обработчики форм
    const profileEditForm = document.getElementById('profile-edit-form');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', handleProfileUpdate);
    }

    const usernameChangeForm = document.getElementById('username-change-form');
    if (usernameChangeForm) {
        usernameChangeForm.addEventListener('submit', handleUsernameChange);
    }

    const passwordChangeForm = document.getElementById('password-change-form');
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', handlePasswordChange);
    }

    const profileDeleteForm = document.getElementById('profile-delete-form');
    if (profileDeleteForm) {
        profileDeleteForm.addEventListener('submit', handleProfileDelete);
    }

    // Закрытие модальных окон
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Закрытие при клике вне окна
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    const user = window.currentUser;
    
    if (user) {
        // Заполняем форму текущими данными
        document.getElementById('edit-firstname').value = user.firstName || '';
        document.getElementById('edit-lastname').value = user.lastName || '';
        document.getElementById('edit-group').value = user.group || '';
        document.getElementById('edit-faculty').value = user.faculty || '';
        document.getElementById('edit-department').value = user.department || '';
        document.getElementById('edit-position').value = user.position || '';
        
        // Показываем соответствующие поля для роли
        if (user.role === 'student') {
            document.getElementById('student-edit-fields').style.display = 'block';
            document.getElementById('teacher-edit-fields').style.display = 'none';
        } else {
            document.getElementById('student-edit-fields').style.display = 'none';
            document.getElementById('teacher-edit-fields').style.display = 'block';
        }
    }
    
    modal.style.display = 'block';
}

function openChangeUsernameModal() {
    document.getElementById('change-username-modal').style.display = 'block';
}

function openChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'block';
}

function openDeleteProfileModal() {
    document.getElementById('delete-profile-modal').style.display = 'block';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        firstName: formData.get('edit-firstname'),
        lastName: formData.get('edit-lastname'),
        group: formData.get('edit-group'),
        faculty: formData.get('edit-faculty'),
        department: formData.get('edit-department'),
        position: formData.get('edit-position')
    };

    try {
        const result = await API.updateProfile(profileData);
        showAlert(result.message, 'success');
        
        // Обновляем данные на странице
        window.currentUser = result.user;
        document.getElementById('current-user').textContent = 
            `${result.user.firstName} ${result.user.lastName} (${result.user.role === 'student' ? 'Студент' : 'Преподаватель'})`;
        
        // Закрываем модальное окно
        document.getElementById('edit-profile-modal').style.display = 'none';
        
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function handleUsernameChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newUsername = formData.get('new-username');
    const password = formData.get('username-password');

    try {
        const result = await API.changeUsername(newUsername, password);
        showAlert(result.message, 'success');
        
        // Обновляем данные на странице
        window.currentUser = result.user;
        document.getElementById('current-user').textContent = 
            `${result.user.firstName} ${result.user.lastName} (${result.user.role === 'student' ? 'Студент' : 'Преподаватель'})`;
        
        // Закрываем модальное окно
        document.getElementById('change-username-modal').style.display = 'none';
        
        // Очищаем форму
        e.target.reset();
        
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('current-password');
    const newPassword = formData.get('new-password');
    const confirmPassword = formData.get('confirm-password');

    if (newPassword !== confirmPassword) {
        showAlert('Новые пароли не совпадают', 'error');
        return;
    }

    if (newPassword.length < 10) {
        showAlert('Новый пароль должен содержать не менее 10 символов', 'error');
        return;
    }

    try {
        const result = await API.changePassword(currentPassword, newPassword);
        showAlert(result.message, 'success');
        
        // Закрываем модальное окно
        document.getElementById('change-password-modal').style.display = 'none';
        
        // Очищаем форму
        e.target.reset();
        
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function handleProfileDelete(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const password = formData.get('delete-password');
    const confirmation = formData.get('delete-confirmation');

    if (confirmation !== 'УДАЛИТЬ') {
        showAlert('Пожалуйста, введите слово "УДАЛИТЬ" для подтверждения', 'error');
        return;
    }

    try {
        const result = await API.deleteProfile(password);
        showAlert(result.message, 'success');
        
        // Перенаправляем на главную страницу
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function logout() {
    try {
        await API.logout();
        showAlert('Выход выполнен успешно', 'success');
        
        // Перенаправляем на главную
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        showAlert('Ошибка при выходе', 'error');
    }
}

function showAlert(message, type = 'info') {
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