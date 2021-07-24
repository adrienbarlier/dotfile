let interactionCount = 0;
let commentCount = 0;
let shareCount = 0;
let mylatitude = 0;
let mylongitude = 0;
let dataArray = [];
let postUrls = [];
let countryVariable = "Not Assigned";

let uniqueGroup = Date.now();

(function () {
  ("use strict");

  const successCallback = (position) => {
    if (position.coords.latitude) {
      mylatitude = position.coords.latitude;
    }

    if (position.coords.longitude) {
      mylongitude = position.coords.longitude;
    }
  };

  const errorCallback = (error) => {
    mylongitude = 0;
    mylongitude = 0;
  };

  navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

  const whitelist = [];
  const blacklist = [
    "._m8c",
    ".uiStreamSponsoredLink",
    'a[data-hovercard][href*="hc_ref=ADS"]',
    'a[role="button"][rel~="noopener"][data-lynx-mode="async"]',
  ];

  const sponsoredTexts = [
    "Sponsored",
    "مُموَّل", // Arabic
    "赞助内容", // Chinese (Simplified)
    "贊助", // Chinese (Traditional)
    "Sponzorováno", // Czech
    "Gesponsord", // Dutch
    "May Sponsor", // Filipino
    "Sponsorisé", // French
    "Gesponsert", // German
    "Χορηγούμενη", // Greek
    "ממומן", // Hebrew
    "प्रायोजित", // Hindi
    "Bersponsor", // Indonesian
    "Sponsorizzato", // Italian
    "Sponsorowane", // Polish
    "Patrocinado", // Portuguese (Brazil)
    "Реклама", // Russian
    "Sponzorované", // Slovak
    "Publicidad", // Spanish
    "ได้รับการสนับสนุน", // Thai
    "Sponsorlu", // Turkish
    "Được tài trợ", // Vietnamese
  ];
  const possibleSponsoredTextQueries = [
    'a[role="link"] > span[aria-labelledby]',
    'div[role="button"] > span[aria-labelledby]',
    'span[dir="auto"] > span > div[role="button"]:not([aria-labelledby])',
  ];

  function isHidden(e) {
    const style = window.getComputedStyle(e);

    if (
      style.display === "none" ||
      style.opacity === "0" ||
      style.fontSize === "0px" ||
      style.visibility === "hidden" ||
      style.position === "absolute"
    ) {
      return true;
    }

    return false;
  }

  function getTextFromElement(e) {
    return (e.innerText === "" ? e.dataset.content : e.innerText) || "";
  }

  function getTextFromContainerElement(e) {
    return (
      e.dataset.content ||
      Array.prototype.filter
        .call(e.childNodes, (element) => {
          return element.nodeType === Node.TEXT_NODE;
        })
        .map((element) => {
          return element.textContent;
        })
        .join("")
    );
  }

  function simulate(element, eventName) {
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent,
      eventType = null;

    for (var name in eventMatchers) {
      if (eventMatchers[name].test(eventName)) {
        eventType = name;
        break;
      }
    }

    if (!eventType)
      throw new SyntaxError(
        "Only HTMLEvents and MouseEvents interfaces are supported"
      );

    if (document.createEvent) {
      oEvent = document.createEvent(eventType);
      if (eventType == "HTMLEvents") {
        oEvent.initEvent(eventName, options.bubbles, options.cancelable);
      } else {
        oEvent.initMouseEvent(
          eventName,
          options.bubbles,
          options.cancelable,
          document.defaultView,
          options.button,
          options.pointerX,
          options.pointerY,
          options.pointerX,
          options.pointerY,
          options.ctrlKey,
          options.altKey,
          options.shiftKey,
          options.metaKey,
          options.button,
          element
        );
      }
      element.dispatchEvent(oEvent);
    } else {
      options.clientX = options.pointerX;
      options.clientY = options.pointerY;
      var evt = document.createEventObject();
      oEvent = extend(evt, options);
      element.fireEvent("on" + eventName, oEvent);
    }
    return element;
  }

  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }

  var eventMatchers = {
    HTMLEvents: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    MouseEvents: /^(?:click|dblclick|mouse(?:down|up|over|move|out|enter|over))$/,
  };
  var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
  };

  function getVisibleText(e) {
    if (isHidden(e)) {
      return "";
    }

    const children = e.querySelectorAll(":scope > *");

    if (children.length !== 0) {
      return (
        getTextFromContainerElement(e) +
        Array.prototype.slice.call(children).map(getVisibleText).flat().join("")
      );
    }

    return getTextFromElement(e);
  }

  function hideIfSponsored(e) {
    chrome.storage.sync.get(
      "interaction_filter",
      function (interaction_filter_status) {
        if (interaction_filter_status.interaction_filter > 0) {
          interactionCount = parseInt(
            interaction_filter_status.interaction_filter
          );
        } else {
          interactionCount = 0;
        }
      }
    );

    chrome.storage.sync.get("comment_filter", function (comment_filter_status) {
      if (comment_filter_status.comment_filter > 0) {
        commentCount = parseInt(comment_filter_status.comment_filter);
      } else {
        commentCount = 0;
      }
    });

    chrome.storage.sync.get("share_filter", function (share_filter_status) {
      if (share_filter_status.share_filter > 0) {
        shareCount = parseInt(share_filter_status.share_filter);
      } else {
        shareCount = 0;
      }
    });

    e.dataset.blocked = "non-sponsored";
    return possibleSponsoredTextQueries.some((query) => {
      const result = e.querySelectorAll(query);
      return [...result].some((t) => {
        const visibleText = getVisibleText(t);

        if (
          sponsoredTexts.some(
            (sponsoredText) => visibleText.indexOf(sponsoredText) !== -1
          )
        ) {
          let commentsOfOne,
            sharesOfOne,
            actualCommentsOfOne,
            actualSharesOfOne;

          let descriptionArray = [];
          let linksArray = [];
          let headingCandidatesArray = [];
          let iconImage = "";
          let imgUrlArray = [];
          let videoUrl = "";
          let actualSite = "";

          e.dataset.blocked = "sponsored";

          // e.style.display = "none";
          // console.log(e);

          let allSpans = e.getElementsByTagName("span");
          let allVideos = e.getElementsByTagName("video");

          let allImages = e.getElementsByTagName("img");
          let allAnchors = e.getElementsByTagName("a");
          let allStrong = e.getElementsByTagName("strong");
          let allITags = e.getElementsByTagName("i");

          let allSpansArray = Array.from(allSpans);
          let allVideosArray = Array.from(allVideos);

          let allImagesArray = Array.from(allImages);
          let allAnchorsArray = Array.from(allAnchors);
          let allStrongArray = Array.from(allStrong);

          var s = document.createElement("script");
          s.innerHTML =
            '(function(open) { var elem = document.getElementById("post-urls-productmafia"); if (!elem) { elem = document.createElement("div"); elem.id = "post-urls-productmafia"; elem.style.display = "none"; elem.innerText = JSON.stringify([]); document.body.appendChild(elem); } XMLHttpRequest.prototype.open = function() { this.addEventListener("readystatechange", function(e) { if (this.readyState == 4 && this.status == 200) { responseURL = this.responseURL; if (!responseURL.endsWith("/video/unified_cvc/")) { return; } returnedData = JSON.parse(this.responseText.replace("for (;;);", ""))["payload"]["vi"]; link = "https://www.facebook.com/watch/?v="+returnedData; links = JSON.parse(elem.innerText); if (!links.includes(link)) { links.push(link); elem.innerText = JSON.stringify(links); console.log("Found link: "+link); } } }, false); open.apply(this, arguments); }; })(XMLHttpRequest.prototype.open);';
          s.onload = function () {
            this.remove();
          };
          (document.head || document.documentElement).appendChild(s);

          if (e.querySelectorAll("div div a div div div span").length > 0) {
            actualSite = e.querySelectorAll("div div a div div div span")[0]
              .innerText;
          }

          if (document.getElementsByTagName("image").length > 0) {
            iconImage = e
              .getElementsByTagName("image")[0]
              .getAttribute("xlink:href");
          }

          allStrongArray.forEach((tag) => {
            if (!headingCandidatesArray.includes(tag.innerText)) {
              headingCandidatesArray = [
                ...headingCandidatesArray,
                tag.innerText,
              ];
            }
          });

          allAnchorsArray.forEach((anchor) => {
            if (!linksArray.includes(anchor.getAttribute("href"))) {
              linksArray = [...linksArray, anchor.getAttribute("href")];
            }
          });

          allSpansArray.forEach((span) => {
            if (span.getAttribute("class")) {
              if (
                span.getAttribute("class").split(" ").includes("a3bd9o3v") &&
                span.innerText.length > 60
              ) {
                if (!descriptionArray.includes(span.innerText)) {
                  descriptionArray = [...descriptionArray, span.innerText];
                }
              } else if (span.innerText.length >= 80) {
                descriptionArray = [...descriptionArray, span.innerText];
              }
            }
          });

          if (allImagesArray.length > 0) {
            allImagesArray.forEach((image) => {
              if (image.getAttribute("src").includes("scontent")) {
                imgUrlArray.push(image.getAttribute("src"));
              }
            });
          }

          let requiredInfoSpan = allSpansArray.slice(
            allSpansArray.length - 30,
            allSpansArray.length
          );

          // for (let index = 0; index < requiredInfoSpan.length - 1; index++) {
          //   if (
          //     parseFloat(requiredInfoSpan[index].innerText) !== NaN &&
          //     parseFloat(requiredInfoSpan[index].innerText) ===
          //       parseFloat(requiredInfoSpan[index + 1].innerText) &&
          //     requiredInfoSpan[index].innerText.length < 10
          //   ) {
          //     likesOfOne = parseFloat(requiredInfoSpan[index].innerText);

          //     if (!likesOfOne || likesOfOne === NaN) {
          //       likesOfOne = 0;
          //     }

          //     if (
          //       requiredInfoSpan[index].innerText.includes("k") ||
          //       requiredInfoSpan[index].innerText.includes("K")
          //     ) {
          //       actualLikesOfOne =
          //         parseFloat(requiredInfoSpan[index].innerText) * 1000;
          //     } else if (
          //       requiredInfoSpan[index].innerText.includes("M") ||
          //       requiredInfoSpan[index].innerText.includes("m")
          //     ) {
          //       actualLikesOfOne =
          //         parseFloat(requiredInfoSpan[index].innerText) * 1000000;
          //     } else {
          //       actualLikesOfOne = likesOfOne;
          //     }

          //     break;
          //   }
          // }

          let returnReactions = (t) => {
            var e = new Map();
            try {
              for (
                var r = t.querySelectorAll("span[role*='toolbar'] div"), n = 0;
                n < r.length;
                n++
              )
                try {
                  var a = (r[n].getAttribute("aria-label") || "").split(":");
                  e.set(a[0], a[1].split(" ")[1]);
                } catch (t) {}
            } catch (t) {}
            return e;
          };

          let wowObject = returnReactions(e);

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
                // console.log("second else if");
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

          // if (!actualLikesOfOne) {
          //   actualLikesOfOne = 0;
          // }

          if (!actualCommentsOfOne) {
            actualCommentsOfOne = 0;
          }

          if (!actualSharesOfOne) {
            actualSharesOfOne = 0;
          }

          if (
            actualCommentsOfOne < commentCount ||
            actualSharesOfOne < shareCount
          ) {
            e.style.display = "none";
          }
          // new icon image, images array, video url
          setTimeout(() => {
            if (e.getElementsByTagName("video").length > 0) {
              videoEl = e.getElementsByTagName("video")[0];
              videoUrl = videoEl.getAttribute("src");
              videoEl.autoplay = true;
              videoEl.setAttribute("autoplay", "autoplay");
              simulate(document.querySelector("div[role=main]"), "mousedown");
              simulate(document.querySelector("div[role=main]"), "click");
              simulate(document.querySelector("div[role=main]"), "mouseup");
            }

            if (document.getElementById("post-urls-productmafia")) {
              urlsDiv = document.getElementById("post-urls-productmafia");
              urls = JSON.parse(urlsDiv.innerText);
              for (var i = 0; i < urls.length; i++) {
                // console.log("Found urls: " + urls.length);
                if (!postUrls.includes(urls[i])) {
                  postUrls.push(urls[i]);
                }
              }
            }

            let takeStringGiveNumber = (takenString) => {
              if (parseFloat(takenString) && parseFloat(takenString) !== NaN) {
                if (takenString.includes("K") || takenString.includes("k")) {
                  return parseFloat(takenString) * 1000;
                }
                if (takenString.includes("M") || takenString.includes("m")) {
                  return parseFloat(takenString) * 1000000;
                }

                return parseFloat(takenString);
              } else {
                return 0;
              }
            };

            let returnFromWowObject = (param) => {
              if (param === "likes") {
                if (wowObject.get("Like")) {
                  let gotReaction = takeStringGiveNumber(wowObject.get("Like"));
                  return gotReaction;
                } else {
                  return 0;
                }
              }
              if (param === "loves") {
                if (wowObject.get("Love")) {
                  let gotReaction = takeStringGiveNumber(wowObject.get("Love"));
                  return gotReaction;
                } else {
                  return 0;
                }
              }
              if (param === "cares") {
                if (wowObject.get("Care")) {
                  let gotReaction = takeStringGiveNumber(wowObject.get("Care"));
                  return gotReaction;
                } else {
                  return 0;
                }
              }
              if (param === "hahas") {
                if (wowObject.get("Haha")) {
                  let gotReaction = takeStringGiveNumber(wowObject.get("Haha"));
                  return gotReaction;
                } else {
                  return 0;
                }
              }
              if (param === "wows") {
                if (wowObject.get("Wow")) {
                  let gotReaction = takeStringGiveNumber(wowObject.get("Wow"));
                  return gotReaction;
                } else {
                  return 0;
                }
              }
              if (param === "sads") {
                if (wowObject.get("Sad")) {
                  let gotReaction = takeStringGiveNumber(wowObject.get("Sad"));
                  return gotReaction;
                } else {
                  return 0;
                }
              }
              if (param === "angrys") {
                if (wowObject.get("Angry")) {
                  let gotReaction = takeStringGiveNumber(
                    wowObject.get("Angry")
                  );
                  return gotReaction;
                } else {
                  return 0;
                }
              }
            };

            let buttonText = "Learn More";
            let buttonHref = linksArray[0];

            let fromJqueryBtnText = e.querySelector(
              ".rq0escxv.l9j0dhe7.du4w35lb.d2edcug0.j5wkysh0.hytbnt81 span"
            );

            if (
              fromJqueryBtnText &&
              fromJqueryBtnText.innerText &&
              fromJqueryBtnText.innerText.length > 2 &&
              fromJqueryBtnText.innerText.length < 18
            ) {
              buttonText = fromJqueryBtnText.innerText;
            }

            if (
              fromJqueryBtnText &&
              fromJqueryBtnText.innerText &&
              fromJqueryBtnText.innerText.length > 2 &&
              fromJqueryBtnText.innerText.length < 18
            ) {
              let requiredElement = e.querySelector(
                ".rq0escxv.l9j0dhe7.du4w35lb.d2edcug0.j5wkysh0.hytbnt81 span"
              );

              for (let i = 0; i < 30; i++) {
                let requiredHref = requiredElement.getAttribute("href");

                if (requiredHref) {
                  buttonHref = requiredHref;
                  break;
                } else {
                  requiredElement = requiredElement.parentElement;
                }
              }
            }

            let isPageVerified = false;

            let pageVerifiedInfo = e.querySelector(
              'i[aria-label="Verified Account"]'
            );

            if (pageVerifiedInfo) {
              isPageVerified = true;
            }

            setTimeout(() => {
              chrome.storage.sync.get("country", function (countryName) {
                if (countryName.country) {
                  countryVariable = countryName.country;
                }
              });

              dataArray = [
                ...dataArray,
                {
                  likes: returnFromWowObject("likes"),
                  loves: returnFromWowObject("loves"),
                  cares: returnFromWowObject("cares"),
                  hahas: returnFromWowObject("hahas"),
                  wows: returnFromWowObject("wows"),
                  sads: returnFromWowObject("sads"),
                  angrys: returnFromWowObject("angrys"),
                  comments: actualCommentsOfOne,
                  shares: actualSharesOfOne,
                  headingCandidatesArray,
                  descriptionArray,
                  linksArray,
                  imgUrlArray,
                  videoUrl,
                  iconImage,
                  actualSite,
                  location: {
                    lat: mylatitude,
                    long: mylongitude,
                  },
                  buttonText,
                  buttonHref,
                  isPageVerified,
                  country: countryVariable,
                  uniqueGroup,
                },
              ];
            }, 500);
          }, 1000);

          return true;
        } else {
          if (is_enabled) {
            e.dataset.blocked = "non-sponsored";
            e.innerHTML = "";
          } else {
            e.dataset.blocked = "non-sponsored";
          }
        }
        return false;
      });
    });
  }

  let feedObserver = null; // wait for and observe FB5 feed element

  function setFB5FeedObserver() {
    // We are expecting to find a new feed div
    const feed = document.querySelector("div[role=feed]");

    if (feed !== null) {
      // check existing posts
      feed
        .querySelectorAll('div[data-pagelet^="FeedUnit_"]')
        .forEach(hideIfSponsored);
      const feedContainer = feed.parentNode; // flag this feed as monitored

      feed.dataset.adblockMonitored = true;
      feedObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // check if feed was reloaded without changing page
          if (
            mutation.target === feedContainer &&
            mutation.addedNodes.length > 0
          ) {
            feedObserver.disconnect(); // check again for the new feed. Since the DOM has just changed, we
            // want to wait a bit and start looking for the new div after it was
            // rendered. We put our method at the end of the current queue stack

            setTimeout(setFB5FeedObserver, 0);
          } // new feed posts added

          if (mutation.target === feed && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (
                node.dataset.pagelet &&
                node.dataset.pagelet.startsWith("FeedUnit_")
              ) {
                hideIfSponsored(node);
              }
            });
          }
        });
      }); // check for new feed posts

      feedObserver.observe(feed, {
        childList: true,
      }); // check if the feed is replaced

      feedObserver.observe(feedContainer, {
        childList: true,
      });
      console.info("Monitoring feed updates", [feed]);
    } else {
      // no feed div was available yet in DOM. will check again
      setTimeout(setFB5FeedObserver, 1000);
    }
  }

  function onPageChange() {
    let feed = document.getElementById("stream_pagelet");

    if (feed !== null) {
      // if the user change page to homepage
      feed
        .querySelectorAll('div[id^="hyperfeed_story_id_"]')
        .forEach(hideIfSponsored);
      feedObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.id.startsWith("hyperfeed_story_id_")) {
            hideIfSponsored(mutation.target);
          }
        });
      });
      feedObserver.observe(feed, {
        childList: true,
        subtree: true,
      });
      console.info("Monitoring feed updates", [feed]);
      return;
    }

    feed = document.getElementById("pagelet_group_");

    if (feed !== null) {
      // if the user change page to https://www.facebook.com/groups/*
      feed.querySelectorAll('div[id^="mall_post_"]').forEach(hideIfSponsored);
      feedObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.target
            .querySelectorAll('div[id^="mall_post_"]')
            .forEach(hideIfSponsored);
        });
      });
      feedObserver.observe(feed, {
        childList: true,
        subtree: true,
      });
      console.info("Monitoring feed updates", [feed]);
      return;
    } // FB5 design
    // there's a feed div that we don't monitor yet

    feed = document.querySelector("div[role=feed]");

    if (feed !== null) {
      setFB5FeedObserver();
      return;
    } // there's a feed loading placeholder

    feed = document.getElementById("suspended-feed");

    if (feed !== null) {
      setFB5FeedObserver();
      return;
    } // No new feed was detected
    // Cleanup observer when there's no feed monitored left in DOM

    if (
      feedObserver !== null &&
      document.querySelector("div[role=feed]") === null
    ) {
      feedObserver.disconnect();
    }
  }

  const fbObserver = new MutationObserver(onPageChange); // wait for and observe FB5 page element

  function setupFB5PageObserver() {
    // We are expecting to find a page div
    const pageDiv =
      document.querySelector("div[data-pagelet=root]") ||
      document.querySelector("div[id^=mount_0_0]");

    if (pageDiv !== null) {
      // trigger first page initiation
      onPageChange(); // Facebook uses ajax to load new content so
      // we need to observe the container of the page
      // for any page changes

      fbObserver.observe(pageDiv.parentNode, {
        childList: true,
      });
      console.info("Monitoring page changes", [pageDiv]);
    } else {
      // no page div was available yet in DOM. will check again
      setTimeout(setupFB5PageObserver, 1000);
    }
  }

  let fbContent = document.getElementsByClassName("fb_content")[0];

  if (fbContent !== undefined) {
    // Old Facebook design
    // remove on first load
    onPageChange(); // Facebook uses ajax to load new content so
    // we need this to watch for page change

    fbObserver.observe(fbContent, {
      childList: true,
    });
    console.info("Monitoring page changes", [fbContent]);
  } else if (document.querySelectorAll("[id^=mount_0_0]").length > 0) {
    // if it's FB5 design
    setupFB5PageObserver();
  } // if we can't find ".fb_content", then it must be a mobile website.
  // in that case, we don't need javascript to block ads
  // cleanup

  window.addEventListener("beforeunload", () => {
    fbObserver.disconnect();

    if (feedObserver !== null) {
      feedObserver.disconnect();
    }

    fbContent = null;
  });
})();

