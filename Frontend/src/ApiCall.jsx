import axios from "axios";
const API = "http://localhost:8000/api/v1";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();

export const registerStudent = async (formData) => {
  try {
    const data = await axios.post(`${API}/student/register`, formData);
    return data.data;
  } catch (e) {
    return e.response.data;
  }
};
export const CreateQuiz = async (formData) => {
  try {
    const data = await axios.post(`${API}/teacher/createQuiz`, formData, {
      withCredentials: true,
    });
    return data.data;
  } catch (e) {
    return e.response.data;
  }
};
export const useCreateQuiz = () =>
  useMutation({
    mutationFn: async (formData) => {
      const data = await axios.post(`${API}/teacher/createQuiz`, formData, {
        withCredentials: true,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["quizRooms"]);
    },
  });
export const generateQuestions = async (formData) => {
  try {
    const data = await axios.post(`${API}/teacher/gen-quiz`, formData, {
      withCredentials: true,
    });
    const res = data.data;
    return res;
  } catch (e) {
    return e.response.data;
  }
};
export const useGenerateQuesitions = () =>
  useMutation({
    mutationFn: async (formData) => {
      const data = await axios.post(`${API}/teacher/gen-quiz`, formData, {
        withCredentials: true,
      });
      return data.data;
    },
  });

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
// export const useMergePdfService = () =>
//   useMutation({
//     mutationFn: async (formData: FormData) => {
//       const response = await axios.post(
//         `${backendURL}${apiRoutes.organizePdf}/merge`,
//         formData,
//         {
//           responseType: "blob",
//         },
//       );
//       return response.data;
//     },
//   });
export const useGetAllQuizRooms = () =>
  useQuery({
    queryKey: ["quizRooms"],
    queryFn: async () => {
      const res = await axios.get(`${API}/teacher/getAllQuizRooms`, {
        withCredentials: true,
      });
      return res.data;
    },
  });
export const useGetQuizRoomById = (roomId) =>
  useQuery({
    queryKey: ["quizRoomSingle", roomId],
    queryFn: async () => {
      const res = await axios.get(`${API}/teacher/getQuizRoom/${roomId}`, {
        withCredentials: true,
      });
      return res.data;
    },
  });
