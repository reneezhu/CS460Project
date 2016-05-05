//TODO: malware domains
//TOOD: whitelisting
//TODO: implement element hiding


//Settings
var prefetchWebpages = false;

//Debugging purposes
var displayLogs = true;
var showOnlyBlocked = true;

//Set prefetch settings 
var callback = function() {void chrome.runtime.lastError;};

try {
    chrome.privacy.network.networkPredictionEnabled.set({
        value: prefetchWebpages,
        scope: 'regular'
    }, callback);
} catch(ex) {
    console.error(ex);
}

/*To keep track of current active frames. Needs tab id and frame id to associate them.
  Keeps track of various details used to properly block all ads
  From catblock
*/
frameData = {
	// Returns the data object for the frame with ID frameId on the tab with
	// ID tabId. If frameId is not specified, it'll return the data for all
	// frames on the tab with ID tabId. Returns undefined if tabId and frameId
	// are not being tracked.
	get: function(tabId, frameId) {
	    if (frameId !== undefined)
	        return (frameData[tabId] || {})[frameId];
	    return frameData[tabId];
	},

	// Record that |tabId|, |frameId| points to |url|.
	record: function(tabId, frameId, url) {
	    var fd = frameData;
	    if (!fd[tabId]) fd[tabId] = {};
	    fd[tabId][frameId] = {
	        url: url,
	        // Cache these as they'll be needed once per request
	        domain: parseUri(url).hostname,
	        resources: {}
	    };
	    //fd[tabId][frameId].whitelisted = page_is_whitelisted(url);
	},

	// Watch for requests for new tabs and frames, and track their URLs.
	// Inputs: details: object from onBeforeRequest callback
	// Returns false if this request's tab+frame are not trackable.
	track: function(details) {
	    var fd = frameData, tabId = details.tabId;

	    // A hosted app's background page
	    if (tabId === -1) {
	        return false;
	    }

	    if (details.type === 'main_frame') { // New tab
	        delete fd[tabId];
	        fd.record(tabId, 0, details.url);
	        fd[tabId].blockCount = 0;
	        console.log("\n-------", fd.get(tabId, 0).domain, ": loaded in tab", tabId, "--------\n\n");
	        return true;
	    }

	    // Request from a tab opened before AdBlock started, or from a
	    // chrome:// tab containing an http:// iframe
	    if (!fd[tabId]) {
	        console.log("[DEBUG]", "Ignoring unknown tab:", tabId, details.frameId, details.url);
	        return false;
	    }

	    // Some times e.g. Youtube create empty iframes via JavaScript and
	    // inject code into them.  So requests appear from unknown frames.
	    // Treat these frames as having the same URL as the tab.
	    var potentialEmptyFrameId = (details.type === 'sub_frame' ? details.parentFrameId: details.frameId);
	    if (undefined === fd.get(tabId, potentialEmptyFrameId)) {
	        fd.record(tabId, potentialEmptyFrameId, fd.get(tabId, 0).url);
	        console.log("[DEBUG]", "Null frame", tabId, potentialEmptyFrameId, "found; giving it the tab's URL.");
	    }

	    if (details.type === 'sub_frame') { // New frame
	        fd.record(tabId, details.frameId, details.url);
	        console.log("[DEBUG]", "=========== Tracking frame", tabId, details.parentFrameId, details.frameId, details.url);
	    }

	    return true;
	},

	// Save a resource for the resource blocker.
	storeResource: function(tabId, frameId, url, elType, frameDomain) {
	    var data = frameData.get(tabId, frameId);
	    if (data !== undefined) {
	        data.resources[elType + ":|:" + url + ":|:" + frameDomain] = null;
	    }
	},

	removeTabId: function(tabId) {
	    delete frameData[tabId];
	}
};

//Adds a listener for all requests
chrome.webRequest.onBeforeRequest.addListener(insepectURL,{urls:  ['<all_urls>']},["blocking"]);

/*
* Function to inspect all url requests and the potentially block
*/
function insepectURL(details){
	details.url = getUnicodeUrl(details.url);

	if (!frameData.track(details))
	    return { cancel: false };

	var tabId = details.tabId;
	var requestType = getRequestType({url: details.url, type: details.type});
	var requestingFrameId = (requestType === 'sub_frame' ? details.parentFrameId : details.frameId);
	var elementType = getElementType(requestType);

	var frameDomain = frameData.get(tabId, requestingFrameId).domain;
	frameData.storeResource(tabId, requestingFrameId, details.url, elementType, frameDomain);

  	var blocked = checkMatch(details.url, elementType, frameDomain);

  	//Check if it's in malware list
  	if (checkMalware(details.url)){
  		blocked = true;
  	}

	//Log data to console for debugging purposes
	if(!showOnlyBlocked || (showOnlyBlocked && blocked !== null))
		console.log("URL: " + details.url + "\tTab ID: " + tabId + "\tRequest Type: " + requestType + "\tElement Type: " 
		+ elementType + "\n\tDomain: " + frameDomain + "\tRequesting Frame: " + requestingFrameId + "\tBlocked: " + blocked);

	console.log(blocked);

  	if(blocked && (elementType === "subdocument")){
  		return { redirectUrl: "about:blank" };
  	}
  	
	//Didn't match against any rules
	return {cancel: (blocked !== null)};
}


//Once a tab is removed, we don't need to keep its data
chrome.tabs.onRemoved.addListener(frameData.removeTabId);

//Get tab details for already opened tabs
var handleEarlyOpenedTabs = function(tabs) {
  for (var i = 0; i < tabs.length; i++) {
    var currentTab = tabs[i], tabId = currentTab.id;
    if (!frameData.get(tabId)) {
        currentTab.url = getUnicodeUrl(currentTab.url);
        frameData.track({url: currentTab.url, tabId: tabId, type: "main_frame"});
    }
  }
}

//Query all tabs using http and https
chrome.tabs.query({url: "http://*/*"}, handleEarlyOpenedTabs);
chrome.tabs.query({url: "https://*/*"}, handleEarlyOpenedTabs);

//Make sure to update tab ids if the change in any way
chrome.webNavigation.onTabReplaced.addListener(function(details) {
    frameData.removeTabId(details.replacedTabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    if (details && details.hasOwnProperty("frameId") && details.hasOwnProperty("tabId") &&
        details.hasOwnProperty("url") && details.hasOwnProperty("transitionType") &&
        details.transitionType === "link") {
        var tabData = frameData.get(details.tabId, details.frameId);
        if (tabData &&
            tabData.url !== details.url) {
            details.type = 'main_frame';
            details.url = getUnicodeUrl(details.url);
            frameData.track(details);
        }
    }
});
