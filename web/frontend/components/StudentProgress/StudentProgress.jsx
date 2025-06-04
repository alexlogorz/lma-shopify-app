import React, { useEffect, useState } from "react";
import {
  Spinner,
  Card,
  Layout,
  Text,
  Heading,
  Badge,
  Box,
  DataTable,
  Divider,
  HorizontalStack,
  Button
} from "@shopify/polaris";
import styles from "./StudentProgress.module.css";

export default function StudentProgress({ customerId }) {
  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/progress?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load student progress:", err);
        setLoading(false);
      });
  }, [customerId]);

  if (loading) return <Spinner accessibilityLabel="Loading progress" size="large" />;
  if (!courses.length) return <Text>No registered courses found.</Text>;

  return (
    <Box paddingBlockEnd="10">
      {courses.map((course) => (
        <Layout key={course.id} sectioned>
        
            <Box paddingBlockEnd="6" paddingBlockStart="6">
                <Text variant="headingLg" as="h1">Course Progress</Text>
            </Box>
            
            <Card sectioned>
                <Box>
                  <Text variant="headingLg" as="h2">Title: {course.title}</Text>
                </Box>

                {course.modules.map((mod) => {
                    const rows = mod.lessons.map((lesson) => [
                        <Badge status={lesson.completed ? "success" : "critical"}>
                            {lesson.completed ? "Completed" : "Incomplete"}
                        </Badge>,
                        <Text variant='bodyMd' as="p">{lesson.title}</Text>,
                        <Button>Done</Button>
                    ]);

                    return (
                        <Box key={mod.id} style={{ border: '1px solid #d4d4d4', borderRadius: '4px', padding: '16px', marginBottom: '20px' }}>
                            <Text variant="headingMd" as="h2">Module: {mod.title}</Text>
                            <DataTable
                                columnContentTypes={["text", "text", "text"]}
                                headings={["Status", "Lesson", "Edit"]}
                                rows={rows}
                                verticalAlign="top"
                                hideScrollIndicator
                            />
                        </Box>
                    );
                })}
            </Card>
        </Layout>
      ))}
    </Box>
  );
}