import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import { useState, useEffect } from "react";
import InventoryManagement from "./InventoryManagement";
import Dashboard from "./Dashboard";
import OrderManagement from "./OrderManagement";
import MenuManagement from "./MenuManagement";
import ReportAnalysis from "./ReportAnalysis";
import WastePrediction from "./WastePrediction";
import SpoilageDetection from "./SpoilageDetection";
import Sidebar from "../components/Sidebar";

function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");

  // Handle URL-based navigation
  useEffect(() => {
    const path = location.pathname;
    if (path === "/inventory") {
      setActiveSection("inventory");
    } else if (path === "/orders") {
      setActiveSection("orders");
    } else if (path === "/menu") {
      setActiveSection("menu");
    } else if (path === "/recipes") {
      setActiveSection("recipes");
    } else if (path === "/spoilage") {
      setActiveSection("spoilage");
    } else if (path === "/waste") {
      setActiveSection("waste");
    } else if (path === "/reports") {
      setActiveSection("reports");
    } else if (path === "/employees") {
      setActiveSection("employees");
    } else if (path === "/admin/dashboard") {
      setActiveSection("dashboard");
    }
  }, [location.pathname]);


  // Content components for each section
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "inventory":
        return <InventoryManagement />;
      case "orders":
        return <OrderManagement />;
      case "menu":
        return <MenuManagement />;
      case "recipes":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recipe Suggestion</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Recipe suggestion features will be displayed here.</p>
            </div>
          </div>
        );
      case "spoilage":
        return <SpoilageDetection />;
      case "waste":
        return <WastePrediction />;
      case "reports":
        return <ReportAnalysis />;
      case "employees":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Employee Management</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Employee management features will be displayed here.</p>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Welcome to Smart Kitchen</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Select a menu item from the sidebar to get started.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main content with left margin to account for fixed sidebar */}
      <main className="main-content p-4">
        {user ? (
          renderContent()
        ) : (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Smart Kitchen</h1>
            <p className="text-gray-600">
              Please <Link to="/login" className="text-blue-600 hover:underline">sign in</Link> to access your features.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
