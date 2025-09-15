export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

export const setToken = (token: string) => {
  if (typeof window !== "undefined") localStorage.setItem("token", token);
};

export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }
};
