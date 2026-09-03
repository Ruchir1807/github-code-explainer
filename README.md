# GitHub Code Explainer

A Chrome extension that allows users to select code directly from GitHub and receive an AI-generated explanation.

The project combines a Chrome Extension frontend, a Node.js and Express backend, and Groq's LLM API to provide code explanations without requiring users to copy and paste code into a separate AI application.

---

## Features

* Explain selected code directly from GitHub
* AI-generated explanations using Llama 3.1
* Automatic programming language detection from the GitHub file URL
* Markdown-formatted explanations
* Secure API key management through backend environment variables
* Backend deployed using Render
* Input validation and code-size limits
* Lightweight HTTP API between the extension and backend

---

## Architecture

The application consists of three main components:

```text
┌───────────────────────┐
│      GitHub Page      │
│                       │
│    User selects code  │
└──────────┬────────────┘
           │
           │ window.getSelection()
           ▼
┌───────────────────────┐
│      content.js       │
│                       │
│ Gets selected code    │
└──────────┬────────────┘
           │
           │ Chrome Extension Messaging
           ▼
┌───────────────────────┐
│       popup.js        │
│                       │
│ • Gets selected code  │
│ • Detects language    │
│ • Validates input     │
│ • Calls backend       │
└──────────┬────────────┘
           │
           │ HTTP POST
           │ JSON
           ▼
┌───────────────────────┐
│   Node.js + Express   │
│                       │
│      POST /explain    │
│                       │
│ • Validates request   │
│ • Builds AI prompt    │
│ • Calls Groq API      │
└──────────┬────────────┘
           │
           │ OpenAI-compatible API
           ▼
┌───────────────────────┐
│         Groq          │
│                       │
│    Llama 3.1 8B       │
│                       │
│ Generates explanation │
└──────────┬────────────┘
           │
           │ AI response
           ▼
┌───────────────────────┐
│   Express Backend     │
│                       │
│ Returns JSON response │
└──────────┬────────────┘
           │
           │ HTTP Response
           ▼
┌───────────────────────┐
│       popup.js        │
│                       │
│ Markdown → HTML       │
│                       │
│ Displays explanation  │
└───────────────────────┘
```

---

## How It Works

### 1. Code Selection

The user selects a piece of code on a GitHub page.

The Chrome extension's `content.js` runs on GitHub pages and retrieves the selected text using:

```javascript
window.getSelection().toString()
```

### 2. Communication Between Extension Components

When the user clicks the Analyze button, `popup.js` communicates with `content.js` using Chrome's extension messaging API.

```text
popup.js
    │
    │ Request selected code
    ▼
content.js
    │
    │ Selected code
    ▼
popup.js
```

The popup and content script operate in different contexts, so Chrome's messaging API is used to exchange information between them.

### 3. Input Processing

Once the selected code is received, `popup.js`:

* Removes unnecessary whitespace
* Checks whether code was selected
* Limits the maximum input size
* Determines the programming language from the GitHub URL

The data is then prepared as a JSON object:

```json
{
  "code": "public int add(int a, int b) { return a + b; }",
  "language": "Java"
}
```

### 4. Extension to Backend Communication

The extension sends the data to the Express backend through an HTTP POST request.

```text
Chrome Extension
       │
       │ POST /explain
       │ Content-Type: application/json
       ▼
Node.js + Express
```

The backend uses:

```javascript
app.use(express.json());
```

to parse the incoming JSON request body.

The request data can then be accessed through:

```javascript
req.body
```

### 5. Backend Processing

The Express backend exposes the `/explain` endpoint:

```javascript
app.post("/explain", async (req, res) => {
    ...
});
```

The backend extracts the code and programming language:

```javascript
const { code, language } = req.body;
```

It then validates the request before sending anything to the AI service.

### 6. Groq API Integration

The backend uses the OpenAI Node.js SDK with Groq's OpenAI-compatible API endpoint.

```javascript
const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});
```

Although the OpenAI SDK is used, the request is sent to Groq because the SDK's `baseURL` has been configured to point to Groq's API.

The backend then sends the code to the Llama model:

```text
Node.js Backend
       │
       │ OpenAI SDK
       │
       ▼
Groq API
       │
       │ Llama 3.1
       ▼
Generated explanation
```

### 7. Prompt Construction

The backend sends two messages to the model:

* A system message that defines how the model should explain code
* A user message containing the selected code and its programming language

The system prompt is designed to keep explanations grounded in the provided code and discourage the model from inventing missing implementations.

Conceptually:

```text
System:
You are a precise and beginner-friendly code explainer.
Only explain behavior supported by the provided code.

User:
Explain this Java code:

<selected code>
```

### 8. Backend Response

After the model generates the explanation, the backend extracts the generated content:

```javascript
response.choices[0].message.content
```

The result is returned to the extension as JSON:

```json
{
  "explanation": "This method takes two integers..."
}
```

### 9. Displaying the Explanation

The popup receives the response using:

```javascript
const data = await aiResponse.json();
```

The returned Markdown is converted into HTML using Marked and displayed in the extension popup.

```text
AI Response
     │
     ▼
Markdown
     │
     ▼
marked.parse()
     │
     ▼
HTML
     │
     ▼
Extension UI
```

---

## Request Flow

The complete request lifecycle is:

