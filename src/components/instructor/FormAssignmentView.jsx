import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

import { getOfferingById } from '../../api/offerings';
import { getCoordinators } from '../../api/coordinator';
import { getAssessmentMethods } from '../../api/assessmentMethods';
import { getInstructorPcSubmissions } from '../../api/instructorPcSubmissions';
import { getSubmissionGrades } from '../../api/courseOfferingGrades';
import { getInstructorImprovement } from '../../api/courseOfferingImprovements';

const FILE_UPLOAD_METHODS = ['Scoring Rubrics', 'Stakeholder Survey', 'Exit Survey'];
const EMBEDDED_METHOD = 'Embedded Assessment';

const GRADE_COLUMNS = [
  { key: 'a',       label: 'A'  },
  { key: 'a_minus', label: 'A-' },
  { key: 'b_plus',  label: 'B+' },
  { key: 'b',       label: 'B'  },
  { key: 'b_minus', label: 'B-' },
  { key: 'c_plus',  label: 'C+' },
  { key: 'c',       label: 'C'  },
  { key: 'c_minus', label: 'C-' },
  { key: 'd_plus',  label: 'D+' },
  { key: 'd',       label: 'D'  },
  { key: 'f',       label: 'F'  },
  { key: 'w',       label: 'W'  },
  { key: 'i',       label: 'I'  },
];

const defaultGrades = Object.fromEntries(GRADE_COLUMNS.map(g => [g.key, '']));

