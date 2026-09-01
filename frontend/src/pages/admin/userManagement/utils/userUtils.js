export const roleFilters = [
  "All",
  "Master Admin",
  "Admin",
  "Team Leader",
  "Franchise Partner",
  "Franchise Employee",
  "Franchise Developer",
  "Head Office Staff",
];

export const activityOptions = ["All", "Active", "Inactive"];

export const statusStyles = {
  Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Inactive: "bg-red-100 text-red-700 border border-red-200",
};

export const getRoleName = (roleId) => {
  switch (roleId) {
    case 1:
      return "Master Admin";
    case 2:
      return "Admin";
    case 3:
      return "Team Leader";
    case 4:
      return "Franchise Partner";
    case 5:
      return "Franchise Employee";
    case 6:
      return "Franchise Developer";
    case 7:
      return "Head Office Staff";
    default:
      return "Unknown";
  }
};
