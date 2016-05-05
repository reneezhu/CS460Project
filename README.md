# CS460Project
Introduction<br />
Our project is a simple Adblocker in which We implemented a listener that intercepts all requests before they are sent. These requests are then processed and the corresponding url, tab id, and domain are extracted and then tested against a list of filters. <br />
The filters are loaded from EasyList and have the appropriate settings and a corresponding regular expression to check against.<br />
Also, it can block the malware websites by matching the url with the malware domain list.<br />
Besides, we also implemented an UI let the user to make some basic options.<br />
<br /><br /><br />
How to use it:<br />
1. Download the files<br />
2. Goto the extention in chrome and enable developer mode<br />
3. Load unpacked extension<br />
4. Refresh the page and your Ads are gone<br />
5. If you want to test the malware block functionality, you can goto malwaredomains_full.txt and delete the "!" in front of<br /> "||google.com^" and save the file and reload the extension in chrome.<br />
6. Now, it will block all of the web end with google.com<br />