// Format interaction/view/share/comment count
function number_formatter(input) {
  var divider = 1;
  input = input.replace("&nbsp;", "");
  if (input.includes(" ")) input = input.substring(0, input.indexOf(" "));

  if (input.includes(",")) divider = 10;

  if (input.includes(".")) divider = 10;

  input = input.replace(",", "").replace(".", "");

  if (input.includes("K")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("k")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("B")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("b")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("M")) return (parseInt(input, 10) * 1000000) / divider;
  if (input.includes("m")) return (parseInt(input, 10) * 1000000) / divider;

  return parseInt(input, 10) / divider;
}

// Scroll down the page
var is_scrolling = null;
var was_scrolling = null;
chrome.storage.sync.get("autoscroll_status", function (autoscroll) {
  if (autoscroll.autoscroll_status == 1) {
    is_scrolling = 1;
  } else {
    is_scrolling = 0;
  }
  was_scrolling = is_scrolling;
});

function pageScroll() {
  if (is_scrolling != null) {
    chrome.storage.sync.get("autoscroll_status", function (autoscroll) {
      if (autoscroll.autoscroll_status == 1) {
        window.scrollBy(0, 2);
        is_scrolling = 1;
      } else is_scrolling = 0;

      if (was_scrolling != is_scrolling) {
        console.log("Changed scrolling mode");
      }
      was_scrolling = is_scrolling;
    });
  }

  scrolldelay = setTimeout(pageScroll, 10);
}

