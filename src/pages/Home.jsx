import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, increment } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import logoIcono from '../logo-icono.png'
const Home = () => {
  const [rol, setRol] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  
  // --- ESTADOS DE DATOS EN TIEMPO REAL ---
  const [inventario, setInventario] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]); 
  const [usuarios, setUsuarios] = useState([]); 
  
  // Control de Menús Desplegables (Accordions)
  const [inventarioMenuAbierto, setInventarioMenuAbierto] = useState(false);
  const [catPorCategoriaMenuAbierto, setCatPorCategoriaMenuAbierto] = useState(false);
  const [categoriaMenuAbierto, setCategoriaMenuAbierto] = useState(true);
  const [usuariosMenuAbierto, setUsuariosMenuAbierto] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  
  // Navegación de categorías del estudiante y efectos Hover
  const [categoriaActual, setCategoriaActual] = useState('Biblioteca'); 
  const [categoriaHovered, setCategoriaHovered] = useState(null);
  
  // Modal de Fechas para Estudiantes
  const [modalPrestamo, setModalPrestamo] = useState({ abierto: false, item: null });
  const [fechaPrestamo, setFechaPrestamo] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const hoyStr = new Date().toISOString().split('T')[0]; 
  
  // Formulario de inventario (Inserción y Edición)
  const [nombre, setNombre] = useState('');
  const [area, setArea] = useState('Biblioteca');
  const [stock, setStock] = useState(1);
  const [estado, setEstado] = useState('Disponible');
  const [editandoId, setEditandoId] = useState(null);

  // --- ESCUCHA ACTIVA EN TIEMPO REAL ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setLoadingAuth(true);
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().rol) {
            let rolDetectado = docSnap.data().rol.toLowerCase().trim();
            if (rolDetectado === 'administrador') rolDetectado = 'admin';
            setRol(rolDetectado);
          } else {
            alert("Error: Tu usuario no tiene un rol asignado.");
          }
        } catch (error) {
          console.error("Error al obtener rol:", error);
        } finally {
          setLoadingAuth(false);
        }
      } else {
        navigate('/');
      }
    });

    const unsubInventario = onSnapshot(collection(db, "inventario"), (snapshot) => {
      setInventario(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubSolicitudes = onSnapshot(collection(db, "solicitudes"), (snapshot) => {
      setSolicitudes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      setUsuarios(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubscribeAuth();
      unsubInventario();
      unsubSolicitudes();
      unsubUsuarios();
    };
  }, [navigate]);

  const handleCerrarSesion = async () => {
    await signOut(auth); 
    navigate('/');
  };

  // --- OPERACIONES DE DATOS Y FLUJOS ---
  const guardarElemento = async (e) => {
    e.preventDefault();
    try {
      if (editandoId === null) {
        await addDoc(collection(db, "inventario"), { nombre, area, stock: Number(stock), estado });
        alert("Elemento agregado con éxito.");
      } else {
        await updateDoc(doc(db, "inventario", editandoId), { nombre, area, stock: Number(stock), estado });
        alert("Elemento actualizado con éxito.");
        setEditandoId(null);
      }
      cancelarEdicion();
    } catch (error) { console.error(error); }
  };

  const prepararEdicion = (item) => {
    setEditandoId(item.id);
    setNombre(item.nombre);
    setArea(item.area);
    setStock(item.stock);
    setEstado(item.estado);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNombre('');
    setArea('Biblioteca');
    setStock(1);
    setEstado('Disponible');
  };

  const abrirModalPrestamo = (item) => {
    setModalPrestamo({ abierto: true, item });
    setFechaPrestamo(hoyStr);
    setFechaEntrega('');
  };

  const confirmarPrestamo = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "solicitudes"), {
        usuarioEmail: auth.currentUser.email,
        objetoId: modalPrestamo.item.id,
        objetoNombre: modalPrestamo.item.nombre,
        area: modalPrestamo.item.area,
        estado: 'Pendiente',
        fechaPrestamo: fechaPrestamo,
        fechaEntrega: fechaEntrega
      });
      alert(`Solicitud de ${modalPrestamo.item.nombre} enviada con éxito.`);
      setModalPrestamo({ abierto: false, item: null });
    } catch (error) { console.error(error); }
  };

  const cancelarSolicitudEstudiante = async (id) => {
    if (window.confirm("¿Seguro que deseas cancelar esta solicitud pendiente?")) {
      try {
        await deleteDoc(doc(db, "solicitudes", id));
        alert("Solicitud cancelada con éxito.");
      } catch (error) { console.error(error); }
    }
  };

  const cambiarEstadoSolicitud = async (sol, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "solicitudes", sol.id), { estado: nuevoEstado });
      if (sol.objetoId) {
        const inventarioRef = doc(db, "inventario", sol.objetoId);
        if (sol.estado === 'Pendiente' && nuevoEstado === 'Aprobado') {
          await updateDoc(inventarioRef, { stock: increment(-1) });
        } else if (sol.estado === 'Aprobado' && nuevoEstado === 'Devuelto') {
          await updateDoc(inventarioRef, { stock: increment(1) });
        } else if (sol.estado === 'Aprobado' && nuevoEstado === 'Pendiente') {
          await updateDoc(inventarioRef, { stock: increment(1) });
        } else if (sol.estado === 'Devuelto' && nuevoEstado === 'Aprobado') {
          await updateDoc(inventarioRef, { stock: increment(-1) });
        }
      }
    } catch (error) { console.error(error); }
  };

  const modificarRolUsuario = async (userId, nuevoRol) => {
    try {
      await updateDoc(doc(db, "usuarios", userId), { rol: nuevoRol });
      alert("Rol de usuario actualizado exitosamente.");
    } catch (error) { console.error(error); }
  };

  // --- CONTEO DE MÉTRICAS ---
  const stats = (() => {
    const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const activos = solicitudes.filter(s => s.estado === 'Aprobado').length;
    const vencidos = solicitudes.filter(s => s.estado === 'Aprobado' && s.fechaEntrega && s.fechaEntrega < hoyStr).length;
    const frecuencias = {};
    solicitudes.forEach(s => frecuencias[s.objetoNombre] = (frecuencias[s.objetoNombre] || 0) + 1);
    let masPedido = "Ninguno";
    let maxConteo = 0;
    Object.entries(frecuencias).forEach(([n, c]) => {
      if (c > maxConteo) { maxConteo = c; masPedido = n; }
    });
    return { pendientes, activos, vencidos, favorito: maxConteo > 0 ? `${masPedido} (${maxConteo} unds)` : 'Sin registros' };
  })();

  const tieneAlertasVencidas = solicitudes.some(sol => sol.usuarioEmail === auth.currentUser?.email && sol.estado === 'Aprobado' && sol.fechaEntrega && sol.fechaEntrega < hoyStr);

  // --- ESTILOS COMPARTIDOS ---
  const inputEstiloClaro = {
    backgroundColor: '#ffffff',
    color: '#2d3436',
    border: '1px solid #ccd1d9',
    padding: '12px 14px',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer'
  };

  const selectEstiloClaro = {
    backgroundColor: '#ffffff',
    color: '#2d3436',
    border: '1px solid #ccd1d9',
    padding: '12px 14px',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    fontWeight: '500'
  };

  const cabeceraDesplegableEstilo = {
    width: '100%',
    padding: '16px 20px',
    backgroundColor: '#f1f2f6',
    color: '#2d3436',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px',
    transition: 'background-color 0.2s'
  };

  // RECUADRO DE ESTADÍSTICAS EN VIVO
  const renderPanelEstadisticasJSX = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
      <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '12px', color: '#856404' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Solicitudes Pendientes</div>
        <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>{stats.pendientes}</div>
      </div>
      <div style={{ padding: '20px', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '12px', color: '#0c5460' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Préstamos Activos</div>
        <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>{stats.activos}</div>
      </div>
      <div style={{ padding: '20px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '12px', color: '#721c24' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Retrasos Críticos</div>
        <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '5px' }}>{stats.vencidos}</div>
      </div>
      <div style={{ padding: '20px', backgroundColor: '#e2e3e5', border: '1px solid #d6d8db', borderRadius: '12px', color: '#383d41' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Más Solicitado</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stats.favorito}</div>
      </div>
    </div>
  );

  // VISTA 1: ESTUDIANTES
  const vistaEstudianteJSX = (
    <div>
      {tieneAlertasVencidas && (
        <div style={{ backgroundColor: '#ff7675', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '25px', fontWeight: 'bold', textAlign: 'center' }}>
          ⚠️ ALERTA DE RETRASO: Tienes elementos vencidos. Por favor, realiza la entrega en la brevedad posible.
        </div>
      )}

      {/* MODAL CON AUTO-DESPLEGADO DE CALENDARIO AL HACER CLIC EN EL INPUT */}
      {modalPrestamo.abierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2d3436' }}>Solicitar: {modalPrestamo.item?.nombre}</h3>
            <form onSubmit={confirmarPrestamo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#636e72', fontSize: '13px' }}>Fecha de Préstamo:</label>
                <input 
                  type="date" 
                  value={fechaPrestamo} 
                  min={hoyStr} 
                  onChange={(e) => setFechaPrestamo(e.target.value)} 
                  onClick={(e) => e.target.showPicker?.()} 
                  required 
                  style={inputEstiloClaro} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#636e72', fontSize: '13px' }}>Fecha de Devolución:</label>
                <input 
                  type="date" 
                  value={fechaEntrega} 
                  min={fechaPrestamo || hoyStr} 
                  onChange={(e) => setFechaEntrega(e.target.value)} 
                  onClick={(e) => e.target.showPicker?.()} 
                  required 
                  style={inputEstiloClaro} 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalPrestamo({abierto: false, item: null})} style={{ flex: 1, padding: '12px', backgroundColor: '#e1b12c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#00b894', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAS TRES CATEGORÍAS GRANDES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        {[
          { id: 'Biblioteca', icon: '📚', color: '#74b9ff', hoverColor: '#e3f2fd' },
          { id: 'Bienestar', icon: '⚽', color: '#a29bfe', hoverColor: '#f3e5f5' },
          { id: 'Laboratorio', icon: '🧪', color: '#55efc4', hoverColor: '#e8f5e9' }
        ].map(cat => {
          const seleccionado = categoriaActual === cat.id;
          const enHover = categoriaHovered === cat.id;
          
          return (
            <div 
              key={cat.id} 
              onClick={() => setCategoriaActual(cat.id)}
              onMouseEnter={() => setCategoriaHovered(cat.id)}
              onMouseLeave={() => setCategoriaHovered(null)}
              style={{ 
                padding: '25px', 
                backgroundColor: seleccionado ? cat.color : (enHover ? cat.hoverColor : '#ffffff'), 
                color: seleccionado ? 'white' : '#2d3436', 
                border: seleccionado ? 'none' : '2px solid #f1f2f6', 
                borderRadius: '14px', 
                cursor: 'pointer', 
                textAlign: 'center', 
                transition: 'all 0.2s ease',
                boxShadow: seleccionado || enHover ? '0 4px 15px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{cat.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{cat.id}</div>
            </div>
          );
        })}
      </div>

      {/* MENÚ DESPLEGABLE: RECURSOS DISPONIBLES POR CATEGORÍA */}
      <div style={{ marginBottom: '25px', border: '1px solid #dfe6e9', borderRadius: '8px', overflow: 'hidden' }}>
        <button onClick={() => setCategoriaMenuAbierto(!categoriaMenuAbierto)} style={cabeceraDesplegableEstilo}>
          <span>🔍 Elementos Disponibles en {categoriaActual} (Clic para colapsar)</span>
          <span>{categoriaMenuAbierto ? '▲' : '▼'}</span>
        </button>
        
        {categoriaMenuAbierto && (
          <div style={{ padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inventario.filter(item => item.area === categoriaActual).length === 0 ? (
              <p style={{ color: '#b2bec3', margin: 0, textAlign: 'left' }}>No hay elementos registrados en esta área.</p>
            ) : (
              inventario.filter(item => item.area === categoriaActual).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid #f1f2f6', borderRadius: '10px', backgroundColor: '#ffffff' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 'bold', color: '#2d3436', display: 'block', fontSize: '16px', marginBottom: '4px' }}>{item.nombre}</span>
                    <span style={{ fontSize: '13px', color: '#636e72', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.stock > 0 ? '#00b894' : '#ff7675' }}></span>
                      Disponibles: {item.stock} unidades
                    </span>
                  </div>
                  <button onClick={() => abrirModalPrestamo(item)} disabled={item.estado !== 'Disponible' || item.stock <= 0} style={{ padding: '10px 18px', backgroundColor: item.estado === 'Disponible' && item.stock > 0 ? '#00b894' : '#eee', color: item.estado === 'Disponible' && item.stock > 0 ? 'white' : '#b2bec3', border: 'none', borderRadius: '6px', cursor: item.estado === 'Disponible' && item.stock > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '13px' }}>
                    Solicitar Préstamo
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* HISTORIAL DESPLEGABLE ESTUDIANTE */}
      <div style={{ border: '1px solid #dfe6e9', borderRadius: '8px', overflow: 'hidden' }}>
        <button onClick={() => setHistorialAbierto(!historialAbierto)} style={cabeceraDesplegableEstilo}>
          <span>📋 Mi Historial y Estado de Pedidos (Clic para desplegar)</span>
          <span>{historialAbierto ? '▲' : '▼'}</span>
        </button>
        {historialAbierto && (
          <div style={{ padding: '15px', backgroundColor: '#ffffff', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dfe6e9', backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Recurso</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fechas</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.filter(s => s.usuarioEmail === auth.currentUser?.email).map(sol => {
                  
                  // 1. LÓGICA DE ESTADO VISUAL
                  let estadoVisual = sol.estado;
                  
                  // Evaluamos la fecha solo si el estado en BD es "Aprobado"
                  if (sol.estado === 'Aprobado' && sol.fechaEntrega) {
                    const fechaHoy = new Date();
                    fechaHoy.setHours(0, 0, 0, 0); 
                    
                    const fechaLimite = new Date(sol.fechaEntrega + 'T00:00:00');
                    fechaLimite.setHours(0, 0, 0, 0);

                    // Si hoy es mayor que la fecha límite, REEMPLAZAMOS el estado visual
                    if (fechaHoy > fechaLimite) {
                      estadoVisual = 'Retrasado';
                    }
                  }

                  // 2. ASIGNACIÓN DE COLORES
                  let colorFondo = '';
                  let colorTexto = '';

                  if (estadoVisual === 'Pendiente') {
                    colorFondo = '#fff3cd'; 
                    colorTexto = '#856404';
                  } else if (estadoVisual === 'Aprobado') {
                    colorFondo = '#d4edda'; 
                    colorTexto = '#155724';
                  } else if (estadoVisual === 'Devuelto') {
                    colorFondo = '#e2e3e5'; 
                    colorTexto = '#383d41';
                  } else {
                    // Aplica para 'Retrasado' o 'Cancelado/Rechazado'
                    colorFondo = '#f8d7da'; 
                    colorTexto = '#721c24';
                  }

                  // 3. RENDERIZAR LA FILA
                  return (
                    <tr key={sol.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#0984e3', textAlign: 'left' }}>
                        {sol.objetoNombre}
                      </td>
                      <td style={{ padding: '12px', color: '#636e72', textAlign: 'left' }}>
                        <div style={{ fontSize: '11px' }}>Préstamo: {sol.fechaPrestamo}</div>
                        <div style={{ fontSize: '11px' }}>Devolución: {sol.fechaEntrega}</div>
                      </td>
                      
                      <td style={{ padding: '12px', textAlign: 'left' }}>
                        {/* Se muestra una única etiqueta limpia */}
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          backgroundColor: colorFondo, 
                          color: colorTexto,
                          display: 'inline-block'
                        }}>
                          {estadoVisual === 'Retrasado' ? '⚠️ Retrasado' : estadoVisual}
                        </span>
                      </td>

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {sol.estado === 'Pendiente' ? (
                          <button 
                            onClick={() => cancelarSolicitudEstudiante(sol.id)} 
                            style={{ padding: '5px 10px', background: '#ff7675', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span style={{ color: '#b2bec3', fontSize: '11px' }}>Fijo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // VISTA 2: OPERATIVA (GESTIÓN DE INVENTARIO Y DEVOLUCIONES)
  const vistaGestionJSX = (
    <div>
      {/* FORMULARIO DE INSERCIÓN / EDICIÓN CLARO */}
      <div style={{ background: '#ffffff', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #dfe6e9' }}>
        <h3 style={{ marginTop: 0, color: editandoId ? '#e1b12c' : '#2d3436', marginBottom: '20px', borderBottom: '1px solid #f1f2f6', paddingBottom: '10px', textAlign: 'left' }}>
          {editandoId ? "📝 Modo Edición Activo" : "➕ Insertar Nuevo Recurso"}
        </h3>
        <form onSubmit={guardarElemento} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: '2 1 200px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#636e72', textAlign: 'left' }}>Nombre del Objeto:</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputEstiloClaro} placeholder="Ej: Microscopio monocular" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#636e72', textAlign: 'left' }}>Área de Asignación:</label>
            <select value={area} onChange={(e) => setArea(e.target.value)} style={selectEstiloClaro}>
              <option value="Biblioteca">Biblioteca</option>
              <option value="Bienestar">Bienestar</option>
              <option value="Laboratorio">Laboratorio</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '90px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#636e72', textAlign: 'left' }}>Stock:</label>
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required style={inputEstiloClaro} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ padding: '12px 20px', backgroundColor: editandoId ? '#e1b12c' : '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {editandoId ? "Actualizar" : "Guardar Recurso"}
            </button>
            {editandoId && (
              <button type="button" onClick={cancelarEdicion} style={{ padding: '12px 15px', backgroundColor: '#636e72', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CONTROL DE SOLICITUDES Y DEVOLUCIONES */}
      <h3 style={{ color: '#2d3436', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', textAlign: 'left', fontSize: '18px' }}>Control de Solicitudes y Devoluciones</h3>
      <div style={{ overflowX: 'auto', marginBottom: '35px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dfe6e9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dfe6e9' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Estudiante</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Objeto / Área</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Fechas Pactadas</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Acción de Control</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map(sol => {
              const vencido = sol.estado === 'Aprobado' && sol.fechaEntrega && sol.fechaEntrega < hoyStr;
              return (
                <tr key={sol.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                  <td style={{ padding: '12px', color: '#2d3436', textAlign: 'left' }}>{sol.usuarioEmail}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0984e3', textAlign: 'left' }}>{sol.objetoNombre} <span style={{fontSize: '11px', color: '#b2bec3', display: 'block'}}>{sol.area}</span></td>
                  <td style={{ padding: '12px', fontSize: '11px', color: '#636e72', textAlign: 'left' }}>
                    <div>Préstamo: {sol.fechaPrestamo}</div><div>Devolución: {sol.fechaEntrega}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                     <span style={{ fontWeight: 'bold', color: sol.estado === 'Pendiente' ? '#e1b12c' : sol.estado === 'Aprobado' ? '#00b894' : sol.estado === 'Devuelto' ? '#2d3436' : '#d63031' }}>{sol.estado}</span>
                     {vencido && <div style={{ color: '#d63031', fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>⚠️ RETRASADO</div>}
                  </td>
                  <td style={{ padding: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {sol.estado === 'Pendiente' && (
                      <>
                        <button onClick={() => cambiarEstadoSolicitud(sol, 'Aprobado')} style={{ background: '#00b894', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Aprobar (-1 Stock)</button>
                        <button onClick={() => cambiarEstadoSolicitud(sol, 'Rechazado')} style={{ background: '#ff7675', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Rechazar</button>
                      </>
                    )}
                    {sol.estado === 'Aprobado' && (
                      <>
                        <button onClick={() => cambiarEstadoSolicitud(sol, 'Devuelto')} style={{ background: '#0984e3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>📥 Registrar Devolución (+1)</button>
                        <button onClick={() => cambiarEstadoSolicitud(sol, 'Pendiente')} style={{ background: '#dfe6e9', color: '#2d3436', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Revertir</button>
                      </>
                    )}
                    {(sol.estado === 'Devuelto' || sol.estado === 'Rechazado') && (
                      <button onClick={() => cambiarEstadoSolicitud(sol, 'Pendiente')} style={{ background: '#dfe6e9', color: '#2d3436', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Revertir a Pendiente</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MENÚ DESPLEGABLE 1: CATÁLOGO GENERAL */}
      <div style={{ border: '1px solid #dfe6e9', borderRadius: '8px', overflow: 'hidden', marginTop: '20px' }}>
        <button onClick={() => setInventarioMenuAbierto(!inventarioMenuAbierto)} style={cabeceraDesplegableEstilo}>
          <span>📦 Ver Catálogo General de Inventario (Lista Unificada)</span>
          <span>{inventarioMenuAbierto ? '▲' : '▼'}</span>
        </button>
        {inventarioMenuAbierto && (
          <div style={{ padding: '15px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inventario.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', border: '1px solid #f1f2f6', borderRadius: '6px', background: '#fff', alignItems: 'center' }}>
                <span style={{ color: '#2d3436', textAlign: 'left', fontSize: '13px' }}><strong>{item.nombre}</strong> — {item.area} (Stock: <strong>{item.stock} unds</strong>)</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => prepararEdicion(item)} style={{ background: '#74b9ff', border: 'none', padding: '5px 10px', color: 'white', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Editar</button>
                  <button onClick={() => deleteDoc(doc(db, "inventario", item.id))} style={{ background: '#ff7675', border: 'none', padding: '5px 10px', color: 'white', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MENÚ DESPLEGABLE 2: CATÁLOGO FILTRADO POR CATEGORÍAS */}
      <div style={{ border: '1px solid #dfe6e9', borderRadius: '8px', overflow: 'hidden', marginTop: '15px' }}>
        <button onClick={() => setCatPorCategoriaMenuAbierto(!catPorCategoriaMenuAbierto)} style={cabeceraDesplegableEstilo}>
          <span>🗂️ Ver Catálogo Organizado por Categorías (Carpetas)</span>
          <span>{catPorCategoriaMenuAbierto ? '▲' : '▼'}</span>
        </button>
        {catPorCategoriaMenuAbierto && (
          <div style={{ padding: '20px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {['Biblioteca', 'Bienestar', 'Laboratorio'].map(areaFiltro => {
              const itemsFiltrados = inventario.filter(i => i.area === areaFiltro);
              return (
                <div key={areaFiltro} style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2d3436', borderBottom: '1px solid #f1f2f6', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📁</span> {areaFiltro} ({itemsFiltrados.length} recursos asignados)
                  </h4>
                  {itemsFiltrados.length === 0 ? (
                    <p style={{ color: '#b2bec3', fontSize: '13px', margin: '5px 0 15px 25px' }}>Sin elementos registrados en esta sección.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px' }}>
                      {itemsFiltrados.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', border: '1px solid #f1f2f6', borderRadius: '6px', background: '#fafafa', alignItems: 'center' }}>
                          <span style={{ color: '#2d3436', fontSize: '13px' }}><strong>{item.nombre}</strong> (Stock Real: {item.stock} unds)</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => prepararEdicion(item)} style={{ background: '#74b9ff', border: 'none', padding: '4px 8px', color: 'white', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Editar</button>
                            <button onClick={() => deleteDoc(doc(db, "inventario", item.id))} style={{ background: '#ff7675', border: 'none', padding: '4px 8px', color: 'white', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );

  // VISTA 3: EXCLUSIVA CUENTAS (SUPERUSUARIO ENCAPSULADO)
  const vistaSuperusuarioCuentasDesplegableJSX = (
    <div style={{ border: '1px solid #dfe6e9', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' }}>
      <button onClick={() => setUsuariosMenuAbierto(!usuariosMenuAbierto)} style={{ ...cabeceraDesplegableEstilo, backgroundColor: '#dfe6e9' }}>
        <span>👥 Configuración Global de Permisos y Cuentas ({usuarios.length} Usuarios)</span>
        <span>{usuariosMenuAbierto ? '▲' : '▼'}</span>
      </button>
      {usuariosMenuAbierto && (
        <div style={{ padding: '15px', backgroundColor: '#ffffff', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dfe6e9' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>ID Firebase</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Correo Electrónico</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Asignación de Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                  <td style={{ padding: '12px', color: '#b2bec3', fontFamily: 'monospace', fontSize: '11px', textAlign: 'left' }}>{u.id}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0984e3', textAlign: 'left' }}>{u.correo || u.email}</td>
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                    <select value={u.rol || u.role} onChange={(e) => modificarRolUsuario(u.id, e.target.value)} style={{ ...selectEstiloClaro, padding: '8px 10px', fontSize: '12px' }}>
                      <option value="estudiante">Estudiante</option>
                      <option value="operador">Operador</option>
                      <option value="admin">Administrador</option>
                      <option value="superusuario">Superusuario</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // CONFIGURACIÓN DINÁMICA POR ROL
  const titulosConfig = {
    superusuario: { 
      t: "👑 Panel Maestro: Superusuario", 
      c: (
        <div>
          {renderPanelEstadisticasJSX()}
          {vistaSuperusuarioCuentasDesplegableJSX}
          <div style={{ margin: '30px 0', borderTop: '2px dashed #dfe6e9' }}></div>
          {vistaGestionJSX}
        </div>
      )
    },
    admin: { 
      t: "💼 Panel de Control: Administrador", 
      c: (
        <div>
          {renderPanelEstadisticasJSX()}
          {vistaGestionJSX}
        </div>
      )
    },
    operador: { t: "⚙️ Panel de Operaciones: Operador", c: vistaGestionJSX },
    estudiante: { t: "Préstamos - Boomerang", c: vistaEstudianteJSX }
  };

  if (loadingAuth) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa', color: '#2d3436', fontSize: '18px', fontWeight: 'bold' }}>Estableciendo conexión segura...</div>;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', width: '100%', fontFamily: "'Segoe UI', Roboto, sans-serif", margin: 0, padding: '40px 20px', boxSizing: 'border-box' }}>
      {titulosConfig[rol] ? (
        <div style={{ background: '#ffffff', padding: '35px', maxWidth: '1100px', margin: '0 auto', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          
     {/* Header principal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f2f6', paddingBottom: '20px', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logoIcono} alt="Boomerang Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold', color: '#2d3436' }}>{titulosConfig[rol].t}</h1>
            </div>
            
            {/* BOTONES DE LA ESQUINA DERECHA - AHORA SOLO EL AVATAR DE PERFIL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => setMostrarPerfil(true)} 
                style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#0984e3', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
                title="Ver Perfil"
              >
                {auth.currentUser?.email ? auth.currentUser.email.charAt(0).toUpperCase() : 'U'}
              </button>
            </div>
          </div>

          {/* Renderizado del Panel correspondiente */}
          {titulosConfig[rol].c}

          {/* VENTANA FLOTANTE DE PERFIL - LIMPIA Y DIRECTA */}
          {mostrarPerfil && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative', textAlign: 'left' }}>
                
                {/* Botón para cerrar (X) */}
                <button 
                  onClick={() => setMostrarPerfil(false)} 
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#636e72' }}
                >
                  ✕
                </button>

                <h3 style={{ margin: '0 0 20px 0', color: '#2d3436', fontSize: '22px', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px' }}>Mi Perfil</h3>
                
                {/* Información básica del Usuario */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#b2bec3', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Usuario / Correo</p>
                    <p style={{ margin: 0, color: '#2d3436', fontSize: '15px', fontWeight: '500' }}>{auth.currentUser?.email}</p>
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#b2bec3', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Rol en Boomerang</p>
                    <span style={{ backgroundColor: '#e3f2fd', color: '#0b7dda', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                      {rol}
                    </span>
                  </div>
                </div>

                {/* FILA DE BOTONES DE ACCIÓN ABAJO */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* Botón para cerrar el perfil */}
                  <button 
                    onClick={() => setMostrarPerfil(false)} 
                    style={{ flex: 1, padding: '12px', backgroundColor: '#dfe6e9', color: '#2d3436', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'background-color 0.2s' }}
                  >
                    Regresar
                  </button>

                  {/* Botón para cerrar sesión */}
                  <button 
                    onClick={handleCerrarSesion} 
                    style={{ flex: 1, padding: '12px', backgroundColor: '#ff7675', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'background-color 0.2s' }}
                  >
                    Cerrar Sesión
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2 style={{ color: '#d63031' }}>Rol inválido o sin permisos asignados.</h2>
          <button onClick={handleCerrarSesion} style={{ marginTop: '15px', padding: '10px 20px', background: '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Regresar al Login</button>
        </div>
      )}
    </div>
  );
};

export default Home;