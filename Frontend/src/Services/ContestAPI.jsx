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

export const useGetContestById = (id) =>
  useQuery({
    queryKey: ["getContest", id],
    queryFn: async () => {
      const res = await axios.get(`${API}/contest/getContest/${id}`, {
        withCredentials: true,
      });
      if (!res.data || res.data?.status === "error" || res.data?.success === false) {
        throw new Error(res.data?.message || res.data?.msg || "Unable to load contest.");
      }
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

export const createSubmission = async (payload) => {
  const res = await axios.post(`${API}/submission/create`, payload, {
    withCredentials: true,
  });
  return res.data;
};

export const useUserSubmissions = (cfContestId, problemIndex) =>
  useQuery({
    queryKey: ["userSubmissions", cfContestId, problemIndex],
    queryFn: async () => {
      const res = await axios.get(`${API}/submission/user/list`, {
        params: { cfContestId, problemIndex },
        withCredentials: true,
      });
      return res.data.submissions;
    },
    enabled: Boolean(cfContestId && problemIndex),
    refetchOnMount: "always",
  });

export const useGetAllContest = () =>
  useQuery({
    queryKey: ["AllContest"],
    queryFn: async () => {
      const res = await axios.get(`${API}/contest/getAll`, {
        withCredentials: true,
      });
      if (!res.data || res.data?.status === "error" || res.data?.success === false) {
        throw new Error(res.data?.message || res.data?.msg || "Unable to load contests.");
      }
      return res.data;
    },
  });

export const useGetSolvedProblems = (contestId) =>
  useQuery({
    queryKey: ["solvedProblems", contestId],
    queryFn: async () => {
      const res = await axios.get(`${API}/submission/user/list/${contestId}`, {
        withCredentials: true,
      });
      return res.data.solvedSubmissions;
    },
    enabled: Boolean(contestId),
    refetchOnMount: "always",
  });