// Record saved ads & don't post them to web service multiple times
var checked_ads = [];

var version_code = 4;
var interaction_limit = 0;
var comment_limit = 0;
var share_limit = 0;
var view_limit = 0;
var interaction_count = 0;
var comment_count = 0;
var share_count = 0;
var view_count = 0;
var text_content = "";
var advertiser = "";
var post_link = "";
var post_id = "";
var advertiser_link = "-";
var type = "IMAGE";
var post_date = "";
var parser = new DOMParser();
var doc;
var interaction_count_s = "0";
var comment_count_s = "0";
var view_count_s = "0";
var share_count_s = "0";
var post_title = "";
var posts;
var is_enabled = false;
var advertiser_image = "";
var post_image = "";
var post_video = "";
var tmp = "";
var ip_address = "";
var country = "";
var is_location_checked = false;
var destination_url = "";
var temp_var = "";
var urlParts = "";
pageScroll();

// Select the node that will be observed for mutations
var targetNode = document.getElementsByTagName("body")[0];

// Options for the observer (which mutations to observe)
var config = {
  attributes: true,
  childList: true,
  subtree: true,
};
function isElement(element) {
  return element instanceof Element || element instanceof HTMLDocument;
}

function isHidden(e) {
  if (!isElement(e)) {
    return true;
  }
  const style = window.getComputedStyle(e);

  if (
    style.display === "none" ||
    style.opacity === "0" ||
    style.fontSize === "0px" ||
    style.visibility === "hidden" ||
    style.position === "absolute"
  ) {
    return true;
  }
  return false;
}

