const express = require('express');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();

// Порт из переменной окружения
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Настройка сессий
app.use(session({
  secret: process.env.SESSION_SECRET || 'labconnect-render-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Подключение к PostgreSQL
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Функция подключения к базе данных
async function connectDatabase() {
  try {
    await db.connect();
    console.log('✅ Подключение к PostgreSQL установлено');
    await initDatabase();
    await createTestData();
  } catch (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err);
    process.exit(1);
  }
}

// Создание таблиц
async function initDatabase() {
  try {
    // Таблица пользователей
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT true,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK(role IN ('student', 'teacher')),
        group_name VARCHAR(50),
        faculty VARCHAR(100),
        department VARCHAR(100),
        position VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица users готова');

    // Таблица для курсов
    await db.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        discipline VARCHAR(100) NOT NULL,
        password VARCHAR(255),
        teacher_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица courses готова');

    // Проверим существующие курсы
    const coursesCheck = await db.query('SELECT COUNT(*) as count FROM courses');
    console.log(`📊 В таблице courses: ${coursesCheck.rows[0].count} записей`);

    // Таблица для лабораторных работ
    await db.query(`
      CREATE TABLE IF NOT EXISTS labs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        course_id INTEGER REFERENCES courses(id),
        template_code TEXT,
        deadline TIMESTAMP,
        max_score INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица labs готова');

    // Таблица для сданных работ
    await db.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        lab_id INTEGER REFERENCES labs(id),
        student_id INTEGER REFERENCES users(id),
        files TEXT,
        code TEXT,
        comment TEXT,
        score INTEGER,
        teacher_comment TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'checked', 'revision')),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checked_at TIMESTAMP
      )
    `);
    console.log('✅ Таблица submissions готова');

    console.log('✅ Все таблицы базы данных инициализированы');
  } catch (err) {
    console.error('❌ Ошибка инициализации базы данных:', err);
  }
}

// Создание тестовых данных
async function createTestData() {
  try {
    // Проверяем, есть ли пользователи
    const result = await db.query('SELECT COUNT(*) as count FROM users');
    
    if (parseInt(result.rows[0].count) === 0) {
      console.log('🔄 Создание тестовых данных...');
      
      // Хешируем пароли
      const teacherPassword = await bcrypt.hash('teacher12345', 10);
      const studentPassword = await bcrypt.hash('student12345', 10);
      
      // Создаем тестового преподавателя
      await db.query(
        `INSERT INTO users (username, password, email, email_verified, first_name, last_name, role, department, position) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['teacher', teacherPassword, 'teacher@astu.ru', true, 'Николай', 'Измайлов', 'teacher', 'АСОПУ', 'Преподаватель']
      );
      
      // Создаем тестового студента
      await db.query(
        `INSERT INTO users (username, password, email, email_verified, first_name, last_name, role, group_name, faculty) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['student', studentPassword, 'student@astu.ru', true, 'Александр', 'Бондаренко', 'student', 'ДИПР6-31', 'Институт информационных технологий']
      );
      
      console.log('✅ Тестовые данные созданы');
      console.log('👨‍🏫 Преподаватель: teacher / teacher12345');
      console.log('👨‍🎓 Студент: student / student12345');
    } else {
      console.log('✅ В базе уже есть пользователи');
    }
  } catch (err) {
    console.error('❌ Ошибка создания тестовых данных:', err);
  }
}

// Middleware для проверки аутентификации
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Требуется аутентификация' });
  }
}

// API маршруты

