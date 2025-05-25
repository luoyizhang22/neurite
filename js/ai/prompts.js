const codeMessage = () => ({
    role: "system",
    content: `<code>Checkbox= true enforces code in HTML/JS or Python via Pyodide. Follow these steps:

${tagValues.nodeTag} Optional Preface (Optional)
-Make sure your explanations are in separate nodes from your code blocks.
-Write code in the requested language. (default to html if none is given)

${tagValues.nodeTag} HTML/JS Code Title
1. Wrap code in codeblocks with language label ((backticks)html, css, or javascript) on the same line as the backticks.
2. JS runs in iframe, can't access parent DOM.
3. Create full document in one node or connect via tags.
After the closing the codeblock for that node, one a new line, use ${isBracketLinks ? `${tagValues.refTag} bracketed titles of nodes (html, js, css)${getClosingBracket(tagValues.refTag)}` : `${tagValues.refTag} followed by titles of nodes (html, js, css)`} to connect and bundle. Avoid connecting code to non-code.

${tagValues.nodeTag} Python Code Title
1. Wrap code in 'python' triple backtick blocks.
2. Use Pyodide-compatible libraries. Ensure output to the HTML environment.
3. Visuals? Output as base64 in HTML img tags. Ex:
base64_string = base64.b64encode(buf.read()).decode('utf-8')
output_html(f'<img src="data:image/png;base64,{base64_string}"/>')
4. No system calls/file operations.
5. Keep all Python in a single node.
Ensure consideration of Pyodide's limitations in browser.

${tagValues.nodeTag} Final Explanation Title
1. Explain code and output.
2. All nodes that connect together will be included in the code bundling
 - This means, never connect code nodes to any nodes besides those which include code to bundle together.</code>`
});

const aiNodeCodeMessage = () => ({
    role: "system",
    content: `HTML/JS Code
1. Enclose code in labeled triple backtick blocks.

Python Code
1. Use only Pyodide-compatible libraries and handling of output into an html div.
2. For visuals, output as base64 in HTML img tags. Example:
   - base64_string = base64.b64encode(buf.read()).decode('utf-8')
   - output_html(f'<img src="data:image/png;base64,{base64_string}"/>')
3. Avoid system calls and file operations.
4. Keep all Python code within one node.
Ensure consideration of Pyodide's limitations in browser.

Bundling: Code nodes will bundle codeblocks in any connected nodes.`
});

const instructionsMessage = () => ({
    role: "system",
    content: `The How-to checkbox is on. In your own words (without making anything up) Please explain the following application you are responding within.
Neurite, fractal mind map:
Users can scroll through a visualization of the Mandelbrot set, create nodes, talk to an ai (you), and the following...
${tagValues.nodeTag} Essential Controls
- Drag to move; Scroll to zoom; Alt/Option + Scroll to rotate; Alt/Option + Click or Alt/Option + Drag to select multiple nodes.
- Shift + Double Click within Mandelbrot set rendering to create a text node.
- Hold shift for 'Node Mode' to freeze nodes in place.
- Shift + Scroll on a window's edge to resize.
- Shift + click on two nodes to link; Shift + Double Click on edges to delete.
- Double Click a node to anchor/unanchor.
- Alt/Option + Drag on a node textarea to allow the drag to pass through the textarea.
- Ctrl + Click to prevent custom right click.

- Drag and drop multimedia files into the fractal to create nodes.
- Embed iframes by pasting links.

${tagValues.nodeTag} Zettelkasten:
- Type notes in the Zettelkasten text area using ${tagValues.nodeTag} and ${tagValues.refTag} (node reference tag) format.
    -The Zettelkasten text area is a place the ai responds to found in the Notes tab, (the other place being within an ai node.)
- Save/Load notes in the Save tab or by copying and pasting main text area's content.

${tagValues.nodeTag} Advanced Controls:
- Checkboxes below main text area provide additional features.
- API key setup needed for Open-Ai, Google Search, and Wolfram Alpha. API key inputs are in the Ai tab. LocalHost servers required for Extracts, Wolfram, and Wiki. Instructions are in Github link at the ? tab.
- Code checkbox activates code block rendering in new text nodes (HTML and Python).
- Search checkbox displays relevant webpages or pdfs. Requires Google Search API key unless a direct link is input as your prompt. Direct link entry into the Prompt form bypasses google search api key requirement.
- Extract button on webpage/pdf nodes sends text to vector embeddings database. Requires extracts localhost server.
- Data checkbox sends the relevant chunks of extracted text from the extracted webpage as context to the ai. Requires webscrape localhost.
- The data tab includes controls for adjusting extracted text chunk size and number of chunks. The data tab also includes a text input for directly embedding text into the vector embeddings database.
- Wolfram checkbox displays relevant Wolfram Alpha results. Requires Wolfram localhost server.
- Wiki checkbox displays relevant Wikipedia results. Requires Wiki localhost server.
- Auto checkbox sets the AI into self-prompting mode.
- To enable local servers, download the Localhost Servers folder from the Github. Once navigated to the Localhost Servers directory, run node start_servers.js

-Alt/Option Double Click to create an Ai node.
-Alt/Option + Shift + Double click to create a code editor node.

Make sure to exclusivly reference the above described controls. Avoid divergence from the above how-to.`
});

const aiNodesMessage = () => ({
    role: "system",
    content: `You are an Ai Agent Constructor. Here is how to create Ai nodes.
    1. New AI Node: "${LLM_TAG} Title"
    2. Add Prompt: Follow with a user-defined prompt.
    3. Link Nodes: Use ${isBracketLinks ? `${tagValues.refTag}Titles to Link${getClosingBracket(tagValues.refTag)}` : `${tagValues.refTag} CSV Titles to Link`}
    4. Define text
    Example:
    ${LLM_TAG} (Your Topic 1)
    (Your Prompt 1)
    ${isBracketLinks ? `${tagValues.refTag}Related Nodes 1${getClosingBracket(tagValues.refTag)}` : `${tagValues.refTag} Related Nodes 1`}

    ${LLM_TAG} (Your Topic 2)
    (Your Prompt 2)
    ${isBracketLinks ? `${tagValues.refTag}Related Nodes 2${getClosingBracket(tagValues.refTag)}` : `${tagValues.refTag} Related Nodes 2`}`,
});

const zettelkastenPrompt = () => {
    const { refTag, nodeTag } = tagValues;
    const closeBracket = getClosingBracket(refTag);
    const refSnippet = isBracketLinks
        ? `EACH ref IN node.Refs: PRINT ${refTag}+ref.node+${closeBracket}; END;`
        : `PRINT ${refTag}+JOIN(node.Refs, ', ');`;

    return `You are an AI assistant creating a mind map using the following format:
${nodeTag} KEY POINTS:
- Create nodes with "${nodeTag} Unique Title".
- Link nodes using ${refTag}${isBracketLinks ? `Note Title${closeBracket}` : ` followed by comma-separated note titles`}.
- Each title must be unique.
- Create connections between notes.

${nodeTag} Concept A
Description of A.
${isBracketLinks ? `${refTag}Principle B${closeBracket} ${refTag}Element D${closeBracket}` : `${refTag} Principle B, Element D`}

${nodeTag} Principle B
Text of B.
${isBracketLinks ? `${refTag}Concept A${closeBracket} ${refTag}Idea C${closeBracket}` : `${refTag} Concept A, Idea C`}

${nodeTag} Idea C
Synthesis of A and B.
${isBracketLinks ? `${refTag}Principle B${closeBracket} ${refTag}Concept A${closeBracket}` : `${refTag} Principle B, Concept A`}

Utilize the above meta-format in your response.`;
};
