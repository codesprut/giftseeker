class Time {
  format(format) {
    if (typeof format !== "string")
      throw new Error("'Format' variable should be a string");

    const date = this.getCurrentDate();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    format = format.toLowerCase();

    format = format.replace("hh", this.leadZero(hours));
    format = format.replace("mm", this.leadZero(minutes));
    format = format.replace("ss", this.leadZero(seconds));

    format = format.replace("h", hours);
    format = format.replace("m", minutes);
    format = format.replace("s", seconds);

    return format;
  }

  leadZero(number) {
    return number > 9 ? number : "0" + number;
  }

  getCurrentDate() {
    return new Date();
  }
}

export default new Time();
