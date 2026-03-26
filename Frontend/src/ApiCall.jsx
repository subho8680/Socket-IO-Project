import axios from "axios";
const API = "http://localhost:8000/api/v1";
export const registerStudent = async (formData) => {
  try {
    const data = await axios.post(`${API}/student/register`, formData);
    return data.data;
  } catch (e) {
    return e.response.data;
  }
};
export const createQuiz = async (formData) => {
  try {
    const data = await axios.post(`${API}/teacher/createQuiz`, formData, {
      withCredentials: true,
    });
    return data.data;
  } catch (e) {
    return e.response.data;
  }
};
export const loginStudent = async (formData) => {
  try {
    const data = await axios.post(`${API}/student/login`, formData, {
      withCredentials: true,
    });
    return data.data;
  } catch (e) {
    return e.response.data;
  }
};

export const registerTeacher = async (formData) => {
  try {
    const data = await axios.post(`${API}/teacher/register`, formData);
    return data.data;
  } catch (e) {
    return e.response.data;
  }
};

export const loginTeacher = async (formData) => {
  try {
    const data = await axios.post(`${API}/teacher/login`, formData, {
      withCredentials: true,
    });
    return data.data;
  } catch (e) {
    return e.response.data;
  }
};
