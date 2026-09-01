import MainLayout from "../../layout/mainLayout";
import {
  Mail,
  MapPin,
  Calendar,
  User,
  Badge,
  Users,
  ShieldCheck,
  Building2,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../utils/axios";

const roleNames = {
  1: "Master Admin",
  2: "Admin",
  3: "Team Leader",
  4: "Franchise Partner",
  5: "Franchise Employee",
  6: "Franchise Developer",
  7: "Head Office Staff",
};

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          setError("No user data found");
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const userID = user.user_id;

        if (!userID) {
          setError("No user ID found in user data");
          setLoading(false);
          return;
        }

        const response = await api.get(`/profile/${userID}`);

        setProfileData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Profile Error:", err);
        setError(err.response?.data?.detail || "Failed to fetch profile data");
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Format date of joining
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="bg-[#F8F7FC] min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card Skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-[#693C83] to-[#8B5FBF] rounded-2xl p-8 shadow-lg">
                  <div className="flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full bg-white/20 animate-pulse" />
                    <div className="h-8 w-32 bg-white/20 rounded-lg mt-4 animate-pulse" />
                    <div className="h-4 w-24 bg-white/20 rounded-lg mt-2 animate-pulse" />
                    <div className="w-full mt-6">
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="h-4 w-16 bg-white/20 rounded mx-auto animate-pulse" />
                        <div className="h-6 w-20 bg-white/20 rounded mx-auto mt-2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Skeleton */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5DDF0] p-6">
                  <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#F8F7FC] border border-[#E5DDF0] rounded-xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-[#F8F7FC] min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl border border-[#E5DDF0] shadow-sm p-8 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1E1B4B]">
                  Error Loading Profile
                </h3>
              </div>
              <p className="text-[#7C6A9A]">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-[#5B21B6] text-white rounded-lg hover:bg-[#4C1D95] transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profileData) {
    return (
      <MainLayout>
        <div className="bg-[#F8F7FC] min-h-screen p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl border border-[#E5DDF0] shadow-sm p-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#F3EFFF] flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-[#7C6A9A]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1E1B4B]">
                No Profile Data
              </h3>
              <p className="text-[#7C6A9A] mt-2">
                We couldn't find any profile information for your account.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const userName = profileData.full_name || "Guest User";
  const roleId = profileData.role_id || 5;
  const roleName = roleNames[roleId] || "User";

  // Get initials for avatar
  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Get user ID from localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.user_id || profileData.user_id || "N/A";

  const infoCards = [
    {
      icon: User,
      label: "Full Name",
      value: profileData.full_name,
      fullWidth: false,
    },
    {
      icon: ShieldCheck,
      label: "Role",
      value: roleName,
      fullWidth: false,
    },
    {
      icon: Mail,
      label: "Email",
      value: profileData.email,
      fullWidth: true,
    },
    {
      icon: MapPin,
      label: "City",
      value: profileData.city || "N/A",
      fullWidth: false,
    },
    {
      icon: Calendar,
      label: "Date of Joining",
      value: formatDate(profileData.date_of_joining),
      fullWidth: false,
    },
    {
      icon: Users,
      label: "Reporting Manager",
      value: profileData.reporting_manager || "N/A",
      fullWidth: false,
    },
    {
      icon: Building2,
      label: "Department",
      value: profileData.department || "N/A",
      fullWidth: false,
    },
    {
      icon: Clock,
      label: "Employee ID",
      value: userId,
      fullWidth: false,
    },
  ];

  return (
    <MainLayout>
      <div className="bg-[#F8F7FC] min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <h1 className="text-3xl font-bold text-[#1E1B4B] mb-6">My Profile</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-[#693C83] to-[#8B5FBF] rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col items-center">
                  {/* Avatar */}
                  <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-4xl shadow-lg mb-3 border-4 border-white/30">
                    {initials}
                  </div>

                  {/* Name */}
                  <h2 className="text-xl font-bold text-white mt-3">
                    {userName}
                  </h2>

                  {/* Role */}
                  <p className="text-white/80 text-sm mt-1">{roleName}</p>

                  {/* User ID Badge */}
                  <div className="mt-4 w-full">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-white/70">User ID</p>
                      <p className="text-lg font-bold text-white mt-0.5">
                        {userId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5DDF0] p-6">
                <h3 className="text-lg font-semibold text-[#1E1B4B] mb-4">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {infoCards.map((card, index) => (
                    <div
                      key={index}
                      className={`
                        bg-[#F8F7FC] border border-[#E5DDF0] rounded-xl p-4
                        hover:border-[#5B21B6] transition-colors duration-200
                        ${card.fullWidth ? "md:col-span-2" : ""}
                      `}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <card.icon size={16} className="text-[#5B21B6]" />
                        <p className="text-xs font-medium text-[#7C6A9A]">
                          {card.label}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-[#1E1B4B] break-words">
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
