import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Summary from './pages/Summary';
import SummaryList from './pages/SummaryList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/summaries" element={<SummaryList />} />
      </Routes>
    </Router>
  );
}

export default App;
