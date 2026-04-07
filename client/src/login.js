import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './style.css';
import React from 'react';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/', { replace: true });
  }, []);

  const handleLogin = async () => {
    setMessage('');
    if (!username || !password) {
      setMessage('Please enter username and password');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role); // save role
      navigate('/');

    } catch (err) {
      if (err.response && err.response.data.error) {
        setMessage(err.response.data.error);
      } else {
        setMessage('Server error');
      }
    }
  };

  return (
    <div className='iqwjn'>
      <div className='vmdyh'>
        <h1 className='xlysu'>Login</h1>
        <p className='pesfk'>Username</p>
        <input className='rfbhi' value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Enter your username'/>
        <p className='oneqc'>Password</p>
        <input className='wrune' type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Enter your password'/>
        <button className='yadfm' onClick={handleLogin}>Login</button>
        {message && <p className='nrpid'>{message}</p>}
        <a className='qjxiw' href='/register'>Don't have an account? Register</a>
      </div>
    </div>
  );
}

export default Login;