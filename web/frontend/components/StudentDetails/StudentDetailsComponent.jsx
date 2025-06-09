import { useEffect, useState } from "react";
import { Text, Spinner, Card, List } from "@shopify/polaris";
import StudentProgress from "../StudentProgress/StudentProgress";
import styles from "./StudentDetailsComponent.module.css";

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
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Spinner accessibilityLabel="Loading student" size="large" />;
  if (!student || student.error) return <Text as="p">Student not found</Text>;

  return (
    <>
      <Card sectioned>
        <Text as="h3" variant="headingMd">{student?.name || "N/A"}</Text>
        <Text as="p">Email: {student.email}</Text>
        <Text as="p">Onboarded: {student.onboarded ? "✅" : "❌"}</Text>
      </Card>

      <Card title="Onboarding Submission" sectioned>
          <List className={styles.submissionList}>
            <List.Item><b>Phone:</b> {student.onboardingSubmission?.phone || "N/A"}</List.Item>
            <List.Item><b>Location:</b> {student.onboardingSubmission?.location || "N/A"}</List.Item>
            <List.Item><b>Preferred Start Date:</b> {student.onboardingSubmission?.preferred_start_date || "N/A"}</List.Item>
            <List.Item><b>Preferred Instructor:</b> {student.onboardingSubmission?.preferred_instructor || "N/A"}</List.Item>
            {/* <List.Item><b>Lesson Package:</b> {student.onboardingSubmission?.lesson_package || "N/A"}</List.Item> */}
            <List.Item><b>Goals:</b> {student.onboardingSubmission?.goals || "N/A"}</List.Item>
            <List.Item><b>Experience Level:</b> {student.onboardingSubmission?.experience_level || "N/A"}</List.Item>
            {/* <List.Item><b>Music Preferences:</b> {student.onboardingSubmission?.music_preferences || "N/A"}</List.Item> */}
            <List.Item><b>Weekly Hours Available:</b> {student.onboardingSubmission?.weekly_hours_available || "N/A"}</List.Item>
            {/* <List.Item><b>Equipment Access:</b> {student.onboardingSubmission?.equipment_access || "N/A"}</List.Item> */}
            {/* <List.Item><b>Additional Notes:</b> {student.onboardingSubmission?.additional_notes || "N/A"}</List.Item> */}
            <List.Item><b>Submitted At:</b> {new Date(student.onboardingSubmission?.created_at).toLocaleString() || "N/A"}</List.Item>
          </List>
        </Card>

      <StudentProgress customerId={id} />
    </>
  );
}
