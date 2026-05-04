import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Registro from "./pages/Registro"; // Nueva línea

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} /> {/* Nueva ruta */}
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;