// Простая регистрация без подтверждения email
app.post('/api/register-simple', async (req, res) => {
  console.log('=== ПРОСТАЯ РЕГИСТРАЦИЯ ===');
  
  const { username, password, email, firstName, lastName, role, group, faculty, department, position } = req.body;

  // Валидация
  if (!username || !password || !email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
  }

  if (password.length < 10) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 10 символов' });
  }

  try {
    // Проверяем, не зарегистрирован ли уже пользователь
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2', 
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким именем или email уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const result = await db.query(
      `INSERT INTO users (username, password, email, email_verified, first_name, last_name, role, group_name, faculty, department, position) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [username, hashedPassword, email, true, firstName, lastName, role, group || null, faculty || null, department || null, position || null]
    );
    
    console.log('✅ Пользователь создан с ID:', result.rows[0].id);
    
    res.json({ 
      success: true, 
      message: 'Пользователь успешно зарегистрирован. Теперь вы можете войти.',
      userId: result.rows[0].id
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  console.log('=== ВХОД ===');
  
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1', 
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Пользователь не найден:', username);
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    const user = result.rows[0];
    console.log('Найден пользователь:', user.username, 'ID:', user.id);

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Неверный пароль для пользователя:', username);
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Сохраняем пользователя в сессии
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      group: user.group_name,
      faculty: user.faculty,
      department: user.department,
      position: user.position
    };

    console.log('✅ Пользователь вошел:', req.session.user);
    
    res.json({ 
      success: true, 
      message: 'Вход выполнен успешно',
      user: req.session.user
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Выход
app.post('/api/logout', (req, res) => {
  console.log('=== ВЫХОД ===');
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Ошибка выхода:', err);
      return res.status(500).json({ error: 'Ошибка при выходе' });
    }
    
    console.log('✅ Сессия уничтожена');
    res.json({ success: true, message: 'Выход выполнен успешно' });
  });
});

// Получение текущего пользователя
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Пользователь не аутентифицирован' });
  }
});

// Обновление профиля
app.put('/api/profile', requireAuth, async (req, res) => {
  const { firstName, lastName, group, faculty, department, position } = req.body;
  const userId = req.session.user.id;

  try {
    await db.query(
      `UPDATE users SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        group_name = COALESCE($3, group_name),
        faculty = COALESCE($4, faculty),
        department = COALESCE($5, department),
        position = COALESCE($6, position)
      WHERE id = $7`,
      [firstName, lastName, group, faculty, department, position, userId]
    );

    // Обновляем данные в сессии
    if (firstName) req.session.user.firstName = firstName;
    if (lastName) req.session.user.lastName = lastName;
    if (group) req.session.user.group = group;
    if (faculty) req.session.user.faculty = faculty;
    if (department) req.session.user.department = department;
    if (position) req.session.user.position = position;

    res.json({ 
      success: true, 
      message: 'Профиль успешно обновлен',
      user: req.session.user
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка при обновлении профиля' });
  }
});

// Смена логина (username)
app.put('/api/change-username', requireAuth, async (req, res) => {
  const { newUsername, password } = req.body;
  const userId = req.session.user.id;

  if (!newUsername || !password) {
    return res.status(400).json({ error: 'Новый логин и пароль обязательны' });
  }

  try {
    // Сначала проверяем пароль
    const result = await db.query(
      'SELECT password FROM users WHERE id = $1', 
      [userId]
    );

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    // Проверяем, не занят ли новый логин
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2', 
      [newUsername, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Этот логин уже занят' });
    }

    // Обновляем логин
    await db.query(
      'UPDATE users SET username = $1 WHERE id = $2',
      [newUsername, userId]
    );

    // Обновляем в сессии
    req.session.user.username = newUsername;

    res.json({ 
      success: true, 
      message: 'Логин успешно изменен',
      user: req.session.user
    });
  } catch (error) {
    console.error('Ошибка смены логина:', error);
    res.status(500).json({ error: 'Ошибка при смене логина' });
  }
});

// Смена пароля
app.put('/api/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
  }

  if (newPassword.length < 10) {
    return res.status(400).json({ error: 'Новый пароль должен содержать не менее 10 символов' });
  }

  try {
    // Проверяем текущий пароль
    const result = await db.query(
      'SELECT password FROM users WHERE id = $1', 
      [userId]
    );

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({ 
      success: true, 
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ error: 'Ошибка при смене пароля' });
  }
});

// Удаление профиля
app.delete('/api/profile', requireAuth, async (req, res) => {
  const { password } = req.body;
  const userId = req.session.user.id;

  if (!password) {
    return res.status(400).json({ error: 'Пароль обязателен для удаления профиля' });
  }

  try {
    // Проверяем пароль
    const result = await db.query(
      'SELECT password FROM users WHERE id = $1', 
      [userId]
    );

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    // Удаляем пользователя и все связанные данные
    await db.query('DELETE FROM submissions WHERE student_id = $1', [userId]);
    await db.query('DELETE FROM labs WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1)', [userId]);
    await db.query('DELETE FROM courses WHERE teacher_id = $1', [userId]);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    // Уничтожаем сессию
    req.session.destroy((err) => {
      if (err) {
        console.error('Ошибка уничтожения сессии:', err);
      }
    });

    res.json({ 
      success: true, 
      message: 'Профиль успешно удален' 
    });
  } catch (error) {
    console.error('Ошибка удаления профиля:', error);
    res.status(500).json({ error: 'Ошибка при удалении профиля' });
  }
});
// Получение курсов преподавателя
app.get('/api/teacher/courses', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ только для преподавателей' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM courses WHERE teacher_id = $1 ORDER BY created_at DESC',
            [req.session.user.id]
        );
        
        console.log(`📊 Найдено курсов: ${result.rows.length}`);
        res.json({ courses: result.rows });
    } catch (error) {
        console.error('❌ Ошибка получения курсов:', error);
        res.status(500).json({ error: 'Ошибка базы данных' });
    }
});

// Создание курса
app.post('/api/courses', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ только для преподавателей' });
    }

    const { name, description, discipline, password } = req.body;

    if (!name || !discipline) {
        return res.status(400).json({ error: 'Название и дисциплина обязательны' });
    }

    try {
        const result = await db.query(
            `INSERT INTO courses (name, description, discipline, password, teacher_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, discipline, password, created_at`,
            [name, description, discipline, password, req.session.user.id]
        );
        
        console.log('✅ Курс создан с ID:', result.rows[0].id);
        
        res.json({ 
            success: true, 
            message: 'Курс успешно создан',
            course: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Ошибка создания курса:', error);
        res.status(500).json({ error: 'Ошибка при создании курса: ' + error.message });
    }
});
// Все остальные API маршруты (курсы, лабораторные работы и т.д.)
// ... остальной код API ...

// Все остальные GET запросы отдаем index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
connectDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Сайт доступен по адресу: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
    console.log(`💡 Режим: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 База данных: PostgreSQL`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Завершение работы...');
  await db.end();
  process.exit(0);
});