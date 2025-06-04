// src/pages/Courses.jsx
import { useEffect, useState } from "react";
import { Page, DataTable, Spinner, Text } from "@shopify/polaris";
import styles from "./CourseTable.module.css"; 
import { Link } from "react-router-dom";

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner accessibilityLabel="Loading" size="large" />;

  const rows = courses.map((course) => [
    <Link to={`/courses/${course.handle}`}>{course.title}</Link>,
    course.handle,
    course.description,
  ]);

  return (
    <div className={styles.courseTable}>
        <DataTable
            columnContentTypes={["text", "text", "text"]}
            headings={["Title", "Slug", "Description"]}
            rows={rows}
        />
    </div>
  );
}