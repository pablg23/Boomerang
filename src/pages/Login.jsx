import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Importamos la conexión que creaste

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Evita que la página recargue al enviar el formulario
    setError(''); // Limpiamos errores previos

    try {
      // Intentamos iniciar sesión con Firebase
      await signInWithEmailAndPassword(auth, email, password);
      // Si funciona, lo mandamos a la pantalla Home
      navigate('/home');
    } catch (err) {
      // Si falla (contraseña incorrecta, no existe el usuario), mostramos un mensaje
      setError('Error al iniciar sesión. Verifica tus datos.');
      console.error(err.message);
    }
  };

 return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Bienvenido a Boomerang</h2>
        
        <form onSubmit={handleLogin}>
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
            Iniciar Sesión
          </button>
        </form>

        <a href="/registro" className="auth-link">
          ¿No tienes cuenta? Regístrate aquí
        </a>
      </div>
    </div>
  );
};

export default Login;
