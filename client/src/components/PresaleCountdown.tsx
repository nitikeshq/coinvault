import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, TrendingUp } from "lucide-react";

interface TimerData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  timeRemaining: number;
  endDate: string;
}

interface ProgressData {
  totalRaised: string;
  targetAmount: string;
  initialLiquidity: string;
  fromDeposits: string;
  progressPercentage: number;
}

export function PresaleCountdown() {
  const [mounted, setMounted] = useState(false);
  const [clientTime, setClientTime] = useState<TimerData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get initial timer data and sync every 60 seconds (instead of every second!)
  const { data: serverTimerData, isLoading: timerLoading } = useQuery<TimerData>({
    queryKey: ['/api/presale/timer'],
    refetchInterval: 60000, // Sync with server every minute
  });

  // Update client-side countdown every second
  useEffect(() => {
    if (!serverTimerData) return;

    // Initialize client timer with server data
    setClientTime(serverTimerData);

    const interval = setInterval(() => {
      setClientTime(prevTime => {
        if (!prevTime || prevTime.timeRemaining <= 0) return prevTime;
        
        const newTimeRemaining = prevTime.timeRemaining - 1000; // Subtract 1 second
        
        if (newTimeRemaining <= 0) {
          return {
            timeRemaining: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
          };
        }
        
        const days = Math.floor(newTimeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((newTimeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((newTimeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((newTimeRemaining % (1000 * 60)) / 1000);
        
        return {
          timeRemaining: newTimeRemaining,
          days,
          hours,
          minutes,
          seconds
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTimerData]);

  // Use client-side calculated timer data
  const timerData = clientTime || serverTimerData;

  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ['/api/presale/progress'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  if (!mounted) {
    return null;
  }

  const isLoading = timerLoading || progressLoading;

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center justify-center gap-2">
          <Clock className="h-6 w-6" />
          Presale Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading presale data...</p>
          </div>
        ) : timerData?.isEnded ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Presale Ended</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">The presale has concluded</p>
          </div>
        ) : (
          <>
            {/* Countdown Timer */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {timerData?.days || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Days</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {timerData?.hours || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hours</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {timerData?.minutes || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {timerData?.seconds || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Seconds</div>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            {progressData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Funding Progress
                  </h3>
                </div>
                
                <Progress 
                  value={progressData.progressPercentage} 
                  className="h-3 bg-gray-200 dark:bg-gray-700"
                />
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${parseFloat(progressData.totalRaised).toLocaleString()} raised
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ${parseFloat(progressData.targetAmount).toLocaleString()} target
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ${parseFloat(progressData.initialLiquidity).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Initial Liquidity</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      ${parseFloat(progressData.fromDeposits).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">From Deposits</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {progressData.progressPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}