import React, { useEffect, useState } from 'react';
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";
import { getOfferings } from "../../api/offerings";
import { useSettings } from "../../context/SettingsContext";

const CourseOfferingsTable = () => {
  const { settings } = useSettings();
  const current_semester = settings?.current_semester;
  const navigate = useNavigate();

  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [offerings, setOfferings] = useState([]);

  useEffect(() => {
    if (!current_semester) return;
    const fetchData = async () => {
      try {
        const res = await getOfferings({ semester: current_semester });
        setOfferings(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [current_semester]);

  const filtered = React.useMemo(() => {
    return offerings
      .filter((o) => {
        const code = o.course?.course_code?.toLowerCase() ?? "";
        const name = o.course?.course_name?.toLowerCase() ?? "";
        const q = search.toLowerCase();
        return code.includes(q) || name.includes(q);
      })
      .sort((a, b) => {
        const aCode = a.course?.course_code?.toLowerCase() ?? "";
        const bCode = b.course?.course_code?.toLowerCase() ?? "";
        if (aCode < bCode) return order === "asc" ? -1 : 1;
        if (aCode > bCode) return order === "asc" ? 1 : -1;
        return 0;
      });
  }, [offerings, search, order]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleRequestSort = () => setOrder(order === "asc" ? "desc" : "asc");
  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <div className="p-4">
        <TextField
          label="Search by course code or name"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active direction={order} onClick={handleRequestSort}>
                  Course
                </TableSortLabel>
              </TableCell>
              <TableCell>Campus</TableCell>
              <TableCell>Instructor(s)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>View</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" className="py-8">
                  No course offerings found for the current semester.
                </TableCell>
              </TableRow>
            ) : paginated.map((offering) => {
              const submitted = (offering.improvements_count ?? 0) > 0;
              const instructorNames = (offering.instructors ?? [])
                .map((i) => `${i.first_name ?? ""} ${i.last_name ?? ""}`.trim())
                .join(", ");

              return (
                <TableRow key={offering.id}>
                  <TableCell>
                    <p className="font-medium">{offering.course?.course_code}</p>
                    <p className="text-sm text-gray-500">{offering.course?.course_name}</p>
                  </TableCell>
                  <TableCell>{offering.campus?.campus_name ?? "-"}</TableCell>
                  <TableCell>{instructorNames || "-"}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        backgroundColor: submitted ? "var(--primary-color)" : "gray",
                        padding: "4px 18px",
                        fontSize: "0.78rem",
                        borderRadius: "50px",
                        color: "white",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {submitted ? "Submitted" : "Not Submitted"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => navigate(`/admin/forms/${offering.id}`)}
                      title="View submissions"
                    >
                      <i className="fas fa-eye text-(--primary-color) text-lg cursor-pointer" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filtered.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default function Forms() {
  return (
    <div>
      <div className="pb-4 flex flex-col gap-3">
        <p className="text-(--primary-color) text-3xl font-bold">Forms Management</p>
        <p className="text-md">
          View instructor submissions for course assessment forms.
        </p>
      </div>

      <div className="w-full bg-white rounded-lg shadow-sm p-1">
        <CourseOfferingsTable />
      </div>
    </div>
  );
}
