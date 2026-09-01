import { useEffect, useState } from "react";
import Sidebar from "../components/layout/sidebar";
import Navbar from "../components/layout/navbar";

const MainLayout = ({ children }) => {
  // Change 1: Keep the sidebar visibility in the layout and start expanded.
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Change 2: Auto-collapse after 3 seconds unless the sidebar is being hovered.
  useEffect(() => {
    const collapseTimer = window.setTimeout(() => {
      if (!isSidebarHovered) {
        setIsSidebarExpanded(false);
      }
    }, 3000);

    return () => window.clearTimeout(collapseTimer);
  }, [isSidebarHovered]);

  // Change 3: Hovering over the sidebar expands it as an overlay.
  const handleSidebarEnter = () => {
    setIsSidebarHovered(true);
    setIsSidebarExpanded(true);
  };

  const handleSidebarLeave = () => {
    setIsSidebarHovered(false);
    setIsSidebarExpanded(false);
  };

  return (
    <div className="h-screen bg-[#F1ECF7] overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      />

      {/* Main Section */}
      <div className="h-screen flex flex-col">

        {/* Navbar */}
        <Navbar />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F1ECF7] scrollbar-hide transition-all duration-300 ml-20">
          {children}
        </main>

      </div>

    </div>
  );
};

export default MainLayout;