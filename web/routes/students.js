import express from 'express';
import { 
  getCustomersWithMetafields, 
  getStudentById, 
  getCourseByHandle, 
  getRegisteredCourses,
  getCompletedLessons
} from '../utils.js';
import sqlite3 from 'sqlite3';

const DB_PATH = `${process.cwd()}/database.sqlite`;

const router = express.Router();
const db = new sqlite3.Database(DB_PATH);

app.use(bodyParser.urlencoded({ extended: true })); 

router.get('/', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const customers = await getCustomersWithMetafields(session);
    res.status(200).json(customers);
  } 
  catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const customerId = req.query.customerId;

    if (!customerId) return res.status(400).json({ error: "customerId is required" });

    const [registeredCourseHandles, completedLessonIds] = await Promise.all([
      getRegisteredCourses(session, customerId),
      getCompletedLessons(session, customerId),
    ]);

    const courses = [];

    for (const handle of registeredCourseHandles) {
      const course = await getCourseByHandle(session, handle);
      for (const mod of course.modules || []) {
        for (const lesson of mod.lessons || []) {
          lesson.completed = completedLessonIds.includes(lesson.id);
        }
      }
      courses.push(course);
    }

    res.status(200).json({ courses });
  } 
  catch (err) {
    console.error("Error building student progress:", err);
    res.status(500).json({ error: "Failed to load student progress" });
  }
});

router.get('/:id', async (req, res) => {
  const session = res.locals.shopify.session;
  const { id } = req.params;

  try {
    const student = await getStudentById(session, id);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.status(200).json(student);
  } 
  catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

router.post('/submit-onboarding', (req, res) => {
  const {
    customerId,
    firstName,
    lastName,
    email,
    phone,
    studentLoc,
    prefStartDate,
    prefInstructor,
    lessonPackage,
    goals,
    expLevel,
    musicPreferences,
    hoursAvail,
    equipmentAccess,
    otherNotes, // if you later name the textarea for specific notes
  } = req.body;

  const query = `
    INSERT INTO onboarding_submissions (
      customer_id,
      first_name,
      last_name,
      email,
      phone,
      location,
      preferred_start_date,
      preferred_instructor,
      lesson_package,
      goals,
      experience_level,
      music_preferences,
      hours_available,
      equipment_access,
      other_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    customerId,
    firstName,
    lastName,
    email,
    phone,
    studentLoc,
    prefStartDate,
    prefInstructor,
    lessonPackage,
    goals,
    expLevel,
    Array.isArray(musicPreferences)
      ? musicPreferences.join(', ')
      : musicPreferences,
    hoursAvail,
    equipmentAccess,
    otherNotes || '',
  ];

  db.run(query, params, (err) => {
    if (err) {
      console.error('Onboard Submission Error:', err.message);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    res.status(200).json({ message: 'Onboarding form submitted successfully' });
  });
});



export default router;