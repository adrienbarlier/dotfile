(function (open) {
  var elem = document.getElementById("post-urls-productmafia");
  if (!elem) {
    elem = document.createElement("div");
    elem.id = "post-urls-productmafia";
    elem.style.display = "none";
    elem.innerText = JSON.stringify([]);
    document.body.appendChild(elem);
  }
  XMLHttpRequest.prototype.open = function () {
    this.addEventListener(
      "readystatechange",
      function (e) {
        if (this.readyState == 4 && this.status == 200) {
          responseURL = this.responseURL;
          if (!responseURL.endsWith("/video/unified_cvc/")) {
            return;
          }
          returnedData = JSON.parse(this.responseText.replace("for (;;);", ""))[
            "payload"
          ]["vi"];
          link = "https://www.facebook.com/watch/?v=" + returnedData;
          links = JSON.parse(elem.innerText);
          if (!links.includes(link)) {
            links.push(link);
            elem.innerText = JSON.stringify(links);
            // console.log("Found link: " + link);
          }
        }
      },
      false
    );
    open.apply(this, arguments);
  };
})(XMLHttpRequest.prototype.open);
