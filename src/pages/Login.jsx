import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus datos.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        <h2 style={{ color: '#2d3436', margin: '0 0 10px 0', fontSize: '28px' }}>Boomerang</h2>
        <p style={{ color: '#636e72', marginBottom: '30px', fontSize: '15px' }}>Inicia sesión para acceder a tu panel.</p>
        
        {error && <p style={{ color: '#ff7675', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #dfe6e9', boxSizing: 'border-box', fontSize: '15px', color: '#2d3436', backgroundColor: '#fdfdfd' }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #dfe6e9', boxSizing: 'border-box', fontSize: '15px', color: '#2d3436', backgroundColor: '#fdfdfd' }}
          />
          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', transition: 'background-color 0.3s' }}>
            Iniciar Sesión
          </button>
        </form>

        <div style={{ marginTop: '25px' }}>
          <a href="/registro" style={{ color: '#0984e3', textDecoration: 'none', fontSize: '14px' }}>
            ¿No tienes cuenta? Regístrate aquí
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;