import { useContext } from "react";
import { AuthContext } from "../context/auth.context.jsx";
import { AuthAPI } from "./api";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Auth context not found");

  async function loginWithEmail(email, password) {
    const res = await AuthAPI.login(email, password);
    const { user, accessToken, refreshToken } = res?.data || {};
    
    if (user && accessToken) {
      // Store tokens in localStorage
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      
      // Store user data in context
      ctx.login(user);
      return user;
    }
    
    throw new Error("Login failed - invalid response");
  }

  async function registerUser(payload) {
    const res = await AuthAPI.register(payload);
    return res?.data || null;
  }

  async function logoutUser() {
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      // Clear tokens and user data regardless of API call success
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      ctx.logout();
    }
  }

  return { ...ctx, loginWithEmail, registerUser, logoutUser };
}
