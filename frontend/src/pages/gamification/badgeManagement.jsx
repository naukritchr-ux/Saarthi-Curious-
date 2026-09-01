import React, { useState, useEffect } from "react";
import MainLayout from "../../layout/mainLayout";
import {
  Award,
  Medal,
  Trophy,
  Users,
  Star,
  Shield,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import {
  getUserBadges,
  checkUserBadges,
  getAllBadges,
} from "../../services/badgeServices";

const recentActivity = [
  "Rahul unlocked Gold Master",
  "Sneha unlocked Silver Achiever",
  "Amit unlocked Bronze Explorer",
  "Priya unlocked Silver Achiever",
];

// Helper to get a fallback emoji based on badge type
const getFallbackEmoji = (badge) => {
  const type = badge?.badge_type?.toLowerCase();
  if (type === "gold") return "🥇";
  if (type === "silver") return "🥈";
  if (type === "bronze") return "🥉";
  if (type === "platinum") return "💎";
  return "🏅";
};

// Helper function to render badge icon - IMAGE FOCUSED
// Helper function to render badge icon - FIXED SIZE WITH OVERFLOW
const renderBadgeIcon = (badge, size = "w-24 h-24") => {
  if (badge?.badge_icon) {
    return (
      <div className={`${size} flex-shrink-0 overflow-visible relative`}>
        <img
          src={badge.badge_icon}
          alt={badge.badge_name || "Badge"}
          className="w-full h-full object-contain"
          style={{
            objectFit: "contain",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = "none";
            const fallbackSpan = document.createElement("span");
            fallbackSpan.className = `text-6xl absolute inset-0 flex items-center justify-center`;
            fallbackSpan.textContent = getFallbackEmoji(badge);
            e.target.parentNode.appendChild(fallbackSpan);
          }}
        />
      </div>
    );
  }
  return (
    <div
      className={`${size} flex-shrink-0 flex items-center justify-center overflow-visible`}
    >
      <span className="text-6xl">{getFallbackEmoji(badge)}</span>
    </div>
  );
};

export default function BadgeManagement() {
  const userId = Number(localStorage.getItem("user_id"));
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const loadBadges = async () => {
      if (!userId) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      try {
        const [userBadgesData, allBadgesData] = await Promise.all([
          getUserBadges(userId),
          getAllBadges(),
        ]);
        setBadges(userBadgesData || []);
        setAllBadges(allBadgesData || []);
      } catch (err) {
        console.error("Badge fetch failed:", err);
        setError("Unable to load badge data from backend.");
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [userId]);

  const handleCheckBadges = async () => {
    if (!userId) return;

    setChecking(true);
    setSuccessMessage(null);

    try {
      const result = await checkUserBadges(userId);

      if (result.new_badges && result.new_badges.length > 0) {
        setSuccessMessage(
          `Congratulations! You earned ${result.new_badges.length} new badge(s): ${result.new_badges.join(", ")}`,
        );

        const [userBadgesData] = await Promise.all([getUserBadges(userId)]);
        setBadges(userBadgesData || []);
      } else {
        setSuccessMessage(
          "Badge check completed. No new badges earned at this time.",
        );
      }
    } catch (err) {
      console.error("Badge check failed:", err);
      setError("Failed to check for new badges.");
    } finally {
      setChecking(false);
    }
  };

  const badgeCounts = badges.reduce(
    (counts, badge) => {
      const type = badge.badge_type?.toLowerCase();
      counts.total += 1;
      if (type === "gold") counts.gold += 1;
      if (type === "silver") counts.silver += 1;
      if (type === "bronze") counts.bronze += 1;
      return counts;
    },
    { total: 0, gold: 0, silver: 0, bronze: 0 },
  );

  const earnedBadgeIds = new Set(badges.map((b) => b.badge_id));
  const availableBadges = allBadges.filter(
    (badge) => !earnedBadgeIds.has(badge.badge_id),
  );

  const previewBadge = badges[0] || {
    badge_name: "No badges earned yet",
    badge_type: "N/A",
    reward_curos: 0,
    earned_at: "",
    badge_icon: null,
  };

  return (
    <MainLayout>
      {/* Hero Section - Simplified */}
      <div className="bg-gradient-to-r from-[#23195A] to-[#6A3EA1] rounded-3xl p-8 text-white flex justify-between items-start mb-8">
        <div>
          <p className="uppercase tracking-[6px] text-sm opacity-80 mb-3">
            Gamification
          </p>
          <h1 className="text-5xl font-bold mb-3">Your Badge Collection</h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Showcase your achievements and unlock new badges through learning.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 rounded-3xl p-5 mb-8">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-700 rounded-3xl p-5 mb-8 flex items-center gap-2">
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-3xl shadow-sm">
          <p className="text-lg text-[#1E1B4B]">Loading badges...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards - Compact */}
          <div className="grid md:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Total"
              value={badgeCounts.total}
              icon={<Award size={24} />}
            />
            <StatCard
              title="Gold"
              value={badgeCounts.gold}
              icon={<Trophy size={24} />}
            />
            <StatCard
              title="Silver"
              value={badgeCounts.silver}
              icon={<Medal size={24} />}
            />
            <StatCard
              title="Bronze"
              value={badgeCounts.bronze}
              icon={<Shield size={24} />}
            />
          </div>

          {/* Earned Badges - Grid with Focus on Images */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#23195A]">
                Earned Badges
              </h2>
              <button
                onClick={handleCheckBadges}
                disabled={checking}
                className="flex items-center gap-2 bg-[#693C83] text-white px-4 py-2 rounded-xl hover:bg-[#5a2f6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={16}
                  className={checking ? "animate-spin" : ""}
                />
                {checking ? "Checking..." : "Check for New"}
              </button>
            </div>

            {badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {badges.map((badge) => (
                  <div
                    key={badge.badge_id || badge.badge_name}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group"
                  >
                    <div className="flex justify-center mb-3">
                      {renderBadgeIcon(badge, "w-32 h-32")}
                    </div>
                    <h3 className="text-sm font-semibold text-[#23195A] truncate">
                      {badge.badge_name}
                    </h3>
                    <div className="mt-2 flex justify-center gap-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                        +{badge.reward_curos || 0}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        {badge.badge_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Available Badges Section - Image Focused */}
          {availableBadges.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#23195A] mb-6">
                Available to Earn
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {availableBadges.map((badge) => (
                  <div
                    key={badge.badge_id || badge.badge_name}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 opacity-75 text-center group hover:opacity-100 transition-opacity"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="w-32 h-32 flex-shrink-0 overflow-visible relative opacity-50 grayscale">
                        {renderBadgeIcon(badge, "w-32 h-32")}
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-[#23195A] truncate">
                      {badge.badge_name}
                    </h3>
                    <div className="mt-2 flex justify-center flex-wrap gap-1">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                        +{badge.curos_reward || 0}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs truncate max-w-full">
                        {badge.requirement_value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Section - Simplified */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Badge Gallery - Main Focus */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <Award className="text-purple-600" />
                <h2 className="text-2xl font-bold text-[#23195A]">
                  Badge Gallery
                </h2>
              </div>

              {badges.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.badge_id || badge.badge_name}
                      className="text-center"
                    >
                      <div className="bg-purple-50 rounded-xl p-3 hover:bg-purple-100 transition-colors">
                        {renderBadgeIcon(badge, "w-20 h-20")}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {badge.badge_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No badges to display
                </p>
              )}
            </div>

            {/* Right Sidebar - Compact */}
            <div className="space-y-6">
              {/* Featured Badge */}
              <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
                <h2 className="text-lg font-bold text-[#23195A] mb-4">
                  Featured Badge
                </h2>
                <div className="flex justify-center mb-3">
                  {renderBadgeIcon(previewBadge, "w-40 h-40")}
                </div>
                <h3 className="text-xl font-bold text-[#23195A]">
                  {previewBadge.badge_name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {previewBadge.badge_type || "No badge preview"}
                </p>
                <div className="mt-3 bg-yellow-100 text-yellow-700 inline-block px-4 py-2 rounded-full text-sm">
                  +{previewBadge.reward_curos || 0} Curos
                </div>
              </div>

              {/* Popular Badge - Simplified */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star size={20} />
                  <h3 className="font-bold">Most Popular</h3>
                </div>
                <div className="flex justify-center mb-2">
                  {renderBadgeIcon(previewBadge, "w-24 h-24")}
                </div>
                <p className="text-lg font-bold">{previewBadge.badge_name}</p>
                <p className="text-xs opacity-90 mt-1">
                  {badgeCounts.total} earned
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-xs">{title}</p>
          <h2 className="text-2xl font-bold text-[#23195A] mt-1">{value}</h2>
        </div>
        <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
