// Desarrollo en el computador: `npm run start:local`.
// Las llamadas a /api pasan por proxy.conf.json hacia el backend en localhost:8080,
// así no hay problemas de CORS.
export const environment = {
  production: false,
  apiUrl: '/api/v1',
};
