import axios from "axios";
import { appendActorParams } from "../utils/auditHelper";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const getRoles = async () => {
  const response = await axios.get(
    `${API}/roles`
  );

  return response.data;
};

export const updateRolePermission = async (
  id,
  permission,
  value
) => {
  const url = appendActorParams(`${API}/roles/${id}/permissions`);
  const response = await axios.put(
    url,
    {
      permission,
      value,
    }
  );

  return response.data;
};

export const getRoleUsers = async (roleId) => {
  const res = await axios.get(
    `${API}/roles/${roleId}/users`
  );

  return res.data;
};