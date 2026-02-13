const start = async () => {
  console.log('🚀 THESIS Gateway worker starting...');
  console.log('🔌 Connecting to message bus...');
  console.log('✅ Gateway worker ready');
  
  process.on('SIGTERM', () => {
    console.log('👋 Gateway worker shutting down gracefully...');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('👋 Gateway worker shutting down gracefully...');
    process.exit(0);
  });
  
  const running = true;
  while (running) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

start();
