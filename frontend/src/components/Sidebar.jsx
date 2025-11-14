import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  UtensilsCrossed, 
  ChefHat, 
  Trash2, 
  BarChart3, 
  Users, 
  LogOut,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";

function Sidebar({ onCollapseChange }) {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default

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

  // Notify parent of collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const menuItems = [
    ...(isAdmin || isChef ? [{
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      section: "dashboard"
    }] : []),
    ...(canManageInventory ? [
      {
        path: "/inventory",
        label: "Inventory",
        icon: Package,
        section: "inventory"
      },
      {
        path: "/orders",
        label: "Orders",
        icon: ShoppingCart,
        section: "orders"
      },
      {
        path: "/menu",
        label: "Menu",
        icon: UtensilsCrossed,
        section: "menu"
      }
    ] : []),
    ...(isChef ? [{
      path: "/recipes",
      label: "Recipes",
      icon: ChefHat,
      section: "recipes"
    }] : []),
    ...(isAdmin ? [
      {
        path: "/waste",
        label: "Waste Prediction",
        icon: Trash2,
        section: "waste"
      },
      {
        path: "/reports",
        label: "Reports",
        icon: BarChart3,
        section: "reports"
      },
      {
        path: "/employees",
        label: "Employees",
        icon: Users,
        section: "employees"
      }
    ] : [])
  ];

  const SidebarContent = () => (
    <>
      {/* Logo and Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6 pb-4 border-b border-gray-200`}>
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Smart Kitchen
          </Link>
        )}
        {isCollapsed && (
          <Sparkles className="w-6 h-6 text-blue-600 mx-auto" />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all hidden md:block"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* User Profile */}
      {user && (
        <div className={`mb-6 pb-4 border-b border-gray-200 ${isCollapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="profile" 
                className={`h-10 w-10 rounded-full object-cover border-2 border-blue-200 ${isCollapsed ? 'mb-2' : ''}`} 
              />
            ) : (
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm ${isCollapsed ? 'mb-2' : ''}`}>
                {initials}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate text-sm">{displayName}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                <div className="text-xs mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {user.role || 'User'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        {user ? (
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all duration-200 ${isCollapsed ? '' : ''}`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </button>
        ) : (
          !isCollapsed && (
            <Link
              to="/login"
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              Sign in
            </Link>
          )
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 p-4 flex flex-col z-40 hidden md:flex shadow-sm transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 p-4 flex flex-col z-50 md:hidden shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}

export default Sidebar;
