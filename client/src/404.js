import { useNavigate } from 'react-router-dom';
import './style.css';

function NotFound() {

const navigate = useNavigate();

return (
  <div className='vrlng'>
    <h1 className='odkxj'>Error 404</h1>
      <button className='pfquv' onClick={() => navigate('/')}>Go Home</button>
  </div>
);
}

export default NotFound;