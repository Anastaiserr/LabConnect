const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const fs = require('fs');
const app = express();
const multer = require('multer');


const PORT = process.env.PORT || 3000;

// Создаем папку для загрузок
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
// Настройка multer для правильной обработки русских имен
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Сохраняем с уникальным именем, но сохраняем оригинальное имя в metadata
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = uniqueSuffix + ext;
    
    console.log('💾 Сохранение файла:', {
        original: file.originalname,
        savedAs: safeName
    });
    
    cb(null, safeName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB лимит
  },
  fileFilter: function (req, file, cb) {
    // Сохраняем оригинальное имя файла
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, true);
  }
});

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

  // В классе JSONDatabase
  getAllCourses() {
  console.log('📂 Получение всех курсов из базы:', this.data.courses);
  return this.data.courses || [];
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
    
    // Сохраняем полную информацию о файлах, а не только имена
    if (labData.attached_files_info) {
        lab.attached_files_info = labData.attached_files_info;
    }
    
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

  // Получение студентов на курсе
getStudentsOnCourse(courseId) {
  const enrollmentIds = this.data.enrollments
    .filter(e => e.course_id == courseId)
    .map(e => e.student_id);
  
  return this.data.users.filter(u => 
    u.role === 'student' && enrollmentIds.includes(u.id)
  );
}

// Создание инвайт-ссылки
generateInviteLink(courseId) {
  const course = this.findCourseById(courseId);
  if (!course) return null;
  
  // Создаем уникальный код для приглашения
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  if (!this.data.invites) {
    this.data.invites = [];
  }
  
  // Удаляем старые инвайты для этого курса
  this.data.invites = this.data.invites.filter(i => i.course_id != courseId);
  
  const invite = {
    code: inviteCode,
    course_id: parseInt(courseId),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней
  };
  
  this.data.invites.push(invite);
  this.save();
  
  return inviteCode;
}

// Вход по инвайт-коду
enrollByInvite(inviteCode, studentId) {
  if (!this.data.invites) {
    throw new Error('Приглашение не найдено');
  }
  
  const invite = this.data.invites.find(i => i.code === inviteCode);
  if (!invite) {
    throw new Error('Приглашение не найдено');
  }
  
  // Проверяем срок действия
  if (new Date() > new Date(invite.expires_at)) {
    throw new Error('Срок действия приглашения истек');
  }
  
  // Записываем студента
  return this.enrollStudent(invite.course_id, studentId);
}

// Получение инвайт-кода курса
getCourseInvite(courseId) {
  if (!this.data.invites) return null;
  
  return this.data.invites.find(i => i.course_id == courseId);
}

// В класс JSONDatabase добавьте эти методы:

// Удаление лабораторной работы
deleteLab(labId) {
    const labIndex = this.data.labs.findIndex(l => l.id == labId);
    if (labIndex === -1) {
        throw new Error('Лабораторная работа не найдена');
    }
    
    this.data.labs.splice(labIndex, 1);
    
    // Также удаляем связанные сдачи работ
    this.data.submissions = this.data.submissions.filter(s => s.lab_id != labId);
    
    this.save();
    return true;
}

// Обновление лабораторной работы
updateLab(labId, labData) {
    const lab = this.data.labs.find(l => l.id == labId);
    if (!lab) {
        throw new Error('Лабораторная работа не найдена');
    }
    
    // Обновляем поля
    Object.assign(lab, labData);
    lab.updated_at = new Date().toISOString();
    
    this.save();
    return lab;
}

// Поиск студентов по имени и фамилии
searchStudents(query) {
    if (!query) return [];
    
    const searchTerm = query.toLowerCase().trim();
    if (searchTerm.length < 2) return []; // Минимум 2 символа для поиска
    
    return this.data.users
        .filter(u => u.role === 'student')
        .filter(u => {
            const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
            const fullNameReverse = `${u.lastName} ${u.firstName}`.toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   fullNameReverse.includes(searchTerm) ||
                   u.firstName.toLowerCase().includes(searchTerm) ||
                   u.lastName.toLowerCase().includes(searchTerm);
        });
}

// Принудительная запись студента на курс (для преподавателя)
forceEnrollStudent(courseId, studentId) {
    const course = this.findCourseById(courseId);
    if (!course) {
        throw new Error('Курс не найден');
    }
    
    const student = this.findUserById(studentId);
    if (!student || student.role !== 'student') {
        throw new Error('Студент не найден');
    }
    
    // Проверяем, не записан ли уже
    const existing = this.data.enrollments.find(
        e => e.course_id == courseId && e.student_id == studentId
    );
    
    if (existing) {
        throw new Error('Студент уже записан на этот курс');
    }
    
    const enrollment = {
        id: Date.now(),
        course_id: parseInt(courseId),
        student_id: parseInt(studentId),
        enrolled_at: new Date().toISOString(),
        enrolled_by: 'teacher' // Отметка, что записан преподавателем
    };
    
    this.data.enrollments.push(enrollment);
    this.save();
    return enrollment;
}

// Сдача лабораторной работы студентом
submitLabWork(submissionData) {
  const { lab_id, student_id, files, code, comment, student_files_info } = submissionData;
  
  const submission = {
      id: Date.now(),
      lab_id: parseInt(lab_id),
      student_id: parseInt(student_id),
      files: files || null,
      code: code || null,
      comment: comment || null,
      student_files_info: student_files_info || [], // Сохраняем полную информацию
      score: null,
      teacher_comment: null,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      checked_at: null
  };
  
  if (!this.data.submissions) {
      this.data.submissions = [];
  }
  
  this.data.submissions.push(submission);
  this.save();
  return submission;
}

// Получение работ для проверки преподавателем
getSubmissionsForTeacher(teacherId) {
    if (!this.data.submissions) return [];
    
    return this.data.submissions.filter(submission => {
        const lab = this.data.labs.find(l => l.id == submission.lab_id);
        if (!lab) return false;
        
        const course = this.data.courses.find(c => c.id == lab.course_id);
        return course && course.teacher_id == teacherId;
    });
}

// Получение работ по конкретной лабораторной работе
getSubmissionsByLab(labId) {
    if (!this.data.submissions) return [];
    return this.data.submissions.filter(s => s.lab_id == labId);
}

// Оценка работы преподавателем
gradeSubmission(submissionId, gradeData) {
    const submission = this.data.submissions.find(s => s.id == submissionId);
    if (!submission) {
        throw new Error('Работа не найдена');
    }
    
    submission.score = gradeData.score;
    submission.teacher_comment = gradeData.teacher_comment;
    submission.status = gradeData.status;
    submission.checked_at = new Date().toISOString();
    
    this.save();
    return submission;
}

// Получение сданных работ студента
getStudentSubmissions(studentId) {
    if (!this.data.submissions) return [];
    return this.data.submissions.filter(s => s.student_id == studentId);
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

// Правильная функция для обработки русских имен файлов
function normalizeFileName(filename) {
  if (!filename) return filename;
  
  let result = filename;
  
  // Декодируем URL-encoded символы
  try {
      result = decodeURIComponent(result);
  } catch (e) {
      // Если декодирование не удалось, пробуем другие кодировки
      try {
          result = Buffer.from(result, 'latin1').toString('utf8');
      } catch (e2) {
          console.log('Не удалось декодировать имя файла:', filename);
      }
  }
  
  // Заменяем ТОЛЬКО запрещенные символы, а не все не-латинские
  // Запрещенные символы в именах файлов: \ / : * ? " < > |
  const forbiddenChars = /[\\/:*?"<>|]/g;
  result = result.replace(forbiddenChars, '_');
  
  // Убираем начальные и конечные пробелы и точки
  result = result.trim();
  result = result.replace(/^\.+|\.+$/g, '');
  
  return result;
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

// Создание лабораторной работы с файлами
app.post('/api/labs', requireAuth, upload.array('files', 10), async (req, res) => {
  if (req.session.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Доступ только для преподавателей' });
  }

  const { name, description, course_id, template_code, start_date, deadline, max_score, requirements } = req.body;

  if (!name || !description || !course_id) {
      return res.status(400).json({ 
          error: 'Название, описание и ID курса обязательны'
      });
  }

  try {
      // Правильно обрабатываем русские названия файлов
      const attached_files_info = req.files ? req.files.map(file => {
          const originalname = normalizeFileName(file.originalname);
          
          console.log('📁 Обработка файла:', {
              original: file.originalname,
              normalized: originalname,
              size: file.size
          });
          
          return {
              filename: file.filename,
              originalname: originalname,
              path: file.path,
              size: file.size,
              mimetype: file.mimetype
          };
      }) : [];

      const lab = db.createLab({
          title: name,
          description,
          course_id: parseInt(course_id),
          template_code: template_code || null,
          start_date: start_date || new Date().toISOString(),
          deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_score: max_score ? parseInt(max_score) : 10,
          requirements: requirements || null,
          attached_files: attached_files_info.map(f => f.originalname).join(','),
          file_paths: attached_files_info.map(f => f.path).join(','),
          attached_files_info: attached_files_info
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

// Поиск курсов - ИСПРАВЛЕННАЯ ВЕРСИЯ
app.get('/api/courses/search', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  try {
      const { query } = req.query;
      console.log('🔍 Поиск курсов по запросу:', query);
      
      let courses = [];
      
      if (!query || query.trim() === '') {
          // Если запрос пустой - возвращаем ВСЕ курсы
          courses = db.getAllCourses();
          console.log('📂 Возвращаем все курсы:', courses.length);
      } else {
          // Если есть запрос - ищем по нему
          courses = db.searchCourses(query);
          console.log('🔎 Найдено курсов по запросу:', courses.length);
      }

      // Добавляем информацию о преподавателе
      const coursesWithTeachers = courses.map(course => {
          const teacher = db.findUserById(course.teacher_id);
          return {
              ...course,
              teacher_first_name: teacher?.firstName || 'Неизвестно',
              teacher_last_name: teacher?.lastName || 'Неизвестно'
          };
      });
      
      res.json({ 
          courses: coursesWithTeachers,
          total: coursesWithTeachers.length,
          query: query || 'all'
      });
  } catch (error) {
      console.error('❌ Ошибка поиска курсов:', error);
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
// Получение студентов на курсе
app.get('/api/courses/:id/students', requireAuth, async (req, res) => {
  try {
    const course = db.findCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    // Проверяем, что преподаватель имеет доступ к курсу
    if (req.session.user.role === 'teacher' && course.teacher_id != req.session.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const students = db.getStudentsOnCourse(req.params.id);
    
    // Убираем пароли из ответа
    const studentsWithoutPasswords = students.map(student => {
      const { password, ...studentWithoutPassword } = student;
      return studentWithoutPassword;
    });

    res.json({ students: studentsWithoutPasswords });
  } catch (error) {
    console.error('Ошибка получения студентов:', error);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Генерация инвайт-ссылки
app.post('/api/courses/:id/generate-invite', requireAuth, async (req, res) => {
  try {
    const course = db.findCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    // Проверяем, что преподаватель имеет доступ к курсу
    if (course.teacher_id != req.session.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const inviteCode = db.generateInviteLink(req.params.id);
    
    res.json({ 
      success: true, 
      inviteCode,
      inviteUrl: `${req.headers.origin}/student-courses.html?invite=${inviteCode}`,
      message: 'Ссылка-приглашение создана'
    });
  } catch (error) {
    console.error('Ошибка генерации инвайта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение текущего инвайт-кода
app.get('/api/courses/:id/invite', requireAuth, async (req, res) => {
  try {
    const course = db.findCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    // Проверяем, что преподаватель имеет доступ к курсу
    if (course.teacher_id != req.session.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const invite = db.getCourseInvite(req.params.id);
    
    res.json({ 
      inviteCode: invite?.code || null,
      inviteUrl: invite ? `${req.headers.origin}/student-courses.html?invite=${invite.code}` : null
    });
  } catch (error) {
    console.error('Ошибка получения инвайта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход по инвайт-коду (для студентов)
app.post('/api/courses/enroll-by-invite', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  const { inviteCode } = req.body;

  if (!inviteCode) {
    return res.status(400).json({ error: 'Код приглашения обязателен' });
  }

  try {
    await db.enrollByInvite(inviteCode, req.session.user.id);
    
    res.json({ 
      success: true, 
      message: 'Вы успешно записались на курс по приглашению'
    });
  } catch (error) {
    console.error('Ошибка записи по инвайту:', error);
    res.status(400).json({ error: error.message });
  }
});

// Проверка инвайт-кода
app.get('/api/courses/invite/:code/info', requireAuth, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  try {
    const inviteCode = req.params.code;
    
    if (!db.data.invites) {
      return res.status(404).json({ error: 'Приглашение не найдено' });
    }
    
    const invite = db.data.invites.find(i => i.code === inviteCode);
    if (!invite) {
      return res.status(404).json({ error: 'Приглашение не найдено' });
    }

    // Проверяем срок действия
    if (new Date() > new Date(invite.expires_at)) {
      return res.status(400).json({ error: 'Срок действия приглашения истек' });
    }

    const course = db.findCourseById(invite.course_id);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    const teacher = db.findUserById(course.teacher_id);
    
    res.json({ 
      course: {
        ...course,
        teacher_name: `${teacher?.firstName} ${teacher?.lastName}`
      },
      expires: invite.expires_at
    });
  } catch (error) {
    console.error('Ошибка проверки инвайта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение информации о курсе по ID
app.get('/api/courses/:id', requireAuth, async (req, res) => {
    try {
        const course = db.findCourseById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ error: 'Курс не найден' });
        }

        // Проверяем, что преподаватель имеет доступ к курсу
        if (req.session.user.role === 'teacher' && course.teacher_id != req.session.user.id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        res.json({ course });
    } catch (error) {
        console.error('Ошибка получения курса:', error);
        res.status(500).json({ error: 'Ошибка базы данных' });
    }
});

// Удаление лабораторной работы
app.delete('/api/labs/:id', requireAuth, async (req, res) => {
    try {
        const labId = req.params.id;
        const lab = db.data.labs.find(l => l.id == labId);
        
        if (!lab) {
            return res.status(404).json({ error: 'Лабораторная работа не найдена' });
        }

        // Проверяем, что преподаватель имеет доступ к курсу
        const course = db.findCourseById(lab.course_id);
        if (!course || course.teacher_id != req.session.user.id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        await db.deleteLab(labId);
        
        res.json({ 
            success: true, 
            message: 'Лабораторная работа удалена'
        });
    } catch (error) {
        console.error('Ошибка удаления лабораторной работы:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление лабораторной работы
app.put('/api/labs/:id', requireAuth, async (req, res) => {
    try {
        const labId = req.params.id;
        const lab = db.data.labs.find(l => l.id == labId);
        
        if (!lab) {
            return res.status(404).json({ error: 'Лабораторная работа не найдена' });
        }

        // Проверяем, что преподаватель имеет доступ к курсу
        const course = db.findCourseById(lab.course_id);
        if (!course || course.teacher_id != req.session.user.id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const updatedLab = await db.updateLab(labId, req.body);
        
        res.json({ 
            success: true, 
            message: 'Лабораторная работа обновлена',
            lab: updatedLab
        });
    } catch (error) {
        console.error('Ошибка обновления лабораторной работы:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Поиск студентов
app.get('/api/students/search', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ только для преподавателей' });
    }

    try {
        const { query } = req.query;
        const students = db.searchStudents(query);
        
        // Убираем пароли из ответа
        const studentsWithoutPasswords = students.map(student => {
            const { password, ...studentWithoutPassword } = student;
            return studentWithoutPassword;
        });

        res.json({ students: studentsWithoutPasswords });
    } catch (error) {
        console.error('Ошибка поиска студентов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Функция для исправления существующих данных
/*function fixExistingFileNames() {
  console.log('🔄 Исправление имен файлов в существующих данных...');
  
  let fixedCount = 0;
  
  // Исправляем лабораторные работы
  db.data.labs.forEach(lab => {
      if (lab.attached_files_info) {
          lab.attached_files_info.forEach(fileInfo => {
              if (fileInfo.originalname) {
                  const oldName = fileInfo.originalname;
                  const newName = normalizeFileName(oldName);
                  
                  if (oldName !== newName) {
                      fileInfo.originalname = newName;
                      fixedCount++;
                      console.log(`✅ Исправлено: "${oldName}" -> "${newName}"`);
                  }
              }
          });
          
          // Также обновляем поле attached_files
          if (lab.attached_files) {
              const filesArray = lab.attached_files.split(',');
              const normalizedFiles = filesArray.map(file => normalizeFileName(file.trim()));
              lab.attached_files = normalizedFiles.join(',');
          }
      }
  });
  
  // Исправляем сдачи работ
  if (db.data.submissions) {
      db.data.submissions.forEach(submission => {
          if (submission.student_files_info) {
              submission.student_files_info.forEach(fileInfo => {
                  if (fileInfo.originalname) {
                      const oldName = fileInfo.originalname;
                      const newName = normalizeFileName(oldName);
                      
                      if (oldName !== newName) {
                          fileInfo.originalname = newName;
                          fixedCount++;
                          console.log(`✅ Исправлено студенческое: "${oldName}" -> "${newName}"`);
                      }
                  }
              });
              
              // Также обновляем поле files
              if (submission.files) {
                  const filesArray = submission.files.split(',');
                  const normalizedFiles = filesArray.map(file => normalizeFileName(file.trim()));
                  submission.files = normalizedFiles.join(',');
              }
          }
      });
  }
  
  db.save();
  console.log(`✅ Исправлено ${fixedCount} имен файлов!`);
  return fixedCount;
}*/

// Временный эндпоинт для исправления имен файлов
/*app.post('/api/fix-filenames', (req, res) => {
  try {
      console.log('🔄 Запуск исправления имен файлов по запросу...');
      
      const fixedCount = fixExistingFileNames();
      
      res.json({ 
          success: true, 
          message: `Исправлено ${fixedCount} имен файлов`,
          fixedCount: fixedCount
      });
      
  } catch (error) {
      console.error('❌ Ошибка при исправлении имен файлов:', error);
      res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});*/

// Получение всех курсов (для студентов)
app.get('/api/courses/all', requireAuth, async (req, res) => {
  try {
      console.log('📚 Запрос всех курсов для студента:', req.session.user.id);
      
      if (req.session.user.role !== 'student') {
          return res.status(403).json({ error: 'Доступ только для студентов' });
      }

      const allCourses = db.getAllCourses();
      console.log('📊 Найдено курсов:', allCourses.length);
      
      // Получаем курсы студента
      const studentCourses = db.getStudentCourses(req.session.user.id);
      const studentCourseIds = studentCourses.map(c => c.id);
      
      // Добавляем информацию о преподавателе и проверяем, записан ли студент
      const coursesWithDetails = allCourses.map(course => {
          const teacher = db.findUserById(course.teacher_id);
          const isEnrolled = studentCourseIds.includes(course.id);
          
          return {
              ...course,
              teacher_first_name: teacher?.firstName || 'Неизвестно',
              teacher_last_name: teacher?.lastName || 'Неизвестно',
              is_enrolled: isEnrolled
          };
      });
      
      res.json({ 
          success: true,
          courses: coursesWithDetails
      });
      
  } catch (error) {
      console.error('❌ Ошибка получения курсов:', error);
      res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Принудительная запись студента на курс (для преподавателя)
app.post('/api/courses/:id/enroll-student', requireAuth, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { studentId } = req.body;

        console.log('🔄 Запись студента на курс:', { courseId, studentId });

        const course = db.findCourseById(courseId);
        if (!course) {
            console.log('❌ Курс не найден:', courseId);
            return res.status(404).json({ error: 'Курс не найден' });
        }

        // Проверяем, что преподаватель имеет доступ к курсу
        if (course.teacher_id != req.session.user.id) {
            console.log('❌ Доступ запрещен для преподавателя:', req.session.user.id);
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const student = db.findUserById(studentId);
        if (!student || student.role !== 'student') {
            console.log('❌ Студент не найден:', studentId);
            return res.status(404).json({ error: 'Студент не найден' });
        }

        // Проверяем, не записан ли уже
        const existing = db.data.enrollments.find(
            e => e.course_id == courseId && e.student_id == studentId
        );
        
        if (existing) {
            console.log('❌ Студент уже записан:', studentId);
            return res.status(400).json({ error: 'Студент уже записан на этот курс' });
        }

        const enrollment = {
            id: Date.now(),
            course_id: parseInt(courseId),
            student_id: parseInt(studentId),
            enrolled_at: new Date().toISOString(),
            enrolled_by: 'teacher'
        };
        
        if (!db.data.enrollments) {
            db.data.enrollments = [];
        }
        
        db.data.enrollments.push(enrollment);
        db.save();
        
        console.log('✅ Студент записан на курс:', enrollment);
        
        res.json({ 
            success: true, 
            message: 'Студент успешно записан на курс'
        });
    } catch (error) {
        console.error('❌ Ошибка записи студента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Сдача лабораторной работы с файлами
app.post('/api/labs/:id/submit', requireAuth, upload.array('files', 10), async (req, res) => {
  if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Доступ только для студентов' });
  }

  try {
      const labId = req.params.id;
      const { code, comment } = req.body;
      
      // Правильно обрабатываем русские названия файлов
      const student_files_info = req.files ? req.files.map(file => {
          const originalname = normalizeFileName(file.originalname);
          
          console.log('📁 Обработка файла студента:', {
              original: file.originalname,
              normalized: originalname,
              size: file.size
          });
          
          return {
              filename: file.filename,
              originalname: originalname,
              path: file.path,
              size: file.size,
              mimetype: file.mimetype
          };
      }) : [];

      if (student_files_info.length === 0 && !code) {
          return res.status(400).json({ error: 'Пожалуйста, прикрепите файлы или введите код' });
      }

      const submission = await db.submitLabWork({
          lab_id: labId,
          student_id: req.session.user.id,
          files: student_files_info.map(f => f.originalname).join(','),
          file_paths: student_files_info.map(f => f.path).join(','),
          student_files_info: student_files_info,
          code: code,
          comment: comment
      });
      
      res.json({ 
          success: true, 
          message: 'Работа успешно отправлена на проверку',
          submission
      });
  } catch (error) {
      console.error('Ошибка сдачи работы:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение работ для проверки (для преподавателя)
app.get('/api/teacher/submissions', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ только для преподавателей' });
    }

    try {
        const submissions = await db.getSubmissionsForTeacher(req.session.user.id);
        
        // Добавляем информацию о студентах и лабораторных работах
        const submissionsWithDetails = submissions.map(submission => {
            const student = db.findUserById(submission.student_id);
            const lab = db.data.labs.find(l => l.id == submission.lab_id);
            const course = lab ? db.data.courses.find(c => c.id == lab.course_id) : null;
            
            return {
                ...submission,
                student_name: student ? `${student.firstName} ${student.lastName}` : 'Неизвестно',
                student_group: student ? student.group : null,
                lab_title: lab ? lab.title : 'Неизвестно',
                course_name: course ? course.name : 'Неизвестно'
            };
        });
        
        res.json({ submissions: submissionsWithDetails });
    } catch (error) {
        console.error('Ошибка получения работ:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Оценка работы
app.post('/api/submissions/:id/grade', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Доступ только для преподавателей' });
    }

    try {
        const submissionId = req.params.id;
        const { score, teacher_comment, status } = req.body;
        
        // Проверяем, что преподаватель имеет доступ к этой работе
        const submission = db.data.submissions.find(s => s.id == submissionId);
        if (!submission) {
            return res.status(404).json({ error: 'Работа не найдена' });
        }
        
        const lab = db.data.labs.find(l => l.id == submission.lab_id);
        const course = lab ? db.data.courses.find(c => c.id == lab.course_id) : null;
        
        if (!course || course.teacher_id != req.session.user.id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        
        const updatedSubmission = await db.gradeSubmission(submissionId, {
            score: parseInt(score),
            teacher_comment,
            status
        });
        
        res.json({ 
            success: true, 
            message: 'Работа оценена',
            submission: updatedSubmission
        });
    } catch (error) {
        console.error('Ошибка оценки работы:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение сданных работ студента
app.get('/api/student/submissions', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для студентов' });
    }

    try {
        const submissions = await db.getStudentSubmissions(req.session.user.id);
        
        // Добавляем информацию о лабораторных работах
        const submissionsWithDetails = submissions.map(submission => {
            const lab = db.data.labs.find(l => l.id == submission.lab_id);
            const course = lab ? db.data.courses.find(c => c.id == lab.course_id) : null;
            
            return {
                ...submission,
                lab_title: lab ? lab.title : 'Неизвестно',
                course_name: course ? course.name : 'Неизвестно',
                max_score: lab ? lab.max_score : 10
            };
        });
        
        res.json({ submissions: submissionsWithDetails });
    } catch (error) {
        console.error('Ошибка получения работ студента:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// server.js - добавьте эти эндпоинты

// Удаление студента с курса
app.delete('/api/courses/:courseId/students/:studentId', requireAuth, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const studentId = req.params.studentId;
        
        console.log('🔄 Удаление студента', studentId, 'с курса', courseId);

        const course = db.findCourseById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Курс не найден' });
        }

        // Проверяем, что преподаватель имеет доступ к курсу
        if (course.teacher_id != req.session.user.id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        // Находим и удаляем запись о записи на курс
        const enrollmentIndex = db.data.enrollments.findIndex(
            e => e.course_id == courseId && e.student_id == studentId
        );
        
        if (enrollmentIndex === -1) {
            return res.status(404).json({ error: 'Студент не записан на этот курс' });
        }

        // Удаляем запись о записи
        db.data.enrollments.splice(enrollmentIndex, 1);
        
        // Также удаляем все сдачи работ этого студента по лабораторным этого курса
        if (db.data.submissions) {
            // Находим все лабораторные работы курса
            const courseLabs = db.data.labs.filter(lab => lab.course_id == courseId);
            const courseLabIds = courseLabs.map(lab => lab.id);
            
            // Удаляем сдачи работ студента по этим лабораторным
            db.data.submissions = db.data.submissions.filter(
                submission => !(courseLabIds.includes(submission.lab_id) && submission.student_id == studentId)
            );
        }

        db.save();
        
        console.log('✅ Студент удален с курса');
        
        res.json({ 
            success: true, 
            message: 'Студент удален с курса' 
        });
    } catch (error) {
        console.error('❌ Ошибка удаления студента:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение курсов студента с логированием
app.get('/api/student/courses', requireAuth, async (req, res) => {
    if (req.session.user.role !== 'student') {
        return res.status(403).json({ error: 'Доступ только для студентов' });
    }

    try {
        const courses = db.getStudentCourses(req.session.user.id);
        console.log('📊 Курсы студента', req.session.user.id, ':', courses);
        
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

// Получение информации о лабораторной работе с файлами
app.get('/api/labs/:id', requireAuth, async (req, res) => {
  try {
    const labId = req.params.id;
    const lab = db.data.labs.find(l => l.id == labId);
    
    if (!lab) {
      return res.status(404).json({ error: 'Лабораторная работа не найдена' });
    }

    // Проверяем доступ
    const course = db.findCourseById(lab.course_id);
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    // Для студентов проверяем, что они записаны на курс
    if (req.session.user.role === 'student') {
      const isEnrolled = db.data.enrollments.some(
        e => e.course_id == course.id && e.student_id == req.session.user.id
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }
    }

    // Для преподавателей проверяем, что это их курс
    if (req.session.user.role === 'teacher' && course.teacher_id != req.session.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Формируем информацию о файлах
    const attachedFiles = lab.attached_files ? lab.attached_files.split(',').map((filename, index) => ({
      originalname: filename.trim(),
      filename: lab.file_paths ? lab.file_paths.split(',')[index] : null
    })) : [];

    res.json({ 
      lab: {
        ...lab,
        attached_files_info: attachedFiles
      }
    });
  } catch (error) {
    console.error('Ошибка получения лабораторной работы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


// Скачивание файла преподавателя
app.get('/api/labs/:id/files/:filename', requireAuth, async (req, res) => {
  try {
      const labId = req.params.id;
      const filename = req.params.filename;
      
      console.log('📥 Запрос на скачивание файла преподавателя:', { labId, filename });
      
      const lab = db.data.labs.find(l => l.id == labId);
      if (!lab) {
          return res.status(404).json({ error: 'Лабораторная работа не найдена' });
      }

      // Проверяем доступ
      const course = db.findCourseById(lab.course_id);
      if (!course) {
          return res.status(404).json({ error: 'Курс не найден' });
      }

      // Для студентов проверяем, что они записаны на курс
      if (req.session.user.role === 'student') {
          const isEnrolled = db.data.enrollments.some(
              e => e.course_id == course.id && e.student_id == req.session.user.id
          );
          if (!isEnrolled) {
              return res.status(403).json({ error: 'Доступ запрещен' });
          }
      }

      // Находим файл в attached_files_info
      let fileInfo = null;
      if (lab.attached_files_info && lab.attached_files_info.length > 0) {
          fileInfo = lab.attached_files_info.find(f => 
              f.originalname === filename
          );
      }

      if (!fileInfo) {
          return res.status(404).json({ error: 'Файл не найден' });
      }

      const filePath = fileInfo.path || fileInfo.filename;
      
      if (!filePath || !fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Файл не найден на сервере' });
      }

      console.log('✅ Отправка файла:', filePath);
      
      // Правильные заголовки для русских названий
      const encodedFilename = encodeURIComponent(fileInfo.originalname);
      res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');
      
      res.sendFile(path.resolve(filePath));
      
  } catch (error) {
      console.error('❌ Ошибка скачивания файла:', error);
      res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});

// Скачивание файла студента (для преподавателя)
app.get('/api/submissions/:id/files/:filename', requireAuth, async (req, res) => {
  try {
      const submissionId = req.params.id;
      const filename = req.params.filename;
      
      console.log('📥 Запрос на скачивание файла студента:', { submissionId, filename });
      
      const submission = db.data.submissions.find(s => s.id == submissionId);
      if (!submission) {
          return res.status(404).json({ error: 'Работа не найдена' });
      }

      // Проверяем, что пользователь - преподаватель и имеет доступ
      if (req.session.user.role !== 'teacher') {
          return res.status(403).json({ error: 'Доступ только для преподавателей' });
      }

      const lab = db.data.labs.find(l => l.id == submission.lab_id);
      const course = lab ? db.findCourseById(lab.course_id) : null;
      
      if (!course || course.teacher_id != req.session.user.id) {
          return res.status(403).json({ error: 'Доступ запрещен' });
      }

      // Находим файл студента
      let fileInfo = null;
      if (submission.student_files_info && submission.student_files_info.length > 0) {
          fileInfo = submission.student_files_info.find(f => 
              f.originalname === filename
          );
      }

      if (!fileInfo) {
          return res.status(404).json({ error: 'Файл не найден' });
      }

      const filePath = fileInfo.path || fileInfo.filename;
      
      if (!filePath || !fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Файл не найден на сервере' });
      }

      console.log('✅ Отправка файла студента:', filePath);
      
      // Правильные заголовки для русских названий
      const encodedFilename = encodeURIComponent(fileInfo.originalname);
      res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');
      
      res.sendFile(path.resolve(filePath));
      
  } catch (error) {
      console.error('❌ Ошибка скачивания файла студента:', error);
      res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});


// Получение информации о submission с файлами
app.get('/api/submissions/:id', requireAuth, async (req, res) => {
  try {
    const submissionId = req.params.id;
    const submission = db.data.submissions.find(s => s.id == submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }

    // Проверяем доступ
    const lab = db.data.labs.find(l => l.id == submission.lab_id);
    const course = lab ? db.findCourseById(lab.course_id) : null;
    
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    // Для преподавателей проверяем, что это их курс
    if (req.session.user.role === 'teacher' && course.teacher_id != req.session.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Для студентов проверяем, что это их работа
    if (req.session.user.role === 'student' && submission.student_id != req.session.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    // Формируем информацию о файлах студента
    const studentFiles = submission.files ? submission.files.split(',').map((filename, index) => ({
      originalname: filename.trim(),
      filename: submission.file_paths ? submission.file_paths.split(',')[index] : null
    })) : [];

    res.json({ 
      submission: {
        ...submission,
        student_files_info: studentFiles,
        lab_title: lab ? lab.title : 'Неизвестно',
        course_name: course ? course.name : 'Неизвестно'
      }
    });
  } catch (error) {
    console.error('Ошибка получения работы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение данных для ведомости
app.get('/api/courses/:id/statement', requireAuth, async (req, res) => {
  try {
      const courseId = req.params.id;
      const course = db.findCourseById(courseId);
      
      if (!course) {
          return res.status(404).json({ error: 'Курс не найден' });
      }

      // Проверяем, что преподаватель имеет доступ к курсу
      if (course.teacher_id != req.session.user.id) {
          return res.status(403).json({ error: 'Доступ запрещен' });
      }

      // Получаем студентов курса
      const students = db.getStudentsOnCourse(courseId);
      
      // Получаем лабораторные работы курса
      const labs = db.getLabsByCourse(courseId);
      
      // Собираем данные об успеваемости
      const statementData = {
          course: {
              id: course.id,
              name: course.name,
              discipline: course.discipline,
              teacher: req.session.user
          },
          labs: labs.map(lab => ({
              id: lab.id,
              title: lab.title,
              max_score: lab.max_score,
              deadline: lab.deadline
          })),
          students: await Promise.all(students.map(async student => {
              const studentSubmissions = db.data.submissions?.filter(s => 
                  s.student_id == student.id && labs.some(l => l.id == s.lab_id)
              ) || [];
              
              const studentLabs = labs.map(lab => {
                  const submission = studentSubmissions.find(s => s.lab_id == lab.id);
                  return {
                      lab_id: lab.id,
                      lab_title: lab.title,
                      max_score: lab.max_score,
                      submitted: !!submission,
                      score: submission?.score || null,
                      status: submission?.status || 'not_submitted',
                      submitted_at: submission?.submitted_at,
                      checked_at: submission?.checked_at
                  };
              });
              
              const submittedLabs = studentLabs.filter(lab => lab.submitted);
              const checkedLabs = submittedLabs.filter(lab => lab.score !== null);
              const totalScore = checkedLabs.reduce((sum, lab) => sum + (lab.score || 0), 0);
              const averageScore = checkedLabs.length > 0 ? totalScore / checkedLabs.length : 0;
              
              return {
                  id: student.id,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  group: student.group,
                  email: student.email,
                  labs: studentLabs,
                  stats: {
                      total_labs: labs.length,
                      submitted_labs: submittedLabs.length,
                      checked_labs: checkedLabs.length,
                      average_score: Math.round(averageScore * 10) / 10,
                      total_score: totalScore
                  }
              };
          }))
      };

      res.json(statementData);
  } catch (error) {
      console.error('Ошибка формирования ведомости:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
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