function handleAdPosts() {
  if (
    loadInteractionSetting &&
    loadCommentSetting &&
    loadSharedSetting &&
    loadViewLimitSetting
  ) {
    document.querySelectorAll("*[data-blocked=sponsored]").forEach((x) => {
      extractAd(x);
    });
  }
  document.querySelectorAll("*[data-blocked=non-sponsored]").forEach((x) => {
    if (is_enabled) {
      x.innerHTML = "";
    }
  });
}

function extractAd(postEl) {}

// Callback function to execute when mutations are observed
var callback = function (mutationsList, observer) {
  // Check if Extension enabled
  setUpSettings();

  handleAdPosts();
};
var loadInteractionSetting = false;
var loadCommentSetting = false;
var loadSharedSetting = false;
var loadViewLimitSetting = false;
function setUpSettings() {
  chrome.storage.sync.get("isenabled", function (enabled_status) {
    if (enabled_status.isenabled == 1) {
      if (!is_enabled) {
        window.scrollTo({ top: 100, behavior: "smooth" });
      }
      is_enabled = true;
      // Check interaction count filter
      chrome.storage.sync.get(
        "interaction_filter",
        function (interaction_filter_status) {
          if (interaction_filter_status.interaction_filter > 0) {
            interaction_limit = parseInt(
              interaction_filter_status.interaction_filter
            );
          } else {
            interaction_limit = 0;
          }
          loadInteractionSetting = true;
        }
      );

      // Check comment count filter
      chrome.storage.sync.get(
        "comment_filter",
        function (comment_filter_status) {
          if (comment_filter_status.comment_filter > 0) {
            comment_limit = parseInt(comment_filter_status.comment_filter);
          } else {
            comment_limit = 0;
          }
          loadCommentSetting = true;
        }
      );

      // Check share count filter
      chrome.storage.sync.get("share_filter", function (share_filter_status) {
        if (share_filter_status.share_filter > 0) {
          share_limit = parseInt(share_filter_status.share_filter);
        } else {
          share_limit = 0;
        }
        loadSharedSetting = true;
      });

      // Check view count filter
      chrome.storage.sync.get("view_filter", function (view_filter_status) {
        if (view_filter_status.view_filter > 0) {
          view_limit = parseInt(view_filter_status.view_filter);
        } else {
          view_limit = 0;
        }
        loadViewLimitSetting = true;
      });
    } else {
      is_enabled = false;
    }
  });
}

