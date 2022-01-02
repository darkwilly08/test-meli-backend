const countDecimals = (num) => {
  if (num % 1 != 0) return num.toString().split(".")[1].length;
  return 0;
};

export { countDecimals };
