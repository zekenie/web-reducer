import axios from "axios";

export const serverClient = axios.create({
  baseURL: process.env.SERVER_URL,
});

export const runnerClient = axios.create({
  baseURL: process.env.RUNNER_URL,
});
