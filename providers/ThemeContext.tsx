import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";

type ThemeColors = {
  primary: string;
  bg: string;
  dark: string;
  muted: string;
  blue: string;
  white: string;
  border: string;
};

const lightColors: ThemeColors = {
  primary: "#137fec",
  bg: "#F6FAFD",
  dark: "#0A1931",
  blue: "#1A3D63",
  muted: "#4A7FA7",
  white: "#FFFFFF",
  border: "#eef2f7",
};

const darkColors: ThemeColors = {
  primary: "#3b82f6",
  bg: "#0f172a",
  dark: "#f8fafc",
  blue: "#93c5fd",
  muted: "#94a3b8",
  white: "#1e293b",
  border: "#334155",
};

type ThemeContextType = {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    AsyncStorage.getItem("app_theme").then(saved => {
      if (saved === "dark") setTheme("dark");
    });
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem("app_theme", next);
      return next;
    });
  };

  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

