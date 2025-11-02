const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();

// Порт из переменной окружения (Render сам устанавливает)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Настройка сессий для продакшена
app.use(session({
  secret: process.env.SESSION_SECRET || 'labconnect-render-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // На Render будет false
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
  }
}));

// Для совместимости с вашим api.js
global.API = {
  // Это нужно для совместимости с фронтендом
};

// Настройка почтового отправления для Render (используем переменные окружения)
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    console.log('⚠️  Email переменные не настроены. Коды будут выводиться в консоль.');
    return null;
  }
  
  console.log('✅ Email настроен, отправка писем включена');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

// Генерация кода подтверждения
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Отправка кода подтверждения (или вывод в консоль если нет настроек email)
async function sendVerificationEmail(email, verificationCode) {
  const transporter = createTransporter();
  
  // Если email не настроен, выводим код в консоль для разработки
  if (!transporter) {
    console.log(`📧 [РЕЖИМ РАЗРАБОТКИ] Код подтверждения для ${email}: ${verificationCode}`);
    return true;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Подтверждение email - LabConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Добро пожаловать в LabConnect!</h2>
          <p>Для завершения регистрации введите следующий код подтверждения:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3498db; font-size: 32px; margin: 0;">${verificationCode}</h1>
          </div>
          <p>Этот код действителен в течение 10 минут.</p>
          <p>Если вы не регистрировались в LabConnect, просто проигнорируйте это письмо.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">LabConnect - платформа для лабораторных работ</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Код подтверждения отправлен на:', email);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    // При ошибке все равно выводим код в консоль
    console.log(`📧 [РЕЗЕРВНЫЙ КОД] для ${email}: ${verificationCode}`);
    return true;
  }
}

// Инициализация базы данных
const db = new sqlite3.Database(process.env.DATABASE_URL || './labconnect.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
  } else {
    console.log('✅ Подключение к SQLite базе данных установлено');
    initDatabase();
  }
});

// Создание таблиц
function initDatabase() {
  // Обновляем таблицу users - добавляем поле email_verified
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT 0,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
    group_name TEXT,
    faculty TEXT,
    department TEXT,
    position TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы users:', err);
    } else {
      console.log('✅ Таблица users готова');
    }
  });

  // Таблица для кодов подтверждения email
  db.run(`CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы email_verifications:', err);
    } else {
      console.log('✅ Таблица email_verifications готова');
    }
  });

  // Таблица для курсов
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    discipline TEXT NOT NULL,
    password TEXT,
    teacher_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы courses:', err);
    } else {
      console.log('✅ Таблица courses готова');
    }
  });

  // Таблица для лабораторных работ
  db.run(`CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    course_id INTEGER,
    template_code TEXT,
    deadline DATETIME,
    max_score INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses (id)
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы labs:', err);
    } else {
      console.log('✅ Таблица labs готова');
    }
  });

  // Таблица для сданных работ
  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id INTEGER,
    student_id INTEGER,
    files TEXT,
    code TEXT,
    comment TEXT,
    score INTEGER,
    teacher_comment TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'checked', 'revision')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    checked_at DATETIME,
    FOREIGN KEY (lab_id) REFERENCES labs (id),
    FOREIGN KEY (student_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы submissions:', err);
    } else {
      console.log('✅ Таблица submissions готова');
    }
  });

  console.log('✅ Все таблицы базы данных инициализированы');
}

// Middleware для проверки аутентификации
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Требуется аутентификация' });
  }
}
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
// API маршруты

