export const calculateAge = (birthday) => {
  var ageDifMs = Date.now() - new Date(birthday).getTime();
  var ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export function generateGradient(...colorArrays) {
  function lerpColor(color1, color2, t) {
    var r = Math.round(lerp(color1.r, color2.r, t));
    var g = Math.round(lerp(color1.g, color2.g, t));
    var b = Math.round(lerp(color1.b, color2.b, t));

    var hexR = r.toString(16).padStart(2, "0");
    var hexG = g.toString(16).padStart(2, "0");
    var hexB = b.toString(16).padStart(2, "0");

    return "#" + hexR + hexG + hexB;
  }

  function lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  var gradients = [];

  for (var j = 0; j < colorArrays.length; j++) {
    var colors = colorArrays[j];
    var gradient = [];
    var step = 1 / (colors.length - 1);

    for (var i = 0; i < colors.length; i++) {
      if (i == colors.length - 1) {
        gradient.push(colors[i]);
      } else {
        var color1 = colors[i];
        var color2 = colors[i + 1];
        for (var k = 0; k < step; k += step / (colors.length - 1)) {
          gradient.push(lerpColor(color1, color2, k));
        }
      }
    }

    gradients.push(gradient);
  }

  return gradients;
}

export const getProgressInPercentage = (progress, limit) => {
  let progressInPercentage = 0;
  if (
    progress === undefined ||
    progress === null ||
    limit === undefined ||
    limit === null
  )
    return;

  if (limit > 0) {
    // Check if progress is greater than limit or percentage is 0
    if (progress === 0 || progress > limit) {
      return progressInPercentage;
    }

    progressInPercentage = (progress / limit) * 100;
  }

  return `${progressInPercentage}%`;
};

export function calculatePercentageChange(lastValue, currentValue) {
  if (typeof lastValue !== "number" || typeof currentValue !== "number") {
    throw new Error("Both lastValue and currentValue must be numbers.");
  }

  if (lastValue === 0) {
    const percentage = currentValue === 0 ? 0 : 100;
    const changeType = currentValue === 0 ? "unchanged" : "increasing";

    return {
      percentage: percentage,
      changeType: changeType,
    };
  }

  const difference = currentValue - lastValue;
  const percentageChange = (difference / Math.abs(lastValue)) * 100;
  const changeType =
    difference > 0 ? "increasing" : difference < 0 ? "decreasing" : "unchanged";

  return {
    percentage: parseFloat(percentageChange.toFixed(2)),
    changeType: changeType,
  };
}

export const capitalizeWord = (word) => {
  const lowerCaseWord = word?.toLowerCase();
  return lowerCaseWord.charAt(0).toUpperCase() + lowerCaseWord.slice(1);
};

export const formatAmount = (num) => {
  const localNumber = typeof num === "string" ? parseInt(num) : num;

  return Math.sign(localNumber || 0) === -1
    ? `${localNumber
        .toFixed(2)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        .slice(1)}`
    : `${localNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")}`;
};
