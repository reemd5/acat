import * as React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  OutlinedInput,
  Chip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SaveIcon from "@mui/icons-material/Save";

// API
import { getCampuses } from "../../api/campuses";
import { getCourses } from "../../api/courses";
import { getInstructors } from "../../api/instructors";
import {
  getOfferings,
  createOffering,
  updateOffering,
  deleteOffering,
} from "../../api/offerings";
import { getCurrentSettings } from "../../api/settings";

const CourseOfferings = () => {
  const [semester, setSemester] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("");
  const [campuses, setCampuses] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [instructors, setInstructors] = React.useState([]);
  const [offerings, setOfferings] = React.useState([]);

  const [newOffering, setNewOffering] = React.useState({});
  const [editingId, setEditingId] = React.useState(null);
  const [editData, setEditData] = React.useState({});

  // 🔹 Load initial data
  React.useEffect(() => {
    const fetchInitial = async () => {
      const [campusRes, courseRes, settingsRes] = await Promise.all([
        getCampuses(),
        getCourses(),
        getCurrentSettings(),
      ]);

      setCampuses(campusRes.data);
      setCourses(courseRes.data);

      const sem = settingsRes.data?.current_semester ?? '';
      setAcademicYear(settingsRes.data?.academic_year ?? '');
      if (sem) {
        setSemester(sem);
        fetchOfferingsBySemester(sem);
      }
    };

    fetchInitial();
  }, []);

  // 🔹 Fetch offerings
  const fetchOfferingsBySemester = async (sem) => {
    if (!sem) return;
    const res = await getOfferings({ semester: sem });
    setOfferings(res.data);
  };

  // 🔹 Fetch instructors per campus
  const fetchInstructors = async (campusId) => {
    const res = await getInstructors({ campus_id: campusId });
    setInstructors(res.data);
  };

  // 🔹 ADD
  const handleAdd = async (campusId) => {
    const data = newOffering[campusId];

    if (!data?.course_id || !data?.instructor_ids?.length) return;

    await createOffering({
      campus_id: campusId,
      semester,
      academic_year: academicYear,
      course_id: data.course_id,
      instructor_ids: data.instructor_ids,
    });

    await fetchOfferingsBySemester(semester);

    setNewOffering((prev) => ({
      ...prev,
      [campusId]: {},
    }));
  };

  // 🔹 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this offering?")) return;
    await deleteOffering(id);
    fetchOfferingsBySemester(semester);
  };

  // 🔹 START EDIT
  const startEdit = (off) => {
    setEditingId(off.id);
    setEditData({
      course_id: off.course?.id,
      semester: off.semester,
      campus_id: off.campus_id,
      instructor_ids: off.instructors?.map((i) => i.id) || [],
    });
  };

  // 🔹 SAVE EDIT
  const saveEdit = async () => {
    await updateOffering(editingId, { ...editData, academic_year: academicYear });
    setEditingId(null);
    fetchOfferingsBySemester(semester);
  };

  return (
    <Box>
      {/* HEADER */}
      <Box className="flex justify-between mb-6">
        <div className="pb-4 flex flex-col gap-3">
          <p className="text-(--primary-color) text-3xl font-bold">
            Course Offerings
          </p>
          <p className="text-md">
            Fill the below table to manage Course Offerings.
          </p>
        </div>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Semester</InputLabel>
          <Select value={semester} label="Semester" disabled>
            {semester && <MenuItem value={semester}>{semester}</MenuItem>}
          </Select>
        </FormControl>
      </Box>

      {/* CAMPUSES */}
      {campuses.map((campus) => {
        const campusOfferings = offerings.filter(
          (o) => o.campus_id === campus.id
        );

        return (
          <Box key={campus.id} mb={5}>
            <Typography variant="h6" mb={2}>
              {campus.campus_name}
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Instructors</TableCell>
                    <TableCell width={120}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {/* 🔥 ADD ROW */}
                  <TableRow>
                    {/* COURSE */}
                    <TableCell>
                      <Select
                        fullWidth
                        size="small"
                        value={newOffering[campus.id]?.course_id || ""}
                        onChange={(e) =>
                          setNewOffering((prev) => ({
                            ...prev,
                            [campus.id]: {
                              ...prev[campus.id],
                              course_id: e.target.value,
                            },
                          }))
                        }
                      >
                        {courses
                          .map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.course_code} - {c.course_name}
                            </MenuItem>
                          ))}
                      </Select>
                    </TableCell>

                    {/* MULTI INSTRUCTORS */}
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <InputLabel>Instructors *</InputLabel>

                        <Select
                          multiple
                          onFocus={() => fetchInstructors(campus.id)}
                          value={
                            newOffering[campus.id]?.instructor_ids || []
                          }
                          onChange={(e) =>
                            setNewOffering((prev) => ({
                              ...prev,
                              [campus.id]: {
                                ...prev[campus.id],
                                instructor_ids: e.target.value,
                              },
                            }))
                          }
                          input={<OutlinedInput label="Instructors *" />}
                          renderValue={(selected) => (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {selected.map((id) => {
                                const inst = instructors.find(
                                  (i) => i.id === id
                                );
                                return inst ? (
                                  <Chip
                                    key={id}
                                    label={`${inst.first_name} ${inst.last_name}`}
                                    size="small"
                                  />
                                ) : null;
                              })}
                            </Box>
                          )}
                        >
                          {instructors
                            .filter((i) =>
                              i.campuses?.some((c) => c.id === campus.id)
                            )
                            .map((i) => (
                              <MenuItem key={i.id} value={i.id}>
                                {i.first_name} {i.last_name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* ADD BTN */}
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleAdd(campus.id)}
                        disabled={!semester}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* 🔥 EXISTING */}
                  {campusOfferings.map((off) => (
                    <TableRow key={off.id}>
                      {/* COURSE */}
                      <TableCell>
                        {editingId === off.id ? (
                          <Select
                            fullWidth
                            size="small"
                            value={editData.course_id}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                course_id: e.target.value,
                              }))
                            }
                          >
                            {courses.map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                {c.course_code}
                              </MenuItem>
                            ))}
                          </Select>
                        ) : (
                          `${off.course?.course_code} - ${off.course?.course_name}`
                        )}
                      </TableCell>

                      {/* INSTRUCTORS */}
                      <TableCell>
                        {editingId === off.id ? (
                          <FormControl fullWidth size="small">
                            <Select
                              multiple
                              onFocus={() => fetchInstructors(campus.id)}
                              value={editData.instructor_ids || []}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  instructor_ids: e.target.value,
                                }))
                              }
                              input={<OutlinedInput />}
                              renderValue={(selected) => (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                  }}
                                >
                                  {selected.map((id) => {
                                    const inst = instructors.find(
                                      (i) => i.id === id
                                    );
                                    return inst ? (
                                      <Chip
                                        key={id}
                                        label={`${inst.first_name} ${inst.last_name}`}
                                        size="small"
                                      />
                                    ) : null;
                                  })}
                                </Box>
                              )}
                            >
                              {instructors
                                .filter((i) =>
                                  i.campuses?.some(
                                    (c) => c.id === campus.id
                                  )
                                )
                                .map((i) => (
                                  <MenuItem key={i.id} value={i.id}>
                                    {i.first_name} {i.last_name}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        ) : off.instructors?.length ? (
                          off.instructors
                            .map(
                              (i) =>
                                `${i.first_name} ${i.last_name}`
                            )
                            .join(", ")
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell>
                        {editingId === off.id ? (
                          <IconButton color="success" onClick={saveEdit}>
                            <SaveIcon />
                          </IconButton>
                        ) : (
                          <>
                            <IconButton onClick={() => startEdit(off)}>
                              <EditIcon />
                            </IconButton>

                            <IconButton
                              color="error"
                              onClick={() => handleDelete(off.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* EMPTY */}
                  {campusOfferings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No offerings
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}
    </Box>
  );
};

export default CourseOfferings;