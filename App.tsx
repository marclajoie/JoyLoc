import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTownFromCoordinates } from './services/geminiService';
import { Status } from './types';
import { MapPinIcon, LoaderIcon, AlertTriangleIcon } from './components/icons';

const App: React.FC = () => {
  const [town, setTown] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastPosition = useRef<{ lat: number; lon: number } | null>(null);

  const handleLocationUpdate = useCallback(async (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;

    // A simple check to avoid spamming the API if the location hasn't changed significantly
    if (
      lastPosition.current &&
      Math.abs(lastPosition.current.lat - latitude) < 0.0001 &&
      Math.abs(lastPosition.current.lon - longitude) < 0.0001
    ) {
      return;
    }
    
    lastPosition.current = { lat: latitude, lon: longitude };

    setStatus(Status.GEOCODING);
    try {
      const newTown = await getTownFromCoordinates(latitude, longitude);
      setTown(newTown);
      setStatus(Status.SUCCESS);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Impossible de déterminer la ville. L'API est peut-être occupée.");
      setStatus(Status.ERROR);
    }
  }, []);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Une erreur de localisation inconnue est survenue.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Accès à la localisation refusé. Veuillez l'activer dans les paramètres de votre navigateur.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Les informations de localisation ne sont pas disponibles.";
        break;
      case error.TIMEOUT:
        errorMessage = "La demande de localisation de l'utilisateur a expiré.";
        break;
    }
    setError(errorMessage);
    setStatus(Status.ERROR);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas prise en charge par votre navigateur.");
      setStatus(Status.ERROR);
      return;
    }

    setStatus(Status.LOCATING);
    watchId.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderStatus = () => {
    switch (status) {
      case Status.LOCATING:
        return (
          <div className="flex items-center text-cyan-400">
            <LoaderIcon className="animate-spin mr-2" />
            <span>Recherche de votre position...</span>
          </div>
        );
      case Status.GEOCODING:
        return (
          <div className="flex items-center text-purple-400">
            <LoaderIcon className="animate-spin mr-2" />
            <span>Détermination de votre ville...</span>
          </div>
        );
      case Status.SUCCESS:
        return (
           <div className="flex items-center text-green-400">
            <MapPinIcon className="mr-2" />
            <span>Position mise à jour !</span>
          </div>
        );
      case Status.ERROR:
         return (
          <div className="flex items-center text-red-400">
            <AlertTriangleIcon className="mr-2" />
            <span>Erreur</span>
          </div>
        );
      default:
        return <div className="h-6"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-cyan-500/10 p-8 border border-gray-700">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Joy Localisateur
          </h1>
          <p className="text-gray-400 mt-2">Votre ville actuelle, mise à jour en temps réel.</p>
        </header>
        
        <main className="my-8">
          <div className="h-8 mb-4 text-sm text-gray-300 transition-opacity duration-300">
            {renderStatus()}
          </div>
          
          <div className="relative p-6 bg-black/30 rounded-lg min-h-[120px] flex items-center justify-center border border-gray-700">
            {town ? (
              <p className="text-5xl font-semibold tracking-tight text-white animate-fade-in">{town}</p>
            ) : (
              <p className="text-xl text-gray-500">En attente de la localisation...</p>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 animate-fade-in">
              <p>{error}</p>
            </div>
          )}
        </main>
        
        <footer className="mt-6 text-xs text-gray-500">
          <p>Cette application utilise la localisation de votre appareil pour fournir des mises à jour en temps réel.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;