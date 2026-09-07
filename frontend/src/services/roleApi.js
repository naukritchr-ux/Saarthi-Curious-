import axios from "axios";
import { appendActorParams } from "../utils/auditHelper";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const getRoles = async () => {
  const response = await axios.get(
    `${API}/roles`
  );

  return response.data;
};

export const createRole = async (roleData) => {
  const url = appendActorParams(`${API}/roles`);
  const response = await axios.post(
    url,
    roleData
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

export const updateRoleName = async (id, roleName) => {
  const response = await axios.put(
    `${API}/roles/${id}`,
    { role_name: roleName }
  );

  return response.data;
};

export const deleteRole = async (id) => {
  const response = await axios.delete(
    `${API}/roles/${id}`
  );

  return response.data;
};

export const getRoleUsers = async (roleId) => {
  const res = await axios.get(
    `${API}/roles/${roleId}/users`
  );

  return res.data;
};