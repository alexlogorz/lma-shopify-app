// src/components/StudentDetailsComponent.jsx
import { useEffect, useState } from "react";
import { Spinner, Text, Heading, Card, Divider, Layout, Box } from "@shopify/polaris";

export default function CourseDetailsComponent({ handle }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${handle}`) 
      .then((res) => res.json())
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [handle]);

  if (loading) return <Spinner accessibilityLabel="Loading course" size="large" />;
  if (!course || course.error) return <Text as="p">Course not found</Text>;

  return (
    <Layout>
  
      {/* Course Title + Description */}
      <Layout.Section>
        <Card sectioned>
          <Text variant="headingLg" as="h1">{course.title}</Text>
          <Text variant="bodyMd" as="p" alignment="start">
            {course.description}
          </Text>
        </Card>
      </Layout.Section>
  
      {/* Modules + Lessons */}
      {course.modules.map((mod, index) => (
        <Layout.Section key={mod.id}>
          <Card sectioned>
            <Text variant="headingMd" as="h2">{`Module ${index + 1}: ${mod.title}`}</Text>
            <Text variant="bodyMd">{mod.description}</Text>
  
            {mod.lessons && mod.lessons.length > 0 && (
              <Box paddingBlockStart="400">
                <Heading element="h5">Lessons</Heading>
                <ul>
                  {mod.lessons.map((lesson, i) => (
                    <li key={i}>
                      <strong>{lesson.title}</strong>: {lesson.description}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Card>
        </Layout.Section>
      ))}
  
    </Layout>
  );
  
}