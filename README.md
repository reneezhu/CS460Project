# CS460Project
Introduction
Our project is a simple Adblocker in which We implemented a listener that intercepts all requests before they are sent. These requests are then processed and the corresponding url, tab id, and domain are extracted and then tested against a list of filters. 
The filters are loaded from EasyList and have the appropriate settings and a corresponding regular expression to check against.
Also, it can block the malware websites by matching the url with the malware domain list.
Besides, we also implemented an UI let the user to make some basic options.

How to use it:
1. Download the files
2. Goto the extention in chrome and enable developer mode
3. Load unpacked extension
4. Refresh the page and your Ads are gone
5. If you want to test the malware block functionality, you can goto malwaredomains_full.txt and delete the "!" in front of "||google.com^" and save the file and reload the extension in chrome.
6. Now, it will block all of the web end with google.com
