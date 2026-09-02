import { useEffect, useState } from "react";
import Sidebar from "../components/layout/sidebar";
import Navbar from "../components/layout/navbar";

const MainLayout = ({ children }) => {
  // Change 1: Keep the sidebar visibility in the layout and start expanded.
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(
    () => window.innerWidth >= 768
  );
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

  const handleNavigation = () => {
    if (window.innerWidth < 768) {
      setIsSidebarExpanded(false);
    }
  };

  return (
    <div className="h-screen bg-[#F1ECF7] overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        onNavigate={handleNavigation}
      />

      {isSidebarExpanded && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarExpanded(false)}
          className="fixed inset-0 top-16 z-40 bg-[#1E1B4B]/40 md:hidden"
        />
      )}

      {/* Main Section */}
      <div className="h-screen flex flex-col">

        {/* Navbar */}
        <Navbar onMenuToggle={() => setIsSidebarExpanded((value) => !value)} />

        {/* Content Area */}
        <main className="ml-0 flex-1 overflow-y-auto bg-[#F1ECF7] p-4 scrollbar-hide transition-all duration-300 sm:p-6 md:ml-20">
          {children}
        </main>

      </div>

    </div>
  );
};

export default MainLayout;