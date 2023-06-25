chrome.action.onClicked.addListener(tab => {
    (async () => {
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {greeting: "hello"});
        console.log(response);
      })();
  });



/// BELOW CODE WORKS, USE AS TEMPLATE 
/*
chrome.action.onClicked.addListener(tab => {
    (async () => {
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {greeting: "hello"});
        // do something with response here, not outside the function
        console.log(response);
      })();
  });
*/