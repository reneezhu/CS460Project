var webRequestRules = new Array();
var elementRules = new Array();
var substringRules = new Array();

var thirdPartyRules = new Array();
var objectRules = {};
var domainRules = {};
var generalRules = new Array();

//Uses basic EasyList ruleset to try and filter ads
//No regex support as of yet
//Third party rules aren't properly handled either... 
//TODO: Fix negation support
$.get('easylist.txt', function(data){
    lines = data.split('\n');
    for(i = 0; i < lines.length; i++){
        var line = lines[i];
        //Check for category 
        if(line.indexOf('$') > -1){
            var expression = line.substring(0,line.indexOf('$'));

            var categories = line.substring(line.indexOf('$') + 1,line.length).split(',');
            //Go through all of the listed categories for the 
            for(j = 0; j < categories.length; j++){
                var category  = categories[j];

                if(category.indexOf("domain=") > -1){
                    var domains = category.substring(category.indexOf("=") + 1,category.length).split('|');
                    for(ind = 0; ind < domains; ind++){
                        var domain = domains[ind];

                        //Check for negation
                        if(domain.indexOf('~') > -1){
                            for(var key in Object.keys(domainRules)){
                                if(key === domain.replace('~','')){
                                    domainRules[key].push(expression);
                                }
                            }
                        }
                        else{
                            //Create a new list if the domain hasn't been used
                            if(domainRules[domain] === undefined){
                                domainRules[domain] = [];
                            }

                            domainRules[domain].push(expression);
                        }
                    }
                }
                else if(new RegExp("script|image|xmlhttprequest|object|document|subdocument|stylesheet|other").test(category)){
                    //Check if is negatation
                    var objectTypes = ["script","image","xmlhttprequest","object","document","subdocument","stylesheet","other"];
                    if(category.indexOf("~") > -1){
                        objectTypes.splice(objectTypes.indexOf(category), 1);
                        for(ind = 0; ind < objectTypes.length; ind++){
                            //Check if array exists, if not we neet to create one
                            if(objectRules[objectTypes[ind]] === undefined){
                                objectRules[objectTypes[ind]] = [];
                            }
                            objectRules[objectTypes[ind]].push(expression);
                        }
                    }
                    else{//No negation
                        if(objectRules[category] === undefined){
                            objectRules[category] = [];
                        }
                        objectRules[category].push(expression);
                    }
                }

            
                //Applies to third party requests
                else if(category.indexOf("third-party") > -1){
                    thirdPartyRules.push(expression);
                }
            }

            //General rule if no categories are specified
            if(categories.length === 0){
                generalRules.push(expression);
            }
            
        }
        //This is a generic filter/element hide rule
        else{
            //Check if it is an element hide rule
            if(line.indexOf("#") === 0){
                //We don't properly handle any element hiding
            }
        }
    }
});

processExpression = function(expression){
    //Check if is exception
    if(expression.substring(0,2) === "@@"){
        
    }

}

/*Function to help check requests against loaded rules
Returns true if the request should be blocked
and false if no matches were found
*/
checkMatch = function(url, elementType, domain){
    //Check if third party
    var urlDomain = getUnicodeDomain(parseUri(url).hostname);
    var thirdParty = checkThirdParty(urlDomain, domain);

    //Third party
    if(thirdParty){
        for(i = 0; i <thirdPartyRules.length; i++){
            if(url.indexOf(thirdPartyRules[i]) > -1){
                return true;
            }
        }
    }

    //Apply domain specific filters
    if(domain !== undefined){
        var filters = domainRules[domain];
        if(filters !== undefined){
            for(i = 0; i < filters.length; i++){
                if(url.indexOf(filters[i]) > -1){
                    return true;
                }
            }
        }
    }

    //Apply element filters
    if(elementType !== undefined){
        var filters = objectRules[elementType];
        if(filters !== undefined){
            for(i = 0; i < filters.length; i++){
                if(url.indexOf(filters[i]) > -1){
                    return true;
                }
            }
        }
    }
    
    //Apply general filters
    for(i = 0; i < generalRules.length; i++){
        if(url.indexOf(generalRules[i]) > -1){
            return true;
        }
    }

    //Couldn't find any matches so return false
    return false;
};

checkThirdParty = function(domain1, domain2) {
  var match1 = parseUri.secondLevelDomainOnly(domain1, false);
  var match2 = parseUri.secondLevelDomainOnly(domain2, false);
  return (match1 !== match2);
}
