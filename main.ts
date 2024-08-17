import "jsr:@std/dotenv/load";

type MessageRole = "system" | "user" | "assistant";
type Message = {
    "role": MessageRole;
    "content": string;
};

type ChatCompletionResponse = {
    choices: {
        message: {
            content: string;
        };
    }[];
};

const PLAMO_URL =
    "https://platform.preferredai.jp/api/completion/v1/chat/completions";

const API_KEY = Deno.env.get("PLAMO_API");

if (!API_KEY) {
    throw new Error(
        "API key is missing. Please set the PLAMO_API environment variable.",
    );
}

const REQUEST_HEADERS = new Headers({
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
});

const messages: Message[] = [
    {
        "role": "system",
        "content":
            "あなたの役割は、プログラミング支援です。主に、Web系であるdenoを利用したWebアプリケーションの作成の支援を行ってください。TypeScriptやHTML周りなどはソースコードとともに動作についての開設なども交えて支援をお願いします。回答や支援においての口調は、全体を通してですます調ではなく「～だよ」「～だよね」「よろしく。」など、日本アニメのクール系美少女キャラの口調でお願いします。",
    },
];

async function getResponse() {
    try {
        const res = await fetch(PLAMO_URL, {
            method: "POST",
            headers: REQUEST_HEADERS,
            body: makeBody(),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const JSON_DATA = await res.json();

        const content = extractAssistantContent(JSON_DATA);

        return content;
    } catch (error) {
        console.error("Error fetching response:", error.message || error);
        return `エラーが発生しました: ${error.message || "不明なエラー"}`;
    }
}

function pushContentToMessages(role: MessageRole, content: string) {
    messages.push({ "role": role, "content": content });
}

function makeBody() {
    const body = JSON.stringify(
        {
            "messages": [...messages],
            "model": "plamo-beta",
        },
    );
    return body;
}

function extractAssistantContent(jsonData: ChatCompletionResponse): string {
    try {
        const content = jsonData.choices[0].message.content;
        return content;
    } catch (error) {
        console.error("Error extracting content:", error);
        return "";
    }
}

let emptyCounter = 0;
async function chatBot() {
    while (true) {
        const userInput = prompt(
            "あなたの質問を入力してください: (終わりたいときはexitと入れてね)",
        );

        if (userInput && /^exit$/i.test(userInput)) break;

        if (userInput) {
            emptyCounter = 0;
            pushContentToMessages("user", userInput);
            const response = await getResponse();
            pushContentToMessages("assistant", response);
            console.log("AIの回答: ", response);
        } else {
            emptyCounter++;
            if (emptyCounter >= 3) {
                console.log("入力を検知できなかったため終了します。");
                break;
            } else {
                console.log("入力がありませんでした。");
            }
        }
    }
}

chatBot();
