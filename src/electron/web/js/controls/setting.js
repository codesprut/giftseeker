const { remote } = require("electron");
const { language } = remote.getGlobal("sharedData");

export default class Setting {
  constructor(name, params, get, set) {
    this.name = name;
    this.getValue = get;
    this.setValue = set;
    this.type = params.type;

    this.control = document.createElement("div");
    this.control.classList.add("input-wrap", "no-selectable");

    if (params.type === "checkbox") this.createCheckbox(params);
    else this.createNumber(params);
  }

  appendTo(element) {
    element.appendChild(this.control);
  }

  createCheckbox(params) {
    this.control.classList.add("checkbox");

    const wrap = document.createElement("label");
    wrap.dataset.tippyContent = `${params.trans}_title`;
    wrap.dataset.tippyTranslate = `${params.trans}_title`;

    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.checked = this.getValue(this.name, params.default);
    checkBox.onchange = () => this.setValue(this.name, checkBox.checked);

    const label = document.createElement("span");
    label.dataset.lang = params.trans;
    label.innerText = language.get(params.trans);

    wrap.appendChild(checkBox);
    wrap.appendChild(label);

    this.control.appendChild(wrap);
  }

  createNumber(params) {}
}
