const { remote } = require("electron");
const { language } = remote.getGlobal("sharedData");

export default class Setting {
  constructor(name, params, get, set) {
    this.name = name;
    this.type = params.type;

    this.getValue = value => get(this.name, value);
    this.setValue = value => set(this.name, value);

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
    wrap.dataset.tippyContent = language.get(`${params.trans}_title`);
    wrap.dataset.tippyTranslate = `${params.trans}_title`;

    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.checked = this.getValue(params.default);
    checkBox.onchange = () => this.setValue(checkBox.checked);

    const label = document.createElement("span");
    label.dataset.lang = params.trans;
    label.innerText = language.get(params.trans);

    wrap.appendChild(checkBox);
    wrap.appendChild(label);

    this.control.appendChild(wrap);
  }

  createNumber(params) {
    const step = params.type === "number" ? 1 : 0.1;

    if (params.default < params.min || params.default > params.max)
      this.setValue(params.default);

    this.control.classList.add("number");

    this.buttonDec = document.createElement("div");
    this.buttonDec.classList.add("button", "button-dec");
    this.buttonDec.innerHTML = `<span class="fa fa-minus"></span>`;

    this.buttonInc = document.createElement("div");
    this.buttonInc.classList.add("button", "button-inc");
    this.buttonInc.innerHTML = `<span class="fa fa-plus"></span>`;

    this.valueLabel = document.createElement("div");
    this.valueLabel.classList.add("value-label");
    this.valueLabel.innerText = this.getValue(params.default);

    const label = document.createElement("div");
    label.classList.add("label");
    label.dataset.tippyContent = language.get(`${params.trans}_title`);
    label.dataset.tippyTranslate = `${params.trans}_title`;
    label.dataset.lang = params.trans;
    label.innerText = language.get(params.trans);

    this.control.appendChild(this.buttonDec);
    this.control.appendChild(this.valueLabel);
    this.control.appendChild(this.buttonInc);
    this.control.appendChild(label);

    if (params.default === params.max) this.buttonInc.classList.add("disabled");
    if (params.default === params.min) this.buttonDec.classList.add("disabled");

    let pressed = false;
    let pressTimeout = undefined;
    let iterations = 0;

    const timeoutFunction = callback => {
      if (!pressed) {
        clearTimeout(pressTimeout);
        iterations = 0;
        return;
      }

      iterations = iterations > 50 ? 50 : iterations + 1;
      callback();
      pressTimeout = setTimeout(() => {
        timeoutFunction(callback);
      }, 200 / (iterations / 2));
    };

    this.buttonInc.onmousedown = () => {
      pressed = true;
      pressTimeout = timeoutFunction(() => this.incrementValue(params, step));
    };
    this.buttonDec.onmousedown = () => {
      pressed = true;
      pressTimeout = timeoutFunction(() => this.decrementValue(params, step));
    };

    this.buttonInc.onmouseup = this.buttonDec.onmouseup = this.buttonInc.onmouseleave = this.buttonDec.onmouseleave = ev => {
      pressed = false;
    };
  }

  incrementValue(params, step) {
    let value = this.getValue();
    if (value < params.max) {
      value = value + step;
      this.buttonDec.classList.remove("disabled");
    }

    if (params.type === "float_number") value = parseFloat(value.toFixed(1));

    if (value === params.max) this.buttonInc.classList.add("disabled");

    this.valueLabel.innerText = value;
    this.setValue(value);
  }

  decrementValue(params, step) {
    let value = this.getValue();
    if (value > params.min) {
      value = value - step;
      this.buttonInc.classList.remove("disabled");
    }

    if (params.type === "float_number") value = parseFloat(value.toFixed(1));

    if (value === params.min) this.buttonDec.classList.add("disabled");

    this.valueLabel.innerText = value;
    this.setValue(value);
  }
}
