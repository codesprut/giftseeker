const { remote } = require("electron");
export default remote.getGlobal("sharedData").language;
