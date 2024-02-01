const makeChatGPTCall = async (text, node) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${apikey}`);

    const raw = JSON.stringify({
      model: "gpt-3.5-turbo-instruct",
      prompt: text,
      max_tokens: 2048,
      temperature: 0,
      top_p: 1,
      n: 1,
      stream: false,
      logprobs: null,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    let response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions,
    );
    response = await response.json();
    const { choices } = response;

    // remove the spaces from the reponse text
    text = choices[0].text.replace(/^s\s+|\s+$/g, "");

    node.value = text;
    node.textContent = text;
  } catch (e) {
    console.error("Error while calling openai api", e);
  }
};

// regex to check the text is in the form "cherry: command;"
const getTextParsed = (text) => {
  const parsed = /cherry:(.*?)\;/gi.exec(text);
  return parsed ? parsed[1] : "";
};

// helper function extract their text from the node
const getTextContentFromDOMElements = (nodes, textarea = false) => {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  for (let node of nodes) {
    if (node) {
      textarea = node.nodeName.toLowerCase();
    }
    const value = textarea && node.value ? node.value : node.textContent;
    if (node && value) {
      const text = getTextParsed(value);
      if (text) return [node, text];
      else return null;
    }
  }
};

const scrapText = () => {
  const element = document.querySelectorAll('[contenteditable="true"]');
  const parsedValue = getTextContentFromDOMElements(element);
  if (parsedValue) {
    const [node, text] = parsedValue;
    makeChatGPTCall(text, node);
  }
};

function debounce(func, delay) {
  let timer;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(context, args), delay);
  };
}

// debounced function call
//
// Here the scrapText function will be debounced after 1000 milliseconds that is if the user
// stopped typing for 1 second then only the function scrapText will be invoked.

const debouncedScrapText = debounce(scrapText, 1000);

// event listener for what the user is typing
window.addEventListener("keypress", debouncedScrapText);
