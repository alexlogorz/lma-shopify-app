import { useParams } from "react-router-dom";
import { Page } from "@shopify/polaris";
import CourseDetailsComponent from "../components/CourseDetails/CourseDetailsComponent"; // adjust path if needed

export default function CourseDetails() {
  const { handle } = useParams();

  return (
    <Page title="Course Details">
        <CourseDetailsComponent handle={handle} />
    </Page>
  );
}