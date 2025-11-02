// js/main.js
// Основные функции приложения и API

// API функции для взаимодействия с сервером
const API = {
  async request(endpoint, options = {}) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api${endpoint}`;
    
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Аутентификация
  async register(userData) {
    return this.request('/register', {
      method: 'POST',
      body: userData
    });
  },

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: credentials
    });
  },

  async logout() {
    return this.request('/logout', {
      method: 'POST'
    });
  },

  async getCurrentUser() {
    return this.request('/user');
  },

  // Новые функции для управления профилем
  async updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: profileData
    });
  },

  async changeUsername(newUsername, password) {
    return this.request('/change-username', {
      method: 'PUT',
      body: { newUsername, password }
    });
  },

  async changePassword(currentPassword, newPassword) {
    return this.request('/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword }
    });
  },

  async deleteProfile(password) {
    return this.request('/profile', {
      method: 'DELETE',
      body: { password }
    });
  },

  // Функции для подтверждения email
  async sendVerificationCode(email) {
    return this.request('/send-verification', {
      method: 'POST',
      body: { email }
    });
  },

  async verifyEmail(email, code) {
    return this.request('/verify-email', {
      method: 'POST',
      body: { email, code }
    });
  }
};

// Основные функции приложения
document.addEventListener('DOMContentLoaded', function() {
  initApp();
});

async function initApp() {
  // Проверка аутентификации
  await checkAuthStatus();
  
  // Инициализация обработчиков событий
  initEventHandlers();
}

async function checkAuthStatus() {
  try {
    const data = await API.getCurrentUser();
    if (data.user) {
      updateUIForAuthUser(data.user);
    }
  } catch (error) {
    // Пользователь не авторизован - это нормально
    console.log('Пользователь не авторизован');
    updateUIForUnauthUser();
  }
}

function updateUIForAuthUser(user) {
  console.log('Обновление UI для авторизованного пользователя:', user);
  
  const authLinks = document.querySelector('nav ul');
  if (authLinks) {
    authLinks.innerHTML = `
      <li><a href="${user.role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html'}">Личный кабинет</a></li>
      <li><a href="#" id="logout">Выйти</a></li>
    `;
    
    // Добавляем обработчик выхода
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
      });
    }
  }
  
  // Обновляем информацию на dashboard страницах
  if (window.location.pathname.includes('dashboard')) {
    updateDashboardUserInfo(user);
  }
}

function updateUIForUnauthUser() {
  const authLinks = document.querySelector('nav ul');
  if (authLinks && !authLinks.querySelector('a[href="login.html"]')) {
    authLinks.innerHTML = `
      <li><a href="index.html">Главная</a></li>
      <li><a href="login.html">Войти</a></li>
      <li><a href="register-simple.html.html">Регистрация</a></li>
    `;
  }
}

function updateDashboardUserInfo(user) {
  // Обновляем информацию в личном кабинете
  if (user.role === 'student') {
    const studentName = document.getElementById('student-name');
    const userGroup = document.getElementById('user-group');
    
    if (studentName) studentName.textContent = user.firstName + ' ' + user.lastName;
    if (userGroup) userGroup.textContent = 'Группа: ' + (user.group || 'Не указана');
    
    // Обновляем данные в профиле
    const profileElements = {
      'profile-firstname': user.firstName,
      'profile-lastname': user.lastName,
      'profile-email': user.email,
      'profile-group': user.group || 'Не указана',
      'profile-faculty': user.faculty || 'Не указан'
    };
    
    for (const [id, value] of Object.entries(profileElements)) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    }
  } else if (user.role === 'teacher') {
    const teacherName = document.getElementById('teacher-name');
    const teacherDept = document.getElementById('teacher-department');
    
    if (teacherName) teacherName.textContent = user.firstName + ' ' + user.lastName;
    if (teacherDept) teacherDept.textContent = 'Кафедра: ' + (user.department || 'Не указана');
    
    // Обновляем данные в профиле
    const profileElements = {
      'teacher-firstname': user.firstName,
      'teacher-lastname': user.lastName,
      'teacher-email': user.email,
      'teacher-department-detail': user.department || 'Не указана',
      'teacher-position': user.position || 'Не указана'
    };
    
    for (const [id, value] of Object.entries(profileElements)) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    }
  }
}

async function logout() {
  try {
    await API.logout();
    showAlert('Выход выполнен успешно', 'success');
    
    // Обновляем UI
    updateUIForUnauthUser();
    
    // Перенаправляем на главную
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
    
  } catch (error) {
    showAlert('Ошибка при выходе', 'error');
  }
}

function initEventHandlers() {
  // Обработчики для выбора роли на странице регистрации
  const roleOptions = document.querySelectorAll('.role-option');
  if (roleOptions.length > 0) {
    roleOptions.forEach(option => {
      option.addEventListener('click', function() {
        roleOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // Показ/скрытие полей в зависимости от роли
        const studentFields = document.getElementById('student-fields');
        const teacherFields = document.getElementById('teacher-fields');
        
        if (studentFields && teacherFields) {
          if (this.dataset.role === 'student') {
            studentFields.style.display = 'block';
            teacherFields.style.display = 'none';
          } else {
            studentFields.style.display = 'none';
            teacherFields.style.display = 'block';
          }
        }
      });
    });
  }
  
  // Обработчик формы регистрации
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Обработчик формы входа
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Инициализация модальных окон управления профилем
  initProfileModals();
}

async function handleRegister(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const userData = {
    username: formData.get('username'),
    password: formData.get('password'),
    email: formData.get('email'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    role: formData.get('role')
  };
  
  // Добавление дополнительных полей в зависимости от роли
  if (userData.role === 'student') {
    userData.group = formData.get('group');
    userData.faculty = formData.get('faculty');
  } else if (userData.role === 'teacher') {
    userData.department = formData.get('department');
    userData.position = formData.get('position');
  }
  
  // Валидация пароля
  if (userData.password.length < 10) {
    showAlert('Пароль должен содержать не менее 10 символов', 'error');
    return;
  }
  
  try {
    const result = await API.register(userData);
    showAlert(result.message, 'success');
    
    // Перенаправляем на страницу входа после успешной регистрации
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const loginData = {
    username: formData.get('username'),
    password: formData.get('password')
  };
  
  try {
    const result = await API.login(loginData);
    showAlert(result.message, 'success');
    
    // Перенаправление в зависимости от роли
    setTimeout(() => {
      window.location.href = result.user.role === 'teacher' ? 
        'teacher-dashboard.html' : 'student-dashboard.html';
    }, 1000);
    
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Функции для управления профилем
function initProfileModals() {
  // Модальное окно редактирования профиля
  const editProfileBtn = document.getElementById('edit-profile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditProfileModal);
  }

  // Модальное окно смены логина
  const changeUsernameBtn = document.getElementById('change-username-btn');
  if (changeUsernameBtn) {
    changeUsernameBtn.addEventListener('click', openChangeUsernameModal);
  }

  // Модальное окно смены пароля
  const changePasswordBtn = document.getElementById('change-password-btn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', openChangePasswordModal);
  }

  // Модальное окно удаления профиля
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
  const user = getCurrentUserFromPage();
  
  if (user) {
    document.getElementById('edit-firstname').value = user.firstName || '';
    document.getElementById('edit-lastname').value = user.lastName || '';
    document.getElementById('edit-group').value = user.group || '';
    document.getElementById('edit-faculty').value = user.faculty || '';
    document.getElementById('edit-department').value = user.department || '';
    document.getElementById('edit-position').value = user.position || '';
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

function getCurrentUserFromPage() {
  // Получаем данные пользователя со страницы
  if (document.getElementById('profile-firstname')) {
    return {
      firstName: document.getElementById('profile-firstname').textContent,
      lastName: document.getElementById('profile-lastname').textContent,
      group: document.getElementById('profile-group').textContent,
      faculty: document.getElementById('profile-faculty').textContent,
      department: document.getElementById('teacher-department-detail')?.textContent || '',
      position: document.getElementById('teacher-position')?.textContent || ''
    };
  }
  return null;
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
    updateDashboardUserInfo(result.user);
    
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
    updateDashboardUserInfo(result.user);
    
    // Закрываем модальное окно
    document.getElementById('change-username-modal').style.display = 'none';
    
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