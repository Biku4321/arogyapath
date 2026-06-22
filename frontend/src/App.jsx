import { useState } from 'react';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <>
      {hasStarted ? (
        <HomePage />
      ) : (
        <LandingPage onStart={() => setHasStarted(true)} />
      )}
    </>
  );
}