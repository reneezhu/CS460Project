# CS460Project
<b>Introduction</b><br />
Our project is a simple Adblocker in which we implemented a web request listener that intercepts ALL web requests before they are sent out. These requests are then processed and the corresponding url, tab id, and domain are extracted to be tested against a set of appropriate filters.The filters used are loaded from EasyList and each have the appropriate settings and a corresponding regular expression to check if a web request should be blocked or not. Additionally, it can block the malware websites by matching the url with the malware domain list. There is also a basic UI to let the user to make some options.<br />

<b>Basic Options</b><br>
<b>    Prefetch</b> - Chrome tries to prefetch websites based on context within the omnibox. However, this can potentially lead to malicious content or ads being loaded. As such, this is disabled by default, but it can enabled or disabled. <br>
<b>    Block Malware Sites</b> - There is also an option to enable/disable blocking of malware ridden domains.<br>
<b>    Block Ads</b> - This is basically turn on/off the ad block functionality. 
<br /><br /><br />
<b>How to use it:</b><br />
1. Download the files<br />
2. Goto the extention in chrome and enable developer mode<br />
3. Load unpacked extension<br />
4. Refresh the page and your Ads are gone<br />
5. If you want to test the malware block functionality, you can goto malwaredomains_full.txt and delete the "!" in front of<br /> "||google.com^" and save the file and reload the extension in chrome.<br />
6. Now, it will block all of the web end with google.com<br />
