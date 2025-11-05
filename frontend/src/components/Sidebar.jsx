import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import { toast } from "sonner";

function Sidebar() {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // Use role-based access control instead of hardcoded emails
  const isAdmin = user?.role === "admin";
  const isChef = user?.role === "chef";
  const canManageInventory = isAdmin || isChef;

  const avatarUrl = user?.avatar || user?.profileImage || user?.photoURL;
  const displayName = user?.fullname || user?.username || user?.email || "Guest";
  const initials = (user?.fullname || user?.username || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Determine active section based on current path
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === "/inventory") return "inventory";
    if (path === "/orders") return "orders";
    if (path === "/menu") return "menu";
    if (path === "/recipes") return "recipes";
    if (path === "/waste") return "waste";
    if (path === "/reports") return "reports";
    if (path === "/employees") return "employees";
    if (path === "/admin/dashboard") return "dashboard";
    return "dashboard";
  };

  const activeSection = getActiveSection();

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 p-4 flex flex-col z-10 hidden md:flex">
      <div className="flex items-center gap-3 mb-6">
        {user ? (
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="profile" className="h-12 w-12 rounded-full object-cover border" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold border">
                {initials}
              </div>
            )}
            <div>
              <div className="font-semibold leading-tight">{displayName}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1">
        <ul className="space-y-1 text-gray-700">
          {(isAdmin || isChef) && (
            <li>
              <Link 
                to="/admin/dashboard"
                className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                  activeSection === "dashboard" ? "bg-blue-100 text-blue-700 font-medium" : ""
                }`}
              >
                📊 Dashboard
              </Link>
            </li>
          )}

          {canManageInventory && (
            <>
              <li>
                <Link 
                  to="/inventory"
                  className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    activeSection === "inventory" ? "bg-blue-100 text-blue-700 font-medium" : ""
                  }`}
                >
                  📦 Inventory Management
                </Link>
              </li>
              <li>
                <Link 
                  to="/orders"
                  className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    activeSection === "orders" ? "bg-blue-100 text-blue-700 font-medium" : ""
                  }`}
                >
                  🛒 Order Management
                </Link>
              </li>
              <li>
                <Link 
                  to="/menu"
                  className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    activeSection === "menu" ? "bg-blue-100 text-blue-700 font-medium" : ""
                  }`}
                >
                  🍽️ Menu Management
                </Link>
              </li>
            </>
          )}

          {isChef && (
            <li>
              <Link 
                to="/recipes"
                className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                  activeSection === "recipes" ? "bg-blue-100 text-blue-700 font-medium" : ""
                }`}
              >
                👨‍🍳 Recipe Suggestion
              </Link>
            </li>
          )}

          {isAdmin && (
            <>
              <li>
                <Link 
                  to="/waste"
                  className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    activeSection === "waste" ? "bg-blue-100 text-blue-700 font-medium" : ""
                  }`}
                >
                  🗑️ Waste Prediction
                </Link>
              </li>
              <li>
                <Link 
                  to="/reports"
                  className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    activeSection === "reports" ? "bg-blue-100 text-blue-700 font-medium" : ""
                  }`}
                >
                  📈 Report and Analysis
                </Link>
              </li>
              <li>
                <Link 
                  to="/employees"
                  className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    activeSection === "employees" ? "bg-blue-100 text-blue-700 font-medium" : ""
                  }`}
                >
                  👥 Employee Management
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"
          >
            Logout
          </button>
        ) : (
          <p>Please sign in to access your features.</p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
