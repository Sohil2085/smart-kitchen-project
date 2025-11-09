import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import AuthProvider from './context/auth.context';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin/dashboard" element={<Home />} />
            <Route path="/inventory" element={<Home />} />
            <Route path="/orders" element={<Home />} />
            <Route path="/menu" element={<Home />} />
            <Route path="/recipes" element={<Home />} />
            <Route path="/waste" element={<Home />} />
            <Route path="/reports" element={<Home />} />
            <Route path="/employees" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="bottom-right" richColors />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
