import Logger from "./logger.js";
import UserPanel from "./userPanel.js";

export default class ServicePanel {
  constructor(serviceName, websiteUrl, settings, value) {
    this.pages = [];
    this.panel = document.createElement("div");
    this.panel.classList.add("service-panel");
    this.panel.setAttribute("id", serviceName.toLowerCase());

    const logsPage = this.addPage("logs");
    const settingsPage = this.addPage("settings");

    this.logger = new Logger();
    this.logger.appendTo(logsPage);

    this.userPanel = new UserPanel(websiteUrl, value);
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
      "service-logs",
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
