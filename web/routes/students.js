import express from 'express';
import { 
  getCustomersWithMetafields, 
  getStudentById, 
  getCourseByHandle, 
  getRegisteredCourses,
  getCompletedLessons,
  insertOnboardingSubmission,
  updateOnboardedMetafield
} from '../utils.js';
import sqlite3 from 'sqlite3';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';

const DB_PATH = `${process.cwd()}/database.sqlite`;
const sessionStorage = new SQLiteSessionStorage(DB_PATH);
const db = new sqlite3.Database(DB_PATH);

const router = express.Router();


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

router.post('/submit-onboarding', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId or shop' });
    }
    console.log(`offline_${process.env.SHOPIFY_SHOP_NAME}`)
    // Load offline session from your SQLite session storage
    const session = await sessionStorage.loadSession(`offline_${process.env.SHOPIFY_SHOP_NAME}`);
    
    if (!session?.accessToken) {
      return res.status(401).json({ error: 'Could not load offline session' });
    }

    await insertOnboardingSubmission(db, req.body);
    await updateOnboardedMetafield(session, customerId, true);

    res.status(200).json({ message: 'Onboarding submitted and metafield updated' });
  } 
  catch (err) {
    console.error('Onboard Submission Error:', err.message);
    res.status(500).json({ error: 'Failed to submit onboarding or update metafield' });
  }
});





export default router;