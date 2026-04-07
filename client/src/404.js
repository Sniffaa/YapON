import { useNavigate } from 'react-router-dom';
import './style.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className='xuqp'>
      <h1 className='rnjb'>Error 404</h1>
        <button className='dieu' onClick={() => navigate('/')}>
          Go Home
        </button>
    </div>
  );
}

export default NotFound;