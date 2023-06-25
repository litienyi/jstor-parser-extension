console.log("CS is running")

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    get0();
    sendResponse({farewell: "goodbye"});
  }
);


/// PARSER CODE

function get0() {
  // SET UP CONSTs
  const jstorUUID = document.querySelector("[data-content-id]").getAttribute("data-content-id");
  const chicagoRequestLink = window.location.href.replace(/\/stable.*/g, "") + "/citation/chicago/" + jstorUUID;
  
  // CREATE ARTICLE0 GLOBAL OBJECT
  window.article0;
  article0 = {}

  // EMULATE HTTP REQUEST TO FETCH CHICAGO CITATION, FETCH() DOES NOT WORK
  const chicagoRequest = new XMLHttpRequest();
  chicagoRequest.open("GET", chicagoRequestLink);
  chicagoRequest.send();

  // WAIT FOR HTTP REQUEST TO COMPLETE & WRITE ARTICLE0 OBJ
  chicagoRequest.onload = function() {
    if (chicagoRequest.status === 200) {
      article0.UUID = generateUUID();
      article0.ambiguousText = JSON.parse(chicagoRequest.responseText)["citation"].replace(/<[^>]*>/g, "");
    } else {
      article0.errorMessage = "Unable to retrieve citation for this article.";
      article0.requestStatus = chicagoRequest.status;
      article0.requestStatusText = chicagoRequest.statusText;
    }
  getReferences();
  // getCitations();
   getReferenceCSV(referenceList);
  // makeNodeList();
  // makeEdgeList();
  };
}


function getReferences() {
  
  // CREATE REFERENCE LIST LIST
  window.referenceList;
  referenceList = [];

  // CHECK IF REFERENCES DROP DOWN MENU IS PRESENT
  if (document.evaluate("//div[contains(text(),'References')]/ancestor::details[@class='accordion']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null) {
    
    // GET ALL <li> ELEMENTS
    const liElements = document.evaluate("//div[contains(text(),'References')]/ancestor::details[@class='accordion']", document.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.querySelectorAll("li");

    // FOR EVERY <li> ELEMENT, 
    for (const liElement of liElements) {
      // FOR EVERY <li> ELEMENT, CREATE NEW REFERENCE OBJ
      let reference = {}
      
      // FOR EVERY OBJ, APPEND UUID AND RELATIONSHIP PROPERTIES
      reference.UUID = generateUUID();
      reference.relationship = "Referenced by " + JSON.stringify(article0).replace(/\"/g, '"');
      
      // FOR EVERY OBJ, APPEND AMBIGUOUS TEXT      
      reference.ambiguousText = liElement.innerHTML.replace(/<[^>]*>/g, "").replace(/\"/g, '"');
        
        // IF HREF AVAILABLE, APPEND
        (liElement.querySelector('[href]') === null) ? null : 
          reference.Links = Object.values(Array.from(liElement.querySelectorAll('[href]'), Node => (Node.getAttribute("href").match(/\/stable+.*/g) ? "https://www.jstor.org" + Node.getAttribute("href") : Node.getAttribute("href")))).join(";");        

        // IF SECTION AVAILABLE, APPEND
        (liElement.closest("section") === null) ? null : reference.Heading = liElement.closest("section").querySelector("h2").textContent;
        
        // IF <mfe-content-details-pharos-heading> AVAILABLE, APPEND
        // try to find .reference-block-title
        let SubheadingDOM = liElement;
        while ((SubheadingDOM !== liElement.closest(".accordion__body")) && (SubheadingDOM.querySelector(".reference-block-title") === null)) {
          SubheadingDOM = SubheadingDOM.parentElement;} // loop breaks when reached closes .according__body or found .reference-block-title
        
        // append Subheading to reference obj.
        (SubheadingDOM.querySelector(".reference-block-title") === null) ? null : reference.Subheading = SubheadingDOM.querySelector(".reference-block-title").textContent;
        
      // ADD OBJ TO REFERENCE LIST
      referenceList.push(reference);
      //}
    }
  }
}



function getCitations() {
  

  window.citationList;
  citationList = [];

  // CHECK IF CITED BY IS AVAILABLE
  if (document.body.querySelector("ul[class='citations']") !== null) {

    const liElements = document.body.querySelector("ul[class='citations']").querySelectorAll("li");

    for (const liElement of liElements) {
      let citation = {};

      citation.UUID = generateUUID();
      citation.relationship = "Cites " + JSON.stringify(article0).replace(/\"/g, '"');

      for (const child of liElement.children) {
        try {
          const propertyName = child.getAttribute("data-qa") || "Extra (No property provided)";
          const propertyValue = child.innerHTML.replace(/<[^>]*>/g, "");
          citation[propertyName] = propertyValue;
          
          
        } catch (error) {
          citation.messageToUser = "I am unable to parse this <li> element. Please double-check manually.";
          citation.entireElement = liElement.innerHTML;
          citation.entireElementText = liElement.innerHTML.replace(/<[^>]*>/g, "");
          citation.error = error;
        }
      }
      citation.Link = "https://www.jstor.org" + liElement.querySelector("mfe-citation-graph-pharos-link").getAttribute("href").replace(/\?refreqid=.*/g, "");
      citationList.push(citation);
    }
  }
}

function generateUUID() {
  const uuid = crypto.randomUUID();
  return uuid.toString("hex").slice(0, 32);
}

function makeNodeList() {
  window.nodeList;
  nodeList = [];
  nodeList.push (referenceList);
  nodeList.push (citationList);
  console.log(nodeList);
}

function makeEdgeList() {
  window.edgeList;
  edgeList = [];
  for (const reference of referenceList) {
    edgeList.push({
      source: reference.UUID, //reference is cited by...
      target: article0.UUID
    });
  }
  for (const citation of citationList) {
    edgeList.push({
      source: article0.UUID, // article0 is cited by...
      target: citation.UUID 
    });
  }
  console.log(edgeList);
}

function getReferenceCSV(referenceList) {
  let csvHeadersArray =[];
  let csvHeadersString; 
  let csvData; // is a string
  
  // GET HEADERS
  for (reference of referenceList) { //loops through all references
    csvHeadersArrayTEMP = Object.keys(reference); //returns an array of properties
    for (property of csvHeadersArrayTEMP) {
      if (!csvHeadersArray.includes(property)) {
        csvHeadersArray.push(property);
      }
    }
  }

  csvHeadersString = csvHeadersArray.toString(",");
  csvData += csvHeadersString + "\n";

  // GET DATA
  for (reference of referenceList) {
    for (property of csvHeadersArray) { 
      // PUSH DATA
      console.log(property);
      console.log(reference[property]);
      csvData += "\"" + (reference[property] || "").replace(/\"/g, "\"\"") + "\"";csvData += (",");
      }
      csvData += ("\n");
  }
  
  
  // DOWNLOAD CSV
  // Create a blob object from the CSV data.
  const blob = new Blob([csvData], {type: 'text/csv'});

  // Get the URL of the blob object.
  const url = window.URL.createObjectURL(blob);

  // Download the file automatically.
  window.open(url, 'Download', '_blank');
}
  

get0();