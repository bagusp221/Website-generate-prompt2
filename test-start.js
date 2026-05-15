const { execSync } = require('child_process');
try {
  execSync('node dist/server.cjs & sleep 2 ; kill $!');
  console.log("Server started normally.");
} catch (e) {
  console.log("Error starting server:", e.output.toString());
}
