import axios from "axios";
const API = "http://localhost:8000/api/v1";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();

export const useFetchProblems = () =>
  useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(
        `${API}/contest/fetch-problems`,
        formData,
        {
          withCredentials: true,
        },
      );
      return res.data;
    },
  });

export const useScrapeProblems = () =>
  useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(
        `${API}/contest/scrape-problems`,
        formData,
        {
          withCredentials: true,
        },
      );
      return res.data;
    },
  });