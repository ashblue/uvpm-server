/**
 * Generate a stub directory and file to prevent Nodemon from crashing when watching
 */
var fs = require('fs');

if (!fs.existsSync('./dist')) {
    fs.mkdir('./dist');
    fs.writeFileSync('./dist/bundle.js', '');
}
