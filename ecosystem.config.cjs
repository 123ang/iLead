module.exports = {
  apps: [
    {
      name: "ilead-api",
      cwd: "/var/www/ilead/current/backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3003",
      },
      max_memory_restart: "512M",
      error_file: "/var/log/ilead/api-error.log",
      out_file: "/var/log/ilead/api-out.log",
      time: true,
    },
  ],
};
