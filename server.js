const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Создаем папки для данных и сессий
const dataDir = './data';
const sessionsDir = './sessions';

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir);
}

// Настройка сессий с FileStore
app.use(session({
  secret: process.env.SESSION_SECRET || 'labconnect-json-secret-2024',
  store: new FileStore({
    path: sessionsDir,
    ttl: 7 * 24 * 60 * 60 // 7 дней
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
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

// JSON база данных
class JSONDatabase {
  constructor() {
    this.dbPath = path.join(dataDir, 'labconnect.json');
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(data);
        console.log('✅ База данных загружена');
      } else {
        this.createInitialData();
        console.log('✅ Создана новая база данных');
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки базы данных:', error);
      this.createInitialData();
    }
  }

  createInitialData() {
    // Хеши паролей: teacher12345 и student12345
    this.data = {
      users: [
        {
          id: 1,
          username: 'teacher',
          password: '$2a$10$8A2BsmTm.4o1qmJxYZ.N1.HfJ/Yz.C/Y.5r.EqNBik6p8eBf.6D0C',
          email: 'teacher@astu.ru',
          firstName: 'Николай',
          lastName: 'Измайлов',
          role: 'teacher',
          department: 'АСОПУ',
          position: 'Преподаватель',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          username: 'student',
          password: '$2a$10$8A2BsmTm.4o1qmJxYZ.N1.HfJ/Yz.C/Y.5r.EqNBik6p8eBf.6D0C',
          email: 'student@astu.ru',
          firstName: 'Александр',
          lastName: 'Бондаренко',
          role: 'student',
          group: 'ДИПР6-31',
          faculty: 'Институт информационных технологий',
          createdAt: new Date().toISOString()
        }
      ],
      courses: [],
      enrollments: [],
      labs: [],
      submissions: []
    };
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения базы данных:', error);
      return false;
    }
  }

  // Методы для пользователей
  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      id: Date.now(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    this.data.users.push(user);
    this.save();
    return user;
  }

  findUserByUsername(username) {
    return this.data.users.find(u => u.username === username);
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  // Методы для курсов
  createCourse(courseData) {
    const course = {
      id: Date.now(),
      ...courseData,
      created_at: new Date().toISOString()
    };
    this.data.courses.push(course);
    this.save();
    return course;
  }

  getCoursesByTeacher(teacherId) {
    return this.data.courses.filter(c => c.teacher_id == teacherId);
  }

  getAllCourses() {
    return this.data.courses;
  }

  findCourseById(id) {
    return this.data.courses.find(c => c.id == id);
  }

  // Методы для лабораторных работ
  createLab(labData) {
    const lab = {
      id: Date.now(),
      ...labData,
      created_at: new Date().toISOString()
    };
    this.data.labs.push(lab);
    this.save();
    return lab;
  }

  getLabsByCourse(courseId) {
    return this.data.labs.filter(l => l.course_id == courseId);
  }

  getLabsCountByCourse(courseId) {
    return this.data.labs.filter(l => l.course_id == courseId).length;
  }

  // Методы для записи на курсы
  enrollStudent(courseId, studentId) {
    const enrollment = {
      id: Date.now(),
      course_id: parseInt(courseId),
      student_id: parseInt(studentId),
      enrolled_at: new Date().toISOString()
    };
    
    // Проверяем, не записан ли уже
    const existing = this.data.enrollments.find(
      e => e.course_id == courseId && e.student_id == studentId
    );
    
    if (existing) {
      throw new Error('Студент уже записан на этот курс');
    }
    
    this.data.enrollments.push(enrollment);
    this.save();
    return enrollment;
  }

  getStudentCourses(studentId) {
    const enrollmentIds = this.data.enrollments
      .filter(e => e.student_id == studentId)
      .map(e => e.course_id);
    
    return this.data.courses.filter(c => enrollmentIds.includes(c.id));
  }

  searchCourses(query) {
    const searchTerm = query.toLowerCase();
    return this.data.courses.filter(c => 
      c.name.toLowerCase().includes(searchTerm) ||
      c.discipline.toLowerCase().includes(searchTerm) ||
      (c.description && c.description.toLowerCase().includes(searchTerm))
    );
  }
}

// Инициализация базы данных
const db = new JSONDatabase();

// Middleware для проверки аутентификации
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Требуется аутентификация' });
  }
}

// ========== API МАРШРУТЫ ==========

// Регистрация
app.post('/api/register-simple', async (req, res) => {
  const { username, password, email, firstName, lastName, role, group, faculty, department, position } = req.body;

  if (!username || !password || !email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
  }

  if (password.length < 10) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 10 символов' });
  }

  try {
    const existingUser = db.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    }

    const user = await db.createUser({
      username,
      password,
      email,
      firstName,
      lastName,
      role,
      group_name: group,
      faculty,
      department,
      position
    });

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      message: 'Пользователь успешно зарегистрирован',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }

  try {
    const user = db.findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Создаем сессию
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      group: user.group_name,
      faculty: user.faculty,
      department: user.department,
      position: user.position
    };

    console.log('✅ Пользователь вошел:', req.session.user.username);
    
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
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при выходе' });
    }
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
    const user = db.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Обновляем данные
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (group) user.group_name = group;
    if (faculty) user.faculty = faculty;
    if (department) user.department = department;
    if (position) user.position = position;

    db.save();

    // Обновляем сессию
    req.session.user = {
      ...req.session.user,
      firstName: user.firstName,
      lastName: user.lastName,
      group: user.group_name,
      faculty: user.faculty,
      department: user.department,
      position: user.position
    };

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

// Получение курсов преподавателя
app.get('/api/teacher/courses', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  try {
    const courses = db.getCoursesByTeacher(req.session.user.id);
    res.json({ courses });
  } catch (error) {
    console.error('Ошибка получения курсов:', error);
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
    const course = db.createCourse({
      name,
      description,
      discipline,
      password,
      teacher_id: req.session.user.id
    });
    
    res.json({ 
      success: true, 
      message: 'Курс успешно создан',
      course
    });
  } catch (error) {
    console.error('Ошибка создания курса:', error);
    res.status(500).json({ error: 'Ошибка при создании курса' });
  }
});

