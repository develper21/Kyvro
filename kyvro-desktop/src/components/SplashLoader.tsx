import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedLogo from './AnimatedLogo';

interface LoadingStep {
  id: string;
  title: string;
  description: string;
  duration: number;
}

const SplashLoader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const loadingSteps: LoadingStep[] = [
    {
      id: 'init',
      title: 'Initializing Kyvro',
      description: 'Setting up the environment...',
      duration: 800
    },
    {
      id: 'database',
      title: 'Connecting to Database',
      description: 'Establishing secure connection...',
      duration: 1200
    },
    {
      id: 'api',
      title: 'Loading WhatsApp API',
      description: 'Configuring messaging services...',
      duration: 1000
    },
    {
      id: 'security',
      title: 'Security Check',
      description: 'Verifying encryption protocols...',
      duration: 900
    },
    {
      id: 'ready',
      title: 'Ready to Launch',
      description: 'All systems operational!',
      duration: 600
    }
  ];

  useEffect(() => {
    let totalProgress = 0;
    let stepProgress = 0;
    let currentStepIndex = 0;

    const runLoadingSequence = async () => {
      for (let i = 0; i < loadingSteps.length; i++) {
        currentStepIndex = i;
        setCurrentStep(i);
        
        const step = loadingSteps[i];
        const stepIncrement = 100 / loadingSteps.length;
        
        // Animate progress for this step
        const stepDuration = step.duration;
        const incrementTime = 50; // Update every 50ms
        const totalIncrements = stepDuration / incrementTime;
        const progressPerIncrement = stepIncrement / totalIncrements;
        
        for (let j = 0; j < totalIncrements; j++) {
          stepProgress += progressPerIncrement;
          totalProgress = Math.min(stepProgress, (i + 1) * stepIncrement);
          setProgress(Math.round(totalProgress));
          
          await new Promise(resolve => setTimeout(resolve, incrementTime));
        }
      }
      
      // Complete loading
      setIsLoading(false);
      setIsComplete(true);
      
      // Hide splash screen after completion animation
      setTimeout(() => {
        setProgress(100);
      }, 500);
    };

    runLoadingSequence();
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e2e] flex flex-col items-center justify-center relative overflow-hidden">
      {/* 3D Background Animation */}
      <div className="absolute inset-0 opacity-30">
        <AnimatedLogo type="background" className="w-full h-full" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4">
        {/* 3D Logo Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isComplete ? [1, 1.2, 1] : 1,
            opacity: 1 
          }}
          transition={{ 
            scale: { duration: 0.5, ease: "easeInOut" },
            opacity: { duration: 0.3 }
          }}
          className="w-32 h-32 mb-8"
        >
          <AnimatedLogo 
            type="logo" 
            className="w-full h-full cursor-pointer"
          />
        </motion.div>

        {/* Loading Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-bold text-white">
              {loadingSteps[currentStep].title}
            </h2>
            <p className="text-gray-400 text-sm">
              {loadingSteps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Loading Progress</span>
            <span>{progress}%</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-full"
              style={{
                backgroundSize: '200% 100%',
                backgroundPosition: `${progress}% 0`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Loading Steps Indicators */}
        <div className="flex space-x-2">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`w-2 h-2 rounded-full ${
                index <= currentStep 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                  : 'bg-gray-600'
              }`}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: index === currentStep ? 1.2 : 0.8,
                opacity: index <= currentStep ? 1 : 0.5
              }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center space-x-2 text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Kyvro Ready!</span>
            </div>
            <p className="text-gray-400 text-sm">
              Welcome to your WhatsApp Business command center
            </p>
          </motion.div>
        )}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-50"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{
              y: [null, -Math.random() * 200 - 100],
              scale: [0, 1, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Glowing Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

export default SplashLoader;
