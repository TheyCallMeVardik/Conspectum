"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("sidebar-collapsed") === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed(c => {
      localStorage.setItem("sidebar-collapsed", String(!c));
      return !c;
    });
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Box component="main" sx={{ flex: 1, overflow: "auto", minWidth: 0, p: { xs: 3, md: 4 } }}>
        {children}
      </Box>
    </Box>
  );
}
