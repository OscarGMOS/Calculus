const SYMBOLS = {
  add: "+",
  subtract: "-",
  multiply: "x",
  divide: "/"
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRange(difficulty) {
  switch (Number(difficulty)) {
    case 1:
      return [1, 10];
    case 2:
      return [2, 25];
    case 3:
      return [5, 60];
    case 4:
      return [10, 120];
    default:
      return [1, 20];
  }
}

function makeAddition(difficulty) {
  const [min, max] = getRange(difficulty);
  const a = randomInt(min, max);
  const b = randomInt(min, max);

  return {
    expression: `${a} ${SYMBOLS.add} ${b}`,
    answer: a + b,
    operation: "add"
  };
}

function makeSubtraction(difficulty) {
  const [min, max] = getRange(difficulty);
  const a = randomInt(min, max);
  const b = randomInt(min, max);
  const top = Math.max(a, b);
  const bottom = Math.min(a, b);

  return {
    expression: `${top} ${SYMBOLS.subtract} ${bottom}`,
    answer: top - bottom,
    operation: "subtract"
  };
}

function makeMultiplication(difficulty) {
  const [min, max] = getRange(difficulty);
  const reducedMax = Math.max(6, Math.round(max / 2));
  const a = randomInt(min, reducedMax);
  const b = randomInt(min, reducedMax);

  return {
    expression: `${a} ${SYMBOLS.multiply} ${b}`,
    answer: a * b,
    operation: "multiply"
  };
}

function makeDivision(difficulty) {
  const [min, max] = getRange(difficulty);
  const divisor = randomInt(Math.max(2, min), Math.max(3, Math.round(max / 2)));
  const quotient = randomInt(Math.max(1, Math.round(min / 2)), Math.max(2, Math.round(max / 3)));
  const dividend = divisor * quotient;

  return {
    expression: `${dividend} ${SYMBOLS.divide} ${divisor}`,
    answer: quotient,
    operation: "divide"
  };
}

const GENERATORS = {
  add: makeAddition,
  subtract: makeSubtraction,
  multiply: makeMultiplication,
  divide: makeDivision
};

export function createProblem(operation, difficulty) {
  const op = operation === "mix"
    ? ["add", "subtract", "multiply", "divide"][randomInt(0, 3)]
    : operation;

  return GENERATORS[op](difficulty);
}