const FormAssignmentView = () => {
  const { formId } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [offering, setOffering] = React.useState(null);
  const [coordinators, setCoordinators] = React.useState([]);
  const [assessmentMethods, setAssessmentMethods] = React.useState([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = React.useState('');
  const [formData, setFormData] = React.useState({});
  const [grades, setGrades] = React.useState(defaultGrades);
  const [improvements, setImprovements] = React.useState('');

  React.useEffect(() => {
    getOfferingById(formId).then((res) => {
      const data = res.data;
      setOffering(data);
      if (data?.coordinator_id) setSelectedCoordinatorId(data.coordinator_id);
    });

    getCoordinators().then(r => setCoordinators(r.data));
    getAssessmentMethods().then(r => setAssessmentMethods(r.data));

    getSubmissionGrades(formId).then(r => {
      if (r.data) {
        const loaded = {};
        GRADE_COLUMNS.forEach(g => { loaded[g.key] = r.data[g.key] ?? ''; });
        setGrades(loaded);
      }
    }).catch(() => {});

    if (auth?.user?.id) {
      getInstructorPcSubmissions(auth.user.id, formId).then((res) => {
        const seed = {};
        res.data.forEach((record) => {
          seed[record.form_assignment_pc_id] = {
            assessment_method_id: record.assessment_method_id,
            average_score: record.average_score,
            percentage: record.percentage_of_students_meeting_performance_standard,
            performance_standard: record.performance_standard ?? 70,
            uploadPath: record.upload_path ?? null,
            assessment_type: record.assessment_type ?? '',
            question_number: record.question_number ?? '',
            comment: record.comment ?? '',
          };
        });
        setFormData(seed);
      }).catch(() => {});

      getInstructorImprovement(formId, auth.user.id).then(r => {
        if (r.data?.improvements) setImprovements(r.data.improvements);
      }).catch(() => {});
    }
  }, [formId]);

  const getMethodName = (methodId) =>
    assessmentMethods.find(m => m.id === Number(methodId))?.method_name ?? '';

  const gradeTotal = GRADE_COLUMNS.reduce((sum, g) => sum + (parseInt(grades[g.key], 10) || 0), 0);

  return (
    <Box sx={{ width: '100%', padding: 2 }}>

      {/* HEADER */}
      <Box className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-(--primary-color) text-3xl font-bold">Forms</h1>
          <p className="text-md">Manage and track your assigned forms</p>
        </div>

        <Box sx={{ minWidth: 250 }}>
          <FormControl fullWidth size="small" disabled>
            <InputLabel id="coordinator-label">Coordinator</InputLabel>
            <Select
              labelId="coordinator-label"
              value={selectedCoordinatorId}
              label="Coordinator"
            >
              <MenuItem value="">Select Coordinator</MenuItem>
              {coordinators
                ?.filter(c => c?.campuses?.some(campus => campus.id == offering?.campus_id))
                ?.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box className="flex items-center gap-3 mb-1">
        <p className="text-(--primary-color) font-bold text-lg">
          Form Submission: <box className="text-black font-extrabold"> {offering?.course?.course_code} - {offering?.course?.course_name}</box>
        </p>
        <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
          Submitted
        </span>
      </Box>
      <p className="text-(--primary-color) font-bold text-lg mb-6">
        Semester: <box className="text-black font-extrabold">{offering?.semester}</box>
      </p>

      {/* GRADE DISTRIBUTION */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        I. FINAL COURSE GRADE DISTRIBUTION
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        Please indicate the number of students getting each grade.
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 6 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              {GRADE_COLUMNS.map(g => (
                <TableCell key={g.key} align="center" sx={{ fontWeight: 'bold' }}>{g.label}</TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {GRADE_COLUMNS.map(g => (
                <TableCell key={g.key} align="center" sx={{ minWidth: 60 }}>
                  <TextField
                    type="number"
                    size="small"
                    value={grades[g.key]}
                    sx={{ width: 60 }}
                    disabled
                  />
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                {gradeTotal}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* PC ASSIGNMENTS TABLE */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>SO / PC</strong></TableCell>
              <TableCell><strong>Assignment</strong></TableCell>
              <TableCell><strong>PC</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {offering?.course?.sos?.length ? (
              offering.course.sos.map((so) => {
                const soAssignments = offering?.assignments?.filter(ass => ass.so_id == so.id);
                if (!soAssignments?.length) return null;

                return (
                  <React.Fragment key={so.id}>
                    <TableRow>
                      <TableCell colSpan={3} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                        {so.so_code} - {so.description}
                      </TableCell>
                    </TableRow>

                    {offering?.assignments?.filter(ass => ass.so_id == so.id).map((assignment) => (
                      <React.Fragment key={assignment.id}>
                        {assignment.assignment_pcs?.map((assignment_pc) => {
                          const entry = formData[assignment_pc.id] ?? {};
                          const methodName = getMethodName(entry.assessment_method_id);
                          const needsFile = FILE_UPLOAD_METHODS.includes(methodName);
                          const isEmbedded = methodName === EMBEDDED_METHOD;
                          const fileLabel = methodName === 'Scoring Rubrics' ? 'Attach Upload' : 'Survey Results';

                          return (
                            <React.Fragment key={assignment_pc.id}>
                              <TableRow>
                                <TableCell style={{ paddingLeft: '50px' }}>
                                  {assignment_pc.pc.pc_code} - {assignment_pc.pc.description}
                                </TableCell>
                                <TableCell />
                                <TableCell />
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  sx={{ paddingTop: 0, paddingBottom: 1.5, paddingLeft: '70px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}
                                >
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Assessment Method</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Average Score</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>% of Students Meeting PS</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Performance Standard</TableCell>
                                        {needsFile && (
                                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>{fileLabel}</TableCell>
                                        )}
                                        {isEmbedded && (
                                          <>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Assessment Type</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Question Number</TableCell>
                                          </>
                                        )}
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Comment</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell sx={{ minWidth: 180 }}>
                                          <FormControl fullWidth size="small" disabled>
                                            <Select value={entry.assessment_method_id ?? ''} displayEmpty>
                                              <MenuItem value=""><em>Select method</em></MenuItem>
                                              {assessmentMethods.map(m => (
                                                <MenuItem key={m.id} value={m.id}>{m.method_name}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 130 }}>
                                          <TextField
                                            type="number"
                                            size="small"
                                            value={entry.average_score ?? ''}
                                            fullWidth
                                            disabled
                                          />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 130 }}>
                                          <TextField
                                            type="number"
                                            size="small"
                                            value={entry.percentage ?? ''}
                                            fullWidth
                                            disabled
                                          />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 100 }}>
                                          <TextField
                                            type="number"
                                            size="small"
                                            value={entry.performance_standard ?? 70}
                                            fullWidth
                                            disabled
                                          />
                                        </TableCell>

                                        {needsFile && (
                                          <TableCell sx={{ minWidth: 180 }}>
                                            {entry.uploadPath ? (
                                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                File uploaded
                                              </Typography>
                                            ) : (
                                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                No file
                                              </Typography>
                                            )}
                                          </TableCell>
                                        )}

                                        {isEmbedded && (
                                          <>
                                            <TableCell sx={{ minWidth: 150 }}>
                                              <TextField size="small" value={entry.assessment_type ?? ''} fullWidth disabled />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 120 }}>
                                              <TextField type="number" size="small" value={entry.question_number ?? ''} fullWidth disabled />
                                            </TableCell>
                                          </>
                                        )}

                                        <TableCell sx={{ minWidth: 180 }}>
                                          <TextField
                                            size="small"
                                            multiline
                                            rows={2}
                                            value={entry.comment ?? ''}
                                            fullWidth
                                            disabled
                                          />
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">No data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* IMPROVEMENTS */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Improvements
        </Typography>
        <TextField
          multiline
          rows={5}
          fullWidth
          value={improvements}
          disabled
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/instructor/forms')}
          sx={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
        >
          Back to Forms
        </Button>
      </Box>

    </Box>
  );
};

export default FormAssignmentView;
