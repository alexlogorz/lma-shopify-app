import express from 'express'
import { 
    getCourses, 
    getCourseByHandle, 
} from '../utils.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const session = res.locals.shopify.session;
        const courses = await getCourses(session);
        res.status(200).json(courses);
    } 
    catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

router.get('/:handle', async (req, res) => {
    try {
      const session = res.locals.shopify.session;
      const { handle } = req.params;

      const course = await getCourseByHandle(session, handle);
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
  
      res.status(200).json(course);
    } 
    catch (error) {
      console.error("Error in course details route:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
});


export default router;