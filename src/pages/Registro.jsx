import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 

const Registro = () => {
  const [nombre, setNombre] = useState(''); // Nuevo estado para el nombre
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validación básica adicional
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setCargando(true);

    try {
      // 1. Crear el usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Guardar sus datos en la colección "usuarios" de Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        nombre: nombre,
        correo: user.email,
        rol: 'estudiante', // Rol por defecto para cuentas nuevas
        fechaRegistro: new Date().toLocaleDateString() // Guardamos la fecha de creación
      });

      // 3. Redirigir al Home automáticamente tras el registro
      navigate('/home');
      
    } catch (err) {
      console.error("Error completo:", err);
      // Personalizar los mensajes de error de Firebase a español
      if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil. Usa al menos 6 caracteres.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError('Ocurrió un error en el registro. Inténtalo de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        <h2 style={{ color: '#2d3436', margin: '0 0 10px 0', fontSize: '28px' }}>Crear Cuenta</h2>
        <p style={{ color: '#636e72', marginBottom: '30px', fontSize: '15px' }}>Únete a Boomerang y accede al inventario.</p>
        
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#d63031', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', border: '1px solid #ff7675' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}> 
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            required
            disabled={cargando}
            style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #dfe6e9', boxSizing: 'border-box', fontSize: '15px', color: '#2d3436', backgroundColor: '#fdfdfd' }}
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            disabled={cargando}
            style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #dfe6e9', boxSizing: 'border-box', fontSize: '15px', color: '#2d3436', backgroundColor: '#fdfdfd' }}
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            disabled={cargando}
            style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #dfe6e9', boxSizing: 'border-box', fontSize: '15px', color: '#2d3436', backgroundColor: '#fdfdfd' }}
          />
          
          <button type="submit" disabled={cargando} style={{ width: '100%', padding: '14px', backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', transition: 'background-color 0.3s', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? 'Registrando cuenta...' : 'Registrarse como Estudiante'}
          </button>
        </form>

        <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <Link to="/" style={{ color: '#0984e3', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Registro;