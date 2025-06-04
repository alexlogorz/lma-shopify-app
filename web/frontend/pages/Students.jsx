import { Page } from "@shopify/polaris";
import StudentTable from "../components/StudentTable/StudentTable"; // adjust path if needed

export default function Students() {
  return (
    <Page title="Students">
      <StudentTable />
    </Page>
  );
}