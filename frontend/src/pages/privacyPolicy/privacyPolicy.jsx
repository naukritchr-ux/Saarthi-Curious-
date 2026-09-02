import { ArrowLeft, Bell, KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";

const securityFeatures = [
  {
    icon: LogIn,
    title: "Protected account areas",
    description:
      "Account pages are available through the app's protected route flow after sign-in.",
  },
  {
    icon: ShieldCheck,
    title: "Authenticated API requests",
    description:
      "When a session token is available, the frontend sends it as a Bearer token with API requests.",
  },
  {
    icon: KeyRound,
    title: "Password change checks",
    description:
      "The password form requires the current password, matching new passwords, and a new password of at least eight characters.",
  },
  {
    icon: ShieldCheck,
    title: "Expired-session handling",
    description:
      "After an unauthorized API response, the frontend removes its stored session values and returns to sign-in.",
  },
  {
    icon: Bell,
    title: "Notification preferences",
    description:
      "Notification choices are saved in this browser's local storage so they can be remembered on this device.",
  },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F8F7FC] p-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5B21B6] transition-colors hover:text-[#4C1D95]"
          >
            <ArrowLeft size={18} />
            Back to Settings
          </button>

          <header className="mb-8 max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#5B21B6]">
              <ShieldCheck size={26} />
            </div>
            <h1 className="text-3xl font-bold text-[#1E1B4B]">Privacy Policy</h1>
            <p className="mt-3 text-base leading-7 text-[#62577A]">
              This page lists the privacy and security controls currently visible in the Saarthi Curious frontend. It does not make claims about backend infrastructure or policies that are not implemented here.
            </p>
          </header>

          <section className="rounded-2xl border border-[#E5DDF0] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 border-b border-[#E5DDF0] pb-5">
              <h2 className="text-xl font-bold text-[#1E1B4B]">Security features</h2>
              <p className="mt-2 text-sm leading-6 text-[#62577A]">
                The frontend currently provides these account and session protections.
              </p>
            </div>

            <div className="space-y-5">
              {securityFeatures.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EFFF] text-[#5B21B6]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1E1B4B]">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#62577A]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-[#E5DDF0] bg-[#FFFBEB] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Browser-stored information</h2>
            <p className="mt-2 text-sm leading-6 text-[#62577A]">
              The frontend uses browser local storage for session values and notification preferences. Clearing site data removes these locally stored values and may sign you out or reset notification choices.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;