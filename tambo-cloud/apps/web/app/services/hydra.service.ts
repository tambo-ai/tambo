import axios from "axios";
import { UserDto } from "../types/user.dto";
import { getSupabaseClient } from "../utils/supabase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_HYDRA_API_URL || "https://api.usehydra.ai";

const getHeaders = async () => {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  };
};

export const createProject = async (projectName: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/projects`,
    { projectName },
    { headers: await getHeaders() },
  );
  return response.data;
};

export const getUserProjects = async () => {
  const response = await axios.get(`${API_BASE_URL}/projects/user`, {
    headers: await getHeaders(),
  });
  return response.data;
};

export const getProject = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
    headers: await getHeaders(),
  });
  return response.data;
};

export const removeProject = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/projects/${id}`, {
    headers: await getHeaders(),
  });
  return response.data;
};

export const generateApiKey = async (projectId: string, name: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/projects/${projectId}/api-key/${name}`,
    {},
    { headers: await getHeaders() },
  );
  return response.data;
};

export const getApiKeys = async (projectId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/projects/${projectId}/api-keys`,
    { headers: await getHeaders() },
  );
  return response.data;
};

export const removeApiKey = async (projectId: string, apiKeyId: string) => {
  const response = await axios.delete(
    `${API_BASE_URL}/projects/${projectId}/api-key/${apiKeyId}`,
    { headers: await getHeaders() },
  );
  return response.data;
};

export const addProviderKey = async (
  projectId: string,
  providerName: string,
  providerKey: string,
) => {
  const response = await axios.put(
    `${API_BASE_URL}/projects/${projectId}/provider-key`,
    { providerName, providerKey },
    { headers: await getHeaders() },
  );
  return response.data;
};

export const removeProviderKey = async (
  projectId: string,
  providerKeyId: string,
) => {
  const response = await axios.delete(
    `${API_BASE_URL}/projects/${projectId}/provider-key/${providerKeyId}`,
    { headers: await getHeaders() },
  );
  return response.data;
};

export const getProviderKeys = async (projectId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/projects/${projectId}/provider-keys`,
    { headers: await getHeaders() },
  );
  return response.data;
};

export const createUser = async (userData: UserDto) => {
  const response = await axios.post(`${API_BASE_URL}/users`, userData, {
    headers: await getHeaders(),
  });
  return response.data;
};
