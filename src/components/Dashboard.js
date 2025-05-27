import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaEdit,
  FaTrash,
  FaClock,
  FaUser,
  FaBook,
  FaEnvelope,
} from "react-icons/fa";

const BASE_URL = "http://localhost:8000/api/lectures/";

const Dashboard = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    teacher_name: "",
    lesson_name: "",
    email: "",
    time: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [notifiedLectures, setNotifiedLectures] = useState([]);
  const [upcomingLessons, setUpcomingLessons] = useState([]);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.teacher_name.trim()) errors.teacher_name = "Teacher name is required";
    if (!form.lesson_name.trim()) errors.lesson_name = "Lesson name is required";
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Invalid email format";
    }
    if (!form.time) errors.time = "Time is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const fetchLectures = async () => {
      setLoading(true);
      try {
        const res = await axios.get(BASE_URL);
        setLectures(res.data);
      } catch (err) {
        toast.error("Failed to fetch lectures");
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  // Reminder Polling Logic
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/upcoming/");
        const { reminders } = res.data;
        console.log(res)

        reminders.forEach((lecture) => {
          const key = `${lecture.id}-${lecture.time}`;
          if (!notifiedLectures.includes(key)) {
            toast.info(
              `Reminder: "${lecture.lesson_name}" by ${lecture.teacher_name} starts soon!`,
              {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );

            setNotifiedLectures((prev) => [...prev, key]);
            setUpcomingLessons((prev) => [
              ...prev,
              { ...lecture, notificationKey: key },
            ]);
          }
        });
      } catch (error) {
        console.error("Error fetching upcoming reminders:", error);
      }
    }, 60 * 1000); // every 60 seconds

    return () => clearInterval(interval);
  }, [notifiedLectures]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix form errors.");
      return;
    }

    setLoading(true);
    const { id, ...data } = form;

    try {
      if (id) {
        const res = await axios.put(`${BASE_URL}update/${id}/`, data);
        setLectures((prev) =>
          prev.map((lecture) => (lecture.id === id ? res.data : lecture))
        );
        toast.success("Lecture updated!");
      } else {
        const res = await axios.post(`${BASE_URL}create/`, data);
        setLectures((prev) => [...prev, res.data]);
        toast.success("Lecture added!");
      }

      setForm({
        id: null,
        teacher_name: "",
        lesson_name: "",
        email: "",
        time: "",
      });
      setFormErrors({});
    } catch (err) {
      toast.error("Error saving lecture.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lecture) => setForm(lecture);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lecture?")) return;
    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}delete/${id}/`);
      setLectures((prev) => prev.filter((lecture) => lecture.id !== id));
      toast.success("Lecture deleted!");
    } catch (err) {
      toast.error("Failed to delete lecture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <ToastContainer />

      {/* Reminder Alert */}
      {upcomingLessons.length > 0 && (
        <div className="position-fixed top-0 start-50 translate-middle-x p-3" style={{ zIndex: 1050 }}>
          <div className="alert alert-warning shadow-lg rounded-3 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><FaClock className="me-2" />Upcoming Lessons</h5>
              <button className="btn-close" onClick={() => setUpcomingLessons([])}></button>
            </div>
            <div className="mt-3">
              {upcomingLessons.map((lesson) => (
                <div key={lesson.notificationKey} className="d-flex align-items-center mb-2">
                  <div className="bg-white rounded-pill px-3 py-1 me-2">
                    <span className="text-danger fw-bold">
                      {lesson.minutesLeft ?? "Soon"}m
                    </span>
                  </div>
                  <div>
                    <strong>{lesson.lesson_name}</strong>
                    <span className="text-muted ms-2">by {lesson.teacher_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-header bg-white border-0 py-4">
                <h4 className="mb-0 text-primary fw-bold">Teacher Lectures Dashboard</h4>
              </div>
              <div className="card-body p-4">
                {/* Form */}
                <form onSubmit={handleSubmit} className="row g-4 mb-5">
                  {[
                    { name: "teacher_name", label: "Teacher Name", type: "text" },
                    { name: "lesson_name", label: "Lesson Name", type: "text" },
                    { name: "email", label: "Email", type: "email" },
                    { name: "time", label: "Time", type: "datetime-local" },
                  ].map(({ name, label, type }) => (
                    <div key={name} className={`col-12 col-md-${name === "time" ? "2" : "3"}`}>
                      <div className="form-floating">
                        <input
                          type={type}
                          name={name}
                          id={name}
                          className={`form-control ${formErrors[name] ? "is-invalid" : ""}`}
                          value={form[name]}
                          onChange={handleChange}
                          disabled={loading}
                          placeholder={label}
                        />
                        <label htmlFor={name}>{label}</label>
                        {formErrors[name] && (
                          <div className="invalid-feedback">{formErrors[name]}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="col-12 col-md-1">
                    <button
                      type="submit"
                      className="btn btn-primary w-100 h-100 rounded-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : form.id ? "Update" : "Add"}
                    </button>
                  </div>
                </form>

                {/* Table */}
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th><FaUser className="me-2" />Teacher</th>
                        <th><FaBook className="me-2" />Lesson</th>
                        <th><FaEnvelope className="me-2" />Email</th>
                        <th><FaClock className="me-2" />Time</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lectures.length ? (
                        lectures.map((lecture) => (
                          <tr key={lecture.id}>
                            <td>{lecture.teacher_name}</td>
                            <td>{lecture.lesson_name}</td>
                            <td>{lecture.email}</td>
                            <td>
                              {new Date(lecture.time).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "UTC",
                              })}
                            </td>
                            <td className="text-end">
                              <div className="d-flex gap-2 justify-content-end">
                                <button
                                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                  onClick={() => handleEdit(lecture)}
                                  disabled={loading}
                                >
                                  <FaEdit className="me-1" /> Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                  onClick={() => handleDelete(lecture.id)}
                                  disabled={loading}
                                >
                                  <FaTrash className="me-1" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-5">
                            No lectures available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {loading && lectures.length === 0 && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