// Create an observer instance linked to the callback function
var observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

chrome.runtime.onMessage.addListener((msgObj) => {
  // do something with msgObj
  if (msgObj.isEnabled == "true") {
    if (!is_enabled) {
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
    is_enabled = true;
  } else if (msgObj.isEnabled == "false") {
    is_enabled = false;
  }
});

async function sendData() {
  let url = "https://api.admafia.io/api/v1/advertisement/array";

  // console.log(dataArray);
  if (dataArray.length > 0) {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        array: dataArray,
      }),
    })
      .then((res) => {
        // console.log("Response is");
        // console.log(res);
      })
      .catch((err) => {
        // console.log("ERROR IS");
        // console.log(err);
      });

    dataArray = [];
  }
}

async function sendPostUrls() {
  chrome.storage.sync.get("country", function (countryName) {
    if (countryName.country) {
      countryVariable = countryName.country;
    }
  });

  let url = "https://api.admafia.io/api/v1/advertisement/posturls";

  if (postUrls.length > 0) {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: postUrls,
        location: {
          lat: mylatitude,
          long: mylongitude,
        },
        country: countryVariable,
        uniqueGroup,
      }),
    })
      .then((res) => {
        // console.log("Response is");
        // console.log(res);
      })
      .catch((err) => {
        // console.log("ERROR IS");
        // console.log(err);
      });

    postUrls = [];
    urlsDiv = document.getElementById("post-urls-productmafia");
    if (urlsDiv) {
      urlsDiv.innerText = JSON.stringify([]);
    }
  }
}

setInterval(() => {
  chrome.storage.sync.get("isenabled", function (enabled_status) {
    if (enabled_status.isenabled == 1) {
      sendData();
    }
  });
}, 30000);

setInterval(() => {
  chrome.storage.sync.get("isenabled", function (enabled_status) {
    if (enabled_status.isenabled == 1) {
      sendPostUrls();
    }
  });
}, 30000);