// Создание лабораторной работы
app.post('/api/labs', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  const { name, description, course_id, template_code, deadline, max_score } = req.body;

  if (!name || !description || !course_id) {
    return res.status(400).json({ error: 'Название, описание и ID курса обязательны' });
  }

  try {
    const lab = db.createLab({
      title: name,
      description,
      course_id: parseInt(course_id),
      template_code,
      deadline,
      max_score: max_score || 10
    });
    
    res.json({ 
      success: true, 
      message: 'Лабораторная работа успешно создана',
      lab
    });
  } catch (error) {
    console.error('Ошибка создания лабораторной работы:', error);
    res.status(500).json({ error: 'Ошибка при создании лабораторной работы' });
  }
});

// Получение лабораторных работ курса
app.get('/api/courses/:id/labs', requireAuth, async (req, res) => {
  try {
    const labs = db.getLabsByCourse(req.params.id);
    res.json({ labs });
  } catch (error) {
    console.error('Ошибка получения лабораторных работ:', error);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Получение количества лабораторных работ
app.get('/api/courses/:id/labs/count', requireAuth, async (req, res) => {
  try {
    const count = db.getLabsCountByCourse(req.params.id);
    res.json({ count });
  } catch (error) {
    console.error('Ошибка получения количества лабораторных работ:', error);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// API для студентов - получение курсов
app.get('/api/student/courses', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  try {
    const courses = db.getStudentCourses(req.session.user.id);
    
    // Добавляем информацию о преподавателе
    const coursesWithTeachers = courses.map(course => {
      const teacher = db.findUserById(course.teacher_id);
      return {
        ...course,
        teacher_first_name: teacher?.firstName || 'Неизвестно',
        teacher_last_name: teacher?.lastName || 'Неизвестно'
      };
    });
    
    res.json({ courses: coursesWithTeachers });
  } catch (error) {
    console.error('Ошибка получения курсов студента:', error);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Поиск курсов
app.get('/api/courses/search', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ courses: [] });
    }

    const courses = db.searchCourses(query);
    
    // Добавляем информацию о преподавателе
    const coursesWithTeachers = courses.map(course => {
      const teacher = db.findUserById(course.teacher_id);
      return {
        ...course,
        teacher_first_name: teacher?.firstName || 'Неизвестно',
        teacher_last_name: teacher?.lastName || 'Неизвестно'
      };
    });
    
    res.json({ courses: coursesWithTeachers });
  } catch (error) {
    console.error('Ошибка поиска курсов:', error);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Запись на курс
app.post('/api/courses/:id/enroll', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  const { password } = req.body;
  const studentId = req.session.user.id;
  const courseId = req.params.id;

  try {
    const course = db.findCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    // Проверка пароля курса
    if (course.password && course.password !== password) {
      return res.status(401).json({ error: 'Неверный пароль курса' });
    }

    // Записываем студента
    await db.enrollStudent(courseId, studentId);

    res.json({ 
      success: true, 
      message: 'Вы успешно записались на курс'
    });
  } catch (error) {
    console.error('Ошибка записи на курс:', error);
    if (error.message === 'Студент уже записан на этот курс') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Ошибка базы данных' });
    }
  }
});

// Получение информации о курсе
app.get('/api/courses/:id/info', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  try {
    const course = db.findCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    const teacher = db.findUserById(course.teacher_id);
    const courseWithTeacher = {
      ...course,
      teacher_first_name: teacher?.firstName || 'Неизвестно',
      teacher_last_name: teacher?.lastName || 'Неизвестно'
    };

    res.json({ course: courseWithTeacher });
  } catch (error) {
    console.error('Ошибка получения информации о курсе:', error);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Все остальные GET запросы
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 База данных: JSON (${dataDir}/labconnect.json)`);
  console.log(`💾 Сессии: ${sessionsDir}`);
  console.log(`🌐 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`👥 Тестовые пользователи:`);
  console.log(`   👨‍🏫 Преподаватель: teacher / teacher12345`);
  console.log(`   👨‍🎓 Студент: student / student12345`);
});