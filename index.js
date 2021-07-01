const fs = require('fs');
const { spawn } = require('child_process');

const services = ['web-app', 'restaurant-service', 'cart-service', 'payment-service', 'order-service'];

services.forEach(() => {
  const proc = spawn('node', [`./services/${service}.js`]);
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
});
