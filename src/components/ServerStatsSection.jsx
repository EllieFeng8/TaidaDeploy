import { useEffect, useState } from 'react';
import { TrendingUp, Cloud, Cpu, HardDrive } from 'lucide-react';

export function ServerStatsSection({ stats: initialStats }) {
  const [stats, setStats] = useState(initialStats);

  // Dynamic system oscillation interval to simulate live-server telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => {
        // Random drift of CPU load between 18% and 34%
        const cpuDrift = (Math.random() - 0.5) * 4;
        let nextCpu = Math.round(prev.cpuUsage + cpuDrift);
        if (nextCpu < 15) nextCpu = 18;
        if (nextCpu > 38) nextCpu = 32;

        // Random drift of RAM load between 64% and 70%
        const ramDrift = (Math.random() - 0.5) * 1.5;
        let nextRam = Math.round(prev.ramUsage + ramDrift);
        if (nextRam < 60) nextRam = 65;
        if (nextRam > 75) nextRam = 69;

        return {
          ...prev,
          cpuUsage: nextCpu,
          ramUsage: nextRam,
        };
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Update total count if parent count shifts
  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      monthlyDeployCount: initialStats.monthlyDeployCount,
    }));
  }, [initialStats.monthlyDeployCount]);

  return (
    <div className="flex flex-col gap-6 lg:w-[320px] xl:w-[360px]">
      {/* Monthly Deploy Count - Styled with deep blue primary bg */}
    </div>
  );
}
