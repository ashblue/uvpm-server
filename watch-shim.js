/**
 * Generate a stub directory and file to prevent Nodemon from crashing when watching
 */
var fs = require('fs');

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

// Delete the old bundle code so the file system picks up on a change before writing
if (fs.existsSync('./dist/index.js')) {
  fs.unlinkSync('./dist/index.js');
}

fs.writeFileSync('./dist/index.js', '');