```text
User selects code
        │
        ▼
GitHub webpage
        │
        ▼
content.js
        │
        │ Chrome messaging
        ▼
popup.js
        │
        │ Input validation
        │ Language detection
        ▼
fetch()
        │
        │ HTTP POST /explain
        ▼
Express Backend
        │
        │ req.body
        ▼
Input Validation
        │
        ▼
Prompt Construction
        │
        │ OpenAI SDK
        ▼
Groq API
        │
        ▼
Llama 3.1
        │
        │ Generated explanation
        ▼
Express Backend
        │
        │ JSON response
        ▼
popup.js
        │
        ▼
Markdown → HTML
        │
        ▼
User
```

---

## Project Structure

```text
github-code-explainer/
│
├── backend/
│   ├── server.js          # Express server and Groq API integration
│   ├── package.json       # Backend dependencies
│   ├── package-lock.json  # Dependency lock file
│   └── .gitignore
│
├── content.js             # Retrieves selected code from GitHub
├── popup.html             # Extension popup interface
├── popup.js               # Main extension logic
├── styles.css             # Popup styling
├── marked.min.js          # Markdown parser
├── manifest.json          # Chrome extension configuration
├── background.js          # Manifest V3 service worker
└── README.md
```

---

## Technology Stack

### Chrome Extension

* JavaScript
* HTML
* CSS
* Chrome Extension APIs
* Marked.js

### Backend

* Node.js
* Express.js
* CORS
* dotenv
* OpenAI Node.js SDK

### AI

* Groq API
* Llama 3.1 8B Instant

### Deployment

* Render

---

## Backend API

### POST `/explain`

Generates an explanation for the supplied code.

#### Request

```http
POST /explain
Content-Type: application/json
```

```json
{
  "code": "public int add(int a, int b) {\n    return a + b;\n}",
  "language": "Java"
}
```

#### Response

```json
{
  "explanation": "This Java method takes two integers..."
}
```

### Error Handling

If no code is provided:

```http
400 Bad Request
```

```json
{
  "error": "No code provided"
}
```

If the AI request fails:

```http
500 Internal Server Error
```

```json
{
  "error": "AI request failed"
}
```

---

## Environment Variables

The Groq API key is stored as an environment variable rather than being included in the source code.

Create a `.env` file inside the `backend` directory:

```env
GROQ_API_KEY=your_groq_api_key
```

The backend accesses the key using:

```javascript
process.env.GROQ_API_KEY
```

The `.env` file should never be committed to the repository.

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Ruchir1807/github-code-explainer.git
cd github-code-explainer
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure the API key

Create:

```text
backend/.env
```

and add:

```env
GROQ_API_KEY=your_groq_api_key
```

### 4. Start the backend

```bash
node server.js
```

The backend runs locally on:

```text
http://localhost:3000
```

### 5. Load the Chrome Extension

1. Open Chrome.
2. Navigate to `chrome://extensions`.
3. Enable Developer mode.
4. Select **Load unpacked**.
5. Select the root project directory.
6. Open a GitHub repository.
7. Select a piece of code.
8. Open the extension.
9. Click **Analyze**.

---

## Design Decisions

### Why use a backend?

The Groq API key must not be exposed in the Chrome extension.

Extension source code is available to the client and can be inspected. Keeping the API key on the backend prevents users from directly obtaining the provider credential.

The architecture therefore follows:

```text
Chrome Extension
       │
       │ Code
       ▼
Backend
       │
       │ API Key
       ▼
Groq
```

### Why use the OpenAI SDK with Groq?

Groq provides an OpenAI-compatible API. This allows the OpenAI Node.js SDK to be used while configuring Groq's API endpoint as the `baseURL`.

This also keeps the AI integration relatively provider-independent, making it easier to change models or providers later.

### Why use asynchronous requests?

The extension communicates with the backend over HTTP, and the backend communicates with Groq over another network request.

Both operations can take time, so asynchronous programming with Promises and `async/await` prevents the application from blocking while waiting for external services.

### Why validate on both frontend and backend?

Frontend validation provides immediate feedback to the user.

Backend validation is still necessary because requests to the backend cannot be assumed to originate from the extension or to contain valid data.

---

## Security Considerations

The current implementation keeps the Groq API key on the backend rather than exposing it in the extension.

For a production deployment, additional measures could be introduced, including:

* API authentication
* Rate limiting
* More restrictive CORS configuration
* Request size limits
* Request timeouts
* Monitoring and logging
* Abuse prevention

CORS should not be considered an authentication mechanism. It primarily controls how browsers handle cross-origin requests.

---

## Current Limitations

The extension currently explains the code selected by the user.

It does not automatically retrieve:

* Other functions referenced by the selected code
* The complete source file
* Related classes
* Repository-wide dependencies
* Git history
* Commit context

Because only the selected code is sent to the model, the prompt instructs the model not to invent implementations or assume behavior that is not present in the provided code.

---

## Future Improvements

* Retrieve surrounding code for additional context
* Support repository-level code understanding
* Add authentication and API rate limiting
* Add response caching
* Improve programming language detection
* Add Beginner, Intermediate, and Advanced explanation modes
* Support follow-up questions about selected code
* Add syntax highlighting
* Support additional LLM providers
* Stream AI responses for improved response time
* Improve handling of larger code selections

---

## Motivation

When working with unfamiliar repositories, understanding individual functions or classes often requires copying code into a separate AI tool.

This project was built to make that process more direct by bringing AI-assisted code explanation into the GitHub interface.

The intended workflow is simple:

```text
Select → Analyze → Understand
```

---

## Author

**Ruchir Sushil**

GitHub: [@Ruchir1807](https://github.com/Ruchir1807)

---

## License

This project is intended for educational and personal use.
