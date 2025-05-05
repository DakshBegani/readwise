import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Summary from "./pages/Summary";
import SummaryList from "./pages/SummaryList";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/summary" element={<ProtectedRoute element={<Summary />} />} />
        <Route path="/summaries" element={<ProtectedRoute element={<SummaryList />} />} />
      </Routes>
    </Router>
  );
}

export default App;