// Отправка кода подтверждения при регистрации
app.post('/api/send-verification', async (req, res) => {
    console.log('=== SEND VERIFICATION REQUEST ===');
    console.log('Body:', req.body);
    
    const { email } = req.body;

    if (!email) {
        console.log('No email provided');
        return res.status(400).json({ error: 'Email обязателен' });
    }

  try {
    // Проверяем, не зарегистрирован ли уже email
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('Ошибка БД:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Этот email уже зарегистрирован' });
      }

      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

      // Сохраняем код в базу
      db.run(
        'INSERT OR REPLACE INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)',
        [email, verificationCode, expiresAt.toISOString()],
        async function(err) {
          if (err) {
            console.error('Ошибка сохранения кода:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
          }

          // Отправляем email (или выводим в консоль)
          const emailSent = await sendVerificationEmail(email, verificationCode);
          
          if (emailSent) {
            res.json({ 
              success: true, 
              message: 'Код подтверждения отправлен на ваш email' 
            });
          } else {
            res.status(500).json({ error: 'Ошибка отправки email. Попробуйте позже.' });
          }
        }
      );
    });
  } catch (error) {
    console.error('Ошибка отправки кода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Подтверждение email
app.post('/api/verify-email', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email и код обязательны' });
  }

  try {
    // Проверяем код
    db.get(
      'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > datetime("now")',
      [email, code],
      (err, row) => {
        if (err) {
          console.error('Ошибка БД:', err);
          return res.status(500).json({ error: 'Ошибка базы данных' });
        }

        if (!row) {
          return res.status(400).json({ error: 'Неверный код или срок действия истек' });
        }

        // Удаляем использованный код
        db.run('DELETE FROM email_verifications WHERE email = ?', [email]);

        res.json({ 
          success: true, 
          message: 'Email успешно подтвержден' 
        });
      }
    );
  } catch (error) {
    console.error('Ошибка подтверждения email:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Регистрация (ОБНОВЛЕННАЯ ВЕРСИЯ - с обязательным подтверждением email)
app.post('/api/register', async (req, res) => {
  console.log('=== РЕГИСТРАЦИЯ ===');
  
  const { username, password, email, firstName, lastName, role, group, faculty, department, position, verificationCode } = req.body;

  // Валидация
  if (!username || !password || !email || !firstName || !lastName || !role || !verificationCode) {
    return res.status(400).json({ error: 'Все поля, включая код подтверждения, обязательны' });
  }

  if (password.length < 10) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 10 символов' });
  }

  try {
    // Сначала проверяем код подтверждения
    db.get(
      'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND expires_at > datetime("now")',
      [email, verificationCode],
      async (err, verificationRow) => {
        if (err) {
          console.error('Ошибка БД при проверке кода:', err);
          return res.status(500).json({ error: 'Ошибка базы данных' });
        }

        if (!verificationRow) {
          return res.status(400).json({ error: 'Неверный код подтверждения или срок действия истек' });
        }

        // Проверяем, не зарегистрирован ли уже пользователь
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
          if (err) {
            console.error('Ошибка БД:', err);
            return res.status(500).json({ error: 'Ошибка базы данных' });
          }
          
          if (row) {
            return res.status(400).json({ error: 'Пользователь с таким именем или email уже существует' });
          }

          // Хеширование пароля
          const hashedPassword = await bcrypt.hash(password, 10);

          // Создание пользователя с подтвержденным email
          db.run(
            `INSERT INTO users (username, password, email, email_verified, first_name, last_name, role, group_name, faculty, department, position) 
             VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, email, firstName, lastName, role, group || null, faculty || null, department || null, position || null],
            function(err) {
              if (err) {
                console.error('Ошибка создания пользователя:', err);
                return res.status(500).json({ error: 'Ошибка при создании пользователя: ' + err.message });
              }
              
              // Удаляем использованный код подтверждения
              db.run('DELETE FROM email_verifications WHERE email = ?', [email]);
              
              console.log('✅ Пользователь создан с ID:', this.lastID);
              
              res.json({ 
                success: true, 
                message: 'Пользователь успешно зарегистрирован и подтвержден. Теперь вы можете войти.',
                userId: this.lastID
              });
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});

// Вход
app.post('/api/login', (req, res) => {
  console.log('=== ВХОД ===');
  
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('Ошибка БД:', err);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    
    if (!user) {
      console.log('❌ Пользователь не найден:', username);
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    console.log('Найден пользователь:', user.username, 'ID:', user.id);

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Неверный пароль для пользователя:', username);
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Проверяем, подтвержден ли email
    if (!user.email_verified) {
      console.log('❌ Email не подтвержден для пользователя:', username);
      return res.status(401).json({ error: 'Email не подтвержден. Проверьте вашу почту.' });
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
  });
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
    db.run(
      `UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        group_name = COALESCE(?, group_name),
        faculty = COALESCE(?, faculty),
        department = COALESCE(?, department),
        position = COALESCE(?, position)
      WHERE id = ?`,
      [firstName, lastName, group, faculty, department, position, userId],
      function(err) {
        if (err) {
          console.error('Ошибка обновления профиля:', err);
          return res.status(500).json({ error: 'Ошибка при обновлении профиля' });
        }

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
      }
    );
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
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
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Ошибка БД:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Неверный пароль' });
      }

      // Проверяем, не занят ли новый логин
      db.get('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, userId], (err, row) => {
        if (err) {
          console.error('Ошибка БД:', err);
          return res.status(500).json({ error: 'Ошибка базы данных' });
        }

        if (row) {
          return res.status(400).json({ error: 'Этот логин уже занят' });
        }

        // Обновляем логин
        db.run(
          'UPDATE users SET username = ? WHERE id = ?',
          [newUsername, userId],
          function(err) {
            if (err) {
              console.error('Ошибка обновления логина:', err);
              return res.status(500).json({ error: 'Ошибка при смене логина' });
            }

            // Обновляем в сессии
            req.session.user.username = newUsername;

            res.json({ 
              success: true, 
              message: 'Логин успешно изменен',
              user: req.session.user
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Ошибка смены логина:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
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
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Ошибка БД:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Неверный текущий пароль' });
      }

      // Хешируем новый пароль
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Обновляем пароль
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId],
        function(err) {
          if (err) {
            console.error('Ошибка обновления пароля:', err);
            return res.status(500).json({ error: 'Ошибка при смене пароля' });
          }

          res.json({ 
            success: true, 
            message: 'Пароль успешно изменен'
          });
        }
      );
    });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
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
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Ошибка БД:', err);
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Неверный пароль' });
      }

      // Удаляем пользователя и все связанные данные
      db.serialize(() => {
        // Удаляем submissions пользователя
        db.run('DELETE FROM submissions WHERE student_id = ?', [userId]);
        
        // Если пользователь - преподаватель, удаляем его курсы и labs
        db.run('DELETE FROM labs WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = ?)', [userId]);
        db.run('DELETE FROM courses WHERE teacher_id = ?', [userId]);
        
        // Удаляем самого пользователя
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
          if (err) {
            console.error('Ошибка удаления пользователя:', err);
            return res.status(500).json({ error: 'Ошибка при удалении профиля' });
          }

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
        });
      });
    });
  } catch (error) {
    console.error('Ошибка удаления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение курсов преподавателя
app.get('/api/teacher/courses', requireAuth, (req, res) => {
  if (req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  db.all('SELECT * FROM courses WHERE teacher_id = ?', [req.session.user.id], (err, courses) => {
    if (err) {
      console.error('Ошибка получения курсов:', err);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    
    res.json({ courses });
  });
});

// Получение курсов студента
app.get('/api/student/courses', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  // Здесь можно добавить логику для получения курсов студента
  // Пока возвращаем все курсы
  db.all('SELECT * FROM courses', (err, courses) => {
    if (err) {
      console.error('Ошибка получения курсов:', err);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    
    res.json({ courses });
  });
});

// Создание курса
app.post('/api/courses', requireAuth, (req, res) => {
  if (req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  const { name, description, discipline, password } = req.body;

  if (!name || !discipline) {
    return res.status(400).json({ error: 'Название и дисциплина обязательны' });
  }

  db.run(
    'INSERT INTO courses (name, description, discipline, password, teacher_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, discipline, password, req.session.user.id],
    function(err) {
      if (err) {
        console.error('Ошибка создания курса:', err);
        return res.status(500).json({ error: 'Ошибка при создании курса' });
      }
      
      res.json({ 
        success: true, 
        message: 'Курс успешно создан',
        courseId: this.lastID
      });
    }
  );
});

// Получение лабораторных работ для курса
app.get('/api/courses/:courseId/labs', requireAuth, (req, res) => {
  const courseId = req.params.courseId;

  db.all('SELECT * FROM labs WHERE course_id = ?', [courseId], (err, labs) => {
    if (err) {
      console.error('Ошибка получения лабораторных работ:', err);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    
    res.json({ labs });
  });
});

// Создание лабораторной работы
app.post('/api/labs', requireAuth, (req, res) => {
  if (req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  const { title, description, courseId, templateCode, deadline, maxScore } = req.body;

  if (!title || !courseId) {
    return res.status(400).json({ error: 'Название и курс обязательны' });
  }

  db.run(
    'INSERT INTO labs (title, description, course_id, template_code, deadline, max_score) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, courseId, templateCode, deadline, maxScore],
    function(err) {
      if (err) {
        console.error('Ошибка создания лабораторной работы:', err);
        return res.status(500).json({ error: 'Ошибка при создании лабораторной работы' });
      }
      
      res.json({ 
        success: true, 
        message: 'Лабораторная работа успешно создана',
        labId: this.lastID
      });
    }
  );
});

// Получение работ на проверку (для преподавателя)
app.get('/api/teacher/submissions', requireAuth, (req, res) => {
  if (req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  const query = `
    SELECT s.*, u.first_name, u.last_name, u.group_name, l.title as lab_title, c.name as course_name
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    JOIN labs l ON s.lab_id = l.id
    JOIN courses c ON l.course_id = c.id
    WHERE c.teacher_id = ?
    ORDER BY s.submitted_at DESC
  `;

  db.all(query, [req.session.user.id], (err, submissions) => {
    if (err) {
      console.error('Ошибка получения работ на проверку:', err);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    
    res.json({ submissions });
  });
});

// Получение сданных работ (для студента)
app.get('/api/student/submissions', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  const query = `
    SELECT s.*, l.title as lab_title, c.name as course_name
    FROM submissions s
    JOIN labs l ON s.lab_id = l.id
    JOIN courses c ON l.course_id = c.id
    WHERE s.student_id = ?
    ORDER BY s.submitted_at DESC
  `;

  db.all(query, [req.session.user.id], (err, submissions) => {
    if (err) {
      console.error('Ошибка получения сданных работ:', err);
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    
    res.json({ submissions });
  });
});

// Сдача работы
app.post('/api/submissions', requireAuth, (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  const { labId, code, comment } = req.body;

  if (!labId) {
    return res.status(400).json({ error: 'ID лабораторной работы обязателен' });
  }

  db.run(
    'INSERT INTO submissions (lab_id, student_id, code, comment) VALUES (?, ?, ?, ?)',
    [labId, req.session.user.id, code, comment],
    function(err) {
      if (err) {
        console.error('Ошибка сдачи работы:', err);
        return res.status(500).json({ error: 'Ошибка при сдаче работы' });
      }
      
      res.json({ 
        success: true, 
        message: 'Работа успешно сдана',
        submissionId: this.lastID
      });
    }
  );
});

// Проверка работы
app.put('/api/submissions/:submissionId', requireAuth, (req, res) => {
  if (req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  const submissionId = req.params.submissionId;
  const { score, teacherComment, status } = req.body;

  if (!score && status !== 'revision') {
    return res.status(400).json({ error: 'Оценка обязательна' });
  }

  db.run(
    'UPDATE submissions SET score = ?, teacher_comment = ?, status = ?, checked_at = CURRENT_TIMESTAMP WHERE id = ?',
    [score, teacherComment, status || 'checked', submissionId],
    function(err) {
      if (err) {
        console.error('Ошибка проверки работы:', err);
        return res.status(500).json({ error: 'Ошибка при проверке работы' });
      }
      
      res.json({ 
        success: true, 
        message: 'Работа успешно проверена'
      });
    }
  );
});

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Сайт доступен по адресу: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  console.log(`💡 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 База данных: ${process.env.DATABASE_URL || './labconnect.db'}`);
});