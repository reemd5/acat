import React from 'react';
import {
  Box,
  Button,
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
  Paper
} from '@mui/material';
import { useParams } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import CustomSnackbar from '../CustomSnackbar';
import { showSnackbar } from '../../utils/snackbar';

import { getOfferingById, submitInstructorForm } from '../../api/offerings';
import { getCoordinators } from '../../api/coordinator';
import { getSOs } from '../../api/so';
import { getAssessmentMethods } from '../../api/assessmentMethods';
import { getInstructorPcSubmissions, submitInstructorPcData, updateOfferingCoordinator } from '../../api/instructorPcSubmissions';
import { getSubmissionGrades, saveSubmissionGrades } from '../../api/courseOfferingGrades';
import { getInstructorImprovement, saveInstructorImprovement } from '../../api/courseOfferingImprovements';

const FILE_UPLOAD_METHODS = ['Scoring Rubrics', 'Stakeholder Survey', 'Exit Survey'];
const EMBEDDED_METHOD = 'Embedded Assessment';
const MIN_IMPROVEMENT_CHARS = 150;
// const MIN_IMPROVEMENT_WORDS = 150;

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

// const countWords = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const countChars = (text) => text.length;
const FormAssignmentSubmission = () => {
  const { formId } = useParams();
  const { auth } = useAuth();

  const [offering, setOffering] = React.useState(null);
  const [coordinators, setCoordinators] = React.useState([]);
  const [sos, setSos] = React.useState([]);
  const [assessmentMethods, setAssessmentMethods] = React.useState([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

  // keyed by form_assignment_pc_id
  const [formData, setFormData] = React.useState({});
  // grade distribution — common per offering
  const [grades, setGrades] = React.useState(defaultGrades);
  // improvements — per instructor
  const [improvements, setImprovements] = React.useState('');

  React.useEffect(() => {
    getOfferingById(formId, auth?.user?.id).then((response) => {
      const data = response.data;
      setOffering(data);
      if (data?.coordinator_id) setSelectedCoordinatorId(data.coordinator_id);
      if (data?.is_submitted) setIsSubmitted(true);
    });

    getCoordinators().then(r => setCoordinators(r.data));
    getSOs().then(r => setSos(r.data));
    getAssessmentMethods().then(r => setAssessmentMethods(r.data));

    // Load grade distribution (common per offering)
    getSubmissionGrades(formId).then(r => {
      if (r.data) {
        const loaded = {};
        GRADE_COLUMNS.forEach(g => { loaded[g.key] = r.data[g.key] ?? ''; });
        setGrades(loaded);
      }
    }).catch(() => {});

    if (auth?.user?.id) {
      // Load PC submissions
      getInstructorPcSubmissions(auth.user.id, formId).then((response) => {
        const seed = {};
        response.data.forEach((record) => {
          seed[record.form_assignment_pc_id] = {
            assessment_method_id: record.assessment_method_id,
            average_score: record.average_score,
            percentage: record.percentage_of_students_meeting_performance_standard,
            performance_standard: record.performance_standard ?? 70,
            uploadPath: record.upload_path ?? null,
            upload: null,
            assessment_type: record.assessment_type ?? '',
            question_number: record.question_number ?? '',
            comment: record.comment ?? '',
          };
        });
        setFormData(seed);
      }).catch(() => {});

      // Load instructor improvements
      getInstructorImprovement(formId, auth.user.id).then(r => {
        if (r.data?.improvements) setImprovements(r.data.improvements);
      }).catch(() => {});
    }
  }, [formId]);

  const getMethodName = (methodId) =>
    assessmentMethods.find(m => m.id === Number(methodId))?.method_name ?? '';

  const handleSelectCoordinator = (id) => {
    setSelectedCoordinatorId(id);
    if (id) {
      updateOfferingCoordinator(formId, id).catch(err => {
        showSnackbar(setSnackbar, err?.response?.data?.message ?? 'Failed to update coordinator.', 'error');
      });
    }
  };

  const handleFieldChange = (pcId, field, value) => {
    setFormData(prev => ({ ...prev, [pcId]: { ...prev[pcId], [field]: value } }));
  };

  const handleFileChange = (pcId, file) => {
    setFormData(prev => ({
      ...prev,
      [pcId]: { ...prev[pcId], upload: file, uploadPath: prev[pcId]?.uploadPath ?? null },
    }));
  };

  const handleGradeChange = (key, value) => {
    setGrades(prev => ({ ...prev, [key]: value }));
  };

  const gradeTotal = GRADE_COLUMNS.reduce((sum, g) => sum + (parseInt(grades[g.key], 10) || 0), 0);
  // const wordCount = countWords(improvements);
  const charCount = countChars(improvements);
  const requiresImprovements = Object.values(formData).some(
    entry => entry.percentage !== '' && entry.percentage !== undefined && Number(entry.percentage) < 70
  );

  // Build FormData requests for all assignments. mode: 'save' | 'submit'
  const buildPcRequests = (allAssignments, mode) => {
    return allAssignments.map(assignment => {
      const fd = new FormData();
      fd.append('instructor_id', auth?.user?.id);
      fd.append('form_assignment_id', assignment.id);
      fd.append('mode', mode);

      let idx = 0;
      assignment.assignment_pcs.forEach((apc) => {
        const entry = formData[apc.id] ?? {};

        // In save mode, skip entries with no method chosen
        if (mode === 'save' && !entry.assessment_method_id) return;

        fd.append(`submissions[${idx}][form_assignment_pc_id]`, apc.id);
        fd.append(`submissions[${idx}][assessment_method_id]`, entry.assessment_method_id ?? '');
        fd.append(`submissions[${idx}][average_score]`, entry.average_score ?? '');
        fd.append(`submissions[${idx}][percentage_of_students_meeting_performance_standard]`, entry.percentage ?? '');
        fd.append(`submissions[${idx}][performance_standard]`, entry.performance_standard ?? 70);
        if (entry.assessment_type) fd.append(`submissions[${idx}][assessment_type]`, entry.assessment_type);
        if (entry.question_number)  fd.append(`submissions[${idx}][question_number]`, entry.question_number);
        if (entry.comment)          fd.append(`submissions[${idx}][comment]`, entry.comment);
        if (entry.upload)           fd.append(`file_${apc.id}`, entry.upload);
        idx++;
      });

      return submitInstructorPcData(fd);
    });
  };

  const handleSaveForm = () => {
    if (requiresImprovements && charCount > 0 && charCount < MIN_IMPROVEMENT_CHARS) {
      showSnackbar(setSnackbar, `Improvements must be at least ${MIN_IMPROVEMENT_CHARS} characters when any PC is below 70%.`, 'error');
      return;
    }

    const allAssignments = offering?.assignments?.filter(a => a.assignment_pcs?.length) ?? [];

    // Validate conditional fields only for entries that have a method chosen
    for (const assignment of allAssignments) {
      for (const apc of assignment.assignment_pcs) {
        const entry = formData[apc.id] ?? {};
        if (!entry.assessment_method_id) continue; 
        const methodName = getMethodName(entry.assessment_method_id);
        if (FILE_UPLOAD_METHODS.includes(methodName) && !entry.upload && !entry.uploadPath) {
          showSnackbar(setSnackbar, `A file upload is required for ${apc.pc.pc_code} (${methodName}).`, 'error');
          return;
        }
        if (methodName === EMBEDDED_METHOD && (!entry.assessment_type || !entry.question_number)) {
          showSnackbar(setSnackbar, `Assessment type and question number are required for ${apc.pc.pc_code}.`, 'error');
          return;
        }
      }
    }

    const pcRequests = buildPcRequests(allAssignments, 'save');
    const gradePayload = Object.fromEntries(
      GRADE_COLUMNS.map(g => [g.key, parseInt(grades[g.key], 10) || 0])
    );

    Promise.all([...pcRequests, saveSubmissionGrades(formId, gradePayload), saveInstructorImprovement(formId, auth?.user?.id, improvements)])
      .then(() => {
        showSnackbar(setSnackbar, 'Form saved successfully.', 'success');
        // Refresh upload paths
        if (auth?.user?.id) {
          getInstructorPcSubmissions(auth.user.id, formId).then((response) => {
            setFormData(prev => {
              const next = { ...prev };
              response.data.forEach((record) => {
                next[record.form_assignment_pc_id] = {
                  ...next[record.form_assignment_pc_id],
                  uploadPath: record.upload_path ?? null,
                  upload: null,
                };
              });
              return next;
            });
          });
        }
      })
      .catch(err => {
        showSnackbar(setSnackbar, err?.response?.data?.message ?? 'Failed to save form.', 'error');
      });
  };

  const handleSubmitForm = () => {
    if (!selectedCoordinatorId) {
      showSnackbar(setSnackbar, 'Please select a coordinator before submitting.', 'error');
      return;
    }

    const allAssignments = offering?.assignments?.filter(a => a.assignment_pcs?.length) ?? [];

    // Full validation required
    for (const assignment of allAssignments) {
      for (const apc of assignment.assignment_pcs) {
        const entry = formData[apc.id] ?? {};
        const methodName = getMethodName(entry.assessment_method_id);

        if (!entry.assessment_method_id) {
          showSnackbar(setSnackbar, `Select an assessment method for ${apc.pc.pc_code}.`, 'error');
          return;
        }
        if (!entry.average_score && entry.average_score !== 0) {
          showSnackbar(setSnackbar, `Enter the average score for ${apc.pc.pc_code}.`, 'error');
          return;
        }
        if (!entry.percentage && entry.percentage !== 0) {
          showSnackbar(setSnackbar, `Enter the % of students meeting PS for ${apc.pc.pc_code}.`, 'error');
          return;
        }
        if (FILE_UPLOAD_METHODS.includes(methodName) && !entry.upload && !entry.uploadPath) {
          showSnackbar(setSnackbar, `A file upload is required for ${apc.pc.pc_code} (${methodName}).`, 'error');
          return;
        }
        if (methodName === EMBEDDED_METHOD && (!entry.assessment_type || !entry.question_number)) {
          showSnackbar(setSnackbar, `Assessment type and question number are required for ${apc.pc.pc_code}.`, 'error');
          return;
        }
      }
    }

    if (requiresImprovements && charCount < MIN_IMPROVEMENT_CHARS) {
      showSnackbar(setSnackbar, `Improvements must be at least ${MIN_IMPROVEMENT_CHARS} characters when any PC is below 70%.`, 'error');
      return;
    }

    const pcRequests = buildPcRequests(allAssignments, 'submit');
    const gradePayload = Object.fromEntries(
      GRADE_COLUMNS.map(g => [g.key, parseInt(grades[g.key], 10) || 0])
    );

    Promise.all([...pcRequests, saveSubmissionGrades(formId, gradePayload), saveInstructorImprovement(formId, auth?.user?.id, improvements)])
      .then(() => {
        return submitInstructorForm(formId, auth?.user?.id);
      })
      .then(() => {
        setIsSubmitted(true);
        showSnackbar(setSnackbar, 'Form submitted successfully.', 'success');
        if (auth?.user?.id) {
          getInstructorPcSubmissions(auth.user.id, formId).then((response) => {
            setFormData(prev => {
              const next = { ...prev };
              response.data.forEach((record) => {
                next[record.form_assignment_pc_id] = {
                  ...next[record.form_assignment_pc_id],
                  uploadPath: record.upload_path ?? null,
                  upload: null,
                };
              });
              return next;
            });
          });
        }
      })
      .catch(err => {
        showSnackbar(setSnackbar, err?.response?.data?.message ?? 'Failed to submit form.', 'error');
      });
  };

  return (
    <Box sx={{ width: "100%", padding: 2 }}>

      {/* HEADER + COORDINATOR */}
      <Box className="flex justify-between items-center mb-6">
        <div className='flex flex-col gap-3'>
          <h1 className="text-(--primary-color) text-3xl font-bold">Forms</h1>
          <p className="text-md">Manage and track your assigned forms</p>
        </div>

        <Box sx={{ minWidth: 250 }}>
          <FormControl fullWidth size="small" disabled={isSubmitted}>
            <InputLabel id="coordinator-label">Coordinator</InputLabel>
            <Select
              labelId="coordinator-label"
              value={selectedCoordinatorId}
              onChange={(e) => handleSelectCoordinator(e.target.value)}
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
        {isSubmitted && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
            Submitted
          </span>
        )}
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
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    value={grades[g.key]}
                    onChange={(e) => handleGradeChange(g.key, e.target.value)}
                    sx={{ width: 60 }}
                    disabled={isSubmitted}
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
                                <TableCell style={{ paddingLeft: "50px" }}>
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
                                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>{fileLabel} *</TableCell>
                                        )}
                                        {isEmbedded && (
                                          <>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Assessment Type *</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Question Number *</TableCell>
                                          </>
                                        )}
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>Comment</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell sx={{ minWidth: 180 }}>
                                          <FormControl fullWidth size="small" disabled={isSubmitted}>
                                            <Select
                                              value={entry.assessment_method_id ?? ''}
                                              onChange={(e) => handleFieldChange(assignment_pc.id, 'assessment_method_id', e.target.value)}
                                              displayEmpty
                                            >
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
                                            slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                                            value={entry.average_score ?? ''}
                                            onChange={(e) => handleFieldChange(assignment_pc.id, 'average_score', e.target.value)}
                                            fullWidth
                                            disabled={isSubmitted}
                                          />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 130 }}>
                                          <TextField
                                            type="number"
                                            size="small"
                                            slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                                            value={entry.percentage ?? ''}
                                            onChange={(e) => handleFieldChange(assignment_pc.id, 'percentage', e.target.value)}
                                            fullWidth
                                            disabled={isSubmitted}
                                            InputProps={{
                                              style: {
                                                color:
                                                  entry.percentage !== '' &&
                                                  Number(entry.percentage) < 70
                                                    ? '#d32f2f'
                                                    : '#2e7d32',
                                                fontWeight: 'bold',
                                              },
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 100 }}>
                                          <TextField
                                            type="number"
                                            size="small"
                                            slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
                                            value={entry.performance_standard ?? 70}
                                            onChange={(e) => handleFieldChange(assignment_pc.id, 'performance_standard', e.target.value)}
                                            fullWidth
                                            disabled={isSubmitted}
                                          />
                                        </TableCell>

                                        {needsFile && (
                                          <TableCell sx={{ minWidth: 180 }}>
                                            <Button variant="outlined" component="label" size="small" fullWidth disabled={isSubmitted}>
                                              {entry.upload ? entry.upload.name : entry.uploadPath ? 'Replace file' : 'Choose file'}
                                              <input
                                                type="file"
                                                hidden
                                                onChange={(e) => handleFileChange(assignment_pc.id, e.target.files[0] ?? null)}
                                              />
                                            </Button>
                                            {entry.uploadPath && !entry.upload && (
                                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                                File uploaded
                                              </Typography>
                                            )}
                                          </TableCell>
                                        )}

                                        {isEmbedded && (
                                          <>
                                            <TableCell sx={{ minWidth: 150 }}>
                                              <TextField
                                                size="small"
                                                value={entry.assessment_type ?? ''}
                                                onChange={(e) => handleFieldChange(assignment_pc.id, 'assessment_type', e.target.value)}
                                                fullWidth
                                                disabled={isSubmitted}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 120 }}>
                                              <TextField
                                                type="number"
                                                size="small"
                                                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                                                value={entry.question_number ?? ''}
                                                onChange={(e) => handleFieldChange(assignment_pc.id, 'question_number', e.target.value)}
                                                fullWidth
                                                disabled={isSubmitted}
                                              />
                                            </TableCell>
                                          </>
                                        )}

                                        <TableCell sx={{ minWidth: 180 }}>
                                          <TextField
                                            size="small"
                                            multiline
                                            rows={2}
                                            value={entry.comment ?? ''}
                                            onChange={(e) => handleFieldChange(assignment_pc.id, 'comment', e.target.value)}
                                            fullWidth
                                            disabled={isSubmitted}
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
          Improvements{requiresImprovements && <span style={{ color: 'red' }}> *</span>}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {requiresImprovements
            ? `Required: at least one PC is below 70%. Describe planned improvements (minimum ${MIN_IMPROVEMENT_CHARS} characters).`
            : 'Describe planned improvements based on the assessment results (optional).'}
        </Typography>
        <TextField
          multiline
          rows={5}
          fullWidth
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="Enter your improvements here..."
          error={requiresImprovements && charCount > 0 && charCount < MIN_IMPROVEMENT_CHARS}
          helperText={
            requiresImprovements
              ? `${charCount} / ${MIN_IMPROVEMENT_CHARS} characters minimum`
              : `${charCount} characters`
          }
          disabled={isSubmitted}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        {!isSubmitted && (
          <Button
            variant="outlined"
            onClick={handleSaveForm}
            sx={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
          >
            Save
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmitForm}
          disabled={isSubmitted}
          sx={{ backgroundColor: isSubmitted ? undefined : 'var(--primary-color)' }}
        >
          {isSubmitted ? 'Submitted' : 'Submit Form'}
        </Button>
      </Box>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />

    </Box>
  );
};

export default FormAssignmentSubmission;
