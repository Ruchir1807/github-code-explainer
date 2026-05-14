console.log("CONTENT SCRIPT RUNNING");

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {

        if (request.action === "getSelectedCode") {

            const selectedText =
                window.getSelection().toString();

            sendResponse({
                code: selectedText
            });
        }
    }
);