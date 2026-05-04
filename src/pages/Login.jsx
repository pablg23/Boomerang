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
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Iniciar Sesión en Boomerang</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Correo electrónico" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
      </form>

      {/* Si hay un error, lo mostramos en rojo */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

<button onClick={() => navigate('/registro')} style={{marginTop: '10px'}}>
  ¿No tienes cuenta? Regístrate aquí
</button>
    </div>
    
  );
};

export default Login;

