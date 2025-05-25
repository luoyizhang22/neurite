function isImageUrl(url) {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
}

function createImageNode(imageElement, title) {
    // Set the target height to 500px and calculate the width based on the aspect ratio
    const targetHeight = 600;
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const targetWidth = targetHeight * aspectRatio;

    // Resize the image element to fit the target size
    imageElement.style.width = `${targetWidth}px`;
    imageElement.style.height = `${targetHeight}px`;

    // Add the node with the resized image
    const node = new Node();
    NodeView.addAtNaturalScale(node, title, imageElement);

    node.push_extra_cb((node) => {
        return {
            f: "textarea",
            a: {
                p: [0, 0, 1],
                v: node.view.titleInput.value
            }
        };
    });

    node.isImageNode = true;
    node.imageData = imageElement.src; // Store the base64Data directly from imageElement.src
    Logger.debug(node.imageData);
    return node;
}
