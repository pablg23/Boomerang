import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; 

// IMPORTACIÓN SEGURA: Traemos el logo como un módulo de JavaScript
import logoIcono from '../logo-icono.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false); // Estado para controlar el bloqueo visual
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true); // Iniciamos el bloqueo mientras carga

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err) {
      console.error("Error en login:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError('El usuario no existe o el correo es inválido.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Contraseña o correo incorrectos. Inténtalo de nuevo.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Por seguridad, intenta más tarde.');
      } else {
        setError('Error al iniciar sesión. Verifica tus datos.');
      }
    } finally {
      setCargando(false); // Liberamos el botón si hubo error
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        {/* ENCABEZADO CON TEXTO Y LOGO ALINEADOS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '0 0 10px 0' }}>
          <h2 style={{ color: '#2d3436', margin: 0, fontSize: '28px' }}>Boomerang</h2>
          <img 
            src={logoIcono} 
            alt="Logo Boomerang" 
            style={{ width: '35px', height: '35px', objectFit: 'contain' }} 
          />
        </div>

        <p style={{ color: '#636e72', marginBottom: '30px', fontSize: '15px' }}>Inicia sesión para acceder a tu panel.</p>
        
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#d63031', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', border: '1px solid #ff7675' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
            placeholder="Contraseña"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            disabled={cargando}
            style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #dfe6e9', boxSizing: 'border-box', fontSize: '15px', color: '#2d3436', backgroundColor: '#fdfdfd' }}
          />
          <button type="submit" disabled={cargando} style={{ width: '100%', padding: '14px', backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', transition: 'background-color 0.3s', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <Link to="/registro" style={{ color: '#0984e3', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
            ¿No tienes cuenta? Regístrate aquí
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;