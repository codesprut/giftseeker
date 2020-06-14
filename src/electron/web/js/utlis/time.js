class Time {
  format(format) {
    if (typeof format !== "string")
      throw new Error("'Format' variable should be a string");

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

  leadZero(number) {
    return number > 9 ? number : "0" + number;
  }

  getCurrentDate() {
    return new Date();
  }
}

export default new Time();
