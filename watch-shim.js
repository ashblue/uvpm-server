/**
 * Generate a stub directory and file to prevent Nodemon from crashing when watching
 */
var fs = require('fs');

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

// Delete the old bundle code so the file system picks up on a change before writing
if (fs.existsSync('./dist/bundle.js')) {
  fs.unlinkSync('./dist/bundle.js');
}

fs.writeFileSync('./dist/bundle.js', '');
