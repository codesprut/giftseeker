const { ipcRenderer } = require("electron");

export default class ServicePanel {
  constructor(serviceName, settings, logger, controlPanel) {
    this.pages = [];
    this.panel = document.createElement("div");
    this.panel.classList.add("service-panel");
    this.panel.setAttribute("id", serviceName.toLowerCase());

    this.logger = logger;
    this.serviceName = serviceName;

    this.controlPanel = controlPanel;
    this.controlPanel.appendTo(this.panel);

    const logsPage = this.addPage("logs", "bars");
    logger.appendTo(logsPage);

    const settingsPage = this.addPage("settings", "cog");

    this.renderSettings(settingsPage, settings);
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

  renderSettings(settingsPage, settings) {
    const numbersPanel = document.createElement("div");
    numbersPanel.classList.add("settings-numbers");

    const checkboxesPanel = document.createElement("div");
    checkboxesPanel.classList.add("settings-checkbox");

    settingsPage.appendChild(numbersPanel);
    settingsPage.appendChild(checkboxesPanel);

    const controls = Object.entries(settings).map(
      ([controlKey, controlConfig]) =>
        new SettingsControl(
          controlKey,
          controlConfig,
          (settingName, settingValue) => {
            ipcRenderer.send("service-setting-changed", {
              serviceName: this.serviceName,
              settingName,
              settingValue,
            });
          },
        ),
    );

    for (const control of controls) {
      if (control.isRange) {
        const rangeSecondPart = controls.find(
          it => it.name === control.rangePart,
        );
        control.setRange(rangeSecondPart);
      }

      control.appendTo(
        control.type === "checkbox" ? checkboxesPanel : numbersPanel,
      );
    }
  }

  addPage(pageCode, icon) {
    const menuItem = document.createElement("span");
    const pageItem = document.createElement("div");

    menuItem.classList.add("fa", `fa-${icon}`);
    menuItem.dataset.tippyTranslate = `service.${pageCode}`;

    menuItem.onclick = () => {
      if (this.menuItemCallback) {
        this.menuItemCallback(pageCode);
      }
    };

    pageItem.classList.add(
      `service-${pageCode}`,
      "in-service-panel",
      "styled-scrollbar",
    );
    pageItem.dataset.id = pageCode;

    this.controlPanel.appendButton(menuItem);
    this.panel.appendChild(pageItem);

    if (this.pages.length === 0) {
      menuItem.classList.add("active");
      pageItem.classList.add("active");
    }

    this.pages.push({
      pageCode,
      menuItem,
      pageItem,
    });

    return pageItem;
  }

  appendTo(element) {
    element.appendChild(this.panel);
  }
}

class SettingsControl {
  constructor(name, params, setter) {
    this.value = params.default;
    this.name = name;
    this.type = params.type;
    this.min = params.min;
    this.max = params.max;
    this.isRange = !!params.range;

    if (this.isRange) {
      this.rangeType = params.rangeType;
      this.rangePart = params.rangePart;
    }

    this.getValue = () => this.value;
    this.saveValue = value => {
      if (this.range) {
        this.range.update(value);
      }

      this.value = value;
      setter(name, value);
    };

    this.control = document.createElement("div");
    this.control.classList.add("input-wrap", "no-selectable");

    if (params.type === "checkbox") {
      this.createCheckbox(params);
    } else {
      this.createNumber(params);
    }
  }

  appendTo(element) {
    element.appendChild(this.control);
  }

  createCheckbox(params) {
    this.control.classList.add("checkbox");

    const wrap = document.createElement("label");
    wrap.dataset.tippyTranslate = `${params.trans}_title`;

    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.checked = this.getValue();
    checkBox.onchange = () => this.saveValue(checkBox.checked);

    const label = document.createElement("span");
    label.classList.add("label");
    label.dataset.lang = params.trans;

    wrap.appendChild(checkBox);
    wrap.appendChild(label);

    this.control.appendChild(wrap);
  }

  createNumber(params) {
    const step = params.type === "number" ? 1 : 0.1;

    if (params.default < this.min || params.default > this.max) {
      this.saveValue(params.default);
    }

    this.control.classList.add("number");

    this.buttonDec = document.createElement("div");
    this.buttonDec.classList.add("button", "button-dec");
    this.buttonDec.innerHTML = `<span class="fa fa-minus"></span>`;

    this.buttonInc = document.createElement("div");
    this.buttonInc.classList.add("button", "button-inc");
    this.buttonInc.innerHTML = `<span class="fa fa-plus"></span>`;

    this.valueLabel = document.createElement("div");
    this.valueLabel.classList.add("value-label");
    this.valueLabel.innerText = this.getValue();

    const label = document.createElement("div");
    label.classList.add("label");
    label.dataset.tippyTranslate = `${params.trans}_title`;
    label.dataset.lang = params.trans;

    this.control.appendChild(this.buttonDec);
    this.control.appendChild(this.valueLabel);
    this.control.appendChild(this.buttonInc);
    this.control.appendChild(label);

    if (params.default === this.max) {
      this.buttonInc.classList.add("disabled");
    }
    if (params.default === this.min) {
      this.buttonDec.classList.add("disabled");
    }

    let pressed = false;
    let pressTimeout;
    let iterations = 0;

    const timeoutFunction = callback => {
      if (!pressed) {
        return;
      }

      iterations = iterations > 50 ? 50 : iterations + 1;
      callback();
      pressTimeout = setTimeout(() => {
        timeoutFunction(callback);
      }, 500 / iterations);
    };

    this.buttonInc.onmousedown = () => {
      pressed = true;
      pressTimeout = timeoutFunction(() => this.incrementValue(params, step));
    };
    this.buttonDec.onmousedown = () => {
      pressed = true;
      pressTimeout = timeoutFunction(() => this.decrementValue(params, step));
    };

    this.buttonInc.onmouseup =
      this.buttonDec.onmouseup =
      this.buttonInc.onmouseleave =
      this.buttonDec.onmouseleave =
        () => {
          clearTimeout(pressTimeout);
          iterations = 0;
          pressed = false;
        };
  }

  incrementValue(params, step) {
    let value = this.getValue();
    if (value < this.max) {
      value = value + step;
      this.buttonDec.classList.remove("disabled");
    }

    if (params.type === "float_number") {
      value = parseFloat(value.toFixed(1));
    }

    if (value === this.max) {
      this.buttonInc.classList.add("disabled");
    }

    this.valueLabel.innerText = value;
    this.saveValue(value);
  }

  decrementValue(params, step) {
    let value = this.getValue();
    if (value > this.min) {
      value = value - step;
      this.buttonInc.classList.remove("disabled");
    }

    if (params.type === "float_number") {
      value = parseFloat(value.toFixed(1));
    }

    if (value === this.min) {
      this.buttonDec.classList.add("disabled");
    }

    this.valueLabel.innerText = value;
    this.saveValue(value);
  }

  setRange(control) {
    this.range = control;

    this.update(control.getValue());
  }

  update(rangeValue) {
    const constraints = this.rangeType === "max" ? "min" : "max";

    this[constraints] = rangeValue;

    this.buttonDec.classList.remove("disabled");
    this.buttonInc.classList.remove("disabled");

    if (this.getValue() === this.min) {
      this.buttonDec.classList.add("disabled");
    }
    if (this.getValue() === this.max) {
      this.buttonInc.classList.add("disabled");
    }
  }
}
