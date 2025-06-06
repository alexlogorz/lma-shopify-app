import { useEffect, useState } from "react";
import { DataTable, Spinner } from "@shopify/polaris";
import { Link } from "react-router-dom";
import styles from './StudentTable.module.css';

export default function StudentTable() {
  const [customers, setCustomers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load customers:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner accessibilityLabel="Loading" size="large" />;

  const rows = customers.map((customer) => [
    <Link to={`/students/${customer.id.split('/').pop()}`}>{customer?.name || 'N/A'}</Link>,
    customer.email,
    customer.onboarded ? "✅" : "❌"
  ]);

  return (
    <div className={styles.studentsTable}>
      <DataTable
        columnContentTypes={["text", "text", "text"]}
        headings={["Name", "Email", "Onboarded"]}
        rows={rows}
      />
    </div>
  );
}