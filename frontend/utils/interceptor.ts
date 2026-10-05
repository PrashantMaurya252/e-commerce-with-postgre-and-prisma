import axios from "axios"

let store: any;
export const injectStore = (_store: any) => {
  store = _store;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const api = axios.create({
    baseURL:BACKEND_URL,
    withCredentials:true
})

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = store?.getState()?.auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    // ❌ Do NOT refresh for refresh-token API itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.get(
          `${BACKEND_URL}/auth/refresh-token`,
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;

        if (store) {
          store.dispatch({ type: 'auth/updateAccessToken', payload: newAccessToken });
        }

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // store.dispatch(logout());
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export default api