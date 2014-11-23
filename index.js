// Run only by vendor node.
// In an ideal world this would be run in the same process/context of
// atom-shell but there are many hurdles atm, see
// https://github.com/atom/atom-shell/issues/533
var path = require('path');

// increase the libuv threadpool size to 1.5x the number of logical CPUs.
process.env.UV_THREADPOOL_SIZE = Math.ceil(Math.max(4, require('os').cpus().length * 1.5));

process.title = 'mapnik-server';

server = require('./lib/server');
server.listen(3001);

console.log("listening port 3001");
