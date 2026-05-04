import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase'; 

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Crear el usuario en la autenticación
      const infoUsuario = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. CREACIÓN PROFESIONAL DEL PERFIL:
      // El rol se define en el código, no lo elige el usuario.
      await setDoc(doc(db, "usuarios", infoUsuario.user.uid), {
        correo: email,
        rol: 'estudiante', // Rol por defecto SIEMPRE
        fechaRegistro: new Date().toISOString()
      });

      alert("Cuenta de estudiante creada con éxito");
      navigate('/home');
    } catch (err) {
      // Manejo de errores más específico
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Error al registrarse. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Crear Cuenta en Boomerang</h2>
      <p>Regístrate como estudiante para empezar.</p>
      
      <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Correo institucional" 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '8px', width: '250px' }}
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '8px', width: '250px' }}
        />
        
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Crear cuenta
        </button>
      </form>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
        ¿Ya tienes cuenta? Inicia sesión
      </button>
    </div>
  );
};

export default Registro;