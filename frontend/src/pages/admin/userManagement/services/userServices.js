import api from "../../../../utils/axios";

export const fetchUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const fetchReportingManagers = async () => {
  const response = await api.get("/reporting-managers");
  return response.data;
};

export const fetchTeamLeaders = async () => {
  const response = await api.get("/team-leaders");
  return response.data;
};
