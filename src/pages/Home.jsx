import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore'; // Importamos getDoc para leer la base de datos
import { signOut } from 'firebase/auth';

const Home = () => {
  const [rol, setRol] = useState(null); // Aquí guardaremos el rol temporalmente
  const navigate = useNavigate();

  useEffect(() => {
    // onAuthStateChanged escucha cuando alguien inicia sesión o entra a la página
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Si hay un usuario logueado, vamos a Firestore a buscar su "perfil"
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Guardamos el rol en el estado para que React actualice la pantalla
          setRol(docSnap.data().rol);
        }
      } else {
        // Si nadie ha iniciado sesión, lo pateamos de vuelta al Login por seguridad
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleCerrarSesion = async () => {
    await signOut(auth); // Cerramos la sesión en Firebase
    navigate('/');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Bienvenido a Boomerang</h2>
      
      {/* MAGIA DE ROLES: Mostramos un cuadro diferente dependiendo de qué palabra tenga en Firestore */}
      
      {rol === 'admin' ? (
        <div style={{ padding: '20px', backgroundColor: '#ffeaa7', borderRadius: '10px', width: '300px' }}>
          <h3>👑 Modo Administrador</h3>
          <p>Tienes permisos para gestionar todo el sistema.</p>
        </div>
      ) : rol === 'estudiante' ? (
        <div style={{ padding: '20px', backgroundColor: '#74b9ff', color: 'white', borderRadius: '10px', width: '300px' }}>
          <h3>🎓 Modo Estudiante</h3>
          <p>Aquí podrás publicar y buscar objetos perdidos.</p>
        </div>
      ) : (
        <p>Cargando tu perfil...</p> // Muestra esto medio segundo mientras lee la base de datos
      )}

      <button onClick={handleCerrarSesion} style={{ marginTop: '30px', padding: '10px 20px', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Home;