const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'HumTum Print Agent',
  script: path.join(__dirname, 'print-agent.js')
});

// Listen for the "uninstall" event, which indicates the
// process is uninstalled.
svc.on('uninstall', function() {
  console.log('HumTum Print Agent service uninstalled successfully.');
});

svc.uninstall();
