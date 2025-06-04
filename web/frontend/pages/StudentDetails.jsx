import { useParams } from "react-router-dom";
import { Page } from "@shopify/polaris";
import StudentDetailsComponent from "../components/StudentDetails/StudentDetailsComponent"; // adjust path if needed

export default function StudentDetails() {
  const { id } = useParams();

  return (
    <Page title="Student Details">
        <StudentDetailsComponent id={id} />
    </Page>
  );
}