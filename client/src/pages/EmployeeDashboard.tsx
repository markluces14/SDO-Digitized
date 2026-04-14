import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../lib/api";
import { getCurrentUser } from "../lib/auth";

/* ---------- types ---------- */
type Employee = {
  id: number;
  employee_no: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  position: string;
  department: string;
  birthdate?: string | null;
  date_hired?: string | null;
  place_of_birth?: string | null;
};

type Document = {
  id: number;
  title: string;
  deleted_at?: string | null;
};

/* ============================================================= */

export default function EmployeeDashboard() {
  const me = getCurrentUser();
  const myEmpId = me?.employee_id || null;

  const [emp, setEmp] = useState<Employee | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!myEmpId) return;
    setLoading(true);
    setErr(null);
    try {
      const empRes = await api.get(`/employees/${myEmpId}`);
      setEmp(empRes.data);

      const docsRes = await api.get(`/employees/${myEmpId}/documents`);
      setDocs(docsRes.data?.data ?? docsRes.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load.");
      setEmp(null);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [myEmpId]);

  const fullName =
    emp &&
    [emp.last_name, [emp.first_name, emp.middle_name].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");

  const uploadedDocs = docs.filter((d) => !d.deleted_at);

  const goToMyFile = () => {
    if (!myEmpId) return;
    window.location.hash = `#/employee/${myEmpId}`;
  };

  return (
    <div className="light-detail">
      <div className="page-header">
        <div className="page-title">My Dashboard</div>
      </div>

      {err && (
        <div
          style={{
            margin: "0 0 12px",
            padding: "10px 12px",
            border: "1px solid #f1caca",
            background: "#fff4f4",
            color: "#7d1b1b",
            borderRadius: 10,
          }}
        >
          {err}
        </div>
      )}

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        {loading && <div className="muted">Loading…</div>}
        {emp && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <strong>Name:</strong> {fullName}
            </div>
            <div>
              <strong>Employee #:</strong> {emp.employee_no}
            </div>
            <div>
              <strong>Email:</strong> {emp.email}
            </div>
            <div>
              <strong>Position:</strong> {emp.position}
            </div>
            <div>
              <strong>School/Office:</strong> {emp.department}
            </div>
            <div>
              <strong>Birthdate:</strong>{" "}
              {emp.birthdate
                ? dayjs(emp.birthdate).format("MMMM DD, YYYY")
                : "—"}
            </div>
            <div>
              <strong>Date Hired:</strong>{" "}
              {emp.date_hired
                ? dayjs(emp.date_hired).format("MMMM DD, YYYY")
                : "—"}
            </div>
            <div>
              <strong>Place of Birth:</strong> {emp.place_of_birth || "—"}
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files card */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Uploaded Files</h3>

          <button className="btn btn-outline" onClick={goToMyFile}>
            Go to My File
          </button>
        </div>

        <div style={{ height: 10 }} />

        {loading ? (
          <div className="muted">Loading…</div>
        ) : uploadedDocs.length === 0 ? (
          <div className="muted">No uploaded files yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="muted">
              Uploaded: <strong>{uploadedDocs.length}</strong>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 10,
              }}
            >
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    border: "1px solid #e9eff7",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  {doc.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
