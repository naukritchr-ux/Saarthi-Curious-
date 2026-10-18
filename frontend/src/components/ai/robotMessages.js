/**
 * Bank of 85+ casual, context-aware, motivating, and smart messages
 * for Saarthi AI Co-Pilot on the admin dashboard.
 */

export const ROBOT_MESSAGES = [
  // ── Greetings & Time-aware Check-ins (1-15) ────────────────────────
  { text: "Good day, {name}! Ready to review learner momentum?", mood: "happy", gesture: "excited" },
  { text: "Hey {name}! Grabbed your coffee yet? ☕ Let's make today productive.", mood: "happy", gesture: "wink" },
  { text: "Good afternoon, {name}! Halfway through the day — platform is running steady.", mood: "idle", gesture: "talking1" },
  { text: "Checking in, {name}! Everything on the LMS is monitored and green.", mood: "happy", gesture: "hero" },
  { text: "Hey {name}, hope you're having an awesome day so far!", mood: "happy", gesture: "excited" },
  { text: "Welcome back, {name}! Let me know if you need any instant stats or reports.", mood: "talking", gesture: "talking2" },
  { text: "Hydration check! 💧 Remember to take short breaks between dashboard reviews.", mood: "happy", gesture: "wink" },
  { text: "Greetings, {name}! I've got my sensors locked on student activity.", mood: "idle", gesture: "hero" },
  { text: "Hey there! Ready to guide our franchise partners and learners today?", mood: "happy", gesture: "excited" },
  { text: "Another great day to empower curious minds across Saarthi!", mood: "happy", gesture: "talking1" },
  { text: "Power levels at 100%! What would you like to analyze next?", mood: "idle", gesture: "hero" },
  { text: "Need a quick summary of today's progress? Just click one of my prompt buttons!", mood: "talking", gesture: "talking2" },
  { text: "Beep boop! 🤖 All background services and data pipelines are running smooth.", mood: "happy", gesture: "wink" },
  { text: "Glad to see you, {name}! Let's make today's learning outcomes count.", mood: "happy", gesture: "excited" },
  { text: "A fresh session begins! Let me know if you'd like to inspect quiz trends.", mood: "idle", gesture: "talking1" },

  // ── Calendar, Calls & Scheduling (16-28) ──────────────────────────
  { text: "Need to reschedule calls for tomorrow? Use the 'Saarthi Calendar' tool!", mood: "talking", gesture: "talking1" },
  { text: "Calendar tip: You can ask me 'Move all Friday meetings to Monday' anytime.", mood: "happy", gesture: "wink" },
  { text: "Checking your schedule... Your booked slots sync directly with Google Meet.", mood: "idle", gesture: "hero" },
  { text: "Remember: New bookings arrive as 'Pending' until you click Approve in the ledger.", mood: "talking", gesture: "talking2" },
  { text: "Your 'Today's Meetings' widget gives you direct links to join calls instantly.", mood: "happy", gesture: "talking1" },
  { text: "Got a busy day tomorrow? I can free up your afternoon slots in one command.", mood: "idle", gesture: "wink" },
  { text: "Slot availability tip: You can generate recurring 15-minute slots 3 months ahead.", mood: "talking", gesture: "talking2" },
  { text: "Whenever a learner requests a call, you'll see a clean blue pending badge.", mood: "happy", gesture: "hero" },
  { text: "Approved calls automatically receive verified Google Calendar event IDs.", mood: "happy", gesture: "wink" },
  { text: "Need to clear your schedule for an off-site meeting? Just ask me to reschedule.", mood: "talking", gesture: "talking1" },
  { text: "Smooth scheduling keeps both learners and franchise partners aligned.", mood: "idle", gesture: "hero" },
  { text: "Have an unexpected conflict? Say 'Cancel my 10 AM call' in the AI schedule bar.", mood: "thinking", gesture: "talking2" },
  { text: "All slot timings follow strict 15-minute micro-mentoring intervals.", mood: "idle", gesture: "talking1" },

  // ── Learner Progress & Engagement (29-45) ─────────────────────────
  { text: "4 learners haven't logged in this week — want me to suggest re-engagement scripts?", mood: "thinking", gesture: "talking1" },
  { text: "Active learners are holding a solid 4.2-day average streak!", mood: "happy", gesture: "excited" },
  { text: "Tip: Learners with streaks over 5 days are 3x more likely to complete programs.", mood: "happy", gesture: "wink" },
  { text: "Did you know? Sending nudges on Wednesday mornings yields the highest open rate.", mood: "talking", gesture: "talking2" },
  { text: "16 learners have already started their course modules. That's an 80% kickoff rate!", mood: "happy", gesture: "hero" },
  { text: "Check the Funnel report if you want a bird's-eye view of drop-off points.", mood: "idle", gesture: "talking1" },
  { text: "Learner motivation is running high in ongoing modules this week.", mood: "happy", gesture: "excited" },
  { text: "A personalized shout-out to top streak holders boosts cohort retention.", mood: "talking", gesture: "talking2" },
  { text: "Retention quizzes are showing consistent pass rates across active batches.", mood: "happy", gesture: "hero" },
  { text: "You can trigger bulk notification emails via Notification Scripts in one click.", mood: "talking", gesture: "talking1" },
  { text: "Keep an eye on learners stalled at 60% completion — they just need a slight push!", mood: "thinking", gesture: "talking2" },
  { text: "Franchise partner teams are actively checking in on their branch employees.", mood: "idle", gesture: "hero" },
  { text: "Active learning sessions peak between 2:00 PM and 5:00 PM daily.", mood: "idle", gesture: "talking1" },
  { text: "Curiosity is contagious! The leaderboard is sparking friendly competition.", mood: "happy", gesture: "wink" },
  { text: "Consistent micro-quizzes yield much higher retention than long exams.", mood: "talking", gesture: "talking1" },
  { text: "High streak counts signal strong platform habits — let's keep them going!", mood: "happy", gesture: "excited" },
  { text: "Check your learner table to see which students earned badges today.", mood: "idle", gesture: "hero" },

  // ── Gamification, Curos & Economy (46-58) ──────────────────────────
  { text: "Over 435 Curos are actively circulating in our learner economy! 🪙", mood: "happy", gesture: "excited" },
  { text: "Learners love spending Curos on bonus challenges and milestone perks.", mood: "happy", gesture: "wink" },
  { text: "Awarding bonus Curos for tricky quizzes is a proven engagement booster.", mood: "talking", gesture: "talking1" },
  { text: "Gamification balance is healthy: earned tokens match active quiz attempts.", mood: "idle", gesture: "hero" },
  { text: "Badge tiers encourage learners to push from Bronze up to Diamond status.", mood: "happy", gesture: "talking2" },
  { text: "The Curo economy drives intrinsic motivation without external friction.", mood: "idle", gesture: "talking1" },
  { text: "Top learners are eyeing the next milestone reward tier this month.", mood: "happy", gesture: "wink" },
  { text: "Franchise partners can celebrate their branch leaderboard champions.", mood: "happy", gesture: "excited" },
  { text: "Streak bonuses keep learners logging in each day to protect their flame! 🔥", mood: "happy", gesture: "hero" },
  { text: "Every quiz completed mints new learning value across the platform.", mood: "talking", gesture: "talking1" },
  { text: "Curos are more than points — they represent real applied learning time.", mood: "idle", gesture: "hero" },
  { text: "Want to introduce a new reward script? Head over to the Gamification settings.", mood: "talking", gesture: "talking2" },
  { text: "Recognition is key: a quick badge award brightens any learner's day.", mood: "happy", gesture: "wink" },

  // ── Platform Management & Admin Tips (59-72) ───────────────────────
  { text: "Admin tip: Export CSV reports whenever you need to present to stakeholders.", mood: "talking", gesture: "talking1" },
  { text: "The Role Hierarchy keeps permissions strictly compartmentalized by branch.", mood: "idle", gesture: "hero" },
  { text: "Master Admin privileges give you 360-degree visibility over all franchises.", mood: "happy", gesture: "hero" },
  { text: "Need to audit franchise growth? Check Reports > Franchise Performance.", mood: "talking", gesture: "talking2" },
  { text: "Franchise Developers can monitor assigned partners and their staff directly.", mood: "idle", gesture: "talking1" },
  { text: "Head Office Staff have direct oversight access under Admin guidance.", mood: "idle", gesture: "hero" },
  { text: "Your backend verifies RBAC permissions on every single request.", mood: "happy", gesture: "wink" },
  { text: "All user activity logs are timestamped and preserved for audits.", mood: "idle", gesture: "talking1" },
  { text: "Password reset and account unlock requests can be handled in User Management.", mood: "talking", gesture: "talking2" },
  { text: "Check System Health periodically to ensure background workers are responsive.", mood: "idle", gesture: "hero" },
  { text: "The responsive layout lets you monitor platform stats from tablet or desktop.", mood: "happy", gesture: "wink" },
  { text: "Clean database architecture ensures lightning-fast queries across cohorts.", mood: "idle", gesture: "hero" },
  { text: "Need custom analytics? Just type your query into my chat box below!", mood: "happy", gesture: "excited" },
  { text: "Automating repetitive admin workflows frees you to focus on strategy.", mood: "talking", gesture: "talking1" },

  // ── Fun Robot Banter & Encouragement (73-90) ───────────────────────
  { text: "Processing... Computing... Result: You're doing a fantastic job, {name}!", mood: "happy", gesture: "wink" },
  { text: "I may be powered by silicon, but my enthusiasm for Saarthi is 100% genuine! ✨", mood: "happy", gesture: "excited" },
  { text: "Did you know? My neural circuits process learner metrics in under 80 milliseconds.", mood: "idle", gesture: "hero" },
  { text: "Taking a quick stretch break? I'll guard the dashboard while you're away.", mood: "idle", gesture: "talking1" },
  { text: "High five! ✋ Together, we're building an incredible learning ecosystem.", mood: "happy", gesture: "excited" },
  { text: "Just calibrating my optical sensors... yep, dashboard looks spotless!", mood: "happy", gesture: "wink" },
  { text: "Learning is a journey, not a sprint. Keep up the steady leadership, {name}!", mood: "idle", gesture: "hero" },
  { text: "I ran a diagnostics check: platform status is optimal, admin energy is high!", mood: "happy", gesture: "excited" },
  { text: "Remember to celebrate small wins — every quiz completed is a step forward.", mood: "happy", gesture: "talking1" },
  { text: "Questions about completion rates? Click 'Explain this week's trends'!", mood: "talking", gesture: "talking2" },
  { text: "My antennas pick up great vibes from the team leaderboard today.", mood: "happy", gesture: "wink" },
  { text: "Need advice on re-engaging dropped learners? I've got strategies ready.", mood: "thinking", gesture: "talking1" },
  { text: "Curiosity never sleeps, and neither does my monitoring loop!", mood: "happy", gesture: "hero" },
  { text: "Keep shining, {name}. Your guidance shapes hundreds of bright futures.", mood: "happy", gesture: "excited" },
  { text: "I'm always right here if you need answers, insights, or just a quick smile.", mood: "happy", gesture: "wink" },
  { text: "Beep boop! All circuits green, coffee level critical. Refill if needed! ☕", mood: "happy", gesture: "excited" },
  { text: "Let's turn curiosity into mastery today!", mood: "happy", gesture: "hero" },
  { text: "Ready whenever you are, {name}. Let's make an impact!", mood: "happy", gesture: "talking2" },
];

/**
 * Returns a random message formatted with the admin name
 */
export function getRandomMessage(adminName = "Admin") {
  const item = ROBOT_MESSAGES[Math.floor(Math.random() * ROBOT_MESSAGES.length)];
  return {
    ...item,
    text: item.text.replace(/\{name\}/g, adminName),
  };
}

/**
 * Returns a greeting message appropriate for current local time
 */
export function getInitialGreeting(adminName = "Admin") {
  const hour = new Date().getHours();
  let text = "";
  if (hour < 12) {
    text = `Good morning, ${adminName}! Ready to check today's learners?`;
  } else if (hour < 17) {
    text = `Good afternoon, ${adminName}! Dashboard is active and monitoring.`;
  } else {
    text = `Good evening, ${adminName}! How did today's learning outcomes go?`;
  }
  return {
    text,
    mood: "happy",
    gesture: "excited",
  };
}
