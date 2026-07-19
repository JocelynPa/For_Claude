import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "session_token";

export const apiClient = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined),
  timeout: 15_000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}
