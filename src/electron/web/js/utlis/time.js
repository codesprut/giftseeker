class Time {
  format(format) {
    if (typeof format !== "string") {
      throw new Error("'Format' variable should be a string");
    }

    const date = this.getCurrentDate();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return format
      .toLowerCase()
      .replace("hh", this.leadZero(hours))
      .replace("mm", this.leadZero(minutes))
      .replace("ss", this.leadZero(seconds))
      .replace("h", hours)
      .replace("m", minutes)
      .replace("s", seconds);
  }

  elapsed(timestamp) {
    const hours = Math.floor(timestamp / 60 / 60);
    const minutes = Math.floor(timestamp / 60 - hours * 60);
    const seconds = timestamp % 60;

    return "hh:mm:ss"
      .replace("hh", this.leadZero(hours))
      .replace("mm", this.leadZero(minutes))
      .replace("ss", this.leadZero(seconds))
      .replace(/^(00\D)+/g, "");
  }

  leadZero(number) {
    return number > 9 ? number : "0" + number;
  }

  getCurrentDate() {
    return new Date();
  }
}

export default new Time();
