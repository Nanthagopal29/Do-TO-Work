import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import W_Home from "./components/W_Home";
import UserSelect from "./components/WorkUser";
import UserReports from "./components/UserReports";
import WorkListForm from "./components/WorkListForm";
import WorkEntryForm from "./components/WorkEntryForm";
import WorkReport from "./components/WorkReport";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<W_Home />} />
        <Route path="/dashboard" element={<UserSelect />} />
        <Route path="/user_reports" element={<UserReports />} />
        <Route path="/work-entry/:username" element={<WorkEntryForm />} />
        <Route path="/user-report/:username" element={<UserReports />} />
        <Route path="/list_form" element={<WorkListForm />} />
        <Route path="/work_entry" element={<WorkEntryForm />} />
        <Route path="/work_report" element={<WorkReport />} />
      </Routes>
    </Router>
    
  );
};

export default App;