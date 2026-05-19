import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Registro from "./pages/Registro";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas principales y únicas */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/home" element={<Home />} /> {/* Aquí entran todos los roles unificados */}
      </Routes>
    </Router>
  );
}

export default App;