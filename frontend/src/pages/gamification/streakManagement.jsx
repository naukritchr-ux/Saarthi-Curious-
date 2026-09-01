import MainLayout from "../../layout/mainLayout";
import React, { useState, useEffect } from "react";
import { streakService } from "../../services/streakService";

const StreakManagement = () => {
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    longest_streak: 0,
    total_learning_days: 0,
    last_activity_date: null,
    freezes: 0,
  });
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      console.log("Fetching streak data...");
      const data = await streakService.getUserStreak(userId);
      console.log("Streak data fetched:", data);
      setStreakData(data);
    } catch (error) {
      console.error("Failed to fetch streak data:", error);
      setStreakData({
        current_streak: 0,
        longest_streak: 0,
        total_learning_days: 0,
        last_activity_date: null,
        freezes: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextBadge = () => {
    const current = streakData.current_streak;
    if (current >= 365) return { name: "365 Day Badge", daysLeft: 0 };
    if (current >= 100)
      return { name: "365 Day Badge", daysLeft: 365 - current };
    if (current >= 30)
      return { name: "100 Day Badge", daysLeft: 100 - current };
    if (current >= 7) return { name: "30 Day Badge", daysLeft: 30 - current };
    return { name: "7 Day Badge", daysLeft: 7 - current };
  };

  const nextBadge = getNextBadge();
  const progressPercentage = loading
    ? 0
    : Math.min(
        (streakData.current_streak /
          (streakData.current_streak + nextBadge.daysLeft)) *
          100,
        100,
      );

  const hasFreezeAvailable = streakData.freezes > 0;

  // Calculate next freeze milestone
  const getNextFreezeMilestone = () => {
    const current = streakData.current_streak;
    if (current === 0) return 10;
    const nextMilestone = Math.ceil(current / 10) * 10;
    return nextMilestone;
  };

  const nextFreezeMilestone = getNextFreezeMilestone();
  const daysToNextFreeze = Math.max(
    0,
    nextFreezeMilestone - streakData.current_streak,
  );

  return (
    <MainLayout>
      <div className="p-[30px] bg-[#f7f6fb] min-h-screen">
        <div className="page-header">
          <h1 className="text-[42px] text-[#1e1b5a] mb-[10px]">
            Streak Management
          </h1>
          <p className="text-[#6b7280] text-[18px]">
            Track your learning consistency and unlock rewards.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-[20px] my-[30px]">
          <div className="bg-white p-[24px] rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
            <h4 className="text-[#6b7280] mb-[10px]">Current Streak</h4>
            <h2 className="text-[#1e1b5a] text-[36px]">
              {loading ? "..." : `${streakData.current_streak} Days`}
            </h2>
            <span className="text-[#10b981] font-semibold">
              {streakData.current_streak > 0 ? "🔥 Active" : "❄ Inactive"}
            </span>
          </div>

          <div className="bg-white p-[24px] rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
            <h4 className="text-[#6b7280] mb-[10px]">Longest Streak</h4>
            <h2 className="text-[#1e1b5a] text-[36px]">
              {loading ? "..." : `${streakData.longest_streak} Days`}
            </h2>
            <span className="text-[#10b981] font-semibold">
              🏆 Personal Best
            </span>
          </div>

          <div className="bg-white p-[24px] rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
            <h4 className="text-[#6b7280] mb-[10px]">Total Learning Days</h4>
            <h2 className="text-[#1e1b5a] text-[36px]">
              {loading ? "..." : streakData.total_learning_days}
            </h2>
            <span className="text-[#10b981] font-semibold">📚 All Time</span>
          </div>

          {/* REPLACED: Next Badge with Streak Freezes */}
          <div className="bg-white p-[24px] rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
            <h4 className="text-[#6b7280] mb-[10px]">Streak Freezes</h4>
            <h2 className="text-[#1e1b5a] text-[36px]">
              {loading ? "..." : `${streakData.freezes}`}
            </h2>
            <div className="flex flex-col gap-1">
              <span
                className={`font-semibold ${hasFreezeAvailable ? "text-[#10b981]" : "text-[#6b7280]"}`}
              >
                {hasFreezeAvailable ? "❄️ Freeze Available" : "❄️ No Freezes"}
              </span>
              {!loading && streakData.current_streak > 0 && (
                <span className="text-sm text-[#6b7280]">
                  {daysToNextFreeze === 0
                    ? "🎉 Freeze earned at current milestone!"
                    : `${daysToNextFreeze} days until next freeze`}
                </span>
              )}
              {!loading && streakData.current_streak === 0 && (
                <span className="text-sm text-[#6b7280]">
                  Start your streak to earn freezes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-[25px]">
          <div className="bg-white rounded-[20px] p-[25px] shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
            <h3>Streak Progress</h3>

            <div className="progress-wrapper">
              <div className="w-full h-[16px] bg-[#eceaf5] rounded-[30px] overflow-hidden mt-[20px]">
                <div
                  className="h-full bg-gradient-to-r from-[#7c3aed] to-[#00c897]"
                  style={{ width: `${loading ? 0 : progressPercentage}%` }}
                ></div>
              </div>

              <div className="mt-[12px] text-[#1e1b5a] font-semibold">
                {loading
                  ? "..."
                  : `${streakData.current_streak} / ${nextBadge.daysLeft + streakData.current_streak} Days Completed`}
              </div>
            </div>

            <div className="mt-[20px] p-[16px] rounded-[12px] bg-[#f5f3ff]">
              🎯{" "}
              {loading
                ? "..."
                : nextBadge.daysLeft > 0
                  ? `Complete ${nextBadge.daysLeft} more days to unlock the`
                  : "You have unlocked the"}
              <strong> {nextBadge.name}</strong>
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-[25px] shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
            <h3>Freeze Rules</h3>

            <ul className="space-y-2">
              <li>Earn 1 freeze every 10 consecutive days.</li>
              <li>Auto-applies on missed weekdays.</li>
              <li>No penalty for weekend breaks.</li>
              <li className="font-semibold text-[#1e1b5a]">
                Current Balance: {streakData.freezes} Freezes
              </li>
              {hasFreezeAvailable && (
                <li className="text-[#10b981] font-semibold">
                  ✅ Freeze available - your streak is protected!
                </li>
              )}
              {!hasFreezeAvailable && streakData.current_streak > 0 && (
                <li className="text-[#6b7280]">
                  🔒 Complete {daysToNextFreeze} more days to earn a freeze
                </li>
              )}
              {!hasFreezeAvailable && streakData.current_streak === 0 && (
                <li className="text-[#6b7280]">
                  🔒 Complete 10 days to earn your first freeze
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StreakManagement;
