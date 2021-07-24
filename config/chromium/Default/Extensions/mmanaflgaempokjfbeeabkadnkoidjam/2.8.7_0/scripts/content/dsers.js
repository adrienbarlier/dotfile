window.DsersContentScript.initDsersAuthToken();
window.DsersContentScript.initMessageListener();

window.addEventListener("FocusCurrentTab", window.DsersContentScript.sendFocusEvent);