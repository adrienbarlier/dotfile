# Chrome-Extension 🏆

## How is works. 🔧
Currently, this works by filtering through all the post, and
checking if each one of them is advertisement or not. If
it is advertisement, then it’s “style.display” property is
flex, else, it’s “style.display” property is none. This is
handled in hideIfSponsered() function. This function also
receives each post container as parameter. Once we find
that the container is of other posts rather than of the
advertisement, we hide them. Else, we show them.
After filtering whether it is advertisement or not, we
extract likes, comments, shares, page name, images,
profile icon, video (in blob url), and store it in data array,
which is sent to our database in every 30 seconds
interval. Once sent to our server, the data array is
cleared, and next advertisements are pushed in data
array.

Our chrome extension is built on top of another opensource project
https://github.com/tiratatp/facebook_adblock/
For countries, whenever user clicks on the icon, a request is made to https://www.ip-adress.com/ , then the name of country is fetched and saved to chrome sync storage. The interaction count filter is also saved in chrome sync storage and the advertisement which doesn’t fulfill the given requirements are given display style of “none”. All the required information like likes, comments, shares, loves, hahas, cares, angrys are collected in an array called dataArray and post request is made to our backend server in the time interval of 30 seconds. The post urls are also captured using XMLHttpRequest and they too are sent to our backend in regular interval in similar fashion. The dataArray and array of post urls are sent with a timestamp, which acts as a unique group id for both of them, which helps later while creating video ads from the post urls.
