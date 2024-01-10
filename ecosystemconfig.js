module.exports = {
  apps: [
    {
      name: "Retail Eazy",
      script: "server.js", // Change this to your main server file
      instances: "max", // Set to 'max' to utilize all available CPU cores
      exec_mode: "cluster", // Run the app in cluster mode
      watch: false, // Enable auto-restart on file changes
      ignore_watch: ["node_modules", "logs"], // Exclude certain directories from watching
    //   max_memory_restart: "1G", // Restart the app if memory usage exceeds 1GB
      //   log_date_format: 'YYYY-MM-DD HH:mm:ss', // Log date format
      //   error_file: 'logs/error.log', // Path to error log file
      //   out_file: 'logs/out.log', // Path to combined output log file
      //   merge_logs: true, // Merge logs from all instances into one file
      //   log_type: 'json', // Log format (json, raw, simple, or none)
      //   env: {
      //     NODE_ENV: 'production', // Set the environment to production
      //     PORT: 8000, // Set your application port
      //   },
    },
  ],
};
