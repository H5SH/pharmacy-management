import React from 'react';
import { toAbsoluteUrl } from '../../../../_metronic/helpers';

const SplashScreen: React.FC = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-primary text-white">
      <div className="text-center">
        <img
          src={toAbsoluteUrl('/media/logos/favicon.ico')}
          alt="Logo"
          width={120}
          height={120}
          className="mb-4"
        />
        <h1 className="display-4 mb-4">Welcome to Our App</h1>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

