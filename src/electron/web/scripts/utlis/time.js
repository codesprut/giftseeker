const leadZero = number => {
  return number > 9 ? number : "0" + number;
};

const getCurrentDate = () => {
  return new Date();
};

const format = format => {
  if (typeof format !== "string") {
    throw new Error("'Format' variable should be a string");
  }

  const date = getCurrentDate();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return format
    .toLowerCase()
    .replace("hh", leadZero(hours))
    .replace("mm", leadZero(minutes))
    .replace("ss", leadZero(seconds))
    .replace("h", hours)
    .replace("m", minutes)
    .replace("s", seconds);
};

const elapsed = timestamp => {
  const hours = Math.floor(timestamp / 60 / 60);
  const minutes = Math.floor(timestamp / 60 - hours * 60);
  const seconds = timestamp % 60;

  return "hh:mm:ss"
    .replace("hh", leadZero(hours))
    .replace("mm", leadZero(minutes))
    .replace("ss", leadZero(seconds))
    .replace(/^(00\D)+/g, "");
};

export { elapsed, format };
