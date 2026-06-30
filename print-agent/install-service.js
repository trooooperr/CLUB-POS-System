const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'HumTum Print Agent',
  description: 'HumTum Restaurant POS Silent local print agent.',
  script: path.join(__dirname, 'print-agent.js'),
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    }
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service and start it.
svc.on('install', function() {
  console.log('HumTum Print Agent service installed successfully.');
  console.log('Starting service...');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('HumTum Print Agent service is already installed.');
});

svc.on('start', function() {
  console.log('HumTum Print Agent service started. Listening on config port.');
});

svc.install();
