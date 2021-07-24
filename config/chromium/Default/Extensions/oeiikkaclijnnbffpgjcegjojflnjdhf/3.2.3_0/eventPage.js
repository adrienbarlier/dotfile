function send_to_api_productmafia(post_message) {
  R = new XMLHttpRequest(); //Create the object
  R.open(
    "POST",
    "https://www.productmafia.com/wp-content/plugins/facebook_hunter_pro/data.php",
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

/*
chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
    post_message = request.sendLink;
    send_to_api(post_message);
   // Add this line:
  return Promise.resolve("Dummy response to keep the console quiet");
});
*/

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  send_to_api_productmafia(message);
});
