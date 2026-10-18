export const getDeviceId = () => {
  let deviceId = localStorage.getItem("saarthi_device_id");
  if (!deviceId) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = "dev-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    localStorage.setItem("saarthi_device_id", deviceId);
  }
  return deviceId;
};

export default getDeviceId;
