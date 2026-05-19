import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';

const Home = () => {
  const [rol, setRol] = useState(null); 
  const navigate = useNavigate();
  
  // --- ESTADOS PARA LA IMPLEMENTACIÓN SIMULADA (IDEAL PARA PRESENTAR) ---
  const [categoriaActual, setCategoriaActual] = useState('biblioteca');
  const [inventario, setInventario] = useState([
    // Biblioteca
    { id: 1, nombre: "Cien años de soledad - Gabriel García Márquez", categoria: "biblioteca", disponible: true },
    { id: 2, nombre: "Cálculo de una variable - James Stewart", categoria: "biblioteca", disponible: true },
    // Bienestar
    { id: 3, nombre: "Balón de Fútbol Nike N°5", categoria: "bienestar", disponible: true },
    { id: 4, nombre: "Juego de Mesa: Ajedrez Profesional", categoria: "bienestar", disponible: false },
    { id: 5, nombre: "Guitarra Acústica Yamaha", categoria: "bienestar", disponible: true },
    // Laboratorio
    { id: 6, nombre: "Microscopio Monocular Digital", categoria: "laboratorio", disponible: true },
    { id: 7, nombre: "Kit de Probetas y Vasos de Precipitado", categoria: "laboratorio", disponible: true },
  ]);

  const [solicitudesAdmin, setSolicitudesAdmin] = useState([
    { id: 101, usuario: "estudiante1@correo.com", objeto: "Cien años de soledad", area: "📚 Biblioteca", estado: "Pendiente" },
    { id: 102, usuario: "estudiante2@correo.com", objeto: "Balón de Fútbol", area: "⚽ Bienestar", estado: "Pendiente" },
  ]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRol(docSnap.data().rol);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleCerrarSesion = async () => {
    await signOut(auth); 
    navigate('/');
  };

  // Funciones de interacción para la demo
  const handlePrestarDevolver = (id) => {
    setInventario(inventario.map(item => 
      item.id === id ? { ...item, disponible: !item.disponible } : item
    ));
  };

  const handleAccionAdmin = (id, nuevoEstado) => {
    setSolicitudesAdmin(solicitudesAdmin.map(sol => 
      sol.id === id ? { ...sol, estado: nuevoEstado } : sol
    ));
  };

  // --- VISTAS DE LAS IMPLEMENTACIONES ---

  // 1. Interfaz del Estudiante (Catálogo por áreas + Préstamos)
  const VistaEstudiante = () => (
    <div>
      <p style={{ color: '#636e72', marginBottom: '20px' }}>Selecciona el área donde deseas solicitar o devolver un implemento:</p>
      
      {/* Selector de Áreas Escalables */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center' }}>
        <button onClick={() => setCategoriaActual('biblioteca')} style={{ padding: '10px 15px', backgroundColor: categoriaActual === 'biblioteca' ? '#74b9ff' : '#eee', color: categoriaActual === 'biblioteca' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📚 Biblioteca</button>
        <button onClick={() => setCategoriaActual('bienestar')} style={{ padding: '10px 15px', backgroundColor: categoriaActual === 'bienestar' ? '#a29bfe' : '#eee', color: categoriaActual === 'bienestar' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⚽ Bienestar</button>
        <button onClick={() => setCategoriaActual('laboratorio')} style={{ padding: '10px 15px', backgroundColor: categoriaActual === 'laboratorio' ? '#55efc4' : '#eee', color: categoriaActual === 'laboratorio' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🧪 Laboratorio Químico</button>
      </div>

      {/* Lista de Recursos del Área seleccionada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {inventario.filter(item => item.categoria === categoriaActual).map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #dfe6e9', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <span style={{ fontWeight: '500', color: '#2d3436' }}>{item.nombre}</span>
            <button 
              onClick={() => handlePrestarDevolver(item.id)}
              style={{
                padding: '8px 16px',
                backgroundColor: item.disponible ? '#00b894' : '#ff7675',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {item.disponible ? 'Solicitar Préstamo' : 'Devolver Objeto'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // 2. Interfaz de Gestión (Admin, Operador, Superusuario)
  const VistaGestion = ({ tituloRol }) => (
    <div>
      <p style={{ color: '#636e72', marginBottom: '20px' }}>Panel de control para la revisión y aprobación de préstamos en todas las sedes.</p>
      
      <h4 style={{ textAlign: 'left', color: '#2d3436', marginBottom: '10px' }}>Solicitudes en Tiempo Real:</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f2f6', borderBottom: '2px solid #dfe6e9' }}>
              <th style={{ padding: '10px' }}>Estudiante</th>
              <th style={{ padding: '10px' }}>Objeto</th>
              <th style={{ padding: '10px' }}>Área</th>
              <th style={{ padding: '10px' }}>Estado</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesAdmin.map(sol => (
              <tr key={sol.id} style={{ borderBottom: '1px solid #dfe6e9' }}>
                <td style={{ padding: '12px 10px' }}>{sol.usuario}</td>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{sol.objeto}</td>
                <td style={{ padding: '12px 10px' }}>{sol.area}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: sol.estado === 'Pendiente' ? '#ffeaa7' : sol.estado === 'Aprobado' ? '#e5faf2' : '#ffebee', color: sol.estado === 'Pendiente' ? '#d6a21e' : sol.estado === 'Aprobado' ? '#00b894' : '#ff7675' }}>
                    {sol.estado}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  {sol.estado === 'Pendiente' ? (
                    <>
                      <button onClick={() => handleAccionAdmin(sol.id, 'Aprobado')} style={{ padding: '5px 10px', backgroundColor: '#00b894', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Aprobar</button>
                      <button onClick={() => handleAccionAdmin(sol.id, 'Rechazado')} style={{ padding: '5px 10px', backgroundColor: '#ff7675', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Rechazar</button>
                    </>
                  ) : (
                    <span style={{ color: '#b2bec3', fontSize: '12px' }}>Procesado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Configuración de cabeceras de rol
  const titulosConfig = {
    superusuario: { t: "👑 Panel de Super Usuario", c: <VistaGestion tituloRol="Super Usuario" /> },
    admin: { t: "💼 Panel de Administrador", c: <VistaGestion tituloRol="Administrador" /> },
    operador: { t: "⚙️ Panel de Operador", c: <VistaGestion tituloRol="Operador" /> },
    estudiante: { t: "🎓 Panel de Préstamos - Boomerang", c: <VistaEstudiante /> }
  };

  const panelActual = titulosConfig[rol];

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px 20px', backgroundColor: '#f5f6fa', minHeight: '100vh' }}>
      {panelActual ? (
        <div style={{ backgroundColor: '#ffffff', padding: '30px', maxWidth: '850px', margin: '0 auto', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          
          <div style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '15px', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '26px', color: '#2d3436' }}>{panelActual.t}</h1>
          </div>
          
          <div style={{ minHeight: '300px' }}>
            {panelActual.c}
          </div>

          <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '20px', textAlign: 'right', marginTop: '20px' }}>
            <button onClick={handleCerrarSesion} style={{ backgroundColor: '#ff7675', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
              Cerrar Sesión
            </button>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px', color: '#636e72' }}>
          <h2>Cargando componentes de Boomerang...</h2>
        </div>
      )}
    </div>
  );
};

export default Home;