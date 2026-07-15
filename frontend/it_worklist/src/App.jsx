import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import WorkListForm from "./components/WorkListForm";
import WorkEntry from "./components/WorkEntry";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/list_form" element={<WorkListForm />} />
        <Route path="/work_entry" element={<WorkEntry />} />
      </Routes>
    </Router>
    
  );
};

export default App;