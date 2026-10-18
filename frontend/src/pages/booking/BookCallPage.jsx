import React from "react";
import SaarthiDashboard from "./SaarthiDashboard";

const getLoggedInUserId = () => {
  const id = localStorage.getItem("user_id") || localStorage.getItem("id");
  return id ? Number(id) : null;
};

const DEFAULT_HOST_ID = getLoggedInUserId() || Number(import.meta.env?.VITE_BOOKING_HOST_ID) || 2;

export default function BookCallPage({
  mode = "admin",
  hostId = DEFAULT_HOST_ID,
}) {
  const isAdmin = mode === "admin";
  const effectiveHostId = isAdmin ? (getLoggedInUserId() || hostId || 2) : (hostId || DEFAULT_HOST_ID);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0a0b0e]">
      <SaarthiDashboard adminId={effectiveHostId} />
    </div>
  );
}