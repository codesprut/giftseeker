import Logger from "./logger.js";
import UserPanel from "./user-panel.js";
import Setting from "./setting.js";

export default class ServicePanel {
  constructor(service) {
    this.pages = [];
    this.panel = document.createElement("div");
    this.panel.classList.add("service-panel");
    this.panel.setAttribute("id", service.name.toLowerCase());

    const logsPage = this.addPage("logs");
    const settingsPage = this.addPage("settings");

    this.renderSettings(
      settingsPage,
      service.settings,
      service.getConfig,
      service.setConfig
    );

    this.logger = new Logger();
    this.logger.appendTo(logsPage);

    this.userPanel = new UserPanel(service.websiteUrl, {
      enabled: service.withValue,
      current: service.currentValue,
      translationKey: service.translationKey("value_label")
    });
    this.userPanel.appendTo(this.panel);
  }

  setActive() {
    this.panel.classList.add("active");
  }

  selectPage(pageCode) {
    for (const page of this.pages) {
      if (page.pageCode === pageCode) {
        page.menuItem.classList.add("active");
        page.pageItem.classList.add("active");
        continue;
      }
      page.menuItem.classList.remove("active");
      page.pageItem.classList.remove("active");
    }
  }

  setMenuItemClickCallback(callback) {
    this.menuItemCallback = callback;
  }

  renderSettings(settingsPage, settings, getSetting, setSetting) {
    const numbersPanel = document.createElement("div");
    numbersPanel.classList.add("settings-numbers");

    const checkboxesPanel = document.createElement("div");
    checkboxesPanel.classList.add("settings-checkbox");

    settingsPage.appendChild(numbersPanel);
    settingsPage.appendChild(checkboxesPanel);

    const controls = {};

    for (const settingKey in settings) {
      controls[settingKey] = new Setting(
        settingKey,
        settings[settingKey],
        getSetting,
        setSetting
      );
    }

    for (const controlKey in controls) {
      const control = controls[controlKey];
      if (control.isRange) control.setRange(controls[control.rangePart]);

      control.appendTo(
        control.type === "checkbox" ? checkboxesPanel : numbersPanel
      );
    }
  }

  addPage(pageCode) {
    if (!this.menuItems) {
      this.menuItems = document.createElement("ul");
      this.panel.appendChild(this.menuItems);
    }

    const menuItem = document.createElement("li");
    const pageItem = document.createElement("div");

    menuItem.dataset.id = pageCode;
    menuItem.dataset.lang = `service.${pageCode}`;

    menuItem.onclick = () => {
      if (this.menuItemCallback) this.menuItemCallback(pageCode);
    };

    pageItem.classList.add(
      `service-${pageCode}`,
      "in-service-panel",
      "styled-scrollbar"
    );
    pageItem.dataset.id = pageCode;

    this.menuItems.appendChild(menuItem);
    this.panel.appendChild(pageItem);

    if (this.pages.length === 0) {
      menuItem.classList.add("active");
      pageItem.classList.add("active");
    }

    this.pages.push({
      pageCode,
      menuItem,
      pageItem
    });

    return pageItem;
  }

  appendTo(element) {
    element.appendChild(this.panel);
  }
}
