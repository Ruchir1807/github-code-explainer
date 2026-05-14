require("dotenv").config();

const express = require("express");
const cors = require("cors");

const OpenAI = require("openai");

const app = express();


// MIDDLEWARE
app.use(cors());

app.use(express.json());


// OPENAI/GROQ CLIENT
const client = new OpenAI({

    apiKey: process.env.GROQ_API_KEY,

    baseURL:
        "https://api.groq.com/openai/v1"
});


// API ROUTE
app.post("/explain", async (req, res) => {

    try {

        const { code, language } = req.body;

        // BASIC VALIDATION
        if (!code) {

            return res.status(400).json({
                error: "No code provided"
            });
        }

        // LIMIT SIZE
        if (code.length > 30000) {

            return res.status(400).json({
                error:
                    "Selected code is too large"
            });
        }

        // AI REQUEST
     const response =
    await client.chat.completions.create({

        model:
            "llama-3.1-8b-instant",

        messages: [

            {
                role: "system",

                content:
`You are a precise, grounded, and beginner-friendly code explainer.

Rules:
- Only explain code that is directly visible
- Never invent missing implementations
- Clearly distinguish between visible behavior and inferred behavior
- Mention uncertainty when necessary
- Do not assume functionality that is not shown
- Avoid generic filler advice
- Do not suggest improvements unless a real issue is visible
- Explain concepts clearly and simply
- Keep explanations structured and technically accurate
- Focus on why the code exists, not just syntax
- Prioritize explaining purpose and logic over line-by-line narration
- Only explain imports/includes that are important to understanding the code
- Mention frameworks, testing patterns, or architectural patterns when relevant`
            },

            {
                role: "user",

                content:
`Explain this ${language} code.

Structure the explanation using these sections:

# Purpose
- Explain what the code is trying to achieve
- Focus on the overall goal of the code

# Important imports/includes
- Explain only meaningful libraries, headers, modules, or dependencies
- Skip obvious or unused imports

# Important functions/classes/macros
- Explain important visible functions, classes, test suites, hooks, macros, or components
- Mention what role they play

# Important logic
- Explain loops, conditions, validation, comparisons, execution flow, or data processing
- Focus on WHY the logic exists

# Comments and naming
- Explain what comments, naming, or structure suggest
- Distinguish between explicit comments and inferred structure
- Do not invent missing context

Additional Rules:
- Do not hallucinate unseen code
- If something is inferred, explicitly say it is inferred
- Avoid generic statements like "the code could use more comments"
- Avoid repeating "not shown in this snippet" excessively
- Keep explanations beginner-friendly but technically correct
- Mention testing frameworks or patterns when relevant
- Prefer concise clarity over unnecessary detail

Code:

${code}`
            }
        ]
    });

        // SEND RESPONSE
        res.json({

            explanation:
                response.choices[0]
                    .message.content
        });

    }
    catch (error) {

        console.error(error);

        res.status(500).json({

            error:
                "AI request failed"
        });
    }
});


// START SERVER
app.listen(3000, () => {

    console.log(
        "Server running on port 3000"
    );
});