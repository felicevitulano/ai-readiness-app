module.exports = {
  apps: [
    {
      name: "ai-readiness",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/opt/ai-readiness-app",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
