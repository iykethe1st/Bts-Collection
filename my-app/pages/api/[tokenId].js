export default function handler(req, res) {
    // get the token ids from the query parameter
    const tokenId = req.query.tokenId;
    // As all the images are uploaded on github, we can extract the images from github directly.
    const image_url = "https://ipfs.io/ipfs/QmcfsZCGdcXyHJP8MupMQwYuSET8TFJCHUhAaoJwe4EJuP/";
    // The api is sending back metadata for a Crypto Dev
    res.status(200).json({
        name: "Bts #" + tokenId,
        description: "Bts is a collection of tokens made by @iykethe1st. For educational purposes only.",
        image: image_url + tokenId + ".svg"
    })

}