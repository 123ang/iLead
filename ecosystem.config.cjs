module.exports = {
  apps: [
    {
      name: "ilead-api",
      cwd: "/root/projects/iLead/backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "4016",
      },
      max_memory_restart: "512M",
      error_file: "/var/log/ilead/api-error.log",
      out_file: "/var/log/ilead/api-out.log",
      time: true,
    },
  ],
};
