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
    <div className="auth-container">
      <div className="auth-card">
        <h2>Crear Cuenta</h2>
        
        {/* Asegúrate de que esta función se llame igual que la que tienes arriba */}
        <form onSubmit={handleRegistro}> 
          <input
            type="email"
            placeholder="Correo electrónico"
            className="auth-input"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="auth-input"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          
          <button type="submit" className="auth-btn">
            Registrarse
          </button>
        </form>

        <a href="/" className="auth-link">
          ¿Ya tienes cuenta? Inicia sesión aquí
        </a>
      </div>
    </div>
  );
};

export default Registro;