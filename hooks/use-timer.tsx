// hooks/use-timer.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface TimerContextType {
  timerSeconds: number;
  isTimerRunning: boolean;
  timerHour: string | null;
  isTimerMinimized: boolean;
  startClass: (hour: string, durationMinutes?: number) => void;
  stopClass: () => void;
  toggleTimer: () => void;
  setIsTimerMinimized: (val: boolean) => void;
  formatTime: (sec: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerSeconds, setTimerSeconds] = useState(3000) // 50 minutos * 60 = 3000s
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerHour, setTimerHour] = useState<string | null>(null)
  const [isTimerMinimized, setIsTimerMinimized] = useState(true)

  // Motor decrescente
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000)
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timerSeconds])

  const startClass = (hour: string, durationMinutes = 50) => {
    setTimerHour(hour)
    setTimerSeconds(durationMinutes * 60)
    setIsTimerRunning(true)
    setIsTimerMinimized(false)
    setTimeout(() => setIsTimerMinimized(true), 3000) // Minimiza para a bolinha após 3s
  }

  const stopClass = () => {
    setIsTimerRunning(false)
    setTimerSeconds(3000)
    setTimerHour(null)
    setIsTimerMinimized(true)
  }

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning)

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <TimerContext.Provider value={{
      timerSeconds, isTimerRunning, timerHour, isTimerMinimized,
      startClass, stopClass, toggleTimer, setIsTimerMinimized, formatTime
    }}>
      {children}
    </TimerContext.Provider>
  )
}

export const useTimer = () => {
  const context = useContext(TimerContext)
  if (!context) throw new Error('useTimer must be used within TimerProvider')
  return context
}