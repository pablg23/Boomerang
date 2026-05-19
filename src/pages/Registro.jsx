import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        correo: user.email,
        rol: 'estudiante'
      });

      navigate('/home');
    } catch (err) {
      if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else {
        setError('Error en el registro: ' + err.message);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        <h2 style={{ color: '#2d3436', margin: '0 0 10px 0', fontSize: '28px' }}>Crear Cuenta</h2>
        <p style={{ color: '#636e72', marginBottom: '30px', fontSize: '15px' }}>Únete a Boomerang como estudiante.</p>
        
        {error && <p style={{ color: '#ff7675', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
        
        <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}> 
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
          
          <button type="submit" disabled={cargando} style={{ width: '100%', padding: '14px', backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div style={{ marginTop: '25px' }}>
          <a href="/" style={{ color: '#0984e3', textDecoration: 'none', fontSize: '14px' }}>
            ¿Ya tienes cuenta? Inicia sesión aquí
          </a>
        </div>

      </div>
    </div>
  );
};

export default Registro;