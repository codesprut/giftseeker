const { ipcRenderer } = require("electron");
import { getTranslation } from "./language.js";
import browser from "./browser.js";
import { format as timeFormat, elapsed as timeElapsed } from "./utlis/time.js";

import Logger from "./controls/logger.js";
import ServiceIcon from "./controls/service-icon.js";
import ServicePanel from "./controls/service-panel.js";
import ServiceControlPanel from "./controls/service-control-panel.js";

const iconsWrap = document.querySelector(".services-icons");
const panelsWrap = document.querySelector(".services-panels");

const services = {};

ipcRenderer.on("window-initial-data", async (event, { servicesInfo }) => {
  for (const serviceInfo of servicesInfo) {
    const service = {
      name: serviceInfo.name,
      state: serviceInfo.state,
      isStarted: function () {
        return this.state === "started";
      },
      inProcess: function () {
        return this.state === "process";
      },
    };

    service.icon = new ServiceIcon(service.name, service.state);
    service.panel = new ServicePanel(
      service.name,
      serviceInfo.settings,
      new Logger(getTranslation, timeFormat),
      new ServiceControlPanel(serviceInfo.websiteUrl, serviceInfo.currency),
    );

    const serviceButton = service.panel.controlPanel.mainButton;

    service.icon.onClick(() => {
      document
        .querySelectorAll(".service-icon, .service-panel")
        .forEach(el => el.classList.remove("active"));

      service.icon.setActive();
      service.panel.setActive();
    });

    service.panel.setMenuItemClickCallback(pageCode => {
      for (const service of Object.values(services)) {
        service.panel.selectPage(pageCode);
      }
    });

    serviceButton.onclick = async () => {
      if (serviceButton.classList.contains("disabled")) {
        return;
      }

      ipcRenderer.send("service-button-pressed", serviceInfo.name);
    };

    serviceButton.onmouseenter = () => {
      serviceButton.classList.add("hovered");
      if (service.state === "started") {
        serviceButton.innerText = getTranslation("service.btn_stop");
      }
    };

    serviceButton.onmouseleave = () => {
      serviceButton.classList.remove("hovered");
    };

    service.icon.appendTo(iconsWrap);
    service.panel.appendTo(panelsWrap);

    services[service.name] = service;
  }

  const firstService = servicesInfo[0].name;

  services[firstService].icon.setActive();
  services[firstService].panel.setActive();

  ipcRenderer.send("services-loaded");
});

ipcRenderer.on(
  "service-new-tick",
  async (event, { serviceName, totalTicks, interval }) => {
    const service = services[serviceName];
    const serviceButton = service.panel.controlPanel.mainButton;

    if (service.isStarted() && !serviceButton.classList.contains("hovered")) {
      serviceButton.innerText = timeElapsed(interval - (totalTicks % interval));
    }
  },
);

ipcRenderer.on(
  "service-new-log",
  async (event, { serviceName, message, severity }) => {
    services[serviceName].panel.logger.add(message, severity);
  },
);

ipcRenderer.on(
  "service-currency-changed",
  async (event, { serviceName, currency }) => {
    services[serviceName].panel.controlPanel.updateCurrencyValue(currency);
  },
);

ipcRenderer.on(
  "service-userinfo-updated",
  async (event, { serviceName, userInfo }) => {
    services[serviceName].panel.controlPanel.updateInfo(userInfo);
  },
);

ipcRenderer.on(
  "service-authorization-required",
  async (event, { serviceName, websiteUrl, authPageUrl, authContent }) => {
    const service = services[serviceName];
    const serviceButton = service.panel.controlPanel.mainButton;

    serviceButton.classList.add("disabled");
    serviceButton.innerText = getTranslation("service.btn_awaiting");

    const cookies = await browser.authorizationWindow(
      websiteUrl,
      authPageUrl,
      authContent,
    );

    ipcRenderer.send("services-new-session", { serviceName, cookies });
  },
);

ipcRenderer.on(
  "service-state-changed",
  async (event, { serviceName, processState }) => {
    const service = services[serviceName];
    const serviceButton = service.panel.controlPanel.mainButton;

    service.icon.setState(processState);
    service.state = processState;

    let buttonTranslation = `service.btn_${
      service.isStarted() ? "stop" : "start"
    }`;

    if (service.inProcess()) {
      serviceButton.classList.add("disabled");
      buttonTranslation = `service.btn_checking`;
    } else {
      serviceButton.classList.remove("disabled");
    }

    serviceButton.innerText = getTranslation(buttonTranslation);
  },
);

window.addEventListener("beforeunload", () => {
  ipcRenderer.send("services-unloaded");
});
