import { useState } from 'react';
import './style.css';

function Register() {

const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [accept, setAccept] = useState(false);
const [success, setSuccess] = useState('');
const [error, setError] = useState('');

const doRegister = async () => {
  setError('');
  setSuccess('');

  if (!accept) return setError('Please review and accept the terms and conditions.');
  if (!username || !password) return setError('Don’t leave any fields blank.');

  try {
    const res = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) return setError(data.error || 'Registration failed');

    setSuccess('Account created! You can now log in.');
  } catch {
    setError('Cannot connect to server');
  }
};
    
return (
<div className='nwxyv'>
  <div className='chopq'>
    <h1 className='ajhuo'>Register</h1>
    {error && <p className='kuxwp'>{error}</p>}
    {success && <p className='wfkjt'>{success}</p>}
    <p className='arecq'>Username</p>
    <input className='clgom' placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)}/>
    <p className='rkewc'>Password</p>
    <input className='eamht' placeholder="Enter password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
    <div className='qwxnf'>
      <input className='jklvq' type='checkbox' checked={accept} onChange={(e) => setAccept(e.target.checked)}/>
      <p className='dihet'>I agree to the YapON Terms</p>
    </div>
    <button className='hclaj' onClick={doRegister}>Register</button>
    <a className='ugmjs' href='/login'>Already have an account? Log in</a>
  </div>
</div>
);
}

export default Register;