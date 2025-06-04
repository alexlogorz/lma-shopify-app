import { useEffect, useState } from "react";
import { Text, Spinner, Card } from "@shopify/polaris";
import StudentProgress from "../StudentProgress/StudentProgress";

export default function StudentDetailsComponent({ id }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${id}`) 
      .then((res) => res.json())
      .then((data) => {
        setStudent(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Spinner accessibilityLabel="Loading student" size="large" />;
  if (!student || student.error) return <Text as="p">Student not found</Text>;

  return (
    <>
      <Card sectioned>
        <Text as="h3" variant="headingMd">{student.name}</Text>
        <Text as="p">Email: {student.email}</Text>
        <Text as="p">Onboarded: {student.onboarded ? "✅" : "❌"}</Text>
      </Card>
      <StudentProgress customerId={id}/>
    </>
  );
}