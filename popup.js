console.log("POPUP JS LOADED");

document
    .getElementById("analyzeBtn")
    .addEventListener("click", async () => {

        const resultDiv =
            document.getElementById("result");

        const loadingDiv =
            document.getElementById("loading");

        try {

            // GET CURRENT TAB
            const [tab] =
                await chrome.tabs.query({

                    active: true,
                    currentWindow: true
                });

            // SEND MESSAGE TO CONTENT SCRIPT
            chrome.tabs.sendMessage(

                tab.id,

                {
                    action: "getSelectedCode"
                },

                async (response) => {

                    // CONTENT SCRIPT ERROR
                    if (chrome.runtime.lastError) {

                        console.error(
                            chrome.runtime.lastError
                        );

                        resultDiv.innerText =
                            "Could not connect to GitHub page.";

                        return;
                    }

                    // NO RESPONSE
                    if (!response) {

                        resultDiv.innerText =
                            "No response from content script.";

                        return;
                    }

                    let code = response.code;

                    // EMPTY SELECTION
                    if (!code || !code.trim()) {

                        resultDiv.innerText =
                            "Please highlight some code first.";

                        return;
                    }

                    // CLEAN CODE
                    code = code.trim();

                    code = code.replace(
                        /\n{3,}/g,
                        "\n\n"
                    );

                    // LIMIT SIZE
                    if (code.length > 30000) {

                        resultDiv.innerText =
                            "Selected code is too large.";

                        return;
                    }

                    // SHOW LOADING
                    loadingDiv.classList.remove(
                        "hidden"
                    );

                    resultDiv.innerText = "";

                    try {

                        // DETECT LANGUAGE
                        const url = tab.url;

                        const extension =
                            url.split(".")
                               .pop()
                               .toLowerCase();

                        let language =
                            "JavaScript";

                        if (extension === "cpp"
                            || extension === "cc"
                            || extension === "cxx") {

                            language = "C++";
                        }

                        else if (extension === "c") {

                            language = "C";
                        }

                        else if (extension === "java") {

                            language = "Java";
                        }

                        else if (extension === "py") {

                            language = "Python";
                        }

                        else if (extension === "ts") {

                            language = "TypeScript";
                        }

                        // CALL BACKEND
                        const aiResponse =
                            await fetch(

                                "https://github-code-explainer.onrender.com",

                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body: JSON.stringify({

                                        code: code,

                                        language: language
                                    })
                                }
                            );

                        // API ERROR
                        if (!aiResponse.ok) {

                            const errorText =
                                await aiResponse.text();

                            console.error(errorText);

                            loadingDiv.classList.add(
                                "hidden"
                            );

                            resultDiv.innerText =
                                `API Error: ${aiResponse.status}`;

                            return;
                        }

                        // GET RESPONSE
                        const data =
                            await aiResponse.json();

                        console.log(data);

                        // HIDE LOADING
                        loadingDiv.classList.add(
                            "hidden"
                        );

                        // DISPLAY RESULT
                       resultDiv.innerHTML =
    marked.parse(data.explanation);

                    }
                    catch (error) {

                        console.error(error);

                        loadingDiv.classList.add(
                            "hidden"
                        );

                        resultDiv.innerText =
                            "Error calling backend.";
                    }
                }
            );
        }
        catch (error) {

            console.error(error);

            loadingDiv.classList.add(
                "hidden"
            );

            resultDiv.innerText =
                "Unexpected error occurred.";
        }
    });
