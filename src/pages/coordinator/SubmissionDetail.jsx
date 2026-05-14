import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getCoordinatorImprovementById } from "../../api/coordinator";

const GRADE_COLUMNS = [
  { key: "a",       label: "A"  },
  { key: "a_minus", label: "A-" },
  { key: "b_plus",  label: "B+" },
  { key: "b",       label: "B"  },
  { key: "b_minus", label: "B-" },
  { key: "c_plus",  label: "C+" },
  { key: "c",       label: "C"  },
  { key: "c_minus", label: "C-" },
  { key: "d_plus",  label: "D+" },
  { key: "d",       label: "D"  },
  { key: "f",       label: "F"  },
  { key: "w",       label: "W"  },
  { key: "i",       label: "I"  },
];

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCoordinatorImprovementById(id);
        setRecord(res.data);
      } catch (err) {
        setError("Could not load this submission.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-gray-500">{error || "Record not found."}</p>
        <button
          className="text-sm text-(--primary-color) underline"
          onClick={() => navigate("/coordinator")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const grades = record.grade_distribution ?? {};
  const gradeTotal = GRADE_COLUMNS.reduce(
    (sum, g) => sum + (parseInt(grades[g.key], 10) || 0),
    0
  );
  const pcSubmissions = record.pc_submissions ?? [];

  return (
    <Box sx={{ width: "100%", padding: 2 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/coordinator")}
          className="text-(--primary-color) border border-(--primary-color) rounded-full px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <div>
          <p className="text-2xl font-bold text-(--primary-color)">
            {record.course_code} - {record.course_name}
          </p>
          <p className="text-sm text-gray-500">Submission Detail (Read Only)</p>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Instructor</p>
          <p className="font-medium">{record.instructor_name}</p>
        </div>
        <div>
          <p className="text-gray-500">Semester</p>
          <p className="font-medium">{record.semester}</p>
        </div>
      </div>

      {/* Grade Distribution */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
        I. Final Course Grade Distribution
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              {GRADE_COLUMNS.map((g) => (
                <TableCell key={g.key} align="center" sx={{ fontWeight: "bold" }}>
                  {g.label}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {GRADE_COLUMNS.map((g) => (
                <TableCell key={g.key} align="center">
                  {grades[g.key] ?? 0}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {gradeTotal}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* PC Submissions */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
        II. Performance Criteria Submissions
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>PC Code</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Assessment Method</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Avg Score</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>% Meeting PS</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Performance Standard</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Comment</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Upload</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pcSubmissions.length ? (
              pcSubmissions.map((pc, idx) => (
                <TableRow key={idx}>
                  <TableCell>{pc.pc_code}</TableCell>
                  <TableCell>{pc.pc_description}</TableCell>
                  {/* <TableCell>{pc.assessment_method}</TableCell> */}
                  <TableCell>
                    <div>{pc.assessment_method || "—"}</div>

                    {pc.assessment_method === "Embedded Assessment" && (
                      <div className="text-xs text-gray-500 mt-1 leading-5">
                        <div>Assessment: {pc.assessment_type || "—"}</div>
                        <div>Question: {pc.question_number || "—"}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell align="center">{pc.average_score}</TableCell>
                  <TableCell align="center">
                    <span
                      style={{
                        color: Number(pc.percentage_meeting_standard) < 70 ? "#d32f2f" : "#2e7d32",
                        fontWeight: "bold",
                      }}
                    >
                      {pc.percentage_meeting_standard}%
                    </span>
                  </TableCell>
                  <TableCell align="center">{pc.performance_standard ?? 70}</TableCell>
                  <TableCell>{pc.comment || "—"}</TableCell>
                  <TableCell align="center">
                    {pc.upload_path ? (
                      <a
                        href={`http://localhost:5000/storage/${pc.upload_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-(--primary-color) underline"
                      >
                        View File
                      </a>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: "text.secondary" }}>
                  No PC submissions recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Improvements */}
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
        III. Improvements
      </Typography>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <p className="whitespace-pre-line text-sm text-gray-700">
          {record.improvement_text || "No improvements submitted by this instructor."}
        </p>
      </div>
    </Box>
  );
};

export default SubmissionDetail;
