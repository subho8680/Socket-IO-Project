import axios from "axios";
const API = "http://localhost:8000/api/v1";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();

export const useFetchProblems = () =>
  useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(`${API}/contest/fetch-problems`, formData, {
        withCredentials: true,
      });
      return res.data;
    },
  });

export const useScrapeProblems = () =>
  useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(`${API}/contest/scrape-problems`, formData, {
        withCredentials: true,
      });
      return res.data;
    },
  });

export const usegetContestById = (id) =>
  useQuery({
    queryKey: ["getContest",id],
    queryFn: async () => {
      const res = await axios.get(`${API}/contest/getContest/${id}`, {
        withCredentials: true,
      });
      return res.data;
    },
  });

export const executeCode = async ({ code, language, input, expectedOutput }) => {
  const res = await axios.post(
    `${API}/contest/execute`,
    { code, language, input, expectedOutput },
    { withCredentials: true },
  );
  return res.data;
};

export const useGetAllContest = () =>
  useQuery({
    queryKey: ["AllContest"],
    queryFn: async () => {
      const res = await axios.get(`${API}/contest/getAll`, {
        withCredentials: true,
      });
      return res.data;
    },
  });
