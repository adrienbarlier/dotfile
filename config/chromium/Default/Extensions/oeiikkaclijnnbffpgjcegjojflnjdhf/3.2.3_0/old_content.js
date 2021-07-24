(function () {
  "use strict";

  // if e contains anything in whitelist, then ignore.
  const whitelist = []; // if e contains anything in blacklist, then hide.
  // a[data-hovercard][href*="hc_ref=ADS"] from https://github.com/uBlockOrigin/uAssets/issues/233
  // a[role="button"][target="_blank"] is used for good post now too.

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
    'div[id^="feedsubtitle"] > :first-child',
    'div[id^="feed_sub_title"] > :first-child',
    'div[id^="feed__sub__title"] > :first-child',
    'div[id^="feedlabel"] > :first-child',
    'div[id^="fbfeed_sub_header_id"] > :nth-child(3)',
    'div[data-testid$="storysub-title"] > :first-child',
    'div[data-testid$="story-subtilte"] > :first-child',
    'div[data-testid$="story--subtilte"] > :first-child',
    'a[role="button"][aria-labelledby]',
    'a[role="link"] > span[aria-labelledby]', // FB5 design
    'div[role="button"] > span[aria-labelledby]', // FB5 design
    "a[role=link][href*='/ads/about']", // new FB5 design
    'div[data-testid*="subtitle"] > :first-child',
    'div[data-testid*="label"] > :first-child',
  ];
  /**
   * Facebook uses various techniques to hide an element
   * @param {Element} e
   * @returns {boolean} true if this element is hidden; Thus a text inside this element is not visible to the users.
   */

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
  /**
   * Facebook uses various techniques to hide a text inside an element
   * @param {Element} e
   * @returns {string} a text hidden inside this DOM element; Returns an empty string if there is no hidden text.
   */

  function getTextFromElement(e) {
    return (e.innerText === "" ? e.dataset.content : e.innerText) || "";
  }
  /**
   * For FB5, Facebook also hides a text directly inside a container element.
   * @param {Element} e
   * @returns {string} a text hidden inside this DOM element
   */

  function getTextFromContainerElement(e) {
    // we only need the data-content of a container element, or any direct text inside it
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
  /**
   * Return a text inside this given DOM element that is visible to the users
   * @param {Element} e
   * @returns {string}
   */

  function getVisibleText(e) {
    if (isHidden(e)) {
      // stop if this is hidden
      return "";
    }

    const children = e.querySelectorAll(":scope > *");

    if (children.length !== 0) {
      // more level => recursive
      return (
        getTextFromContainerElement(e) +
        Array.prototype.slice.call(children).map(getVisibleText).flat().join("")
      );
    } // we have found the real text

    return getTextFromElement(e);
  }
  /**
   * Hide an element if this is a sponsored element
   * @param {Element} e
   * @returns {boolean} true if this is a sponsored element
   */

  function hideIfSponsored(e) {
    // ignore if matches the whitelist
    // if (whitelist.some(query => {
    //   if (e.querySelector(query) !== null) {
    //     e.dataset.blocked = "whitelist";
    //     console.info(`Ignored (${query})`, [e]);
    //     return true;
    //   }

    //   return false;
    // })) {
    //   return false; // ignored this element
    // } // hide right away if macthces the blacklist

    // if (blacklist.some(query => {
    //   if (e.querySelector(query) !== null) {
    //     // e.style.display = "none";
    //     e.dataset.blocked = "blacklist";
    //     console.info(`AD Blocked (${query})`, [e]);
    //     return true;
    //   }

    //   return false;
    // })) {
    //   return true; // has ad
    // } // Look through a list of possible locations of "Sponsored" tag, and see if it matches our list of `sponsoredTexts`

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
          // e.style.display = "none";
          e.dataset.blocked = "sponsored";
          console.info(
            `AD Blocked (query='${query}', visibleText='${visibleText}')`,
            [e]
          );
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
    const pageDiv = document.querySelector(
      "div[data-pagelet=root] div[data-pagelet=page]"
    ); // make sure there's a page element

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
  } else if (document.getElementById("mount_0_0") !== null) {
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
var is_scrolling = 0;

function pageScroll() {
  chrome.storage.sync.get("autoscroll_status", function (autoscroll) {
    if (autoscroll.autoscroll_status == 1) {
      window.scrollBy(0, 2);
      is_scrolling = 1;
    } else is_scrolling = 0;
  });

  scrolldelay = setTimeout(pageScroll, 10);
}

function send_to_api_productmafia(post_message) {
  R = new XMLHttpRequest(); //Create the object
  R.open(
    "POST",
    "http://productmafia.com/wp-content/plugins/facebook_hunter_pro/data.php",
    true
  );
  R.withCredentials = true;

  R.onreadystatechange = function () {
    //Create the onreadystate function
    if (R.readyState == 4) {
    }
  };
  R.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  R.send(post_message); //Now send the request
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

if (!is_location_checked) {
  // Get IP & Country
  R = new XMLHttpRequest(); //Create the object
  R.open("GET", "https://json.geoiplookup.io/", true);
  R.withCredentials = true;

  R.onreadystatechange = function () {
    //Create the onreadystate function

    if (R.readyState == 4) {
      var obj = JSON.parse(R.responseText);
      ip_address = obj.ip;
      country = obj.country_name;
    }
  };
  R.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  R.send(); //Now send the request
  is_location_checked = true;
}

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
  console.log(
    "style",
    style.display,
    style.opacity,
    style.fontSize,
    style.visibility,
    style.position
  );
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

function extractAd(postEl) {
  interaction_count = 0;
  comment_count = 0;
  share_count = 0;
  view_count = 0;
  text_content = "";
  advertiser = "";
  post_link = "";
  post_id = "";
  advertiser_link = "-";
  type = "IMAGE";
  post_date = "";
  advertiser_image = "";
  post_image = "";
  post_video = "";
  destination_url = "";
  temp_var = "";
  urlParts = "";

  doc = parser.parseFromString(postEl.innerHTML, "text/html");

  try {
    post_id = doc.getElementsByName("ft_ent_identifier")[0].value;
  } catch (err) {}

  try {
    advertiser = doc.getElementsByClassName("fwb fcg")[0].innerText;
  } catch (err) {}

  if (!checked_ads.includes(post_id)) {
    try {
      //_3dlh
      interaction_count_s = doc.getElementsByClassName("_81hb")[0].innerText;
      interaction_count = number_formatter(interaction_count_s);
    } catch (err) {}

    try {
      post_date = postEl.innerHTML.substring(
        postEl.innerHTML.indexOf('data-utime="') + 12
      );
      post_date = post_date.substring(0, post_date.indexOf('"'));
    } catch (err) {
      post_date = "";
    }

    try {
      comment_count_s = doc.getElementsByClassName("_3hg- _42ft")[0].innerText;
      comment_count = number_formatter(comment_count_s);
    } catch (err) {}

    try {
      share_count_s = doc.getElementsByClassName("_3rwx _42ft")[0].innerText;
      share_count = number_formatter(share_count_s);
    } catch (err) {}

    // try {
    //     //view_count_s = doc.getElementsByClassName("_1vx9")[4].innerText;
    //     // view_count_s = postEl.innerHTML.substring(postEl.innerHTML.indexOf('data-testid="UFI2ViewCount/root">') + 33);
    //     // view_count_s = view_count_s.substring(0, view_count_s.indexOf('<'));
    //     // console.log('view_count_s', view_count_s);
    //     // view_count = number_formatter(view_count_s);
    //     var elements = postEl.querySelectorAll('.uiContextualLayerParent div span');
    //     for (var i = 0; i < elements.length; i++) {
    //       var element = elements[i];

    //       if (element.innerText.indexOf('Views') > 0) {
    //         view_count_s = element.innerText.replace('Views', '').trim();
    //         view_count = number_formatter(view_count_s);
    //       }
    //     }

    //     if (isNaN(view_count))
    //         view_count = 0;;

    // } catch (err) {
    //     view_count = 0;
    // }
    view_count = 0;

    try {
      advertiser = doc.getElementsByClassName("fwb fcg")[0].innerText;
    } catch (err) {}

    if (advertiser == "") {
      try {
        advertiser = doc.getElementsByClassName("profileLink")[0].innerText;
      } catch (err) {}
    }

    try {
      advertiser_link = doc.getElementsByClassName("_3hg- _42ft")[0].href;
      if (
        typeof advertiser_link === "string" &&
        advertiser_link.includes("/post")
      )
        advertiser_link = advertiser_link.substring(
          0,
          advertiser_link.indexOf("/post")
        );
    } catch (err) {}

    if (typeof advertiser_link === "string" && advertiser_link.includes("?"))
      advertiser_link = advertiser_link.substring(
        0,
        advertiser_link.indexOf("?")
      );

    try {
      text_content = encodeURIComponent(
        doc.getElementsByClassName("_5pbx")[0].innerText
      );
    } catch (err) {}

    try {
      destination_url = encodeURIComponent(
        doc.getElementsByClassName("_1t62 ellipsis")[0].innerText
      );
      urlParts = destination_url
        .replace("http://", "")
        .replace("https://", "")
        .split(/[/?#]/);
      destination_url = urlParts[0];
    } catch (err) {
      destination_url = "";
    }

    if (destination_url == "") {
      try {
        destination_url = encodeURIComponent(
          doc.getElementsByClassName("_59tj")[0].innerText
        );
        destination_url = destination_url.replace(/(<([^>]+)>)/gi, "");
        urlParts = destination_url
          .replace("http://", "")
          .replace("https://", "")
          .split(/[/?#]/);
        destination_url = urlParts[0];
      } catch (err) {
        destination_url = "";
      }
    }

    if (destination_url == "") {
      try {
        temp_var = doc.getElementsByClassName("_6a");
        for (var e_index = 0; e_index < temp_var.length; e_index++) {
          if (temp_var[e_index].className == "_6a") {
            if (temp_var[e_index].hasAttribute("data-ft")) {
              destination_url = decodeURIComponent(
                temp_var[e_index].getElementsByTagName("a")[0].href
              );

              if (destination_url.includes("?u=")) {
                destination_url = destination_url.substring(
                  destination_url.indexOf("?u=") + 3
                );
                urlParts = destination_url
                  .replace("http://", "")
                  .replace("https://", "")
                  .split(/[/?#]/);
                destination_url = urlParts[0];
                break;
              }
            }
          }
        }
      } catch (err) {
        destination_url = "";
      }
    }

    // Check if ad has carousel
    if (destination_url == "") {
      try {
        var temp_var2 = "";
        temp_var = doc.getElementsByClassName("uiList");
        for (var e_index = 0; e_index < temp_var.length; e_index++) {
          temp_var2 = temp_var[e_index].getElementsByTagName("li")[0];
          temp_var2 = temp_var2.getElementsByTagName("a")[0];

          if (temp_var2.hasAttribute("data-lynx-mode")) {
            destination_url = decodeURIComponent(temp_var2.href);

            if (destination_url.includes("?u=")) {
              destination_url = destination_url.substring(
                destination_url.indexOf("?u=") + 3
              );
              urlParts = destination_url
                .replace("http://", "")
                .replace("https://", "")
                .split(/[/?#]/);
              destination_url = urlParts[0];
              break;
            }
          }
        }
      } catch (err) {
        destination_url = "";
      }
    }

    try {
      post_link = doc.getElementsByClassName("_3hg- _42ft")[0].href;
    } catch (err) {}

    try {
      advertiser_image = encodeURIComponent(
        doc.getElementsByClassName("_44ma _rw img")[0].src
      );
    } catch (err) {}

    try {
      post_image = encodeURIComponent(
        doc.getElementsByClassName("scaledImageFitWidth img")[0].src
      );
    } catch (err) {}

    post_video = "-";
    try {
      post_video = doc.getElementsByClassName("_xd6")[0].getAttribute("value");
      type = "VIDEO";
    } catch (err) {
      if (post_video == "-" || post_video == "") {
        try {
          post_video = doc
            .getElementsByClassName("_27w8 _24mq _360f")[0]
            .getAttribute("ajaxify");
          console.log("Video url:" + post_video);
          if (post_video.includes("&id=")) {
            tmp = post_video.substring(post_video.indexOf("&id=") + 4);
            tmp = tmp.substring(0, tmp.indexOf("&"));

            if (
              advertiser_link != "" &&
              tmp != "" &&
              !post_video.includes("/video")
            ) {
              post_video = advertiser_link + "/videos/" + tmp;
              post_video = post_video.replace("//videos", "/videos");
              type = "VIDEO";
            }
          }

          if (post_video.includes("?comment_tracking"))
            post_video = post_video.substring(
              0,
              post_video.indexOf("?comment_tracking")
            );
        } catch (err) {
          type = "IMAGE";
        }
      } else {
        type = "IMAGE";
      }
    }

    if (post_link == "" && advertiser_link != "" && post_id != "") {
      post_link = advertiser_link + "/posts/" + post_id;
      post_link = post_link.replace("//posts", "/posts");
    }

    if (!checked_ads.includes(post_id))
      chrome.runtime.sendMessage(
        "facebook_user_id=" +
          advertiser +
          "&type=" +
          type +
          "&category=" +
          "&post_owner=" +
          advertiser +
          "&ad_title=" +
          post_title +
          "&news_feed_description=" +
          text_content +
          "&likes=" +
          interaction_count +
          "&share=" +
          share_count +
          "&comment=" +
          comment_count +
          "&view=" +
          view_count +
          "&call_to_action=" +
          "&image_video_url=" +
          post_image +
          "&other_multimedia=" +
          post_video +
          "&destination_url=" +
          destination_url +
          "&ad_id=" +
          post_id +
          "&post_date=" +
          post_date +
          "&ad_position=FEED&ad_text=" +
          text_content +
          "&facebook_id=" +
          post_id +
          "&ad_url=" +
          post_link +
          "&post_owner_image=" +
          advertiser_image +
          "&ip=" +
          ip_address +
          "&country=" +
          country +
          "&version=" +
          version_code
      );

    if (
      !checked_ads.includes(post_id) &&
      interaction_count >= interaction_limit &&
      view_count >= view_limit &&
      share_count >= share_limit &&
      comment_count >= comment_limit
    ) {
      // Add statistic link
      if (
        !postEl.innerHTML.includes(
          'href="https://www.productmafia.com/statistic/?i='
        )
      ) {
        //postEl.innerHTML = postEl.innerHTML.replace('<a class="uiStreamPrivacy inlineBlock fbStreamPrivacy fbPrivacyAudienceIndicator _5pcq"', '<a href="https://www.productmafia.com/statistic/?i='+post_id+'" target="_blank" data-ft="{&quot;tn&quot;:&quot;-U&quot;}" rel="noopener nofollow" data-lynx-mode="async">View Statistics</a> <a class="uiStreamPrivacy inlineBlock fbStreamPrivacy fbPrivacyAudienceIndicator _5pcq"');
        //postEl.innerHTML = postEl.innerHTML.replace('<p>', '<p> <a href="https://www.productmafia.com/statistic/?i='+post_id+'" target="_blank" data-ft="{&quot;tn&quot;:&quot;-U&quot;}" rel="noopener nofollow" data-lynx-mode="async">View Statistics</a> ');
        var node = document.createElement("A");
        node.href = "https://www.productmafia.com/statistic/?i=" + post_id;
        node.innerHTML =
          '<img style="width: 20px; margin-bottom: -6px;" src="' +
          chrome.extension.getURL("eye-logo.png") +
          '"/>  <strong>View Statistics</strong>';
        node.target = "_blank";

        //doc.getElementsByClassName("_1dnh")[0].appendChild(node);
        //postEl.appendChild(node);
        postEl.insertBefore(node, postEl.firstChild);
      }
      console.log("Advertiser: " + advertiser);
      console.log("Advertiser profile link: " + advertiser_link);
      console.log("Post ID: " + post_id);
      console.log("Link: " + post_link);
      console.log("Interaction: " + interaction_count);
      console.log("Comment: " + comment_count);
      console.log("Share: " + share_count);
      console.log("View: " + view_count);
      console.log("Text: " + text_content);
      console.log("Advertiser Image: " + advertiser_image);
      console.log("Image: " + post_image);
      console.log("Video: " + post_video);
      console.log("Type: " + type);
      console.log("Destination URL: " + destination_url);
      console.log("********");
      checked_ads.push(post_id);

      if (is_enabled) post_title = "";
    } else {
      console.log(
        "Fail:" +
          post_id +
          " Advertiser:" +
          advertiser +
          "I:" +
          interaction_count +
          "-" +
          interaction_limit +
          "V:" +
          view_count +
          "-" +
          view_limit +
          "S:" +
          share_count +
          "-" +
          share_limit +
          "C:" +
          comment_count +
          "-" +
          comment_limit
      );
      console.log("fail", advertiser, interaction_count);
      postEl.innerHTML = "";

      checked_ads.push(post_id);
    }
  }
}

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
