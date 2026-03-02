import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ToastContainer } from "react-toastify";

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      
      {/* Sidebar */}
      {isSidebarOpen && <Sidebar />}
      <ToastContainer position="top-right" autoClose={4000} />

      {/* wrapper konten */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  );
}