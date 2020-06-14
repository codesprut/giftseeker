import ServiceIcon from "./serviceIcon.js";
import ServicePanel from "./servicePanel.js";

const createIcon = (serviceName, defaultStatus) => {
  const icon = new ServiceIcon(serviceName);
  icon.setStatus(defaultStatus);

  return icon;
};

const createPanel = serviceName => new ServicePanel(serviceName);

export { createIcon, createPanel };
