let likesOfOne,
  commentsOfOne,
  sharesOfOne,
  actualLikesOfOne,
  actualCommentsOfOne,
  actualSharesOfOne,
  mediaUrl = {};
let descriptionArray = [];
let linksArray = [];
let headingCandidatesArray = [];

let e = document;
let allSpans = e.getElementsByTagName("span");
let allSpansArray = Array.from(allSpans);
let requiredInfoSpan = allSpansArray.slice(
  allSpansArray.length - 30,
  allSpansArray.length
);

requiredInfoSpan.forEach((span, index) => {
  console.log(index, span.innerText);
});

for (let index = 0; index < requiredInfoSpan.length - 1; index++) {
  if (
    parseFloat(requiredInfoSpan[index].innerText) !== NaN &&
    parseFloat(requiredInfoSpan[index].innerText) ===
      parseFloat(requiredInfoSpan[index + 1].innerText) &&
    requiredInfoSpan[index].innerText.length < 10
  ) {
    likesOfOne = parseFloat(requiredInfoSpan[index].innerText);

    if (!likesOfOne || likesOfOne === NaN) {
      likesOfOne = 0;
    }

    if (
      requiredInfoSpan[index].innerText.includes("k") ||
      requiredInfoSpan[index].innerText.includes("K")
    ) {
      actualLikesOfOne = parseFloat(requiredInfoSpan[index].innerText) * 1000;
    } else if (
      requiredInfoSpan[index].innerText.includes("M") ||
      requiredInfoSpan[index].innerText.includes("m")
    ) {
      actualLikesOfOne =
        parseFloat(requiredInfoSpan[index].innerText) * 1000000;
    } else {
      actualLikesOfOne = likesOfOne;
    }

    break;
  }
}

for (let index = 0; index < requiredInfoSpan.length - 1; index++) {
  if (
    (requiredInfoSpan[index].innerText.includes("comment") ||
      requiredInfoSpan[index].innerText.includes("Comment")) &&
    parseFloat(requiredInfoSpan[index].innerText) !== NaN
  ) {
    commentsOfOne = parseFloat(requiredInfoSpan[index].innerText);

    if (!commentsOfOne || commentsOfOne === NaN) {
      commentsOfOne = 0;
    }

    if (
      requiredInfoSpan[index].innerText.split(" ")[0].includes("k") ||
      requiredInfoSpan[index].innerText.split(" ")[0].includes("K")
    ) {
      actualCommentsOfOne = commentsOfOne * 1000;
    } else if (
      requiredInfoSpan[index].innerText.split(" ")[0].includes("m") ||
      requiredInfoSpan[index].innerText.split(" ")[0].includes("M")
    ) {
      console.log("second else if");
      actualCommentsOfOne = commentsOfOne * 1000000;
    } else {
      actualCommentsOfOne = commentsOfOne;
    }

    break;
  }
}

for (let index = 0; index < requiredInfoSpan.length - 1; index++) {
  if (
    (requiredInfoSpan[index].innerText.includes("share") ||
      requiredInfoSpan[index].innerText.includes("Share")) &&
    parseFloat(requiredInfoSpan[index].innerText) !== NaN
  ) {
    sharesOfOne = parseFloat(requiredInfoSpan[index].innerText);

    if (!sharesOfOne || sharesOfOne === NaN) {
      sharesOfOne = 0;
    }

    if (
      requiredInfoSpan[index].innerText.split(" ")[0].includes("k") ||
      requiredInfoSpan[index].innerText.split(" ")[0].includes("K")
    ) {
      actualSharesOfOne = sharesOfOne * 1000;
    } else if (
      requiredInfoSpan[index].innerText.split(" ")[0].includes("m") ||
      requiredInfoSpan[index].innerText.split(" ")[0].includes("M")
    ) {
      actualSharesOfOne = sharesOfOne * 1000000;
    } else {
      actualSharesOfOne = sharesOfOne;
    }

    break;
  }
}
